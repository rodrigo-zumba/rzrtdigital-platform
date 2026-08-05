import { Resend } from "resend";

import { env } from "@/lib/env";

type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
};

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

function isAllowedOutsideProduction(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) return false;
  const allowlist = env.EMAIL_DEV_ALLOWLIST_DOMAINS.split(",").map((d) => d.trim().toLowerCase());
  return allowlist.includes(domain);
}

/**
 * Fora de produção, e-mail nunca sai para endereço real fora da allowlist
 * (CLAUDE.md §4.12): loga, não envia. Com EMAIL_TRANSPORT=console, nunca
 * envia de fato — loga o link/HTML no terminal (docs/ESPECIFICACAO.md §7).
 */
export async function sendEmail(input: SendEmailInput): Promise<void> {
  if (env.APP_ENV !== "production" && !isAllowedOutsideProduction(input.to)) {
    console.log(
      `[email bloqueado fora da allowlist] para=${input.to} assunto="${input.subject}" — não enviado.`,
    );
    return;
  }

  if (env.EMAIL_TRANSPORT === "console" || !resend) {
    console.log(`\n[email:console] para=${input.to}\nassunto: ${input.subject}\n${input.html}\n`);
    return;
  }

  const { error } = await resend.emails.send({
    from: env.EMAIL_FROM,
    to: input.to,
    subject: input.subject,
    html: input.html,
  });

  if (error) {
    console.error("Falha ao enviar e-mail via Resend:", error);
    throw new Error("Falha ao enviar e-mail.");
  }
}
