import { redirect } from "next/navigation";

import { LogoutButton } from "@/components/layout/LogoutButton";
import { getRequestContext } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getRequestContext();
  if (!ctx) redirect("/login");
  if (ctx.kind !== "INTERNAL") redirect("/portal");

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <p className="font-[family-name:var(--font-display)] text-base font-semibold">
          RZRT <span className="text-blue-light">Digital</span> · Admin
        </p>
        <div className="flex items-center gap-4">
          <span className="text-sm text-text-secondary">{ctx.name}</span>
          <LogoutButton />
        </div>
      </header>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
