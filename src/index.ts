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
    const number = styleText("dim", `${index + 1}.`);
    const pathDisplay = styleText("dim", `(${option.path ?? "custom path"})`);

    if (isSelected) {
      const indicator = styleText("cyan", "❯");
      const name = styleText(["bold", "cyan"], option.name);
      console.log(`${indicator} ${number} ${name} ${pathDisplay}`);
    } else {
      console.log(`  ${number} ${option.name} ${pathDisplay}`);
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

async function selectOption(
  options: Option[],
  footer?: string,
): Promise<number> {
  let selectedIndex = 0;

  const render = () => {
    renderOptions(options, selectedIndex);
    if (footer) {
      console.log();
      console.log(styleText("dim", footer));
    }
  };

  const clear = () => {
    const lineCount = options.length + (footer ? 2 : 0);
    clearOptions(lineCount);
  };

  // Initial render
  render();

  return new Promise((resolve) => {
    stdin.setRawMode(true);
    stdin.resume();

    const onKeypress = (data: Buffer) => {
      const key = data.toString();

      // Handle arrow keys (escape sequences)
      if (key === "\x1b[A") {
        // Up arrow
        clear();
        selectedIndex = (selectedIndex - 1 + options.length) % options.length;
        render();
      } else if (key === "\x1b[B") {
        // Down arrow
        clear();
        selectedIndex = (selectedIndex + 1) % options.length;
        render();
      } else if (key >= "1" && key <= "9") {
        // Number keys 1-9
        const targetIndex = parseInt(key, 10) - 1;
        if (targetIndex < options.length) {
          clear();
          selectedIndex = targetIndex;
          render();
        }
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

  // 2. Determine installation path
  let destinationPath: string;

  if (!stdin.isTTY) {
    // Non-TTY mode: read from environment variable
    const envPath = process.env.SKILL_INSTALL_PATH;
    if (!envPath) {
      console.error(
        "Error: stdin is not a TTY and SKILL_INSTALL_PATH is not set.",
      );
      console.error("");
      console.error(
        "In non-interactive mode, set the SKILL_INSTALL_PATH environment variable:",
      );
      console.error(
        "  SKILL_INSTALL_PATH=./.claude/skills skill-installer <skill-path>",
      );
      process.exit(1);
    }
    destinationPath = envPath;
  } else {
    // TTY mode: interactive prompt
    const options: Option[] = [
      { name: "Claude Code", path: "./.claude/skills" },
      { name: "Codex", path: "./.codex/skills" },
      { name: "GitHub Copilot", path: "./.github/skills" },
      { name: "Cursor", path: "./.cursor/skills" },
      { name: "Gemini CLI", path: "./.gemini/skills" },
      { name: "Windsurf", path: "./.windsurf/skills" },
      { name: "OpenCode", path: "./.opencode/skills" },
      { name: "Other", path: null },
    ];

    console.log(
      "\n" +
        styleText("bold", "Select AI Agent") +
        styleText("dim", " (↑↓ to move, Enter to confirm)"),
    );
    const selectedIndex = await selectOption(
      options,
      "Missing your agent? Let us know: https://github.com/uhyo/funstack-skill-installer/issues",
    );
    const selectedOption = options[selectedIndex]!;

    if (selectedOption.path !== null) {
      destinationPath = selectedOption.path;
    } else {
      const rl = readline.createInterface({ input: stdin, output: stdout });
      try {
        const customPath = await rl.question(
          "\nEnter custom installation path: ",
        );
        if (!customPath.trim()) {
          console.error("Error: Installation path cannot be empty");
          process.exit(1);
        }
        destinationPath = customPath.trim();
      } finally {
        rl.close();
      }
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
      styleText("bold", finalDestination),
  );
}

main().catch((error) => {
  console.error("Error:", error.message);
  process.exit(1);
});
