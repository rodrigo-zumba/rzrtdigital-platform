import Link from "next/link";

import { markNotificationReadAction } from "@/modules/notifications/actions/mark-notification-read.action";

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  link: string | null;
  createdAt: Date;
};

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

export function NotificationsMenu({
  items,
  unreadCount,
  viewAllHref,
}: {
  items: NotificationItem[];
  unreadCount: number;
  viewAllHref: string;
}) {
  return (
    <details className="group relative">
      <summary
        className="relative flex min-h-[44px] min-w-[44px] cursor-pointer list-none items-center justify-center rounded-[var(--radius-md)] text-text-secondary outline-none hover:text-blue-light focus-visible:ring-2 focus-visible:ring-blue-light"
        aria-label={unreadCount > 0 ? `${unreadCount} notificações não lidas` : "Notificações"}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="h-5 w-5" aria-hidden="true">
          <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold text-text-primary">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </summary>

      <div className="absolute right-0 z-20 mt-2 w-80 rounded-[var(--radius-md)] border border-border bg-surface p-3 shadow-[var(--shadow-soft)]">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium text-text-primary">Notificações</p>
          {unreadCount > 0 && (
            <form action={markNotificationReadAction}>
              <button type="submit" className="text-xs text-blue-light hover:underline">
                Marcar todas como lidas
              </button>
            </form>
          )}
        </div>

        <div className="mt-2 flex flex-col gap-1">
          {items.length === 0 ? (
            <p className="py-6 text-center text-sm text-text-secondary">Nenhuma notificação por aqui.</p>
          ) : (
            items.map((item) => (
              <form
                key={item.id}
                action={markNotificationReadAction}
                className="flex items-start gap-2 rounded-[var(--radius-sm)] px-2 py-2 text-left hover:bg-surface-hover"
              >
                <input type="hidden" name="notificationId" value={item.id} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-text-primary">{item.title}</p>
                  <p className="text-xs text-text-secondary">{item.message}</p>
                  <p className="mt-1 text-xs text-text-secondary/70">{dateFormatter.format(item.createdAt)}</p>
                </div>
                <button
                  type="submit"
                  className="shrink-0 rounded-[var(--radius-sm)] px-2 py-1 text-xs text-text-secondary hover:text-blue-light"
                  aria-label="Marcar como lida"
                >
                  ✓
                </button>
              </form>
            ))
          )}
        </div>

        <Link href={viewAllHref} className="mt-2 block text-center text-xs text-blue-light hover:underline">
          Ver todas
        </Link>
      </div>
    </details>
  );
}
