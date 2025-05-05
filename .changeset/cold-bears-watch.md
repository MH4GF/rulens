---
"rulens": minor
---

Improve error handling and configuration file resolution

- Enhance lint tool detection to work with either Biome or ESLint when only one is available
- Add ESLint configuration file resolution supporting both new format (eslint.config.js) and legacy formats (.eslintrc.*)
- Add automatic output directory creation when it doesn't exist