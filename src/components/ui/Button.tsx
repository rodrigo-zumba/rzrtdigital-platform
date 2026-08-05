"use client";

import type { ButtonHTMLAttributes } from "react";
import { useFormStatus } from "react-dom";

import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost";

const variantStyles: Record<ButtonVariant, string> = {
  primary: "bg-blue text-text-primary shadow-[var(--shadow-glow)] hover:brightness-110 active:brightness-95",
  secondary:
    "border border-border-strong text-text-primary bg-surface/60 hover:bg-surface-hover hover:border-blue-light/50",
  ghost: "text-text-primary hover:text-blue-light",
};

const baseStyles =
  "inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] px-5 py-2.5 min-h-[44px] text-sm font-semibold tracking-tight transition-all duration-[var(--duration-base)] ease-[var(--ease-standard)] hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:-translate-y-0";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant };

export function Button({ variant = "primary", className, type = "button", ...props }: ButtonProps) {
  return (
    <button type={type} className={cn(baseStyles, variantStyles[variant], className)} {...props} />
  );
}

/** Botão de submit que reflete o estado pendente do formulário (React 19 useFormStatus). */
export function SubmitButton({
  children,
  pendingLabel,
  variant = "primary",
  className,
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  variant?: ButtonVariant;
  className?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" variant={variant} disabled={pending} className={cn("w-full", className)}>
      {pending ? pendingLabel ?? "Enviando..." : children}
    </Button>
  );
}
