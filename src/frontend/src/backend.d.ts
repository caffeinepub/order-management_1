import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Stage {
    id: bigint;
    assignedRoles: Array<bigint>;
    name: string;
    sfaEnabled: boolean;
    orderIndex: bigint;
}
export interface AuditEntry {
    id: bigint;
    action: string;
    entityId: string;
    performedBy: Principal;
    timestamp: bigint;
    details: string;
    entityType: string;
}
export interface AppRole {
    id: bigint;
    name: string;
    description: string;
}
export interface Order {
    id: bigint;
    customerName: string;
    status: string;
    paymentStatus: string;
    createdAt: bigint;
    createdBy: Principal;
    collectDate: string;
    orderDate: string;
    isHeld: boolean;
    orderId: string;
    updatedAt: bigint;
    address: string;
    notes: string;
    paymentDate: string;
    quantity: bigint;
    contactNo: string;
    isAllClear: boolean;
    expectedDelivery: string;
    amount: number;
    consumerNo: string;
    product: string;
}
export interface AppUser {
    id: bigint;
    principal: Principal;
    username: string;
    password: string;
    createdAt: bigint;
    roles: Array<bigint>;
}
export interface backendInterface {
    appendAudit(action: string, entityType: string, entityId: string, details: string): Promise<void>;
    assignRoles(userId: bigint, roleIds: Array<bigint>): Promise<void>;
    createOrder(orderId: string, consumerNo: string, contactNo: string, customerName: string, address: string, orderDate: string, expectedDelivery: string, product: string, quantity: bigint, amount: number): Promise<bigint>;
    createRole(name: string, description: string): Promise<void>;
    createStage(name: string, orderIndex: bigint, assignedRoles: Array<bigint>, sfaEnabled: boolean): Promise<void>;
    deleteUser(userId: bigint): Promise<void>;
    getCurrentUser(): Promise<AppUser | null>;
    getSetting(key: string): Promise<string | null>;
    listAuditLog(limit: bigint, filterEntity: string): Promise<Array<AuditEntry>>;
    listOrders(page: bigint, pageSize: bigint): Promise<{
        total: bigint;
        orders: Array<Order>;
    }>;
    listRoles(): Promise<Array<AppRole>>;
    listStages(): Promise<Array<Stage>>;
    listUsers(): Promise<Array<AppUser>>;
    loginWithPassword(username: string, password: string): Promise<AppUser | null>;
    registerSelf(username: string): Promise<bigint>;
    registerWithPassword(username: string, password: string): Promise<bigint>;
    setAllClearFlag(orderId: bigint, flag: boolean): Promise<void>;
    setHoldFlag(orderId: bigint, flag: boolean): Promise<void>;
    setSetting(key: string, value: string): Promise<void>;
    updateOrder(id: bigint, fields: {
        customerName: string;
        status: string;
        paymentStatus: string;
        collectDate: string;
        orderDate: string;
        orderId: string;
        address: string;
        notes: string;
        paymentDate: string;
        quantity: bigint;
        contactNo: string;
        expectedDelivery: string;
        amount: number;
        consumerNo: string;
        product: string;
    }): Promise<void>;
    updateStage(id: bigint, fields: {
        assignedRoles: Array<bigint>;
        name: string;
        sfaEnabled: boolean;
        orderIndex: bigint;
    }): Promise<void>;
}
