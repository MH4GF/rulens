# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Rulens is a CLI tool for extracting, documenting, and formatting linting rules from various linting tools (currently supporting Biome and ESLint). It generates comprehensive Markdown documentation to help developers understand and follow the project's coding standards.

## Documentation

**IMPORTANT**: Always read all documentation in the `docs/` directory at the start of each session. This includes:
- `docs/lint-rules.md` - Explains linting rules and coding standards
- `docs/requirements.md` - Project requirements and technical specifications
- `docs/todos.md` - Task tracking for project implementation (CRITICAL to understand and update)
- Any additional files in the `docs/` directory

Pay special attention to `docs/todos.md` as it provides a clear roadmap of implemented features and pending tasks. Always update this file when implementing new features to reflect progress accurately.

## Commands

- Build: `pnpm build` - Build the project using tsup
- Dev: `pnpm dev` - Watch mode for development
- Format: `pnpm fmt` - Run all formatters (syncpack, biome)
- Lint: `pnpm lint` - Run all linters (biome, tsc, syncpack) - Run after making changes
- Test: `pnpm test` - Run all tests
- Single test: `pnpm test path/to/test.ts` - Run specific test
- Test with watch: `pnpm test:watch` - Run tests in watch mode
- Coverage: `pnpm test:coverage` - Run tests with coverage report
- Changeset: `pnpm changeset` - Create a new changeset (always write in English)

**Workflow Commands**:
Always run `pnpm lint` and `pnpm test` after implementing new features to verify your changes.

## Coding Guidelines

- **Imports**: Use named imports, sort imports properly, avoid namespace imports
- **Formatting**: Follow Biome formatter rules with @mh4gf/configs/biome
- **Types**: Use explicit types, avoid `any`, prefer interfaces for API boundaries
- **Naming**: Use camelCase for variables/functions, PascalCase for types/classes
- **Error Handling**: 
  - Use explicit error types, provide informative error messages
  - Add try/catch blocks with specific error handling logic
  - Design functions to fail gracefully when possible (e.g., detect tools independently)
  - Use informative error messages that explain both what happened and how to fix it
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

- **Pure Function Testing**: Focus on testing pure functions without mocks or external dependencies
  - If a function has external dependencies (filesystem, network, etc.), consider refactoring to extract pure logic
  - When function purity is low, focus tests on the pure parts rather than using complex mocks
- **Test Isolation Approach**: For functions with external dependencies:
  - Mark tests with `it.skip` and document them as integration tests
  - Use `// biome-ignore lint/suspicious/noSkippedTests: Integration test requiring real environment` comment
  - Document what real environment setup would be needed to run the test
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

## Project Maintenance

- **Task Tracking**: Always update `docs/todos.md` when implementing new features or fixing bugs
  - Mark completed tasks with `[x]` 
  - Update related sub-tasks to maintain accurate project status
  
- **Version Management**: 
  - Use changesets for documenting changes (`pnpm changeset`)
  - Write changeset descriptions in English
  - Choose appropriate version bumps (patch, minor, major) based on the impact of changes
  
- **Code Ownership**:
  - Let the user handle Git operations (commit, push) unless explicitly requested
  - When suggesting commit messages, focus on the content, not the mechanics of committing
