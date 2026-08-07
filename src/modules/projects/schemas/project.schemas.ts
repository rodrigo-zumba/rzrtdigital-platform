import { z } from "zod";

export const projectTypeValues = [
  "CRIATIVOS",
  "ESTRATEGIA_DIGITAL",
  "FUNIS_DE_VENDAS",
  "INTELIGENCIA_ARTIFICIAL",
  "SITES_E_LANDING_PAGES",
  "TRAFEGO_PAGO",
  "OUTRO",
] as const;

export const projectStatusValues = ["PLANNING", "IN_PROGRESS", "ON_HOLD", "COMPLETED", "CANCELLED"] as const;
export const projectPriorityValues = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;
export const taskStatusValues = ["TODO", "IN_PROGRESS", "DONE"] as const;

const optionalDate = z
  .string()
  .trim()
  .optional()
  .or(z.literal(""))
  .transform((value) => (value ? new Date(value) : undefined));

export const projectWriteSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome do projeto.").max(160),
  description: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ? value : undefined)),
  type: z.enum(projectTypeValues),
  priority: z.enum(projectPriorityValues),
  startDate: optionalDate,
  dueDate: optionalDate,
});

export const createProjectSchema = projectWriteSchema.extend({ organizationId: z.string().min(1) });
export type CreateProjectInput = z.infer<typeof createProjectSchema>;

export const updateProjectSchema = projectWriteSchema.extend({
  organizationId: z.string().min(1),
  projectId: z.string().min(1),
});
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

export const setProjectStatusSchema = z.object({
  organizationId: z.string().min(1),
  projectId: z.string().min(1),
  status: z.enum(projectStatusValues),
});
export type SetProjectStatusInput = z.infer<typeof setProjectStatusSchema>;

export const setProjectProgressSchema = z.object({
  organizationId: z.string().min(1),
  projectId: z.string().min(1),
  progress: z.coerce.number().int().min(0).max(100),
});
export type SetProjectProgressInput = z.infer<typeof setProjectProgressSchema>;

export const archiveProjectSchema = z.object({
  organizationId: z.string().min(1),
  projectId: z.string().min(1),
});
export type ArchiveProjectInput = z.infer<typeof archiveProjectSchema>;

export const createTaskSchema = z.object({
  organizationId: z.string().min(1),
  projectId: z.string().min(1),
  title: z.string().trim().min(2, "Informe o título da tarefa.").max(200),
  priority: z.enum(projectPriorityValues),
  dueDate: optionalDate,
});
export type CreateTaskInput = z.infer<typeof createTaskSchema>;

export const updateTaskStatusSchema = z.object({
  organizationId: z.string().min(1),
  projectId: z.string().min(1),
  taskId: z.string().min(1),
  status: z.enum(taskStatusValues),
});
export type UpdateTaskStatusInput = z.infer<typeof updateTaskStatusSchema>;

export const deleteTaskSchema = z.object({
  organizationId: z.string().min(1),
  projectId: z.string().min(1),
  taskId: z.string().min(1),
});
export type DeleteTaskInput = z.infer<typeof deleteTaskSchema>;
