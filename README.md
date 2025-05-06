# Rulens

> No more maintaining coding guidelines. Your linter rules to AI instructions, instantly.

[![npm version](https://img.shields.io/npm/v/rulens.svg)](https://www.npmjs.com/package/rulens)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/node/v/rulens.svg)](https://nodejs.org)

Rulens is a CLI tool that extracts and formats linting rules into Markdown documentation. It analyzes your project's Biome and ESLint configurations and generates comprehensive documentation of all active linting rules with descriptions.

## Why Rulens?

- **AI-Ready Code Generation**: Help AI coding assistants understand your project's coding standards before generating code
- **Consistent Code Quality**: Eliminate the cycle of writing code → running linters → fixing errors by teaching the standards upfront
- **Automatic Documentation**: Keep your linting documentation perfectly in sync with your actual configuration

## Core Features

- Automatically documents linting rules from your project configuration
- Supports both Biome and ESLint
- Includes detailed descriptions for each rule with links to official documentation
- Organizes rules by category with clear category explanations
- Provides consistent Markdown formatting suitable for documentation and AI input

## Prerequisites

Rulens works with existing linting configurations in your project:

- **Node.js**: Version 20.0.0 or higher is required
- **Biome**: If you want to extract Biome rules, Biome should be installed in your project
- **ESLint**: If you want to extract ESLint rules, ESLint should be installed in your project

Rulens will automatically detect and use the appropriate linting tools from your project's `node_modules/.bin` directory. If not found, it will attempt to use globally installed versions.

## Getting Started

### Installation

```bash
# Using npm
npm install -D rulens

# Using pnpm
pnpm add -D rulens

# Using yarn
yarn add -D rulens
```

### Quick Start

Run this command in your project root to generate the documentation:

```bash
npx rulens generate
```

That's it! You'll find a `docs/lint-rules.md` file containing your linting rules in an AI-friendly format.

### AI Integration

Add this prompt directive to your AI coding assistant instructions for immediate awareness of your coding standards:

```
IMPORTANT: Read coding guidelines in docs/lint-rules.md before beginning code work
```

This simple instruction helps AI tools like GitHub Copilot, Cursor, Claude, and other assistants to follow your project's linting standards from the start.

See also [docs/lint-rules.md](https://github.com/MH4GF/rulens/blob/main/docs/lint-rules.md) and [CLAUDE.md](https://github.com/MH4GF/rulens/blob/main/CLAUDE.md) in the rulens project.

## Usage

### Generate Command

The `generate` command creates Markdown documentation from your linting configuration:

```bash
# Basic usage - generates Markdown at docs/lint-rules.md
rulens generate

# Custom output path
rulens generate --output custom-path.md

# Custom ESLint config path
rulens generate --eslint-config custom-eslint.config.js

# Pass additional arguments to biome
rulens generate --biome-args "--somearg value"
```

### Lint Command

The `lint` command verifies that your documentation is up-to-date with your current configuration:

```bash
# Basic usage - verifies docs/lint-rules.md is up-to-date
rulens lint

# With auto-update
rulens lint --update

# Custom options
rulens lint --output custom-path.md --verbose
```

If the documentation is out of date, the command exits with code 1, causing your CI build to fail.

## Command Options Reference

### Generate Command Options

| Option                   | Description                                | Default              |
| ------------------------ | ------------------------------------------ | -------------------- |
| `--biome-args <args>`    | Additional arguments to pass to biome rage | -                    |
| `--eslint-config <path>` | Path to ESLint config file                 | Auto-detected\*      |
| `--output <file>`        | Output file path                           | `docs/lint-rules.md` |
| `--verbose`              | Enable verbose mode with detailed output   | `false`              |
| `--help`                 | Display help information                   | -                    |
| `--version`              | Display version number                     | -                    |

### Lint Command Options

| Option                   | Description                                         | Default              |
| ------------------------ | --------------------------------------------------- | -------------------- |
| `--biome-args <args>`    | Additional arguments to pass to `biome rage`        | -                    |
| `--eslint-config <path>` | Path to ESLint config file                          | Auto-detected\*      |
| `--output <file>`        | Output file path to verify                          | `docs/lint-rules.md` |
| `--update`               | Update the output file if it's out of date          | `false`              |
| `--verbose`              | Enable verbose logging with detailed info and diffs | `false`              |

_\* ESLint config is auto-detected in the following order:_

1. _JavaScript formats: `eslint.config.js`, `eslint.config.mjs`, `eslint.config.cjs`_
2. _TypeScript formats: `eslint.config.ts`, `eslint.config.mts`, `eslint.config.cts`_
3. _Legacy formats: `.eslintrc.js`, `.eslintrc.json`, `.eslintrc.yaml`, `.eslintrc.yml`, `.eslintrc`_

## CI/CD Integration

Rulens provides built-in support for CI/CD pipelines through the `lint` command, which verifies that your documentation is up-to-date with your actual configuration. The command exits with code 1 when documentation is out of date, making it ideal for CI pipelines.

### CI Implementation Examples

#### GitHub Actions - Verification Workflow

```yaml
name: Verify Lint Rules Documentation

on:
  push:
    branches: [main]
    paths:
      - ".eslintrc*"
      - "eslint.config.*"
      - "biome.json"
      - "package.json"
  pull_request:
    branches: [main]
    paths:
      - ".eslintrc*"
      - "eslint.config.*"
      - "biome.json"
      - "package.json"

jobs:
  verify-docs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "20"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Verify lint rules documentation
        run: npx rulens lint
```

#### GitLab CI Example

```yaml
verify-lint-docs:
  stage: test
  script:
    - npm ci
    - npx rulens lint
  only:
    changes:
      - .eslintrc*
      - eslint.config.*
      - biome.json
      - package.json
```

#### GitHub Actions - Auto-update Workflow

For automatically updating documentation and creating a commit:

```yaml
name: Update Lint Rules Documentation

on:
  push:
    paths:
      - ".eslintrc*"
      - "eslint.config.*"
      - "biome.json"
      - "package.json"

jobs:
  update-docs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
      - run: npm install
      - name: Update lint rules documentation if needed
        run: npx rulens lint --update
      - name: Check for changes
        id: git-check
        run: |
          git diff --exit-code docs/lint-rules.md || echo "changes=true" >> $GITHUB_OUTPUT
      - name: Commit changes if needed
        if: steps.git-check.outputs.changes == 'true'
        run: |
          git config --local user.email "actions@github.com"
          git config --local user.name "GitHub Actions"
          git add docs/lint-rules.md
          git commit -m "docs: update lint rules documentation"
          git push
```

### Additional Integration Options

#### Pre-commit Hook Integration

You can use Rulens with pre-commit hooks to ensure documentation stays up-to-date locally:

```bash
# Using Husky
npx husky add .husky/pre-commit "npx rulens lint --update"
```

#### Best Practices

1. **Always run in CI**: Even with pre-commit hooks, run verification in CI to catch changes from all contributors
2. **Consider auto-update workflows**: For larger teams, set up workflows that automatically create PRs when documentation needs updating
3. **Include in code review**: When reviewing PRs that change linting rules, verify documentation has been updated
4. **Keep in sync with code**: Update documentation alongside rule changes, not as an afterthought

## Development

```bash
# Install dependencies
pnpm install

# Build
pnpm build

# Development with watch mode
pnpm dev

# Run tests
pnpm test

# Format code
pnpm fmt

# Lint code
pnpm lint
```

## Roadmap

- Support for additional linting tools (Prettier, Stylelint, etc.)
- ESLint rule description crawling for more consistent documentation
- Custom templates for different documentation formats

## License

MIT

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.
