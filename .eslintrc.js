/**
 * CONFIGURAÇÃO ESLINT
 * Vizinho Virtual - SaaS de Gestão de Condomínios
 * 
 * Regras de linting para manter qualidade e consistência do código
 * 
 * @author Code Quality Expert - Vizinho Virtual
 */

module.exports = {
  root: true,
  env: {
    node: true,
    es2022: true,
    jest: true
  },
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    '@typescript-eslint/recommended-requiring-type-checking'
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    project: ['./tsconfig.json', './backend/*/tsconfig.json']
  },
  plugins: [
    '@typescript-eslint',
    'security',
    'import'
  ],
  rules: {
    // ==============================================
    // REGRAS GERAIS
    // ==============================================
    'no-console': 'warn',
    'no-debugger': 'error',
    'no-unused-vars': 'off', // Usar a versão do TypeScript
    'no-var': 'error',
    'prefer-const': 'error',
    'prefer-arrow-callback': 'error',
    'arrow-spacing': 'error',
    'comma-dangle': ['error', 'never'],
    'semi': ['error', 'always'],
    'quotes': ['error', 'single'],
    'indent': ['error', 2],
    'max-len': ['error', { code: 120, ignoreUrls: true }],
    'eol-last': 'error',
    'no-trailing-spaces': 'error',

    // ==============================================
    // REGRAS TYPESCRIPT
    // ==============================================
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/explicit-function-return-type': 'warn',
    '@typescript-eslint/explicit-module-boundary-types': 'warn',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-non-null-assertion': 'warn',
    '@typescript-eslint/prefer-nullish-coalescing': 'error',
    '@typescript-eslint/prefer-optional-chain': 'error',
    '@typescript-eslint/no-floating-promises': 'error',
    '@typescript-eslint/await-thenable': 'error',
    '@typescript-eslint/no-misused-promises': 'error',
    '@typescript-eslint/require-await': 'error',

    // ==============================================
    // REGRAS DE SEGURANÇA
    // ==============================================
    'security/detect-object-injection': 'error',
    'security/detect-non-literal-regexp': 'error',
    'security/detect-unsafe-regex': 'error',
    'security/detect-buffer-noassert': 'error',
    'security/detect-child-process': 'warn',
    'security/detect-disable-mustache-escape': 'error',
    'security/detect-eval-with-expression': 'error',
    'security/detect-no-csrf-before-method-override': 'error',
    'security/detect-non-literal-fs-filename': 'warn',
    'security/detect-non-literal-require': 'warn',
    'security/detect-possible-timing-attacks': 'warn',
    'security/detect-pseudoRandomBytes': 'error',

    // ==============================================
    // REGRAS DE IMPORT
    // ==============================================
    'import/order': ['error', {
      groups: [
        'builtin',
        'external',
        'internal',
        'parent',
        'sibling',
        'index'
      ],
      'newlines-between': 'always',
      alphabetize: {
        order: 'asc',
        caseInsensitive: true
      }
    }],
    'import/no-unresolved': 'error',
    'import/no-cycle': 'error',
    'import/no-self-import': 'error',
    'import/no-duplicate-exports': 'error',

    // ==============================================
    // REGRAS DE COMPLEXIDADE
    // ==============================================
    'complexity': ['warn', 10],
    'max-depth': ['warn', 4],
    'max-nested-callbacks': ['warn', 3],
    'max-params': ['warn', 5],
    'max-statements': ['warn', 20],

    // ==============================================
    // REGRAS DE NOMENCLATURA
    // ==============================================
    '@typescript-eslint/naming-convention': [
      'error',
      {
        selector: 'variableLike',
        format: ['camelCase', 'UPPER_CASE']
      },
      {
        selector: 'typeLike',
        format: ['PascalCase']
      },
      {
        selector: 'interface',
        format: ['PascalCase'],
        prefix: ['I']
      },
      {
        selector: 'enum',
        format: ['PascalCase']
      },
      {
        selector: 'enumMember',
        format: ['UPPER_CASE']
      }
    ]
  },
  overrides: [
    // ==============================================
    // CONFIGURAÇÕES ESPECÍFICAS PARA TESTES
    // ==============================================
    {
      files: ['**/*.test.ts', '**/*.spec.ts'],
      env: {
        jest: true
      },
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off',
        'max-statements': 'off'
      }
    },
    // ==============================================
    // CONFIGURAÇÕES PARA ARQUIVOS DE CONFIGURAÇÃO
    // ==============================================
    {
      files: ['*.config.js', '*.config.ts'],
      rules: {
        '@typescript-eslint/no-var-requires': 'off',
        'import/no-commonjs': 'off'
      }
    },
    // ==============================================
    // CONFIGURAÇÕES PARA SCRIPTS
    // ==============================================
    {
      files: ['scripts/**/*.js'],
      env: {
        node: true
      },
      rules: {
        'no-console': 'off',
        '@typescript-eslint/no-var-requires': 'off'
      }
    }
  ],
  settings: {
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true,
        project: ['./tsconfig.json', './backend/*/tsconfig.json']
      }
    }
  },
  ignorePatterns: [
    'node_modules/',
    'dist/',
    'build/',
    'coverage/',
    '*.min.js',
    'public/',
    '.env*'
  ]
};