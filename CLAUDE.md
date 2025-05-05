# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Documentation

**IMPORTANT**: Always read all documentation in the `docs/` directory at the start of each session. This includes:
- `docs/lint-rules.md`
- `docs/requirements.md`
- `docs/todos.md`
- Any additional files in the `docs/` directory

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
- **Type Safety**: Avoid eslint-disable directives and type assertions (as keyword), use valibot for runtime type validation
- **External Data**: Handle all external data (JSON, API responses) as untrusted and validate with valibot
- **Logging**: Use the Logger class instead of console.log/error for consistent logging
- **Comments**: Follow these guidelines for code comments:
  - Use JSDoc style comments for functions, classes, and interfaces
  - Write comments that explain "why" not "what" the code is doing
  - Avoid redundant comments that merely restate the code
  - Don't use comments for code organization or section markers; structure your code instead
  - Document non-obvious behavior, complex algorithms, or business rules
  - Keep comments up-to-date with code changes
  - Use English for all comments

## Testing Strategy

- **Real Environment Testing**: Avoid using mocks. Test with real dependencies whenever possible to ensure tests validate actual behavior.
- **Avoid Mocking Libraries**: Never use `vi.mock` or `vi.spyOn` - prioritize real implementation testing.
- **Integration Testing**: Prioritize integration tests that exercise the full code path rather than isolated unit tests.
- **Test Quality Priorities**: Focus on "correctly executing functionality" and "bug detection" rather than just "tests passing".
- **TDD Approach**: Follow test-driven development when appropriate:
  - Write failing tests first with `it.skip` to clearly define expected behavior
  - Implement code to make tests pass
  - Refactor and optimize
  - Remove `skip` as tests start passing
- **Concrete Assertions**: Use specific value assertions instead of general type checks
  - Prefer `expect(result).toContain("specific/value")` over just checking array length or type
  - Use `.toMatchSnapshot()` for testing large outputs like command results
- **Test Edge Cases**: Always include tests for error conditions and edge cases
- **Independent Tests**: Ensure each test runs independently and doesn't depend on other tests

## Knip Handling

- **Unused Exports**: Run `pnpm fmt:knip` to automatically remove export keywords from unused types
- **Manual Review**: Always manually review knip suggestions - automatic fixes might not catch all cases
- **Type References**: To keep a type export that knip flags as unused, either:
  - Create a deliberate reference to it in your code
  - Use type-only imports where appropriate
  - Add it to knip's ignore configuration if it's intentionally exported for external use
- **After Fixes**: Always run `pnpm lint` and `pnpm build` after applying knip fixes to ensure nothing broke
- **Common Pattern**: For placeholder implementations, use void references or dummy usage to prevent knip warnings
