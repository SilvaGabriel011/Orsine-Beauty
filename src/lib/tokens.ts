/**
 * Utilitários para geração e validação de tokens de cancelamento.
 * Usa JWT com assinatura HMAC-SHA256 e expiração de 7 dias.
 */

import { SignJWT, jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.CANCEL_TOKEN_SECRET || "default-secret-change-in-production"
);

export interface CancelTokenPayload {
  appointmentId: string;
  clientId: string;
  type: "cancel";
}

/**
 * Gera um token JWT para cancelamento de agendamento.
 * O token expira em 7 dias.
 */
export async function generateCancelToken(params: {
  appointmentId: string;
  clientId: string;
}): Promise<string> {
  const payload: CancelTokenPayload = {
    appointmentId: params.appointmentId,
    clientId: params.clientId,
    type: "cancel",
  };

  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

/**
 * Valida um token de cancelamento e retorna o payload.
 * Lança erro se token for inválido ou expirado.
 */
export async function validateCancelToken(token: string): Promise<CancelTokenPayload> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    
    // Verifica se o tipo é válido
    if (payload.type !== "cancel") {
      throw new Error("Invalid token type");
    }

    return {
      appointmentId: payload.appointmentId as string,
      clientId: payload.clientId as string,
      type: "cancel",
    };
  } catch {
    throw new Error("Token inválido ou expirado");
  }
}
