/**
 * SCHEMAS DE VALIDAÇÃO PARA AUTENTICAÇÃO
 * 
 * Implementa validações rigorosas para:
 * - Registro de usuários
 * - Login e autenticação
 * - Recuperação de senha
 * - 2FA (Two-Factor Authentication)
 * - Validação de dados pessoais
 * 
 * @author Backend Expert - Vizinho Virtual
 */

import Joi from 'joi';

// ==============================================
// VALIDAÇÕES CUSTOMIZADAS
// ==============================================

// Validação de senha forte
const passwordSchema = Joi.string()
  .min(8)
  .max(128)
  .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
  .required()
  .messages({
    'string.min': 'A senha deve ter pelo menos 8 caracteres',
    'string.max': 'A senha deve ter no máximo 128 caracteres',
    'string.pattern.base': 'A senha deve conter pelo menos: 1 letra minúscula, 1 maiúscula, 1 número e 1 caractere especial',
    'any.required': 'Senha é obrigatória'
  });

// Validação de email
const emailSchema = Joi.string()
  .email({ tlds: { allow: false } })
  .max(255)
  .required()
  .messages({
    'string.email': 'Email deve ter um formato válido',
    'string.max': 'Email deve ter no máximo 255 caracteres',
    'any.required': 'Email é obrigatório'
  });

// Validação de nome
const nameSchema = Joi.string()
  .min(2)
  .max(100)
  .pattern(/^[a-zA-ZÀ-ÿ\s]+$/)
  .required()
  .messages({
    'string.min': 'Nome deve ter pelo menos 2 caracteres',
    'string.max': 'Nome deve ter no máximo 100 caracteres',
    'string.pattern.base': 'Nome deve conter apenas letras e espaços',
    'any.required': 'Nome é obrigatório'
  });

// Validação de telefone (formato internacional)
const phoneSchema = Joi.string()
  .pattern(/^\+[1-9]\d{1,14}$/)
  .optional()
  .messages({
    'string.pattern.base': 'Telefone deve estar no formato internacional (+351123456789)'
  });

// Validação de NIF português
const nifSchema = Joi.string()
  .pattern(/^\d{9}$/)
  .optional()
  .messages({
    'string.pattern.base': 'NIF deve conter exatamente 9 dígitos'
  });

// Validação de UUID
const uuidSchema = Joi.string()
  .uuid()
  .messages({
    'string.guid': 'ID deve ser um UUID válido'
  });

// Validação de código 2FA
const twoFactorCodeSchema = Joi.string()
  .pattern(/^\d{6}$/)
  .messages({
    'string.pattern.base': 'Código deve conter exatamente 6 dígitos'
  });

// ==============================================
// SCHEMAS DE AUTENTICAÇÃO
// ==============================================

export const authSchemas = {
  // Registro de usuário
  register: Joi.object({
    body: Joi.object({
      email: emailSchema,
      password: passwordSchema,
      name: nameSchema,
      phone: phoneSchema,
      role: Joi.string()
        .valid('SINDICO', 'MORADOR', 'PROFISSIONAL')
        .default('MORADOR')
        .messages({
          'any.only': 'Role deve ser SINDICO, MORADOR ou PROFISSIONAL'
        }),
      buildingId: uuidSchema.optional(),
      apartmentNumber: Joi.string()
        .max(10)
        .optional()
        .messages({
          'string.max': 'Número do apartamento deve ter no máximo 10 caracteres'
        }),
      nif: nifSchema,
      acceptTerms: Joi.boolean()
        .valid(true)
        .required()
        .messages({
          'any.only': 'Você deve aceitar os termos de uso',
          'any.required': 'Aceitação dos termos é obrigatória'
        }),
      acceptPrivacy: Joi.boolean()
        .valid(true)
        .required()
        .messages({
          'any.only': 'Você deve aceitar a política de privacidade',
          'any.required': 'Aceitação da política de privacidade é obrigatória'
        })
    })
  }),

  // Login
  login: Joi.object({
    body: Joi.object({
      email: emailSchema,
      password: Joi.string()
        .required()
        .messages({
          'any.required': 'Senha é obrigatória'
        }),
      twoFactorCode: twoFactorCodeSchema.optional(),
      rememberMe: Joi.boolean().default(false)
    })
  }),

  // Refresh token
  refresh: Joi.object({
    body: Joi.object({
      refreshToken: Joi.string()
        .required()
        .messages({
          'any.required': 'Refresh token é obrigatório'
        })
    })
  }),

  // Verificação de email
  verifyEmail: Joi.object({
    body: Joi.object({
      token: uuidSchema.required().messages({
        'any.required': 'Token de verificação é obrigatório'
      })
    })
  }),

  // Reenviar verificação
  resendVerification: Joi.object({
    body: Joi.object({
      email: emailSchema
    })
  }),

  // Esqueci minha senha
  forgotPassword: Joi.object({
    body: Joi.object({
      email: emailSchema
    })
  }),

  // Resetar senha
  resetPassword: Joi.object({
    body: Joi.object({
      token: uuidSchema.required().messages({
        'any.required': 'Token de recuperação é obrigatório'
      }),
      newPassword: passwordSchema
    })
  }),

  // Verificar 2FA
  verify2FA: Joi.object({
    body: Joi.object({
      token: twoFactorCodeSchema.required().messages({
        'any.required': 'Código 2FA é obrigatório'
      })
    })
  }),

  // Desativar 2FA
  disable2FA: Joi.object({
    body: Joi.object({
      password: Joi.string()
        .required()
        .messages({
          'any.required': 'Senha atual é obrigatória'
        }),
      twoFactorCode: twoFactorCodeSchema.required().messages({
        'any.required': 'Código 2FA é obrigatório'
      })
    })
  }),

  // Alterar senha
  changePassword: Joi.object({
    body: Joi.object({
      currentPassword: Joi.string()
        .required()
        .messages({
          'any.required': 'Senha atual é obrigatória'
        }),
      newPassword: passwordSchema,
      confirmPassword: Joi.string()
        .valid(Joi.ref('newPassword'))
        .required()
        .messages({
          'any.only': 'Confirmação de senha deve ser igual à nova senha',
          'any.required': 'Confirmação de senha é obrigatória'
        })
    })
  })
};

