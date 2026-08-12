import { createFileRoute } from "@tanstack/react-router";
import { AppShell, StatusBadge } from "@/components/app-shell";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { employeeService } from "@/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Upload, Phone, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { cn, getImageUrl } from "@/lib/utils";
import { useState, useEffect } from "react";
import { permissionService } from "@/lib/permissionService";

export const Route = createFileRoute("/employees")({
  head: () => ({ meta: [{ title: "Employees — Aurelia" }, { name: "description", content: "Team directory, roles, shifts and attendance for hotel & restaurant staff." }] }),
  component: EmpPage,
});

const getPhotoUrl = (path?: string) => {
  return getImageUrl(path);
};

function EmpPage() {
  const shifts = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const queryClient = useQueryClient();

  const userRaw = typeof window !== 'undefined' ? localStorage.getItem("user") : null;
  const user = userRaw ? JSON.parse(userRaw) : { role: "Admin" };

  const { data: employees = [], isLoading } = useQuery({
    queryKey: ["employees"],
    queryFn: employeeService.getAll
  });

  const { data: dbRoles = [] } = useQuery({
    queryKey: ["roles"],
    queryFn: () => permissionService.getRoles()
  });

  const roleNames = dbRoles.length > 0 ? dbRoles.map(r => r.name) : ["Admin", "Waiter", "Chef"];

  const currentRoleConfig = dbRoles.find(r => r.name.toLowerCase() === user.role.toLowerCase());
  const canAdd = currentRoleConfig ? !!currentRoleConfig.permissions.employees?.add : permissionService.hasPermission(user.role, "employees", "add");
  const canEdit = currentRoleConfig ? !!currentRoleConfig.permissions.employees?.edit : permissionService.hasPermission(user.role, "employees", "edit");

  const updateMutation = useMutation({
    mutationFn: ({ id, employee }: { id: number; employee: any }) => employeeService.update(id, employee),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast.success("Employee updated successfully");
    },
    onError: () => toast.error("Failed to update employee")
  });

  if (isLoading) {
    return (
      <AppShell title="Employees" breadcrumbs={[{ label: "Home", to: "/dashboard" }, { label: "Employees" }]}>
        <div className="flex items-center justify-center h-64">Loading employees...</div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Employees" breadcrumbs={[{ label: "Home", to: "/dashboard" }, { label: "Employees" }]}>
      {canAdd && <div className="flex justify-end mb-4"><AddEmpSheet roles={roleNames} /></div>}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-2">
        {employees.map(e => (
          <Card key={e.id} className="p-5 rounded-2xl">
            <div className="flex items-center gap-3">
              <Avatar className="size-14"><AvatarImage src={getPhotoUrl(e.photoPath)} /><AvatarFallback>{e.name[0]}</AvatarFallback></Avatar>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{e.name}</div>
                <div className="text-xs text-muted-foreground">{e.role}</div>
              </div>
              <StatusBadge status={e.status} />
            </div>
            <div className="mt-3 space-y-1 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5"><Phone className="size-3" /> {e.email}</div>
              <div>Joined: <span className="text-foreground">{e.joined}</span></div>
            </div>
            <div className="mt-3 flex gap-2">
              <Select defaultValue={e.role} onValueChange={(val: string) => updateMutation.mutate({ id: e.id!, employee: { ...e, role: val } })}>
                <SelectTrigger className="h-8 rounded-lg text-xs flex-1"><SelectValue /></SelectTrigger>
                <SelectContent>{roleNames.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
              </Select>
              <EditEmpSheet employee={e} roles={roleNames} />
            </div>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}

function AddEmpSheet({ roles }: { roles: string[] }) {
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState(roles[0] || "Waiter");
  const [showPw, setShowPw] = useState(false);
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (emp: any) => employeeService.create(emp),
    onError: () => toast.error("Failed to add employee")
  });

  const photoMutation = useMutation({
    mutationFn: ({ id, file }: { id: number; file: File }) => employeeService.uploadPhoto(id, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
    onError: () => toast.error("Failed to upload employee photo")
  });

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild><Button className="rounded-xl bg-primary text-primary-foreground copper-glow"><Plus className="size-4 mr-1" /> Add employee</Button></SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader><SheetTitle className="font-serif text-2xl">New employee</SheetTitle></SheetHeader>
        <form className="mt-6 space-y-3 px-4" autoComplete="off" onSubmit={async (e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);

          const newEmp = {
            name: formData.get("name"),
            email: formData.get("email"),
            password: formData.get("password") || "123456",
            role: role,
            status: "Active",
            joined: formData.get("joined") || new Date().toISOString().split('T')[0]
          };

          try {
            const created = await createMutation.mutateAsync(newEmp);

            const fileInput = formData.get("photo") as File;
            if (fileInput && fileInput.size > 0 && created.id) {
              await photoMutation.mutateAsync({ id: created.id, file: fileInput });
            }

            queryClient.invalidateQueries({ queryKey: ["employees"] });
            toast.success("Employee added successfully");
            setOpen(false);
          } catch (err) {
            // Error handled by mutations
          }
        }}>
          <div>
            <Label>Photo</Label>
            <Input name="photo" type="file" accept="image/*" className="rounded-xl mt-1" />
          </div>
          <div><Label>Name</Label><Input name="name" className="rounded-xl mt-1" required autoComplete="off" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Email</Label><Input name="email" type="email" className="rounded-xl mt-1" required autoComplete="off" /></div>
            <div>
              <Label>Password</Label>
              <div className="relative">
                <Input name="password" type={showPw ? "text" : "password"} className="rounded-xl mt-1 pr-9" required autoComplete="new-password" />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition cursor-pointer p-1"
                  title={showPw ? "Hide password" : "Show password"}
                >
                  {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger className="rounded-xl mt-1"><SelectValue placeholder={roles[0] || "Waiter"} /></SelectTrigger>
                <SelectContent>{roles.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Joining date</Label><Input name="joined" type="date" className="rounded-xl mt-1" /></div>
          </div>
          <Button className="w-full rounded-xl bg-primary text-primary-foreground copper-glow mt-4">Add employee</Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function EditEmpSheet({ employee, roles }: { employee: any; roles: string[] }) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (open) {
      setPassword("");
      setShowPw(false);
    }
  }, [open]);

  const updateMutation = useMutation({
    mutationFn: ({ id, emp }: { id: number; emp: any }) => employeeService.update(id, emp),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast.success("Employee updated successfully");
      setOpen(false);
    },
    onError: () => toast.error("Failed to update employee")
  });

  const photoMutation = useMutation({
    mutationFn: ({ id, file }: { id: number; file: File }) => employeeService.uploadPhoto(id, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
    onError: () => toast.error("Failed to upload photo")
  });

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild><Button variant="outline" size="sm" className="h-8 rounded-lg text-xs">Edit</Button></SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader><SheetTitle className="font-serif text-2xl">Edit employee</SheetTitle></SheetHeader>
        <form className="mt-6 space-y-3 px-4" onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);

          const fileInput = formData.get("photo") as File;
          if (fileInput && fileInput.size > 0) {
            photoMutation.mutate({ id: employee.id, file: fileInput });
          }

          const passwordVal = password.trim();

          const updatedEmp = {
            ...employee,
            name: formData.get("name"),
            email: formData.get("email"),
            password: passwordVal ? passwordVal : employee.password,
            role: formData.get("role"),
            status: formData.get("status"),
            joined: formData.get("joined")
          };
          updateMutation.mutate({ id: employee.id, emp: updatedEmp });
        }}>
          <div>
            <Label>Photo</Label>
            <Input name="photo" type="file" accept="image/*" className="rounded-xl mt-1" />
          </div>
          <div><Label>Name</Label><Input name="name" defaultValue={employee.name} className="rounded-xl mt-1" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Email</Label><Input name="email" type="email" defaultValue={employee.email} className="rounded-xl mt-1" /></div>
            <div>
              <Label>Password</Label>
              <div className="relative">
                <Input
                  name="password"
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  placeholder="Leave empty to keep"
                  className="rounded-xl mt-1 pr-9"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition cursor-pointer p-1"
                  title={showPw ? "Hide password" : "Show password"}
                >
                  {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Role</Label>
              <Select name="role" defaultValue={employee.role}>
                <SelectTrigger className="rounded-xl mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{roles.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Status</Label>
              <Select name="status" defaultValue={employee.status || "Active"}>
                <SelectTrigger className="rounded-xl mt-1"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="Active">Active</SelectItem><SelectItem value="Inactive">Inactive</SelectItem><SelectItem value="On Leave">On Leave</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <div><Label>Joining date</Label><Input name="joined" defaultValue={employee.joined} type="date" className="rounded-xl mt-1" /></div>
          <Button className="w-full rounded-xl bg-primary text-primary-foreground copper-glow mt-4">Save changes</Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
