import { object, optional, string } from 'valibot'

export const generateOptionsSchema = object({
  biomeArgs: optional(string()),
  eslintConfig: optional(string()), // eslintArgsからeslintConfigに変更
  output: string(),
})

export type GenerateOptions = {
  biomeArgs: string
  eslintConfig?: string | undefined // eslintArgsからeslintConfigに変更
  output: string
}
