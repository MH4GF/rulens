import { object, optional, string } from 'valibot'

export const generateOptionsSchema = object({
  biomeArgs: optional(string()),
  eslintConfig: optional(string()), // Changed from eslintArgs to eslintConfig
  output: string(),
})

export type GenerateOptions = {
  biomeArgs: string
  eslintConfig?: string | undefined // Changed from eslintArgs to eslintConfig
  output: string
}
