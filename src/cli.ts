#!/usr/bin/env node

import { install } from "./index.ts";

async function main() {
  const skillPath = process.argv[2];
  if (!skillPath) {
    console.error("Usage: skill-installer <skill-path>");
    console.error("  <skill-path>  Path to the skill directory to install");
    process.exit(1);
  }

  await install(skillPath);
}

main().catch((error) => {
  console.error("Error:", error.message);
  process.exit(1);
});
