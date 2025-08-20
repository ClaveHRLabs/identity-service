import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(eslint.configs.recommended, ...tseslint.configs.recommended, {
    ignores: ['dist/**', 'node_modules/**'],
    files: ['**/*.ts'],
    languageOptions: {
        parser: tseslint.parser,
        parserOptions: { project: false },
    },
    rules: {
        'no-console': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-unused-vars': 'warn',
        '@typescript-eslint/no-namespace': 'off',
        'prefer-const': 'warn',
    },
});