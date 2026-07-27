export interface MenuItem {
    id?: number;
    name: string;
    description: string;
    price: number;
    categoryId: number;
    veg: boolean;
    available: boolean;
    image?: string;
    position?: number;
}

export interface Employee {
    id?: number;
    name: string;
    email: string;
    role: string;
    status: string;
    joined: string;
    password?: string;
    photoPath?: string;
}

export interface LoginDto {
    email: string;
    password?: string;
}

export interface TableCategory {
    id: number;
    name: string;
    position: number;
    isActive: boolean;
}

export interface RestaurantTableDto {
    id: number;
    name: string;
    capacity: number;
    status: string;
    position: number;
    categoryId?: number | null;
    categoryName?: string | null;
    isMerged: boolean;
    mergeGroupId?: number | null;
    combinedCapacity?: number | null;
    qrToken: string;
}

export interface TableGroupedDto {
    categoryId?: number | null;
    categoryName: string;
    tables: RestaurantTableDto[];
}

export interface CreateOrderItemDto {
    menuItemId: number;
    name: string;
    quantity: number;
    priceAtOrder: number;
    isAddOn: boolean;
}

export interface CreateOrderDto {
    type: string;
    tableId?: number | null;
    mergeGroupId?: number | null;
    roomNumber?: string | null;
    customerName?: string | null;
    isPriority: boolean;
    specialInstructions?: string | null;
    items: CreateOrderItemDto[];
}

export interface UpdateOrderItemDto {
    id?: number | null;
    menuItemId: number;
    name: string;
    quantity: number;
    priceAtOrder: number;
    status: string;
    isAddOn: boolean;
}

export interface OrderItemDto {
    id: number;
    menuItemId: number;
    name: string;
    quantity: number;
    priceAtOrder: number;
    status: string;
    isAddOn: boolean;
}

export interface OrderDto {
    id: number;
    orderNumber: string;
    type: string;
    tableId?: number | null;
    tableName?: string | null;
    mergeGroupId?: number | null;
    roomNumber?: string | null;
    parcelCode?: string | null;
    customerName?: string | null;
    status: string;
    isPriority: boolean;
    createdAt: string;
    subtotal: number;
    hasNewAddOns: boolean;
    specialInstructions?: string | null;
    billId?: number | null;
    billStatus?: string | null;
    items: OrderItemDto[];
}

export interface KanbanOrdersDto {
    new: OrderDto[];
    preparing: OrderDto[];
    ready: OrderDto[];
    served: OrderDto[];
}
