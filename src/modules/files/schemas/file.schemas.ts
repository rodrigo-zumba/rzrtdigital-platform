import { z } from "zod";

export const fileVisibilityValues = ["INTERNAL", "CLIENT", "PROJECT_MEMBERS"] as const;

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export const requestUploadSchema = z.object({
  organizationId: z.string().min(1),
  originalName: z.string().trim().min(1).max(255),
  mimeType: z.string().trim().min(1).max(120),
  size: z.coerce.number().int().min(1).max(MAX_FILE_SIZE, "Arquivo maior que 50MB."),
  visibility: z.enum(fileVisibilityValues).default("CLIENT"),
});
export type RequestUploadInput = z.infer<typeof requestUploadSchema>;

export const confirmUploadSchema = z.object({
  organizationId: z.string().min(1),
  storageKey: z.string().min(1),
  originalName: z.string().trim().min(1).max(255),
  mimeType: z.string().trim().min(1).max(120),
  size: z.coerce.number().int().min(1).max(MAX_FILE_SIZE),
  visibility: z.enum(fileVisibilityValues).default("CLIENT"),
});
export type ConfirmUploadInput = z.infer<typeof confirmUploadSchema>;

export const deleteFileSchema = z.object({
  organizationId: z.string().min(1),
  fileId: z.string().min(1),
});
export type DeleteFileInput = z.infer<typeof deleteFileSchema>;

export const downloadFileSchema = z.object({
  organizationId: z.string().min(1),
  fileId: z.string().min(1),
});
export type DownloadFileInput = z.infer<typeof downloadFileSchema>;
