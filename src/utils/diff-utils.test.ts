import { describe, expect, it } from 'vitest'
import { compareContent, normalizeContent } from './diff-utils.ts'

describe('diff-utils', () => {
  // Test pure functions only, avoiding fs mocks

  describe('normalizeContent', () => {
    it('should normalize line endings to LF', () => {
      const input = 'line1\r\nline2\r\nline3'
      const expected = 'line1\nline2\nline3'
      expect(normalizeContent(input)).toBe(expected)
    })

    it('should trim whitespace from beginning and end', () => {
      const input = '  \n  content  \n  '
      const expected = 'content'
      expect(normalizeContent(input)).toBe(expected)
    })

    it('should handle both line endings and whitespace', () => {
      const input = '  \r\n  content  \r\n  '
      const expected = 'content'
      expect(normalizeContent(input)).toBe(expected)
    })
  })

  describe('compareContent', () => {
    it('should return identical=true if contents are identical', () => {
      const result = compareContent('content', 'content')

      expect(result.identical).toBe(true)
      expect(result.message).toBe('Contents are identical')
    })

    it('should return identical=false if contents differ', () => {
      const result = compareContent('existing content', 'new content')

      expect(result.identical).toBe(false)
      expect(result.message).toBe('Contents differ')
    })

    it('should include content details when verbose is true', () => {
      const result = compareContent('existing content', 'new content', { verbose: true })

      expect(result.identical).toBe(false)
      expect(result.actualContent).toBe('new content')
      expect(result.expectedContent).toBe('existing content')
    })

    it('should normalize content before comparing', () => {
      // Text with Windows line endings and extra whitespace
      const existingContent = '  content\r\n  '
      // Text with Unix line endings and different whitespace
      const generatedContent = 'content\n'

      // Should consider them identical after normalization
      const result = compareContent(existingContent, generatedContent)

      expect(result.identical).toBe(true)
    })
  })

  // Integration tests for file system operations would be implemented with it.skip
  // and proper documentation about the test environment needed

  describe('compareWithFile', () => {
    // biome-ignore lint/suspicious/noSkippedTests: Integration test requiring real environment
    it.skip('should compare file content with generated content', async () => {
      // This would require:
      // - A test file with known content
      // - File system access
      // - Would test the actual compareWithFile function
    })
  })

  describe('updateFile', () => {
    // biome-ignore lint/suspicious/noSkippedTests: Integration test requiring real environment
    it.skip('should update file if content differs', async () => {
      // This would require:
      // - A test file with known content
      // - File system write access
      // - Would test the actual updateFile function
    })
  })
})
