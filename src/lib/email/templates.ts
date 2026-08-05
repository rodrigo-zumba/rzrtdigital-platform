function layout(title: string, bodyHtml: string): string {
  return `<!doctype html>
<html lang="pt-BR">
  <body style="margin:0;padding:32px;background:#05070d;font-family:sans-serif;color:#f8fafc;">
    <div style="max-width:480px;margin:0 auto;background:#101728;border:1px solid rgba(148,163,184,0.16);border-radius:20px;padding:32px;">
      <h1 style="font-size:18px;margin:0 0 16px;">${title}</h1>
      ${bodyHtml}
      <p style="margin-top:32px;font-size:12px;color:#94a3b8;">RZRT Digital</p>
    </div>
  </body>
</html>`;
}

function button(href: string, label: string): string {
  return `<p style="margin:24px 0;"><a href="${href}" style="display:inline-block;background:#2563eb;color:#f8fafc;text-decoration:none;padding:12px 20px;border-radius:14px;font-weight:600;">${label}</a></p>
  <p style="font-size:12px;color:#94a3b8;word-break:break-all;">${href}</p>`;
}

export function invitationEmail(params: { inviterName: string; acceptUrl: string; organizationName?: string }) {
  const context = params.organizationName
    ? `para fazer parte da organização <strong>${params.organizationName}</strong>`
    : "para fazer parte da equipe";
  return {
    subject: "Você foi convidado para a RZRT Digital",
    html: layout(
      "Você recebeu um convite",
      `<p>${params.inviterName} convidou você ${context} no painel da RZRT Digital.</p>${button(params.acceptUrl, "Aceitar convite")}<p style="font-size:12px;color:#94a3b8;">Este convite expira em 7 dias.</p>`,
    ),
  };
}

export function passwordResetEmail(params: { resetUrl: string }) {
  return {
    subject: "Redefinição de senha — RZRT Digital",
    html: layout(
      "Redefinir senha",
      `<p>Recebemos um pedido para redefinir sua senha. Se não foi você, ignore este e-mail.</p>${button(params.resetUrl, "Redefinir senha")}<p style="font-size:12px;color:#94a3b8;">Este link expira em 1 hora e só pode ser usado uma vez.</p>`,
    ),
  };
}

export function emailVerificationEmail(params: { verifyUrl: string }) {
  return {
    subject: "Confirme seu e-mail — RZRT Digital",
    html: layout(
      "Confirme seu e-mail",
      `<p>Confirme seu endereço de e-mail para ativar o acesso ao painel.</p>${button(params.verifyUrl, "Confirmar e-mail")}`,
    ),
  };
}

export function accessGrantedEmail(params: { organizationName: string; loginUrl: string }) {
  return {
    subject: "Acesso liberado — RZRT Digital",
    html: layout(
      "Acesso liberado",
      `<p>Seu acesso à organização <strong>${params.organizationName}</strong> foi liberado.</p>${button(params.loginUrl, "Acessar o painel")}`,
    ),
  };
}
