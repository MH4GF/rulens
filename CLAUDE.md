# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- Build: `pnpm build` - Build the project using tsup
- Dev: `pnpm dev` - Watch mode for development
- Format: `pnpm fmt` - Run all formatters (syncpack, biome)
- Lint: `pnpm lint` - Run all linters (biome, tsc, syncpack)
- Test: `pnpm test` - Run all tests
- Single test: `pnpm test path/to/test.ts` - Run specific test
- Test with watch: `pnpm test:watch` - Run tests in watch mode
- Coverage: `pnpm test:coverage` - Run tests with coverage report

## Coding Guidelines

- **Imports**: Use named imports, sort imports properly, avoid namespace imports
- **Formatting**: Follow Biome formatter rules with @mh4gf/configs/biome
- **Types**: Use explicit types, avoid `any`, prefer interfaces for API boundaries
- **Naming**: Use camelCase for variables/functions, PascalCase for types/classes
- **Error Handling**: Use explicit error types, provide informative error messages
- **File Structure**: Place tests alongside implementation files (e.g., foo.ts, foo.test.ts)
- **Exports**: Prefer named exports over default exports
- **Testing**: Use Vitest, aim for 80%+ test coverage
- **Lint Rules**: Always follow @docs/lint-rules.md as coding guideline

## Knip Handling

- **Unused Exports**: Run `pnpm fmt:knip` to automatically remove export keywords from unused types
- **Manual Review**: Always manually review knip suggestions - automatic fixes might not catch all cases
- **Type References**: To keep a type export that knip flags as unused, either:
  - Create a deliberate reference to it in your code
  - Use type-only imports where appropriate
  - Add it to knip's ignore configuration if it's intentionally exported for external use
- **After Fixes**: Always run `pnpm lint` and `pnpm build` after applying knip fixes to ensure nothing broke
- **Common Pattern**: For placeholder implementations, use void references or dummy usage to prevent knip warnings
