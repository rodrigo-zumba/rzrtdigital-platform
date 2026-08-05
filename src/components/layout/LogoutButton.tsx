import { Button } from "@/components/ui/Button";
import { logoutAction } from "@/modules/auth/actions/logout.action";

export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <Button type="submit" variant="ghost" className="w-auto px-3 py-2 text-sm">
        Sair
      </Button>
    </form>
  );
}
