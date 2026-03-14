import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AppRole, AppUser, AuditEntry, Order, Stage } from "../backend.d";
import { useActor } from "./useActor";

// Local types not in backend.d.ts
export interface OrderStage {
  stageId: bigint;
  orderId: bigint;
  completed: boolean;
  completedDate: string;
  manualDateOverride: string;
  note: string;
}

export interface OrderUpdate {
  id: bigint;
  text: string;
  createdBy: { toString(): string };
  createdAt: bigint;
}

export function useListOrders(page: number, pageSize: number) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["orders", "list", page, pageSize],
    queryFn: async () => {
      if (!actor) return { orders: [] as Order[], total: 0n };
      return actor.listOrders(BigInt(page), BigInt(pageSize));
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSearchOrders(query: string) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["orders", "search", query],
    queryFn: async () => {
      if (!actor || !query.trim()) return [] as Order[];
      return (actor as any).searchOrders(query.trim()) as Promise<Order[]>;
    },
    enabled: !!actor && !isFetching && query.trim().length > 0,
  });
}

export interface CreateOrderData {
  orderId: string;
  consumerNo: string;
  contactNo: string;
  customerName: string;
  address: string;
  orderDate: string;
  expectedDelivery: string;
  product: string;
  quantity: bigint;
  amount: number;
}

export function useCreateOrder() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateOrderData) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.createOrder(
        data.orderId,
        data.consumerNo,
        data.contactNo,
        data.customerName,
        data.address,
        data.orderDate,
        data.expectedDelivery,
        data.product,
        data.quantity,
        data.amount,
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
  });
}

export interface UpdateOrderData {
  id: bigint;
  orderId: string;
  consumerNo: string;
  contactNo: string;
  customerName: string;
  address: string;
  orderDate: string;
  expectedDelivery: string;
  product: string;
  quantity: bigint;
  amount: number;
  status: string;
  paymentStatus: string;
  paymentDate: string;
  collectDate: string;
  notes: string;
}

export function useUpdateOrder() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: UpdateOrderData) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.updateOrder(data.id, {
        orderId: data.orderId,
        consumerNo: data.consumerNo,
        contactNo: data.contactNo,
        customerName: data.customerName,
        address: data.address,
        orderDate: data.orderDate,
        expectedDelivery: data.expectedDelivery,
        product: data.product,
        quantity: data.quantity,
        amount: data.amount,
        status: data.status,
        paymentStatus: data.paymentStatus,
        paymentDate: data.paymentDate,
        collectDate: data.collectDate,
        notes: data.notes,
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
  });
}

export function useDeleteOrder() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Actor not ready");
      return (actor as any).deleteOrder(id) as Promise<void>;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
  });
}

export function useSetHoldFlag() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, value }: { id: bigint; value: boolean }) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.setHoldFlag(id, value);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
  });
}

export function useSetAllClearFlag() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, value }: { id: bigint; value: boolean }) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.setAllClearFlag(id, value);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
  });
}

export function useMarkHold() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (orderId: bigint) => {
      if (!actor) throw new Error("Actor not ready");
      return (actor as any).markHold(orderId) as Promise<void>;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
  });
}

export function useUnmarkHold() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (orderId: bigint) => {
      if (!actor) throw new Error("Actor not ready");
      return (actor as any).unmarkHold(orderId) as Promise<void>;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
  });
}

export function useListHeld() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["orders", "held"],
    queryFn: async (): Promise<Order[]> => {
      if (!actor) return [];
      return (actor as any).listHeld() as Promise<Order[]>;
    },
    enabled: !!actor && !isFetching,
  });
}

export function useMarkAllClear() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (orderId: bigint) => {
      if (!actor) throw new Error("Actor not ready");
      return (actor as any).markAllClear(orderId) as Promise<void>;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
  });
}

export function useUnmarkAllClear() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (orderId: bigint) => {
      if (!actor) throw new Error("Actor not ready");
      return (actor as any).unmarkAllClear(orderId) as Promise<void>;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
  });
}

export function useListAllClear() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["orders", "allclear"],
    queryFn: async (): Promise<Order[]> => {
      if (!actor) return [];
      return (actor as any).listAllClear() as Promise<Order[]>;
    },
    enabled: !!actor && !isFetching,
  });
}

export function useListPending() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["orders", "pending"],
    queryFn: async (): Promise<Order[]> => {
      if (!actor) return [];
      return (actor as any).listPending() as Promise<Order[]>;
    },
    enabled: !!actor && !isFetching,
  });
}

export function useListExpectedPayment() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["orders", "expected-payment"],
    queryFn: async (): Promise<Order[]> => {
      if (!actor) return [];
      return (actor as any).listExpectedPayment() as Promise<Order[]>;
    },
    enabled: !!actor && !isFetching,
  });
}

export function useListCollectToday(today: string) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["orders", "collect-today", today],
    queryFn: async (): Promise<Order[]> => {
      if (!actor) return [];
      return (actor as any).listCollectToday(today) as Promise<Order[]>;
    },
    enabled: !!actor && !isFetching,
  });
}

