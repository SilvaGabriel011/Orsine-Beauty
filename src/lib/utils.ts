/**
 * Modulo de Utilitarios — Bela Orsine Beauty
 *
 * Funcoes auxiliares gerais.
 */

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Combina classes CSS de forma segura, resolvendo conflitos Tailwind.
 *
 * Usa clsx para concatenacao logica + twMerge para remover duplicatas.
 * Importante para componentes que aceitam className dinamico.
 *
 * Exemplo:
 *   cn("px-2 py-4", condition && "bg-red-500", "px-4")
 *   → "py-4 bg-red-500 px-4" (px-2 removido, px-4 ganha)
 *
 * @param inputs Array de classes (strings, objetos, arrays, etc)
 * @returns String unica de classes CSS combinadas
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
