"use client";

import { Loader2 } from "lucide-react";

export function getToolLabel(toolName: string, args: Record<string, unknown>): string {
  const rawPath = typeof args.path === "string" ? args.path : "";
  const file = rawPath.split("/").pop() || rawPath || "file";

  if (toolName === "str_replace_editor") {
    switch (args.command) {
      case "create":      return `Creating ${file}`;
      case "str_replace": return `Editing ${file}`;
      case "insert":      return `Inserting into ${file}`;
      case "view":        return `Reading ${file}`;
      default:            return `Editing ${file}`;
    }
  }
  if (toolName === "file_manager") {
    switch (args.command) {
      case "rename": return `Renaming ${file}`;
      case "delete": return `Deleting ${file}`;
      default:       return `Managing files`;
    }
  }
  return toolName;
}

export interface ToolInvocationBadgeProps {
  toolName: string;
  args: Record<string, unknown>;
  state: string;
  result?: unknown;
}

export function ToolInvocationBadge({ toolName, args, state, result }: ToolInvocationBadgeProps) {
  const label = getToolLabel(toolName, args);
  const isDone = state === "result" && result != null;

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs border border-neutral-200">
      {isDone ? (
        <div className="w-2 h-2 rounded-full bg-emerald-500" />
      ) : (
        <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
      )}
      <span className="text-neutral-700">{label}</span>
    </div>
  );
}
