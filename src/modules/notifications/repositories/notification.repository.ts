import { db } from "@/lib/db";

/**
 * Notification é tenant-scoped por schema (organizationId opcional), mas a
 * leitura aqui é sempre por `userId` — o sino do header mostra as
 * notificações do usuário logado, não de uma organização. `organizationId:
 * undefined` só satisfaz a presença de chave exigida pelo tenant guard (ver
 * src/lib/db/tenant-guard.ts); não restringe a busca.
 */
export function listUnreadForUser(userId: string, take: number) {
  return db.notification.findMany({
    where: { userId, organizationId: undefined, readAt: null },
    orderBy: { createdAt: "desc" },
    take,
  });
}

export function countUnreadForUser(userId: string) {
  return db.notification.count({ where: { userId, organizationId: undefined, readAt: null } });
}

export function markAsRead(id: string, userId: string) {
  return db.notification.updateMany({
    where: { id, userId, organizationId: undefined },
    data: { readAt: new Date() },
  });
}

export function markAllAsRead(userId: string) {
  return db.notification.updateMany({
    where: { userId, organizationId: undefined, readAt: null },
    data: { readAt: new Date() },
  });
}

/** Central de notificações (Fase 3) — lista paginada, lidas e não lidas. */
export function listForUser(userId: string, params: { skip: number; take: number }) {
  return db.notification.findMany({
    where: { userId, organizationId: undefined },
    orderBy: { createdAt: "desc" },
    skip: params.skip,
    take: params.take,
  });
}

export function countForUser(userId: string) {
  return db.notification.count({ where: { userId, organizationId: undefined } });
}
