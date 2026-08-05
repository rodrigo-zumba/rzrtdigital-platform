/**
 * Erros padronizados (docs/ESPECIFICACAO.md §10). Nunca expõem stack trace
 * ao usuário — stack só vai para log/observabilidade.
 */
export class AppError extends Error {
  readonly code: string;
  readonly httpStatus: number;

  constructor(code: string, message: string, httpStatus: number) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.httpStatus = httpStatus;
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Você não tem permissão para executar esta ação.") {
    super("FORBIDDEN", message, 403);
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Recurso não encontrado.") {
    super("NOT_FOUND", message, 404);
    this.name = "NotFoundError";
  }
}

export class ValidationError extends AppError {
  constructor(message = "Dados inválidos.") {
    super("VALIDATION_ERROR", message, 400);
    this.name = "ValidationError";
  }
}

export class UnauthenticatedError extends AppError {
  constructor(message = "Sessão inválida ou expirada.") {
    super("UNAUTHENTICATED", message, 401);
    this.name = "UnauthenticatedError";
  }
}

export class RateLimitedError extends AppError {
  constructor(message = "Muitas tentativas. Tente novamente em alguns minutos.") {
    super("RATE_LIMITED", message, 429);
    this.name = "RateLimitedError";
  }
}

export type ErrorResponse = { ok: false; error: { code: string; message: string } };
export type ActionResult<T = undefined> = { ok: true; data: T } | ErrorResponse;

export function toErrorResponse(error: unknown): ErrorResponse {
  if (error instanceof AppError) {
    return { ok: false, error: { code: error.code, message: error.message } };
  }

  // Erro não-mapeado: nunca vaza detalhe interno ao usuário.
  console.error(error);
  return { ok: false, error: { code: "INTERNAL_ERROR", message: "Erro interno. Tente novamente." } };
}
