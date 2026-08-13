import {includeIgnoreFile} from '@eslint/compat'
import oclif from 'eslint-config-oclif'
import prettier from 'eslint-config-prettier'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
import tseslint from 'typescript-eslint'

const gitignorePath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '.gitignore')

const config = [
  includeIgnoreFile(gitignorePath),
  {
    ignores: ['coverage/', 'dist/'],
  },
  ...oclif,
  // Disable type-checked (type-aware) rules for test files. Test fixtures and
  // mocks don't need full type information and shouldn't fail type-aware rules
  // such as no-unsafe-* / no-base-to-string.
  {
    files: ['test/**/*.ts'],
    ...tseslint.configs.disableTypeChecked,
  },
  // eslint.config.mjs imports typescript-eslint, which is a transitive
  // dependency (via eslint-config-oclif) rather than a direct one — relax the
  // extraneous-dependency checks for this file only.
  {
    files: ['eslint.config.mjs'],
    rules: {
      'import-x/no-extraneous-dependencies': 'off',
      'n/no-extraneous-import': 'off',
    },
  },
  // Relax overly-strict rules from eslint-config-oclif@7 across the project.
  {
    rules: {
      // readConfig/resolveProfile deliberately return null to signal "missing,
      // already reported to the user" — a documented part of their contract.
      '@typescript-eslint/no-restricted-types': 'off',
    },
  },
  {
    files: ['src/**/*.ts'],
    rules: {
      // `formatted` mirrors the public `--formatted` CLI flag name.
      'unicorn/consistent-boolean-name': 'off',
      // Private helpers read better after the public API that uses them.
      'unicorn/consistent-class-member-order': 'off',
    },
  },
  // Test files use the documented bare `eslint-disable` convention.
  {
    files: ['test/**/*.ts'],
    rules: {
      '@eslint-community/eslint-comments/require-description': 'off',
    },
  },
  prettier,
]

export default config
