import { randomBytes } from "node:crypto";

import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { env } from "@/lib/env";

import { s3Client } from "./s3-client";

const UPLOAD_URL_EXPIRATION_SECONDS = 5 * 60;
const DOWNLOAD_URL_EXPIRATION_SECONDS = 5 * 60;

/** Chave nunca previsível/reaproveitável entre organizações — prefixo por org. */
export function buildStorageKey(organizationId: string, originalName: string): string {
  const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `${organizationId}/${randomBytes(16).toString("hex")}-${safeName}`;
}

export async function createUploadUrl(storageKey: string, mimeType: string): Promise<string> {
  const command = new PutObjectCommand({ Bucket: env.S3_BUCKET, Key: storageKey, ContentType: mimeType });
  return getSignedUrl(s3Client, command, { expiresIn: UPLOAD_URL_EXPIRATION_SECONDS });
}

export async function createDownloadUrl(storageKey: string): Promise<string> {
  const command = new GetObjectCommand({ Bucket: env.S3_BUCKET, Key: storageKey });
  return getSignedUrl(s3Client, command, { expiresIn: DOWNLOAD_URL_EXPIRATION_SECONDS });
}
