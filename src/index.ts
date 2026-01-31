#!/usr/bin/env node

import * as readline from "node:readline/promises";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { stdin as input, stdout as output } from "node:process";

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
  const options = [
    { name: "Claude Code", path: "./.claude/skills" },
    { name: "Other", path: null },
  ] as const;

  const rl = readline.createInterface({ input, output });

  try {
    console.log("\nSelect AI Agent:");
    options.forEach((option, index) => {
      const pathDisplay = option.path ?? "custom path";
      console.log(`${index + 1}. ${option.name} (${pathDisplay})`);
    });

    const choice = await rl.question(
      `\nEnter your choice (1-${options.length}): `
    );
    const choiceIndex = parseInt(choice, 10) - 1;

    if (isNaN(choiceIndex) || choiceIndex < 0 || choiceIndex >= options.length) {
      console.error(`Error: Invalid choice. Please enter 1-${options.length}.`);
      process.exit(1);
    }

    // 3. Determine installation path
    const selectedOption = options[choiceIndex];
    if (!selectedOption) {
      console.error(`Error: Invalid choice. Please enter 1-${options.length}.`);
      process.exit(1);
    }

    let destinationPath: string;

    if (selectedOption.path !== null) {
      destinationPath = selectedOption.path;
    } else {
      const customPath = await rl.question("Enter custom installation path: ");
      if (!customPath.trim()) {
        console.error("Error: Installation path cannot be empty");
        process.exit(1);
      }
      destinationPath = customPath.trim();
    }

    // 4. Copy skill files
    // Create destination directory if it doesn't exist
    await fs.mkdir(destinationPath, { recursive: true });

    // Copy the skill directory contents to the destination
    const skillName = path.basename(skillPath);
    const finalDestination = path.join(destinationPath, skillName);

    await fs.cp(skillPath, finalDestination, { recursive: true });

    console.log(`\nSkill installed successfully to: ${finalDestination}`);
  } finally {
    rl.close();
  }
}

main().catch((error) => {
  console.error("Error:", error.message);
  process.exit(1);
});
