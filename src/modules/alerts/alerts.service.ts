import type { CreateSubscriptionInput, UpdateSubscriptionInput } from "./alerts.validation";
import * as repo from "./alerts.repo";

export async function createSubscription(userId: number, input: CreateSubscriptionInput) {
  const id = await repo.createSubscription(userId, input);
  return repo.findSubscriptionById(id);
}

export async function listMySubscriptions(
  userId: number,
  query: {
    page?: number;
    limit?: number;
    isActive?: string;
    areaType?: "city" | "governorate" | "bbox";
    incidentCategory?: string;
  }
) {
  const page = Math.max(1, Number(query.page ?? 1));
  const limit = Math.min(100, Math.max(1, Number(query.limit ?? 20)));

  const isActive =
    query.isActive === undefined ? undefined : query.isActive === "true" || query.isActive === "1";

  return repo.getSubscriptionsByUser(userId, {
    page,
    limit,
    isActive,
    areaType: query.areaType,
    incidentCategory: query.incidentCategory,
  });
}

export async function updateMySubscription(userId: number, id: number, input: UpdateSubscriptionInput) {
  const existing = await repo.findSubscriptionById(id);

  if (!existing) {
    const err: any = new Error("Subscription not found");
    err.status = 404;
    throw err;
  }

  if (Number(existing.user_id) !== Number(userId)) {
    const err: any = new Error("Forbidden");
    err.status = 403;
    throw err;
  }

  await repo.updateSubscriptionById(id, input);
  return repo.findSubscriptionById(id);
}

export async function deleteMySubscription(userId: number, id: number) {
  const existing = await repo.findSubscriptionById(id);

  if (!existing) {
    const err: any = new Error("Subscription not found");
    err.status = 404;
    throw err;
  }

  if (Number(existing.user_id) !== Number(userId)) {
    const err: any = new Error("Forbidden");
    err.status = 403;
    throw err;
  }

  await repo.deleteSubscriptionById(id);
  return { ok: true };
}

/**
 * NEW: list alerts
 */
export async function listMyAlerts(
  userId: number,
  query: { page: number; limit: number }
) {
  return repo.getAlertsByUser(userId, query);
}

/**
 * Trigger when incident verified
 */
export async function onIncidentVerified(params: {
  incidentId: number;
  category: string;
  city?: string | null;
  governorate?: string | null;
  lat?: number | null;
  lng?: number | null;
}) {
  const matchedSubs = await repo.findMatchingSubscriptions({
    incidentCategory: params.category,
    city: params.city ?? null,
    governorate: params.governorate ?? null,
    lat: params.lat ?? null,
    lng: params.lng ?? null,
  });

  const subIds = matchedSubs.map((s) => s.id);

  const created = await repo.createAlertRecords(subIds, params.incidentId);

  return {
    created,
    matchedSubscriptions: subIds.length,
  };
}

export type NotificationProvider = {
  name: string;
  send: (payload: { userId: number; incidentId: number; subscriptionId: number }) => Promise<void>;
};

export const ConsoleProvider: NotificationProvider = {
  name: "console",
  async send(payload) {
    console.log("[ALERT DISPATCH]", payload);
  },
};
