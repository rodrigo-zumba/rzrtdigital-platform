import { z } from "zod";

export const listNotificationsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
});
export type ListNotificationsInput = z.infer<typeof listNotificationsSchema>;
