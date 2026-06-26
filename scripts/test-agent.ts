#!/usr/bin/env npx tsx
/**
 * Testing Agent for farm-app
 *
 * Uses Claude to explore source files, write Vitest tests, run them,
 * and iterate until they pass.
 *
 * Usage:
 *   npx tsx scripts/test-agent.ts
 *   npx tsx scripts/test-agent.ts "Write tests for src/lib/auth.ts"
 *   npx tsx scripts/test-agent.ts "Add tests for the login API route"
 *
 * Requires: ANTHROPIC_API_KEY environment variable
 */

import Anthropic from "@anthropic-ai/sdk";
import { execSync } from "child_process";
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { dirname, resolve, join, relative } from "path";
import { readdirSync, statSync } from "fs";

const ROOT = process.cwd();
const client = new Anthropic();

// ── Tool implementations ──────────────────────────────────────────────────────

function readFile(filePath: string): string {
  try {
    return readFileSync(resolve(ROOT, filePath), "utf-8");
  } catch (e) {
    return `Error reading file: ${e instanceof Error ? e.message : String(e)}`;
  }
}

function writeFile(filePath: string, content: string): string {
  try {
    const abs = resolve(ROOT, filePath);
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, content, "utf-8");
    return `Written: ${filePath}`;
  } catch (e) {
    return `Error writing file: ${e instanceof Error ? e.message : String(e)}`;
  }
}

function runTests(testPath?: string): string {
  try {
    const args = testPath ? ` ${testPath}` : "";
    const output = execSync(`npx vitest run${args} --reporter=verbose 2>&1`, {
      cwd: ROOT,
      encoding: "utf-8",
      timeout: 60_000,
    });
    return output;
  } catch (e: unknown) {
    const err = e as { stdout?: string; stderr?: string; message?: string };
    return ((err.stdout ?? "") + (err.stderr ?? "")) || (err.message ?? String(e));
  }
}

function listSourceFiles(directory = "src"): string {
  const results: string[] = [];
  const SKIP = new Set(["node_modules", ".next", "generated", "dist", ".git"]);

  function walk(dir: string) {
    let entries: string[];
    try {
      entries = readdirSync(dir);
    } catch {
      return;
    }
    for (const name of entries) {
      if (SKIP.has(name)) continue;
      const full = join(dir, name);
      let stat;
      try {
        stat = statSync(full);
      } catch {
        continue;
      }
      if (stat.isDirectory()) {
        walk(full);
      } else if (/\.(ts|tsx)$/.test(name)) {
        results.push(relative(ROOT, full).replace(/\\/g, "/"));
      }
    }
  }

  walk(resolve(ROOT, directory));
  return results.join("\n") || "No files found";
}

// ── Tool schemas ──────────────────────────────────────────────────────────────

const TOOLS: Anthropic.Messages.Tool[] = [
  {
    name: "read_file",
    description: "Read the contents of any source or test file in the project.",
    input_schema: {
      type: "object" as const,
      properties: {
        path: {
          type: "string",
          description: "File path relative to project root (e.g. src/lib/auth.ts)",
        },
      },
      required: ["path"],
    },
  },
  {
    name: "write_file",
    description:
      "Write or overwrite a file. Use this to create test files or fix source files.",
    input_schema: {
      type: "object" as const,
      properties: {
        path: {
          type: "string",
          description: "File path relative to project root (e.g. __tests__/lib/auth.test.ts)",
        },
        content: {
          type: "string",
          description: "Full file content to write",
        },
      },
      required: ["path", "content"],
    },
  },
  {
    name: "run_tests",
    description:
      "Run the Vitest test suite and return full output including pass/fail details.",
    input_schema: {
      type: "object" as const,
      properties: {
        path: {
          type: "string",
          description:
            "Optional: specific test file or glob pattern (e.g. __tests__/lib/auth.test.ts)",
        },
      },
      required: [],
    },
  },
  {
    name: "list_source_files",
    description: "List TypeScript source files in the project, excluding generated files.",
    input_schema: {
      type: "object" as const,
      properties: {
        directory: {
          type: "string",
          description: "Directory to list (default: 'src'). Can also use '__tests__'.",
        },
      },
      required: [],
    },
  },
];

