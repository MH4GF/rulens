# rulens

## 0.2.0

### Minor Changes

- 7860651: Add rule options to table output format. Each rule's options are now displayed in a dedicated column with JSON formatting, improving documentation completeness. Empty strings are used for rules without options to reduce token consumption when processed by AI assistants.
- 49b0f08: Improve error handling and configuration file resolution

  - Enhance lint tool detection to work with either Biome or ESLint when only one is available
  - Add ESLint configuration file resolution supporting both new format (eslint.config.js) and legacy formats (.eslintrc.\*)
  - Add automatic output directory creation when it doesn't exist

## 0.1.2

### Patch Changes

- 0db2975: add --verbose option

## 0.1.1

### Patch Changes

- a248543: Initial release of rulens CLI tool for extracting and formatting linting rules into Markdown documentation.
