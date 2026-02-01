# @funstack/skill-installer

A CLI tool and library to install AI Agent skills by copying skill files to the appropriate location.

## Installation

```bash
npm install -g @funstack/skill-installer
```

## Usage

As a working example, see [how FUNSTACK Static uses this library](https://github.com/uhyo/funstack-static/blob/f7fd607116cf581b52d3df95d5a4d415d29bb3a4/packages/static/src/bin/skill-installer.ts) to have users install a skill.

### Use as a CLI

```bash
skill-installer ./path/to/skill-directory
```

### Use as a library

```ts
import { install } from "@funstack/skill-installer";

await install("./path/to/skill-directory");
```

## How it works

### Interactive Mode

When run in an interactive shell, you'll see a menu to select your AI agent:

```
Select AI Agent (↑↓ to move, Enter to confirm)
❯ 1. Claude Code (./.claude/skills)
  2. Codex (./.codex/skills)
  3. GitHub Copilot (./.github/skills)
  4. Cursor (./.cursor/skills)
  5. Gemini CLI (./.gemini/skills)
  6. Windsurf (./.windsurf/skills)
  7. OpenCode (./.opencode/skills)
  8. Other (custom path)

Missing your agent? Let us know: https://github.com/uhyo/funstack-skill-installer/issues
```

- Use arrow keys (↑↓) to navigate
- Press a number key (1-9) to jump to an option
- Press Enter to confirm your selection

### Non-Interactive Mode

For CI/CD pipelines or scripted installations, set the `SKILL_INSTALL_PATH` environment variable:

```bash
SKILL_INSTALL_PATH=./.claude/skills skill-installer ./path/to/my-skill
```

## Supported AI Agents

| Agent          | Installation Path    |
| -------------- | -------------------- |
| Claude Code    | `./.claude/skills`   |
| Codex          | `./.codex/skills`    |
| GitHub Copilot | `./.github/skills`   |
| Cursor         | `./.cursor/skills`   |
| Gemini CLI     | `./.gemini/skills`   |
| Windsurf       | `./.windsurf/skills` |
| OpenCode       | `./.opencode/skills` |

Don't see your agent? [Open an issue](https://github.com/uhyo/funstack-skill-installer/issues) to request support!

## License

MIT
