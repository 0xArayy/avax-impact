"use client";

import { useState, type ReactNode } from "react";
import { shortenHex } from "@/lib/presentation.mjs";

export function ProvenanceLabel({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "safe" | "warning" }) {
  return <span className={`provenance provenance--${tone}`}>{children}</span>;
}

export function CopyButton({ value, label = "Copy" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1_500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button className="copy-button" type="button" onClick={copy} aria-label={`${label}: ${value}`}>
      <span aria-hidden="true">{copied ? "✓" : "□"}</span> {copied ? "Copied" : label}
    </button>
  );
}

export function HexField({ label, value, hint, emphasize = false }: { label: string; value: string; hint?: string; emphasize?: boolean }) {
  return (
    <div className={`hex-field${emphasize ? " hex-field--emphasize" : ""}`}>
      <div className="hex-field__heading">
        <div>
          <span>{label}</span>
          {hint ? <small>{hint}</small> : null}
        </div>
        <CopyButton value={value} />
      </div>
      <code title={value}>{shortenHex(value, 24, 18)}</code>
    </div>
  );
}

export function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string | null;
  children: ReactNode;
}) {
  return (
    <div className="field">
      <div className="field__label-row">
        <label htmlFor={id}>{label}</label>
        {hint ? <span>{hint}</span> : null}
      </div>
      {children}
      {error ? <p className="field__error" id={`${id}-error`}>{error}</p> : null}
    </div>
  );
}
