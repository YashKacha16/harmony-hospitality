import { apiClient } from "@/api/apiClient";

export interface PagePermission {
  access: boolean;
  add?: boolean;
  edit?: boolean;
  delete?: boolean;
  waiterSide?: boolean; // For Orders page
  kitchenSide?: boolean; // For Orders page
}

export interface RolePermissions {
  dashboard: PagePermission;
  rooms: PagePermission;
  bookings: PagePermission;
  tables: PagePermission;
  waitlist: PagePermission;
  orders: PagePermission;
  menu: PagePermission;
  billing: PagePermission;
  employees: PagePermission;
  settings: PagePermission;
}

export interface RoleConfig {
  name: string;
  isSystem: boolean; // System roles (like Admin) cannot be deleted
  permissions: RolePermissions;
}

export interface RolePermissionDto {
  id?: number;
  roleName: string;
  moduleName: string;
  actionName: string;
  isAllowed: boolean;
  isLocked: boolean;
}

const DEFAULT_PERMISSIONS: RolePermissions = {
  dashboard: { access: true },
  rooms: { access: true, add: true, edit: true, delete: true },
  bookings: { access: true, add: true, edit: true, delete: true },
  tables: { access: true, add: true, edit: true, delete: true },
  waitlist: { access: true, add: true, edit: true, delete: true },
  orders: { access: true, add: true, edit: true, delete: true, waiterSide: true, kitchenSide: true },
  menu: { access: true, add: true, edit: true, delete: true },
  billing: { access: true, add: true, edit: true, delete: true },
  employees: { access: true, add: true, edit: true, delete: true },
  settings: { access: true, edit: true },
};

const WAITER_PERMISSIONS: RolePermissions = {
  dashboard: { access: false },
  rooms: { access: false, add: false, edit: false, delete: false },
  bookings: { access: false, add: false, edit: false, delete: false },
  tables: { access: true, add: true, edit: true, delete: false },
  waitlist: { access: true, add: true, edit: true, delete: true },
  orders: { access: true, add: true, edit: true, delete: false, waiterSide: true, kitchenSide: false },
  menu: { access: false, add: false, edit: false, delete: false },
  billing: { access: false, add: false, edit: false, delete: false },
  employees: { access: false, add: false, edit: false, delete: false },
  settings: { access: false, edit: false },
};

const CHEF_PERMISSIONS: RolePermissions = {
  dashboard: { access: false },
  rooms: { access: false, add: false, edit: false, delete: false },
  bookings: { access: false, add: false, edit: false, delete: false },
  tables: { access: false, add: false, edit: false, delete: false },
  waitlist: { access: false, add: false, edit: false, delete: false },
  orders: { access: true, add: false, edit: true, delete: false, waiterSide: false, kitchenSide: true },
  menu: { access: true, add: false, edit: true, delete: false },
  billing: { access: false, add: false, edit: false, delete: false },
  employees: { access: false, add: false, edit: false, delete: false },
  settings: { access: false, edit: false },
};

// Local storage fallback key
const STORAGE_KEY = "hospitality_roles";

export const permissionService = {
  // Translate flat backend rows into structured RolePermissions
  parseBackendPermissions(flatList: RolePermissionDto[]): RoleConfig[] {
    const rolesMap: Record<string, RolePermissions> = {};
    const lockMap: Record<string, boolean> = {};

    // First assign default structures so system roles are always defined
    const systemRoles = ["Admin", "Waiter", "Chef"];
    const systemTemplates = [DEFAULT_PERMISSIONS, WAITER_PERMISSIONS, CHEF_PERMISSIONS];
    
    systemRoles.forEach((roleName, idx) => {
      rolesMap[roleName] = JSON.parse(JSON.stringify(systemTemplates[idx]));
      lockMap[roleName] = true;
    });

    // Layer database entries on top
    flatList.forEach((row) => {
      const roleName = row.roleName;
      const mod = row.moduleName.toLowerCase() as keyof RolePermissions;
      const act = row.actionName as keyof PagePermission;

      if (!rolesMap[roleName]) {
        // Init default empty structures for custom roles
        rolesMap[roleName] = JSON.parse(JSON.stringify(DEFAULT_PERMISSIONS));
        // Reset all custom permissions to false initially so db values configure them
        Object.keys(rolesMap[roleName]).forEach((moduleKey) => {
          const m = rolesMap[roleName][moduleKey as keyof RolePermissions];
          Object.keys(m).forEach((actionKey) => {
            (m as any)[actionKey] = false;
          });
        });
      }

      lockMap[roleName] = row.isLocked;

      if (rolesMap[roleName][mod]) {
        (rolesMap[roleName][mod] as any)[act] = row.isAllowed;
      }
    });

    return Object.entries(rolesMap).map(([name, permissions]) => ({
      name,
      isSystem: systemRoles.includes(name),
      permissions
    }));
  },

  async getRoles(): Promise<RoleConfig[]> {
    try {
      const flatList = await apiClient.get<RolePermissionDto[]>("/api/RolePermission");
      const roles = this.parseBackendPermissions(flatList);
      // Sync local storage as a quick backup/cache
      localStorage.setItem(STORAGE_KEY, JSON.stringify(roles));
      return roles;
    } catch (e) {
      console.warn("Failed to fetch roles from backend, falling back to local cache", e);
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (err) {}
      }
      return [
        { name: "Admin", isSystem: true, permissions: DEFAULT_PERMISSIONS },
        { name: "Waiter", isSystem: true, permissions: WAITER_PERMISSIONS },
        { name: "Chef", isSystem: true, permissions: CHEF_PERMISSIONS },
      ];
    }
  },

  async saveRolePermissions(roleName: string, permissions: RolePermissions): Promise<void> {
    const promises: Promise<any>[] = [];

    Object.entries(permissions).forEach(([moduleName, actions]) => {
      Object.entries(actions).forEach(([actionName, isAllowed]) => {
        promises.push(
          apiClient.post("/api/RolePermission", {
            roleName,
            moduleName,
            actionName,
            isAllowed: !!isAllowed,
            isLocked: ["admin", "waiter", "chef"].includes(roleName.toLowerCase())
          })
        );
      });
    });

    await Promise.all(promises);
    // Refresh local cache
    await this.getRoles();
  },

  async deleteRole(roleName: string): Promise<void> {
    await apiClient.delete(`/api/RolePermission/role/${roleName}`);
    await this.getRoles();
  },

  getRolePermissions(roleName: string): RolePermissions {
    if (typeof window === "undefined") return DEFAULT_PERMISSIONS;
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const roles: RoleConfig[] = JSON.parse(saved);
        const role = roles.find(r => r.name.toLowerCase() === roleName.toLowerCase());
        if (role) return role.permissions;
      } catch (e) {}
    }
    if (roleName.toLowerCase() === "waiter") return WAITER_PERMISSIONS;
    if (roleName.toLowerCase() === "chef") return CHEF_PERMISSIONS;
    return DEFAULT_PERMISSIONS;
  },

  hasPermission(roleName: string, module: keyof RolePermissions, action: keyof PagePermission = "access"): boolean {
    const perms = this.getRolePermissions(roleName);
    const modulePerm = perms[module];
    if (!modulePerm) return false;
    return !!modulePerm[action];
  }
};
