import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  AppRole,
  AppUser,
  AuditEntry,
  Order,
  OrderStage,
  OrderUpdate,
  Stage,
} from "../backend.d";
import { useActor } from "./useActor";

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
      return actor.searchOrders(query.trim());
    },
    enabled: !!actor && !isFetching && query.trim().length > 0,
  });
}

export function useCreateOrder() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      consumerNo: string;
      contactNo: string;
      customerName: string;
      address: string;
      product: string;
      amountText: string;
      expectedPaymentDate: string;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.createOrder(
        data.consumerNo,
        data.contactNo,
        data.customerName,
        data.address,
        data.product,
        data.amountText,
        data.expectedPaymentDate,
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
  });
}

export function useUpdateOrder() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      id: bigint;
      consumerNo: string;
      contactNo: string;
      customerName: string;
      address: string;
      product: string;
      amountText: string;
      expectedPaymentDate: string;
      status: string;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.updateOrder(
        data.id,
        data.consumerNo,
        data.contactNo,
        data.customerName,
        data.address,
        data.product,
        data.amountText,
        data.expectedPaymentDate,
        data.status,
      );
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
      return actor.deleteOrder(id);
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
      return (actor as any).setHoldFlag(id, value) as Promise<boolean>;
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
      return (actor as any).setAllClearFlag(id, value) as Promise<boolean>;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
  });
}

// ─── Hold / AllClear ───────────────────────────────────────────────────────

export function useMarkHold() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (orderId: bigint): Promise<string> => {
      if (!actor) throw new Error("Actor not ready");
      return (actor as any).markHold(orderId);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
  });
}

export function useUnmarkHold() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (orderId: bigint): Promise<string> => {
      if (!actor) throw new Error("Actor not ready");
      return (actor as any).unmarkHold(orderId);
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
      return (actor as any).listHeld();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useMarkAllClear() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (orderId: bigint): Promise<string> => {
      if (!actor) throw new Error("Actor not ready");
      return (actor as any).markAllClear(orderId);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
  });
}

export function useUnmarkAllClear() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (orderId: bigint): Promise<string> => {
      if (!actor) throw new Error("Actor not ready");
      return (actor as any).unmarkAllClear(orderId);
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
      return (actor as any).listAllClear();
    },
    enabled: !!actor && !isFetching,
  });
}

// ─── Pending & Payment ─────────────────────────────────────────────────────

export function useListPending() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["orders", "pending"],
    queryFn: async (): Promise<Order[]> => {
      if (!actor) return [];
      return (actor as any).listPending();
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
      return (actor as any).listExpectedPayment();
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
      return (actor as any).listCollectToday(today);
    },
    enabled: !!actor && !isFetching,
  });
}

// ─── Stage APIs ────────────────────────────────────────────────────────────

export function useListStages() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["stages"],
    queryFn: async (): Promise<Stage[]> => {
      if (!actor) return [];
      return (actor as any).listStages();
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
      order: bigint;
      roleIds: bigint[];
    }): Promise<string> => {
      if (!actor) throw new Error("Actor not ready");
      return (actor as any).createStage(data.name, data.order, data.roleIds);
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
      order: bigint;
      roleIds: bigint[];
    }): Promise<string> => {
      if (!actor) throw new Error("Actor not ready");
      return (actor as any).updateStage(
        data.id,
        data.name,
        data.order,
        data.roleIds,
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["stages"] }),
  });
}

export function useDeleteStage() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint): Promise<string> => {
      if (!actor) throw new Error("Actor not ready");
      return (actor as any).deleteStage(id);
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
    }): Promise<string> => {
      if (!actor) throw new Error("Actor not ready");
      return (actor as any).completeStage(
        data.orderId,
        data.stageId,
        data.note,
      );
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
    }): Promise<string> => {
      if (!actor) throw new Error("Actor not ready");
      return (actor as any).overrideStageDate(
        data.orderId,
        data.stageId,
        data.date,
        data.note,
      );
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
      return (actor as any).listOrderStages(orderId);
    },
    enabled: !!actor && !isFetching && orderId !== null,
  });
}

// ─── Updates Feed ──────────────────────────────────────────────────────────

export function useAddUpdate() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      orderId: bigint;
      text: string;
    }): Promise<string> => {
      if (!actor) throw new Error("Actor not ready");
      return (actor as any).addUpdate(data.orderId, data.text);
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
      return (actor as any).listUpdates(orderId);
    },
    enabled: !!actor && !isFetching && orderId !== null,
  });
}

// ─── Audit ─────────────────────────────────────────────────────────────────

export function useListAuditLog() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["audit"],
    queryFn: async (): Promise<AuditEntry[]> => {
      if (!actor) return [];
      return (actor as any).listAuditLog();
    },
    enabled: !!actor && !isFetching,
  });
}

// ─── Settings ──────────────────────────────────────────────────────────────

export function useGetSetting(key: string) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["settings", key],
    queryFn: async (): Promise<string | null> => {
      if (!actor) return null;
      return (actor as any).getSetting(key);
    },
    enabled: !!actor && !isFetching,
    staleTime: 60_000,
  });
}

export function useSetSetting() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      key: string;
      value: string;
    }): Promise<string> => {
      if (!actor) throw new Error("Actor not ready");
      return (actor as any).setSetting(data.key, data.value);
    },
    onSuccess: (_data, vars) =>
      qc.invalidateQueries({ queryKey: ["settings", vars.key] }),
  });
}

// ─── User / Role Queries ───────────────────────────────────────────────────

export function useGetCurrentUser() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["auth", "currentUser"],
    queryFn: async (): Promise<AppUser | null> => {
      if (!actor) return null;
      return (actor as any).getCurrentUser();
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
      return (actor as any).listRoles();
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
      return (actor as any).listUsers();
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
      return (actor as any).registerSelf(username);
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
    }: {
      userId: bigint;
      roleIds: bigint[];
    }): Promise<string> => {
      if (!actor) throw new Error("Actor not ready");
      return (actor as any).assignRoles(userId, roleIds);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
}

export function useDeleteUser() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (userId: bigint): Promise<string> => {
      if (!actor) throw new Error("Actor not ready");
      return (actor as any).deleteUser(userId);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
}

export function useCreateRole() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      name,
      desc,
    }: {
      name: string;
      desc: string;
    }): Promise<string> => {
      if (!actor) throw new Error("Actor not ready");
      return (actor as any).createRole(name, desc);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["roles"] }),
  });
}
