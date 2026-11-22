"use client";

import * as React from "react";
import { useState } from "react";
import { Check, Copy, Terminal } from "lucide-react";

interface CodeBlockProps {
  code: string;
  language?: string;
  filename?: string;
  showLineNumbers?: boolean;
}

export function CodeBlock({
  code,
  language = "typescript",
  filename,
  showLineNumbers = false,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = code.trim().split("\n");

  return (
    <div className="group relative my-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-950 text-zinc-100 overflow-hidden shadow-sm">
      {/* Header bar if filename or language is provided */}
      <div className="flex h-10 items-center justify-between border-b border-zinc-800 bg-zinc-900/70 px-4">
        <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono">
          <Terminal className="size-3.5 text-zinc-500" />
          <span>{filename || language}</span>
        </div>
        <button
          onClick={handleCopy}
          aria-label="Copy code"
          className="flex items-center gap-1.5 rounded px-2 py-1 text-xs text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-100"
        >
          {copied ? (
            <>
              <Check className="size-3.5 text-emerald-400" />
              <span className="text-[11px] text-emerald-400 font-medium">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="size-3.5" />
              <span className="text-[11px]">Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code content */}
      <div className="overflow-x-auto p-4 text-xs font-mono leading-relaxed">
        <pre className="grid">
          {lines.map((line, idx) => (
            <div key={idx} className="table-row">
              {showLineNumbers && (
                <span className="table-cell select-none pr-4 text-right text-zinc-600 font-mono text-[11px]">
                  {idx + 1}
                </span>
              )}
              <span className="table-cell text-zinc-200">{line || " "}</span>
            </div>
          ))}
        </pre>
      </div>
    </div>
  );
}
