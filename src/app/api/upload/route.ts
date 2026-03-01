import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { AppError, withErrorHandler, requireAdmin } from "@/lib/errors";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  await requireAdmin(supabase);

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const bucket = formData.get("bucket") as string | null;

  if (!file) {
    throw new AppError("VAL_MISSING_FIELDS", "Nenhum arquivo enviado");
  }

  if (!bucket || !["categories", "services", "portfolio"].includes(bucket)) {
    throw new AppError("VAL_INVALID_FORMAT", "Bucket invalido");
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new AppError("VAL_INVALID_FORMAT", "Tipo de arquivo nao permitido. Use JPG, PNG ou WebP.");
  }

  if (file.size > MAX_SIZE) {
    throw new AppError("VAL_INVALID_FORMAT", "Arquivo muito grande. Maximo 5MB.");
  }

  // Generate unique filename
  const ext = file.name.split(".").pop() || "jpg";
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
  const filePath = `${fileName}`;

  const arrayBuffer = await file.arrayBuffer();
  const fileBuffer = new Uint8Array(arrayBuffer);

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(filePath, fileBuffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    throw new AppError("SYS_UPLOAD_FAILED", uploadError.message, uploadError);
  }

  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath);

  return NextResponse.json({
    url: urlData.publicUrl,
    path: filePath,
    bucket,
  });
});
