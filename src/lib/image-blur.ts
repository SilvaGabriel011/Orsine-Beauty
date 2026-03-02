/**
 * Utilitarios para blur placeholder em imagens.
 *
 * Gera um base64 SVG leve para usar como blurDataURL no next/image.
 * Isso elimina o flash branco enquanto a imagem carrega.
 */

/**
 * Gera um blur placeholder SVG em base64.
 * Retorna uma string base64 de ~100 bytes (muito leve).
 *
 * @param width  Largura da imagem (default: 8)
 * @param height Altura da imagem (default: 8)
 * @param color  Cor de fundo em hex (default: rosa claro)
 */
export function generateBlurPlaceholder(
  width = 8,
  height = 8,
  color = "f3e8ee"
): string {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
      <filter id="b"><feGaussianBlur stdDeviation="1"/></filter>
      <rect width="${width}" height="${height}" fill="#${color}" filter="url(#b)"/>
    </svg>
  `.trim();

  const base64 = Buffer.from(svg).toString("base64");
  return `data:image/svg+xml;base64,${base64}`;
}

/** Placeholder padrão cor rosa (para fotos de serviços e portfolio) */
export const BLUR_ROSE = generateBlurPlaceholder(8, 8, "fce7f3");

/** Placeholder padrão cor cinza (para fotos de perfil e genéricas) */
export const BLUR_GREY = generateBlurPlaceholder(8, 8, "f3f4f6");

/** Placeholder padrão cor bege (para fotos de antes/depois) */
export const BLUR_BEIGE = generateBlurPlaceholder(8, 8, "fdf4f0");
