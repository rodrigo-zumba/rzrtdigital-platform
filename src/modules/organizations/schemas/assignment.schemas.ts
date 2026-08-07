import { z } from "zod";

export const assignmentTypeValues = ["ACCOUNT_MANAGER", "ANALYST", "SUPPORT"] as const;

export const createAssignmentSchema = z.object({
  organizationId: z.string().min(1),
  userId: z.string().min(1),
  assignmentType: z.enum(assignmentTypeValues),
});
export type CreateAssignmentInput = z.infer<typeof createAssignmentSchema>;

export const removeAssignmentSchema = z.object({
  organizationId: z.string().min(1),
  assignmentId: z.string().min(1),
});
export type RemoveAssignmentInput = z.infer<typeof removeAssignmentSchema>;
