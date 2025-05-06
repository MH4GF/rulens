import { type InferOutput, boolean, object, optional, string } from 'valibot'

export const generateOptionsSchema = object({
  biomeArgs: optional(string()),
  eslintConfig: optional(string()),
  output: string(),
  verbose: optional(boolean()),
})

export type GenerateOptions = InferOutput<typeof generateOptionsSchema>

export const lintOptionsSchema = object({
  biomeArgs: optional(string()),
  eslintConfig: optional(string()),
  output: string(),
  update: optional(boolean()),
  verbose: optional(boolean()),
})

export type LintOptions = InferOutput<typeof lintOptionsSchema>