// ==============================================
// SCHEMAS DE USUÁRIO
// ==============================================

export const userSchemas = {
  // Atualizar perfil
  updateProfile: Joi.object({
    body: Joi.object({
      name: nameSchema.optional(),
      phone: phoneSchema,
      avatar: Joi.string().uri().optional(),
      preferences: Joi.object({
        language: Joi.string()
          .valid('pt', 'en', 'es', 'fr')
          .default('pt'),
        timezone: Joi.string()
          .default('Europe/Lisbon'),
        notifications: Joi.object({
          email: Joi.boolean().default(true),
          sms: Joi.boolean().default(false),
          push: Joi.boolean().default(true)
        }).default()
      }).default()
    })
  }),

  // Buscar usuários (admin)
  searchUsers: Joi.object({
    query: Joi.object({
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(20),
      search: Joi.string().max(100).optional(),
      role: Joi.string()
        .valid('SINDICO', 'MORADOR', 'PROFISSIONAL', 'ADMIN')
        .optional(),
      buildingId: uuidSchema.optional(),
      isActive: Joi.boolean().optional(),
      emailVerified: Joi.boolean().optional(),
      sortBy: Joi.string()
        .valid('name', 'email', 'createdAt', 'lastLogin')
        .default('createdAt'),
      sortOrder: Joi.string()
        .valid('asc', 'desc')
        .default('desc')
    })
  }),

  // Criar usuário (admin)
  createUser: Joi.object({
    body: Joi.object({
      email: emailSchema,
      password: passwordSchema,
      name: nameSchema,
      phone: phoneSchema,
      role: Joi.string()
        .valid('SINDICO', 'MORADOR', 'PROFISSIONAL', 'ADMIN')
        .required(),
      buildingId: uuidSchema.optional(),
      apartmentNumber: Joi.string().max(10).optional(),
      nif: nifSchema,
      isActive: Joi.boolean().default(true),
      emailVerified: Joi.boolean().default(false)
    })
  }),

  // Atualizar usuário (admin)
  updateUser: Joi.object({
    params: Joi.object({
      userId: uuidSchema.required()
    }),
    body: Joi.object({
      name: nameSchema.optional(),
      phone: phoneSchema,
      role: Joi.string()
        .valid('SINDICO', 'MORADOR', 'PROFISSIONAL', 'ADMIN')
        .optional(),
      buildingId: uuidSchema.optional(),
      apartmentNumber: Joi.string().max(10).optional(),
      isActive: Joi.boolean().optional(),
      emailVerified: Joi.boolean().optional()
    })
  }),

  // Parâmetro de usuário
  userParam: Joi.object({
    params: Joi.object({
      userId: uuidSchema.required()
    })
  })
};

// ==============================================
// VALIDAÇÕES CUSTOMIZADAS AVANÇADAS
// ==============================================

// Validar NIF português (algoritmo de verificação)
export const validateNIF = (nif: string): boolean => {
  if (!/^\d{9}$/.test(nif)) return false;
  
  const digits = nif.split('').map(Number);
  const checkDigit = digits[8];
  
  let sum = 0;
  for (let i = 0; i < 8; i++) {
    sum += digits[i] * (9 - i);
  }
  
  const remainder = sum % 11;
  const expectedCheckDigit = remainder < 2 ? 0 : 11 - remainder;
  
  return checkDigit === expectedCheckDigit;
};

// Validar força da senha
export const validatePasswordStrength = (password: string): {
  score: number;
  feedback: string[];
} => {
  const feedback: string[] = [];
  let score = 0;

  // Comprimento
  if (password.length >= 8) score += 1;
  else feedback.push('Use pelo menos 8 caracteres');

  if (password.length >= 12) score += 1;
  else feedback.push('Use pelo menos 12 caracteres para maior segurança');

  // Complexidade
  if (/[a-z]/.test(password)) score += 1;
  else feedback.push('Inclua letras minúsculas');

  if (/[A-Z]/.test(password)) score += 1;
  else feedback.push('Inclua letras maiúsculas');

  if (/\d/.test(password)) score += 1;
  else feedback.push('Inclua números');

  if (/[@$!%*?&]/.test(password)) score += 1;
  else feedback.push('Inclua caracteres especiais (@$!%*?&)');

  // Padrões comuns
  if (!/(.)\1{2,}/.test(password)) score += 1;
  else feedback.push('Evite repetir o mesmo caractere');

  if (!/123|abc|qwe|password|admin/i.test(password)) score += 1;
  else feedback.push('Evite sequências ou palavras comuns');

  return { score, feedback };
};

// Validar email corporativo (opcional)
export const isBusinessEmail = (email: string): boolean => {
  const personalDomains = [
    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
    'live.com', 'aol.com', 'icloud.com', 'protonmail.com'
  ];
  
  const domain = email.split('@')[1]?.toLowerCase();
  return !personalDomains.includes(domain);
};