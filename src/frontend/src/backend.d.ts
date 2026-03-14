import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Order {
    id: bigint;
    customerName: string;
    status: string;
    expectedPaymentDate: string;
    holdFlag: boolean;
    createdAt: bigint;
    createdBy: Principal;
    amountText: string;
    updatedAt: bigint;
    address: string;
    contactNo: string;
    allClearFlag: boolean;
    consumerNo: string;
    product: string;
}
export interface AppUser {
    id: bigint;
    userPrincipal: Principal;
    username: string;
    roleIds: Array<bigint>;
    createdAt: bigint;
}
export interface AppRole {
    id: bigint;
    roleName: string;
    roleDescription: string;
}
export interface Stage {
    id: bigint;
    stageName: string;
    stageOrder: bigint;
    roleIds: Array<bigint>;
}
export interface OrderStage {
    id: bigint;
    orderId: bigint;
    stageId: bigint;
    completed: boolean;
    completedDate: string;
    manualDateOverride: string;
    note: string;
    completedBy: Principal;
}
export interface AuditEntry {
    id: bigint;
    action: string;
    entityType: string;
    entityId: bigint;
    performedBy: Principal;
    timestamp: bigint;
    detail: string;
}
export interface OrderUpdate {
    id: bigint;
    orderId: bigint;
    text: string;
    createdBy: Principal;
    createdAt: bigint;
}
export interface backendInterface {
    // Order APIs
    createOrder(consumerNo: string, contactNo: string, customerName: string, address: string, product: string, amountText: string, expectedPaymentDate: string): Promise<bigint>;
    deleteOrder(id: bigint): Promise<boolean>;
    getOrder(id: bigint): Promise<Order | null>;
    listOrders(page: bigint, pageSize: bigint): Promise<{ total: bigint; orders: Array<Order> }>;
    searchOrders(searchQuery: string): Promise<Array<Order>>;
    updateOrder(id: bigint, consumerNo: string, contactNo: string, customerName: string, address: string, product: string, amountText: string, expectedPaymentDate: string, status: string): Promise<boolean>;
    setHoldFlag(id: bigint, value: boolean): Promise<boolean>;
    setAllClearFlag(id: bigint, value: boolean): Promise<boolean>;
    // Hold / AllClear
    markHold(orderId: bigint): Promise<string>;
    unmarkHold(orderId: bigint): Promise<string>;
    listHeld(): Promise<Array<Order>>;
    markAllClear(orderId: bigint): Promise<string>;
    unmarkAllClear(orderId: bigint): Promise<string>;
    listAllClear(): Promise<Array<Order>>;
    // Pending & Payment
    listPending(): Promise<Array<Order>>;
    listExpectedPayment(): Promise<Array<Order>>;
    listCollectToday(today: string): Promise<Array<Order>>;
    // User/Role APIs
    registerSelf(username: string): Promise<string>;
    getCurrentUser(): Promise<AppUser | null>;
    listUsers(): Promise<Array<AppUser>>;
    assignRoles(userId: bigint, roleIds: Array<bigint>): Promise<string>;
    deleteUser(userId: bigint): Promise<string>;
    createRole(name: string, desc: string): Promise<string>;
    listRoles(): Promise<Array<AppRole>>;
    // Stage APIs
    createStage(name: string, order: bigint, roleIds: Array<bigint>): Promise<string>;
    listStages(): Promise<Array<Stage>>;
    updateStage(id: bigint, name: string, order: bigint, roleIds: Array<bigint>): Promise<string>;
    deleteStage(id: bigint): Promise<string>;
    reorderStage(id: bigint, newOrder: bigint): Promise<string>;
    // OrderStage APIs
    completeStage(orderId: bigint, stageId: bigint, note: string): Promise<string>;
    overrideStageDate(orderId: bigint, stageId: bigint, date: string, note: string): Promise<string>;
    listOrderStages(orderId: bigint): Promise<Array<OrderStage>>;
    // Updates feed
    addUpdate(orderId: bigint, text: string): Promise<string>;
    listUpdates(orderId: bigint): Promise<Array<OrderUpdate>>;
    // Audit
    listAuditLog(): Promise<Array<AuditEntry>>;
    // Settings
    getSetting(key: string): Promise<string | null>;
    setSetting(key: string, value: string): Promise<string>;
}
