import { z } from "zod";

/**
 * Slugs que colidiriam com rotas do próprio app ou seriam ambíguos como
 * identificador de organização (docs/ESPECIFICACAO.md §5, nota do modelo
 * Organization: "slug com lista de reservados").
 */
export const RESERVED_SLUGS = [
  "admin",
  "portal",
  "api",
  "login",
  "logout",
  "convite",
  "esqueci-minha-senha",
  "redefinir-senha",
  "selecionar-workspace",
  "_next",
  "static",
  "assets",
  "public",
] as const;

export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "O identificador precisa ter no mínimo 3 caracteres.")
  .max(48, "O identificador pode ter no máximo 48 caracteres.")
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use apenas letras minúsculas, números e hífen (ex.: cliente-exemplo).")
  .refine((slug) => !(RESERVED_SLUGS as readonly string[]).includes(slug), {
    message: "Este identificador é reservado. Escolha outro.",
  });
