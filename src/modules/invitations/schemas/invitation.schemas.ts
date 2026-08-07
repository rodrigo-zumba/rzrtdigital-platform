import { z } from "zod";

export const inviteMemberSchema = z.object({
  organizationId: z.string().min(1),
  email: z.string().trim().toLowerCase().email("Informe um e-mail válido."),
  role: z.enum(["CLIENT_ADMIN", "CLIENT_MEMBER", "CLIENT_VIEWER"]),
});
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;

export const inviteInternalUserSchema = z.object({
  email: z.string().trim().toLowerCase().email("Informe um e-mail válido."),
  role: z.enum(["ADMIN", "MANAGER", "ANALYST"]),
});
export type InviteInternalUserInput = z.infer<typeof inviteInternalUserSchema>;