export function useListStages() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["stages"],
    queryFn: async (): Promise<Stage[]> => {
      if (!actor) return [];
      return actor.listStages();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateStage() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      name: string;
      orderIndex: bigint;
      assignedRoles: bigint[];
      sfaEnabled: boolean;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.createStage(
        data.name,
        data.orderIndex,
        data.assignedRoles,
        data.sfaEnabled,
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["stages"] }),
  });
}

export function useUpdateStage() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      id: bigint;
      name: string;
      orderIndex: bigint;
      assignedRoles: bigint[];
      sfaEnabled: boolean;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.updateStage(data.id, {
        name: data.name,
        orderIndex: data.orderIndex,
        assignedRoles: data.assignedRoles,
        sfaEnabled: data.sfaEnabled,
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["stages"] }),
  });
}

export function useDeleteStage() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Actor not ready");
      return (actor as any).deleteStage(id) as Promise<void>;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["stages"] }),
  });
}

export function useCompleteStage() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      orderId: bigint;
      stageId: bigint;
      note: string;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      return (actor as any).completeStage(
        data.orderId,
        data.stageId,
        data.note,
      ) as Promise<void>;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orderStages"] }),
  });
}

export function useOverrideStageDate() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      orderId: bigint;
      stageId: bigint;
      date: string;
      note: string;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      return (actor as any).overrideStageDate(
        data.orderId,
        data.stageId,
        data.date,
        data.note,
      ) as Promise<void>;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orderStages"] }),
  });
}

export function useListOrderStages(orderId: bigint | null) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["orderStages", orderId?.toString()],
    queryFn: async (): Promise<OrderStage[]> => {
      if (!actor || orderId === null) return [];
      return (actor as any).listOrderStages(orderId) as Promise<OrderStage[]>;
    },
    enabled: !!actor && !isFetching && orderId !== null,
  });
}

export function useAddUpdate() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { orderId: bigint; text: string }) => {
      if (!actor) throw new Error("Actor not ready");
      return (actor as any).addUpdate(data.orderId, data.text) as Promise<void>;
    },
    onSuccess: (_data, vars) =>
      qc.invalidateQueries({
        queryKey: ["orderUpdates", vars.orderId.toString()],
      }),
  });
}

export function useListUpdates(orderId: bigint | null) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["orderUpdates", orderId?.toString()],
    queryFn: async (): Promise<OrderUpdate[]> => {
      if (!actor || orderId === null) return [];
      return (actor as any).listUpdates(orderId) as Promise<OrderUpdate[]>;
    },
    enabled: !!actor && !isFetching && orderId !== null,
  });
}

export function useListAuditLog() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["audit"],
    queryFn: async (): Promise<AuditEntry[]> => {
      if (!actor) return [];
      return actor.listAuditLog(BigInt(200), "");
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAppendAudit() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (data: {
      action: string;
      entityType: string;
      entityId: string;
      details: string;
    }) => {
      if (!actor) return;
      return actor.appendAudit(
        data.action,
        data.entityType,
        data.entityId,
        data.details,
      );
    },
  });
}

export function useGetSetting(key: string) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["settings", key],
    queryFn: async (): Promise<string | null> => {
      if (!actor) return null;
      return actor.getSetting(key);
    },
    enabled: !!actor && !isFetching,
    staleTime: 60_000,
  });
}

export function useSetSetting() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { key: string; value: string }) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.setSetting(data.key, data.value);
    },
    onSuccess: (_data, vars) =>
      qc.invalidateQueries({ queryKey: ["settings", vars.key] }),
  });
}

export function useGetCurrentUser() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["auth", "currentUser"],
    queryFn: async (): Promise<AppUser | null> => {
      if (!actor) return null;
      return actor.getCurrentUser();
    },
    enabled: !!actor && !isFetching,
    staleTime: 30_000,
  });
}

export function useListRoles() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["roles"],
    queryFn: async (): Promise<AppRole[]> => {
      if (!actor) return [];
      return actor.listRoles();
    },
    enabled: !!actor && !isFetching,
    staleTime: 60_000,
  });
}

export function useListUsers() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["users"],
    queryFn: async (): Promise<AppUser[]> => {
      if (!actor) return [];
      return actor.listUsers();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useRegisterSelf() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (username: string): Promise<string> => {
      if (!actor) throw new Error("Actor not ready");
      const id = await actor.registerSelf(username);
      return id.toString();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["auth"] }),
  });
}

export function useAssignRoles() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      userId,
      roleIds,
    }: { userId: bigint; roleIds: bigint[] }) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.assignRoles(userId, roleIds);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
}

export function useDeleteUser() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (userId: bigint) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.deleteUser(userId);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
}

export function useCreateRole() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ name, desc }: { name: string; desc: string }) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.createRole(name, desc);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["roles"] }),
  });
}
