/**
 * IconButton — Botão de ícone com tooltip acessível.
 *
 * Envolve qualquer botão de ícone em um Tooltip do shadcn/ui.
 * Garante que leitores de tela e usuários de teclado sempre
 * saibam o que o botão faz.
 *
 * Uso:
 *   <IconButton tooltip="Remover item">
 *     <Trash2 className="h-4 w-4" />
 *   </IconButton>
 */
"use client";

import { forwardRef } from "react";
import type { ComponentProps } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface IconButtonProps extends ComponentProps<typeof Button> {
  tooltip: string;
  side?: "top" | "right" | "bottom" | "left";
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ tooltip, side = "top", children, ...props }, ref) => {
    return (
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button ref={ref} {...props}>
              {children}
            </Button>
          </TooltipTrigger>
          <TooltipContent side={side}>
            <p>{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
);

IconButton.displayName = "IconButton";
