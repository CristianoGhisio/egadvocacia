import nextConfig from 'eslint-config-next'
import tseslint from '@typescript-eslint/eslint-plugin'

const config = [
  ...nextConfig,
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    plugins: {
      '@typescript-eslint': tseslint
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-empty-object-type': 'off',
      'prefer-const': 'warn'
    }
  }
]

export default config
