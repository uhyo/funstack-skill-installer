#!/usr/bin/env node

import * as readline from "node:readline/promises";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { stdin, stdout } from "node:process";
import { styleText } from "node:util";

interface Option {
  name: string;
  path: string | null;
}

function renderOptions(options: Option[], selectedIndex: number): void {
  options.forEach((option, index) => {
    const isSelected = index === selectedIndex;
    const pathDisplay = styleText("dim", `(${option.path ?? "custom path"})`);

    if (isSelected) {
      const indicator = styleText("cyan", "❯");
      const name = styleText(["bold", "cyan"], option.name);
      console.log(`${indicator} ${name} ${pathDisplay}`);
    } else {
      console.log(`  ${option.name} ${pathDisplay}`);
    }
  });
}

function clearOptions(count: number): void {
  // Move cursor up and clear each line
  for (let i = 0; i < count; i++) {
    stdout.write("\x1b[1A"); // Move up one line
    stdout.write("\x1b[2K"); // Clear the line
  }
}

async function selectOption(options: Option[]): Promise<number> {
  let selectedIndex = 0;

  // Initial render
  renderOptions(options, selectedIndex);

  return new Promise((resolve) => {
    stdin.setRawMode(true);
    stdin.resume();

    const onKeypress = (data: Buffer) => {
      const key = data.toString();

      // Handle arrow keys (escape sequences)
      if (key === "\x1b[A") {
        // Up arrow
        clearOptions(options.length);
        selectedIndex = (selectedIndex - 1 + options.length) % options.length;
        renderOptions(options, selectedIndex);
      } else if (key === "\x1b[B") {
        // Down arrow
        clearOptions(options.length);
        selectedIndex = (selectedIndex + 1) % options.length;
        renderOptions(options, selectedIndex);
      } else if (key === "\r" || key === "\n") {
        // Enter key
        stdin.setRawMode(false);
        stdin.pause();
        stdin.removeListener("data", onKeypress);
        resolve(selectedIndex);
      } else if (key === "\x03") {
        // Ctrl+C
        stdin.setRawMode(false);
        process.exit(0);
      }
    };

    stdin.on("data", onKeypress);
  });
}

async function main() {
  // 1. Parse CLI arguments
  const skillPath = process.argv[2];
  if (!skillPath) {
    console.error("Usage: skill-installer <skill-path>");
    console.error("  <skill-path>  Path to the skill directory to install");
    process.exit(1);
  }

  // Validate that the skill path exists and is a directory
  try {
    const stats = await fs.stat(skillPath);
    if (!stats.isDirectory()) {
      console.error(`Error: ${skillPath} is not a directory`);
      process.exit(1);
    }
  } catch {
    console.error(`Error: ${skillPath} does not exist`);
    process.exit(1);
  }

  // 2. Prompt for AI Agent selection
  const options: Option[] = [
    { name: "Claude Code", path: "./.claude/skills" },
    { name: "Other", path: null },
  ];

  console.log(
    "\n" + styleText("bold", "Select AI Agent") + styleText("dim", " (↑↓ to move, Enter to confirm)")
  );
  const selectedIndex = await selectOption(options);
  const selectedOption = options[selectedIndex]!;

  // 3. Determine installation path
  let destinationPath: string;

  if (selectedOption.path !== null) {
    destinationPath = selectedOption.path;
  } else {
    const rl = readline.createInterface({ input: stdin, output: stdout });
    try {
      const customPath = await rl.question("\nEnter custom installation path: ");
      if (!customPath.trim()) {
        console.error("Error: Installation path cannot be empty");
        process.exit(1);
      }
      destinationPath = customPath.trim();
    } finally {
      rl.close();
    }
  }

  // 4. Copy skill files
  // Create destination directory if it doesn't exist
  await fs.mkdir(destinationPath, { recursive: true });

  // Copy the skill directory contents to the destination
  const skillName = path.basename(skillPath);
  const finalDestination = path.join(destinationPath, skillName);

  await fs.cp(skillPath, finalDestination, { recursive: true });

  console.log(
    "\n" +
      styleText("green", "✓") +
      " Skill installed successfully to: " +
      styleText("bold", finalDestination)
  );
}

main().catch((error) => {
  console.error("Error:", error.message);
  process.exit(1);
});
