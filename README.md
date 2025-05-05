# Rulens

Rulens is a CLI tool that extracts and formats linting rules into Markdown documentation. It analyzes your project's Biome and ESLint configurations and generates comprehensive documentation of all active linting rules with descriptions.

## Features

- Automatically documents linting rules from your project configuration
- Supports both Biome and ESLint
- Includes detailed descriptions for each rule with links to official documentation
- Organizes rules by category for easy reference
- Provides consistent Markdown formatting suitable for documentation and AI input
- Additional tools can be supported based on user demand

## Installation

```bash
# Using npm
npm install rulens

# Using pnpm
pnpm add rulens

# Using yarn
yarn add rulens
```

## Usage

```bash
# Basic usage - generates Markdown at docs/lint-rules.md
npx rulens generate

# Custom output path
npx rulens generate --output custom-path.md

# Custom ESLint config path
npx rulens generate --eslint-config custom-eslint.config.js

# Pass additional arguments to biome
npx rulens generate --biome-args "--somearg value"
```

## Sample Output

Rulens generates Markdown documentation that looks like this:

```markdown
# Rulens Lint Rules Dump

## Biome Rules

### accessibility

- [`noAccessKey`](https://biomejs.dev/linter/rules/no-access-key): Enforce that the accessKey attribute is not used on any HTML element.
- [`noAriaHiddenOnFocusable`](https://biomejs.dev/linter/rules/no-aria-hidden-on-focusable): Enforce that aria-hidden="true" is not set on focusable elements.

## ESLint Rules

### @typescript-eslint

- `await-thenable`: ESLint rule: await-thenable (error, with options)
- `ban-ts-comment`: ESLint rule: ban-ts-comment (error, with options)
```

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
      - '.eslintrc.js'
      - 'eslint.config.js' 
      - 'biome.json'
      - 'package.json'

jobs:
  update-docs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
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

## Requirements

- Node.js >= 20.0.0

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

## License

MIT

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.