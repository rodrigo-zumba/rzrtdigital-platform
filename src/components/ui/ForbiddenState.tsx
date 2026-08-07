export function ForbiddenState({ message }: { message?: string }) {
  return (
    <div className="surface-card p-6 text-sm text-text-secondary">
      {message ?? "Você não tem permissão para ver esta página."}
    </div>
  );
}
