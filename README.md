# @funstack/skill-installer

A CLI tool and library to install AI Agent skills by copying skill files to the appropriate location.

## Installation

```bash
npm install -g @funstack/skill-installer
```

## Usage

### Interactive Mode

Run the tool with the path to your skill directory:

```bash
skill-installer ./path/to/my-skill
```

You'll see an interactive menu to select your AI agent:

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

### Programmatic Usage

You can also use this package as a library:

```typescript
import { install } from '@funstack/skill-installer';

// Prompts the user to select an agent and installs the skill
const installedPath = await install('./path/to/my-skill');
console.log(`Installed to: ${installedPath}`);
```

The `install` function returns a promise that resolves to the final installation path.

## Supported AI Agents

| Agent | Installation Path |
|-------|------------------|
| Claude Code | `./.claude/skills` |
| Codex | `./.codex/skills` |
| GitHub Copilot | `./.github/skills` |
| Cursor | `./.cursor/skills` |
| Gemini CLI | `./.gemini/skills` |
| Windsurf | `./.windsurf/skills` |
| OpenCode | `./.opencode/skills` |

Don't see your agent? [Open an issue](https://github.com/uhyo/funstack-skill-installer/issues) to request support!

## License

MIT
