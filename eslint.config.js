import js from '@eslint/js'
import globals from 'globals'
import stylistic from '@stylistic/eslint-plugin'

export default [
    js.configs.recommended,
    {
        plugins: {
            '@stylistic': stylistic,
        },
        languageOptions: {
            ecmaVersion: 2024,
            sourceType: 'module',
            globals: {
                ...globals.browser,
            },
        },
        rules: {
            'curly': ['error', 'all'],
            'eqeqeq': ['error', 'always'],
            'no-console': ['warn', { allow: ['warn'] }],
            'no-empty-function': 'error',
            'no-else-return': ['error', { allowElseIf: false }],
            'no-var': 'error',
            'object-shorthand': ['error', 'always'],
            'prefer-arrow-callback': 'error',
            'prefer-const': 'error',
            'prefer-template': 'error',
            '@stylistic/arrow-parens': ['error', 'always'],
            '@stylistic/brace-style': ['error', '1tbs'],
            '@stylistic/comma-dangle': ['error', 'always-multiline'],
            '@stylistic/comma-spacing': ['error', { before: false, after: true }],
            '@stylistic/comma-style': ['error', 'last'],
            '@stylistic/eol-last': ['error', 'always'],
            '@stylistic/function-call-spacing': ['error', 'never'],
            '@stylistic/indent': ['error', 4],
            '@stylistic/key-spacing': ['error', { mode: 'minimum', beforeColon: false, afterColon: true }],
            '@stylistic/keyword-spacing': ['error', { before: true, after: true }],
            '@stylistic/linebreak-style': ['error', 'unix'],
            '@stylistic/lines-between-class-members': ['error', 'always', { exceptAfterSingleLine: true }],
            '@stylistic/no-multiple-empty-lines': ['error', { max: 2 }],
            '@stylistic/no-trailing-spaces': 'error',
            '@stylistic/object-curly-spacing': ['error', 'always'],
            '@stylistic/quotes': ['error', 'single', { avoidEscape: true, allowTemplateLiterals: 'always' }],
            '@stylistic/semi': ['error', 'never'],
            '@stylistic/space-before-blocks': ['error', 'always'],
            '@stylistic/space-before-function-paren': ['error', { named: 'never', anonymous: 'always', asyncArrow: 'always' }],
            '@stylistic/space-infix-ops': 'error',
        },
    },
]