// ── Agent loop ────────────────────────────────────────────────────────────────

async function runAgent(userPrompt: string) {
  const messages: Anthropic.Messages.MessageParam[] = [
    { role: "user", content: userPrompt },
  ];

  const system = `You are a testing agent for a Next.js 16 + TypeScript project called "farm-app" \
(a farm produce e-commerce app with authentication, products, orders, and an admin panel).

Your job: write Vitest unit tests and make them pass.

## Project context
- Test framework: Vitest with jsdom environment
- React: 19, Next.js: 16 (App Router)
- Tests go in __tests__/ mirroring src/ structure (e.g. src/lib/auth.ts → __tests__/lib/auth.test.ts)
- Path alias: @/* maps to src/*
- Pure utility functions in src/lib/ are the best candidates for unit tests

## Rules for writing tests
1. Server-only modules (next/headers, next/server, next/navigation) must be vi.mock()'d
2. Database modules (src/lib/db, src/lib/pg) must be vi.mock()'d
3. async Server Components cannot be unit tested with Vitest — skip them
4. Use vi.mock() at the top level of the test file (not inside describe/it)
5. Use import type when only importing types — this avoids side effects
6. For crypto/JWT tests, use real implementations (jose works in jsdom)

## Workflow
1. Read the target source file
2. Identify testable functions (pure logic, no DB/server deps)
3. Write tests in __tests__/<same-path>.test.ts
4. Run the tests
5. Fix any failures and re-run until all pass
6. Report which tests pass and what coverage was added

Be thorough: test happy paths, edge cases, and error cases.`;

  console.log("\nTesting agent starting...\n");

  while (true) {
    const response = await client.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 8096,
      system,
      tools: TOOLS,
      messages,
    });

    messages.push({ role: "assistant", content: response.content });

    for (const block of response.content) {
      if (block.type === "text" && block.text.trim()) {
        console.log(block.text);
      }
    }

    if (response.stop_reason === "end_turn") {
      console.log("\nAgent finished.");
      break;
    }

    if (response.stop_reason !== "tool_use") {
      console.log(`Unexpected stop_reason: ${response.stop_reason}`);
      break;
    }

    const toolResults: Anthropic.Messages.ToolResultBlockParam[] = [];

    for (const block of response.content) {
      if (block.type !== "tool_use") continue;

      const input = block.input as Record<string, string>;
      let result: string;

      console.log(`\n[${block.name}] ${JSON.stringify(input)}`);

      switch (block.name) {
        case "read_file":
          result = readFile(input.path);
          break;
        case "write_file":
          result = writeFile(input.path, input.content);
          console.log(`  → ${result}`);
          break;
        case "run_tests":
          result = runTests(input.path);
          // Print a preview of test output
          const preview = result.slice(0, 800);
          console.log("  → " + preview + (result.length > 800 ? "\n  [truncated...]" : ""));
          break;
        case "list_source_files":
          result = listSourceFiles(input.directory ?? "src");
          break;
        default:
          result = `Unknown tool: ${block.name}`;
      }

      toolResults.push({
        type: "tool_result",
        tool_use_id: block.id,
        content: result,
      });
    }

    messages.push({ role: "user", content: toolResults });
  }
}

// ── Entry point ───────────────────────────────────────────────────────────────

const prompt =
  process.argv.slice(2).join(" ") ||
  "Write unit tests for src/lib/auth.ts. Focus on signToken and verifyToken since they are pure functions that don't need mocking.";

runAgent(prompt).catch((e) => {
  console.error("Agent error:", e);
  process.exit(1);
});
