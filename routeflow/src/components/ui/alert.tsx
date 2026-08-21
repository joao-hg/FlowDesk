import * as React from "react";
import { AlertTriangle, Info, XCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type AlertTone = "error" | "warning" | "info" | "success";

const TONES: Record<AlertTone, { className: string; Icon: typeof Info }> = {
  error: { className: "border-danger/30 bg-danger-soft text-danger", Icon: XCircle },
  warning: { className: "border-warning/30 bg-warning-soft text-warning", Icon: AlertTriangle },
  info: { className: "border-brand/30 bg-brand-soft text-brand", Icon: Info },
  success: { className: "border-success/30 bg-success-soft text-success", Icon: Info },
};

interface AlertProps {
  tone?: AlertTone;
  children: React.ReactNode;
  onDismiss?: () => void;
  className?: string;
}

export function Alert({ tone = "info", children, onDismiss, className }: AlertProps) {
  const { className: toneClass, Icon } = TONES[tone];
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-2.5 rounded-xl border px-3 py-2.5 text-xs leading-relaxed",
        toneClass,
        className,
      )}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <div className="flex-1">{children}</div>
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Fechar aviso"
          className="rounded p-0.5 opacity-70 transition hover:opacity-100"
        >
          <X className="h-3.5 w-3.5" aria-hidden />
        </button>
      ) : null}
    </div>
  );
}
