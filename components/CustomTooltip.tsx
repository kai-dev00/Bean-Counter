"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cloneElement, isValidElement, ReactNode } from "react";

type CustomTooltipProps = {
  content: string | ReactNode;
  children: ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  align?: "start" | "center" | "end";
};

export function CustomTooltip({
  content,
  children,
  side = "top",
  align = "center",
}: CustomTooltipProps) {
  // Icon-only buttons have no visible text, so reuse the tooltip text as
  // their accessible name (unless they already have one)
  const trigger =
    typeof content === "string" &&
    isValidElement<{ "aria-label"?: string }>(children) &&
    !children.props["aria-label"]
      ? cloneElement(children, { "aria-label": content })
      : children;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{trigger}</TooltipTrigger>
        <TooltipContent side={side} align={align}>
          <p>{content}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
