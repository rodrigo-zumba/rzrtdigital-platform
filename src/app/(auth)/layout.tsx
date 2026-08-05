export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[image:var(--gradient-radial)] px-4 py-12">
      <div className="w-full max-w-sm">
        <p className="mb-8 text-center font-[family-name:var(--font-display)] text-lg font-semibold text-text-primary">
          RZRT <span className="text-blue-light">Digital</span>
        </p>
        <div className="surface-card p-8">{children}</div>
      </div>
    </div>
  );
}
