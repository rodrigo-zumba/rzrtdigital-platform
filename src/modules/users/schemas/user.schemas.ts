import { z } from "zod";

export const internalRoleValues = ["SUPER_ADMIN", "ADMIN", "MANAGER", "ANALYST"] as const;
export const memberRoleValues = ["CLIENT_ADMIN", "CLIENT_MEMBER", "CLIENT_VIEWER"] as const;

export const listInternalUsersSchema = z.object({
  q: z.string().trim().max(120).optional(),
  role: z.enum(internalRoleValues).optional(),
  page: z.coerce.number().int().min(1).default(1),
});
export type ListInternalUsersInput = z.infer<typeof listInternalUsersSchema>;

export const updateInternalRoleSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(internalRoleValues),
});
export type UpdateInternalRoleInput = z.infer<typeof updateInternalRoleSchema>;

export const setUserStatusSchema = z.object({
  userId: z.string().min(1),
  status: z.enum(["ACTIVE", "SUSPENDED"]),
});
export type SetUserStatusInput = z.infer<typeof setUserStatusSchema>;

export const updateMemberRoleSchema = z.object({
  organizationId: z.string().min(1),
  userId: z.string().min(1),
  role: z.enum(memberRoleValues),
});
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;

export const setMemberStatusSchema = z.object({
  organizationId: z.string().min(1),
  userId: z.string().min(1),
  status: z.enum(["ACTIVE", "SUSPENDED"]),
});
export type SetMemberStatusInput = z.infer<typeof setMemberStatusSchema>;

export const removeMemberSchema = z.object({
  organizationId: z.string().min(1),
  userId: z.string().min(1),
});
export type RemoveMemberInput = z.infer<typeof removeMemberSchema>;

export const updateOwnProfileSchema = z.object({
  name: z.string().trim().min(1, "Informe seu nome.").max(120),
});
export type UpdateOwnProfileInput = z.infer<typeof updateOwnProfileSchema>;
