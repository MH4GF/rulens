# Rulens

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
- Organizes rules by category for easy reference
- Provides consistent Markdown formatting suitable for documentation and AI input

## Quick Start

Run this command in your project root to generate the documentation:

```bash
npx rulens generate
```

That's it! You'll find a `docs/lint-rules.md` file containing your linting in an AI-friendly format.

Example output structure:

```markdown
# Rulens Lint Rules Dump

## Biome Rules

### accessibility

- [`noAccessKey`](https://biomejs.dev/linter/rules/no-access-key): Enforce that the accessKey attribute is not used on any HTML element.
- [`noAriaHiddenOnFocusable`](https://biomejs.dev/linter/rules/no-aria-hidden-on-focusable): Enforce that aria-hidden="true" is not set on focusable elements.

## ESLint Rules

### @typescript-eslint

- [`await-thenable`](https://typescript-eslint.io/rules/await-thenable): Disallow awaiting a value that is not a Thenable (error)
- [`ban-ts-comment`](https://typescript-eslint.io/rules/ban-ts-comment): Disallow `@ts-<directive>` comments or require descriptions after directives (error, with options)
```

You can view an example in the [docs/lint-rules.md](docs/lint-rules.md) file of this rulens repository.

## Usage

### Installation

```bash
# Using npm
npm install -D rulens

# Using pnpm
pnpm add -D rulens

# Using yarn
yarn add -D rulens
```

### Basic Usage

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

### AI Integration

Add this prompt directive to your AI coding assistant instructions for immediate awareness of your coding standards:

```
IMPORTANT: Read coding guidelines in docs/lint-rules.md before beginning code work
```

This simple instruction helps AI tools like GitHub Copilot, Cursor, Claude, and other assistants to follow your project's linting standards from the start.

## Command Options Reference

| Option                   | Description                                | Default              |
| ------------------------ | ------------------------------------------ | -------------------- |
| `--biome-args <args>`    | Additional arguments to pass to biome rage | -                    |
| `--eslint-config <path>` | Path to ESLint config file                 | `eslint.config.js`   |
| `--output <file>`        | Output file path                           | `docs/lint-rules.md` |
| `--help`                 | Display help information                   | -                    |
| `--version`              | Display version number                     | -                    |

## Prerequisites

Rulens works with existing linting configurations in your project:

- **Node.js**: Version 20.0.0 or higher is required
- **Biome**: If you want to extract Biome rules, Biome should be installed in your project
- **ESLint**: If you want to extract ESLint rules, ESLint should be installed in your project

Rulens will automatically detect and use the appropriate linting tools from your project's `node_modules/.bin` directory. If not found, it will attempt to use globally installed versions.

## CI/CD Integration

Integrate Rulens into your CI/CD pipeline to:

1. Automatically generate and update documentation when linting rules change
2. Fail the build if documentation is out of sync with current configuration
3. Keep AI coding assistants informed about the latest linting standards

Example GitHub Actions workflow:

```yaml
name: Update Lint Rules Documentation

on:
  push:
    paths:
      - ".eslintrc.js"
      - "eslint.config.js"
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
      - name: Generate lint rules documentation
        run: npx rulens generate
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
- Improved output formatting optimized for AI comprehension
- ESLint rule description crawling for more consistent documentation
- Custom templates for different documentation formats

## License

MIT

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.
