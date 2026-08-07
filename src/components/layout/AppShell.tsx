"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string };

type AppShellProps = {
  brand: ReactNode;
  navItems: NavItem[];
  orgSwitcher?: ReactNode;
  notifications: ReactNode;
  userMenu: ReactNode;
  breadcrumbs: ReactNode;
  children: ReactNode;
};

export function AppShell({ brand, navItems, orgSwitcher, notifications, userMenu, breadcrumbs, children }: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  const nav = (
    <nav className="flex flex-col gap-1 p-3" aria-label="Navegação principal">
      {navItems.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            onClick={() => setMobileOpen(false)}
            className={cn(
              "flex min-h-[44px] items-center rounded-[var(--radius-md)] px-3 text-sm font-medium transition-colors",
              collapsed ? "justify-center" : "gap-2",
              active
                ? "bg-blue/15 text-blue-light"
                : "text-text-secondary hover:bg-surface-hover hover:text-text-primary",
            )}
          >
            <span className={collapsed ? "sr-only" : "truncate"}>{item.label}</span>
            {collapsed && <span aria-hidden="true">{item.label.charAt(0)}</span>}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="flex min-h-screen">
      {mobileOpen && (
        <button
          type="button"
          aria-label="Fechar menu"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-30 bg-black/60 lg:hidden"
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-border bg-bg-secondary transition-transform duration-[var(--duration-base)] ease-[var(--ease-standard)] lg:sticky lg:top-0 lg:h-screen lg:translate-x-0",
          collapsed ? "lg:w-[76px]" : "lg:w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex min-h-[64px] items-center justify-between border-b border-border px-4">
          <div className={collapsed ? "sr-only" : "truncate"}>{brand}</div>
          <button
            type="button"
            onClick={() => setCollapsed((value) => !value)}
            aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
            aria-expanded={!collapsed}
            className="hidden min-h-[44px] min-w-[44px] items-center justify-center rounded-[var(--radius-md)] text-text-secondary hover:bg-surface-hover hover:text-text-primary lg:flex"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4" aria-hidden="true">
              {collapsed ? (
                <path d="m9 6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
              ) : (
                <path d="m15 6-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
              )}
            </svg>
          </button>
        </div>
        {nav}
      </aside>

      <div className="flex min-h-screen flex-1 flex-col lg:pl-0">
        <header className="flex min-h-[64px] items-center gap-3 border-b border-border px-4">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Abrir menu"
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-[var(--radius-md)] text-text-secondary hover:text-text-primary lg:hidden"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5" aria-hidden="true">
              <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <div className="min-w-0 flex-1">{breadcrumbs}</div>

          {orgSwitcher}
          {notifications}
          {userMenu}
        </header>

        <main className="flex-1 overflow-x-hidden p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
