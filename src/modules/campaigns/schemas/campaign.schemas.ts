import { z } from "zod";

export const campaignPlatformValues = ["META_ADS", "GOOGLE_ADS", "TIKTOK_ADS", "LINKEDIN_ADS", "OUTRO"] as const;
export const campaignStatusValues = ["PLANNING", "ACTIVE", "PAUSED", "COMPLETED"] as const;

const optionalDate = z
  .string()
  .trim()
  .optional()
  .or(z.literal(""))
  .transform((value) => (value ? new Date(value) : undefined));

export const createCampaignSchema = z.object({
  organizationId: z.string().min(1),
  name: z.string().trim().min(2, "Informe o nome da campanha.").max(160),
  platform: z.enum(campaignPlatformValues),
  objective: z
    .string()
    .trim()
    .max(200)
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ? value : undefined)),
  startDate: optionalDate,
  endDate: optionalDate,
  budget: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ? Number(value) : undefined)),
});
export type CreateCampaignInput = z.infer<typeof createCampaignSchema>;

export const setCampaignStatusSchema = z.object({
  organizationId: z.string().min(1),
  campaignId: z.string().min(1),
  status: z.enum(campaignStatusValues),
});
export type SetCampaignStatusInput = z.infer<typeof setCampaignStatusSchema>;

export const archiveCampaignSchema = z.object({
  organizationId: z.string().min(1),
  campaignId: z.string().min(1),
});
export type ArchiveCampaignInput = z.infer<typeof archiveCampaignSchema>;

export const addMetricSchema = z.object({
  organizationId: z.string().min(1),
  campaignId: z.string().min(1),
  date: z.string().trim().min(1, "Informe a data."),
  impressions: z.coerce.number().int().min(0),
  clicks: z.coerce.number().int().min(0),
  leads: z.coerce.number().int().min(0),
  conversions: z.coerce.number().int().min(0),
  spend: z.coerce.number().min(0),
  revenue: z.coerce.number().min(0).optional(),
});
export type AddMetricInput = z.infer<typeof addMetricSchema>;
