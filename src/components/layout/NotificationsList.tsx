import { Pagination } from "@/components/ui/Pagination";
import { markNotificationReadAction } from "@/modules/notifications/actions/mark-notification-read.action";
import type { listNotifications } from "@/modules/notifications/services/notification.service";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  dateStyle: "short",
  timeStyle: "short",
});

export function NotificationsList({
  result,
  basePath,
}: {
  result: Awaited<ReturnType<typeof listNotifications>>;
  basePath: string;
}) {
  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-text-primary">Notificações</h1>
        <form action={markNotificationReadAction}>
          <button type="submit" className="text-sm text-blue-light hover:underline">
            Marcar todas como lidas
          </button>
        </form>
      </div>

      {result.items.length === 0 ? (
        <div className="surface-card p-6 text-sm text-text-secondary">Nenhuma notificação por aqui.</div>
      ) : (
        <ul className="flex flex-col gap-2">
          {result.items.map((notification) => (
            <li
              key={notification.id}
              className={`surface-card flex items-start justify-between gap-3 p-4 ${notification.readAt ? "opacity-70" : ""}`}
            >
              <div>
                <p className="text-sm font-medium text-text-primary">{notification.title}</p>
                <p className="text-sm text-text-secondary">{notification.message}</p>
                <p className="mt-1 text-xs text-text-secondary/70">{dateFormatter.format(notification.createdAt)}</p>
              </div>
              {!notification.readAt && (
                <form action={markNotificationReadAction}>
                  <input type="hidden" name="notificationId" value={notification.id} />
                  <button type="submit" className="shrink-0 text-xs text-blue-light hover:underline">
                    Marcar como lida
                  </button>
                </form>
              )}
            </li>
          ))}
        </ul>
      )}

      <Pagination page={result.page} pageCount={result.pageCount} basePath={basePath} searchParams={{}} />
    </div>
  );
}
