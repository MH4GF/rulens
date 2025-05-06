import mh4gf from '@mh4gf/eslint-config'

// biome-ignore lint/style/noDefaultExport: ESLint requires default export for config
export default [
  { ignores: ['eslint.config.js', 'dist/**', 'coverage'] },
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  ...mh4gf.configs.recommended,
  ...mh4gf.configs.typescript,
  ...mh4gf.configs.vitest,
]
