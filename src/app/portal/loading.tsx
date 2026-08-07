export default function PortalLoading() {
  return (
    <div className="flex flex-col gap-6" role="status" aria-label="Carregando painel">
      <div className="h-6 w-48 animate-pulse rounded-[var(--radius-sm)] bg-surface-hover" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="surface-card h-24 animate-pulse p-5" />
        ))}
      </div>
    </div>
  );
}
