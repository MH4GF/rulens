import { object, optional, string } from 'valibot'

export const generateOptionsSchema = object({
  biomeArgs: optional(string()),
  eslintArgs: optional(string()),
  output: string(),
})

export type GenerateOptions = {
  biomeArgs: string
  eslintArgs: string
  output: string
}
