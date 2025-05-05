import { boolean, object, optional, string } from 'valibot'

export const generateOptionsSchema = object({
  biomeArgs: optional(string()),
  eslintConfig: optional(string()),
  output: string(),
  verbose: optional(boolean()),
})

export type GenerateOptions = {
  biomeArgs: string
  eslintConfig?: string | undefined
  output: string
  verbose?: boolean | undefined
}
