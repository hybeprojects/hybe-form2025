/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
  {
    ignores: ['dist/**', 'node_modules/**'],
  },
  {
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'module',
      globals: {
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        AOS: 'readonly',
        bootstrap: 'readonly',
        intlTelInput: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        setTimeout: 'readonly',
        fetch: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': [
        'warn',
        { varsIgnorePattern: 'paymentMethods|countryInput|currencyInput|languageInput' },
      ],
      'no-undef': 'error',
      'no-console': 'off',
    },
  },
];
