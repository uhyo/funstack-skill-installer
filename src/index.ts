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

/**
 * Install a skill to the appropriate AI agent directory.
 * In TTY mode, prompts the user to select an agent.
 * In non-TTY mode, uses the SKILL_INSTALL_PATH environment variable.
 *
 * @param skillPath - Path to the skill directory to install
 * @returns The path where the skill was installed
 */
export async function install(skillPath: string): Promise<string> {
  // Validate that the skill path exists and is a directory
  try {
    const stats = await fs.stat(skillPath);
    if (!stats.isDirectory()) {
      throw new Error(`${skillPath} is not a directory`);
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes("is not a directory")) {
      throw error;
    }
    throw new Error(`${skillPath} does not exist`);
  }

  // Determine installation path
  let destinationPath: string;

  if (!stdin.isTTY) {
    // Non-TTY mode: read from environment variable
    const envPath = process.env.SKILL_INSTALL_PATH;
    if (!envPath) {
      throw new Error(
        "stdin is not a TTY and SKILL_INSTALL_PATH is not set.\n\n" +
          "In non-interactive mode, set the SKILL_INSTALL_PATH environment variable:\n" +
          "  SKILL_INSTALL_PATH=./.claude/skills skill-installer <skill-path>",
      );
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
          throw new Error("Installation path cannot be empty");
        }
        destinationPath = customPath.trim();
      } finally {
        rl.close();
      }
    }
  }

  // Copy skill files
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

  return finalDestination;
}
