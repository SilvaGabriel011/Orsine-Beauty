/**
 * API Route: /api/upload
 *
 * Processa upload de imagens para diferentes buckets.
 *
 * POST — Envia arquivo para Supabase Storage (categories, services, portfolio)
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { AppError, withErrorHandler, requireAdmin } from "@/lib/errors";

// Tipos de imagem permitidos (JPEG, PNG, WebP, AVIF)
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
// Limite de tamanho: 5MB
const MAX_SIZE = 5 * 1024 * 1024;

// POST: Upload de imagem para bucket especifico (requer admin)
export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  // Verifica permissao de admin
  await requireAdmin(supabase);

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const bucket = formData.get("bucket") as string | null;

  // Validacao: arquivo obrigatorio
  if (!file) {
    throw new AppError("VAL_MISSING_FIELDS", "Nenhum arquivo enviado");
  }

  // Validacao: bucket deve ser um dos permitidos
  if (!bucket || !["categories", "services", "portfolio"].includes(bucket)) {
    throw new AppError("VAL_INVALID_FORMAT", "Bucket invalido");
  }

  // Validacao: tipo de arquivo
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new AppError("VAL_INVALID_FORMAT", "Tipo de arquivo nao permitido. Use JPG, PNG ou WebP.");
  }

  // Validacao: tamanho maximo 5MB
  if (file.size > MAX_SIZE) {
    throw new AppError("VAL_INVALID_FORMAT", "Arquivo muito grande. Maximo 5MB.");
  }

  // Gera nome unico para arquivo: timestamp + random para evitar colisoes
  const ext = file.name.split(".").pop() || "jpg";
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
  const filePath = `${fileName}`;

  // Converte arquivo em buffer
  const arrayBuffer = await file.arrayBuffer();
  const fileBuffer = new Uint8Array(arrayBuffer);

  // Upload para Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(filePath, fileBuffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    throw new AppError("SYS_UPLOAD_FAILED", uploadError.message, uploadError);
  }

  // Obtem URL publica do arquivo
  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath);

  return NextResponse.json({
    url: urlData.publicUrl,
    path: filePath,
    bucket,
  });
});
