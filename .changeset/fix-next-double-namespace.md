---
"rulens": patch
---

Fix ESLint parser to correctly handle plugin rules with double namespaces like `@next/next/rule-name`. This ensures Next.js ESLint rules and other similar format rules are properly categorized and displayed in the generated Markdown documentation.