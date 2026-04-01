import { test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { getToolLabel, ToolInvocationBadge } from "../ToolInvocationBadge";

afterEach(() => {
  cleanup();
});

// ---------------------------------------------------------------------------
// getToolLabel — unit tests
// ---------------------------------------------------------------------------

test("getToolLabel: str_replace_editor create with nested path", () => {
  expect(getToolLabel("str_replace_editor", { command: "create", path: "/src/components/App.jsx" }))
    .toBe("Creating App.jsx");
});

test("getToolLabel: str_replace_editor str_replace", () => {
  expect(getToolLabel("str_replace_editor", { command: "str_replace", path: "/Button.tsx" }))
    .toBe("Editing Button.tsx");
});

test("getToolLabel: str_replace_editor insert", () => {
  expect(getToolLabel("str_replace_editor", { command: "insert", path: "/utils.ts" }))
    .toBe("Inserting into utils.ts");
});

test("getToolLabel: str_replace_editor view", () => {
  expect(getToolLabel("str_replace_editor", { command: "view", path: "/index.tsx" }))
    .toBe("Reading index.tsx");
});

test("getToolLabel: str_replace_editor unknown command falls back to Editing", () => {
  expect(getToolLabel("str_replace_editor", { command: "undo_edit", path: "/App.jsx" }))
    .toBe("Editing App.jsx");
});

test("getToolLabel: str_replace_editor with empty path falls back to 'file'", () => {
  expect(getToolLabel("str_replace_editor", { command: "create", path: "" }))
    .toBe("Creating file");
});

test("getToolLabel: str_replace_editor with no args falls back to 'file'", () => {
  expect(getToolLabel("str_replace_editor", {}))
    .toBe("Editing file");
});

test("getToolLabel: file_manager rename", () => {
  expect(getToolLabel("file_manager", { command: "rename", path: "/OldName.tsx" }))
    .toBe("Renaming OldName.tsx");
});

test("getToolLabel: file_manager delete", () => {
  expect(getToolLabel("file_manager", { command: "delete", path: "/styles.css" }))
    .toBe("Deleting styles.css");
});

test("getToolLabel: file_manager unknown command", () => {
  expect(getToolLabel("file_manager", { command: "unknown", path: "/foo.ts" }))
    .toBe("Managing files");
});

test("getToolLabel: unknown tool name returns tool name unchanged", () => {
  expect(getToolLabel("some_other_tool", { command: "do_something" }))
    .toBe("some_other_tool");
});

// ---------------------------------------------------------------------------
// ToolInvocationBadge — component tests
// ---------------------------------------------------------------------------

test("ToolInvocationBadge renders the friendly label", () => {
  render(
    <ToolInvocationBadge
      toolName="str_replace_editor"
      args={{ command: "create", path: "/App.jsx" }}
      state="call"
    />
  );
  expect(screen.getByText("Creating App.jsx")).toBeDefined();
});

test("ToolInvocationBadge shows green dot when state is result and result is truthy", () => {
  const { container } = render(
    <ToolInvocationBadge
      toolName="str_replace_editor"
      args={{ command: "create", path: "/App.jsx" }}
      state="result"
      result="Success"
    />
  );
  const dot = container.querySelector(".bg-emerald-500");
  expect(dot).toBeDefined();
  expect(dot).not.toBeNull();
});

test("ToolInvocationBadge shows spinner when state is call (in-progress)", () => {
  const { container } = render(
    <ToolInvocationBadge
      toolName="str_replace_editor"
      args={{ command: "create", path: "/App.jsx" }}
      state="call"
    />
  );
  const spinner = container.querySelector(".animate-spin");
  expect(spinner).toBeDefined();
  expect(spinner).not.toBeNull();
});

test("ToolInvocationBadge shows spinner when state is result but result is null", () => {
  const { container } = render(
    <ToolInvocationBadge
      toolName="str_replace_editor"
      args={{ command: "create", path: "/App.jsx" }}
      state="result"
      result={null}
    />
  );
  const spinner = container.querySelector(".animate-spin");
  expect(spinner).toBeDefined();
  expect(spinner).not.toBeNull();
});
