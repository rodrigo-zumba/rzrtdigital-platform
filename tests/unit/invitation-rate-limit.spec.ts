import { beforeEach, describe, expect, it, vi } from "vitest";

// previewInvitation/acceptInvitation checam o rate limit antes de tocar o
// banco — mockar checkRateLimit para negar prova que o call site realmente
// respeita o resultado do limiter, sem depender de um Upstash real (que em
// dev/test é inacessível e cai no fail-open, docs/CLAUDE.md §4.12 não se
// aplica aqui, é infra, não dado de cliente).
vi.mock("@/lib/security/rate-limit", () => ({
  checkRateLimit: vi.fn(),
  invitationRateLimitByIp: {},
  invitationRateLimitByToken: {},
}));

import { checkRateLimit } from "@/lib/security/rate-limit";
import { acceptInvitation, previewInvitation } from "@/modules/invitations/services/invitation.service";

const mockedCheckRateLimit = vi.mocked(checkRateLimit);

describe("rate limit de convite", () => {
  beforeEach(() => {
    mockedCheckRateLimit.mockReset();
  });

  it("previewInvitation nega com a mensagem genérica quando o rate limit é excedido", async () => {
    mockedCheckRateLimit.mockResolvedValue(false);

    const result = await previewInvitation("token-qualquer", "203.0.113.1");

    expect(result).toEqual({ valid: false, reason: "Convite inválido, expirado ou já utilizado." });
    expect(mockedCheckRateLimit).toHaveBeenCalled();
  });

  it("acceptInvitation rejeita quando o rate limit é excedido", async () => {
    mockedCheckRateLimit.mockResolvedValue(false);

    await expect(
      acceptInvitation({ token: "token-qualquer", password: "SenhaForte123456", ip: "203.0.113.1" }),
    ).rejects.toThrow(/inválido, expirado ou já utilizado/);
  });
});
