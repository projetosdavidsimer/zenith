/**
 * CONFIGURAÇÃO PRETTIER
 * Vizinho Virtual - SaaS de Gestão de Condomínios
 * 
 * Formatação automática de código para consistência
 * 
 * @author Code Quality Expert - Vizinho Virtual
 */

module.exports = {
  // ==============================================
  // CONFIGURAÇÕES BÁSICAS
  // ==============================================
  
  // Usar ponto e vírgula no final das declarações
  semi: true,
  
  // Usar aspas simples em vez de duplas
  singleQuote: true,
  
  // Largura máxima da linha
  printWidth: 100,
  
  // Número de espaços por indentação
  tabWidth: 2,
  
  // Usar espaços em vez de tabs
  useTabs: false,
  
  // Quebra de linha no final dos arquivos
  endOfLine: 'lf',
  
  // ==============================================
  // CONFIGURAÇÕES DE OBJETOS E ARRAYS
  // ==============================================
  
  // Vírgula no final de objetos e arrays (quando multiline)
  trailingComma: 'none',
  
  // Espaços dentro de chaves de objetos
  bracketSpacing: true,
  
  // Posição da chave de fechamento em objetos
  bracketSameLine: false,
  
  // ==============================================
  // CONFIGURAÇÕES DE FUNÇÕES
  // ==============================================
  
  // Parênteses em arrow functions com um parâmetro
  arrowParens: 'avoid',
  
  // ==============================================
  // CONFIGURAÇÕES ESPECÍFICAS POR TIPO DE ARQUIVO
  // ==============================================
  
  overrides: [
    // JavaScript e TypeScript
    {
      files: ['*.js', '*.jsx', '*.ts', '*.tsx'],
      options: {
        parser: 'typescript',
        singleQuote: true,
        semi: true,
        trailingComma: 'none'
      }
    },
    
    // JSON
    {
      files: ['*.json'],
      options: {
        parser: 'json',
        singleQuote: false,
        trailingComma: 'none'
      }
    },
    
    // Markdown
    {
      files: ['*.md'],
      options: {
        parser: 'markdown',
        printWidth: 80,
        proseWrap: 'always'
      }
    },
    
    // YAML
    {
      files: ['*.yml', '*.yaml'],
      options: {
        parser: 'yaml',
        singleQuote: true,
        tabWidth: 2
      }
    },
    
    // CSS e SCSS
    {
      files: ['*.css', '*.scss', '*.sass'],
      options: {
        parser: 'css',
        singleQuote: true
      }
    },
    
    // HTML
    {
      files: ['*.html'],
      options: {
        parser: 'html',
        singleQuote: false,
        printWidth: 120
      }
    },
    
    // Package.json (formatação especial)
    {
      files: ['package.json'],
      options: {
        parser: 'json-stringify',
        tabWidth: 2,
        singleQuote: false
      }
    },
    
    // Arquivos de configuração
    {
      files: [
        '.eslintrc.js',
        '.prettierrc.js',
        'jest.config.js',
        'webpack.config.js',
        'vite.config.js'
      ],
      options: {
        parser: 'babel',
        singleQuote: true,
        semi: true
      }
    }
  ]
};