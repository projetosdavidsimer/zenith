import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { BuildingOfficeIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

interface RegisterForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: 'SINDICO' | 'MORADOR' | 'PROFISSIONAL';
  phone?: string;
  buildingName?: string;
  apartmentNumber?: string;
  acceptTerms: boolean;
  acceptPrivacy: boolean;
}

const RegisterPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  
  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterForm>();
  const watchRole = watch('role');
  const watchPassword = watch('password');

  const onSubmit = async (data: RegisterForm) => {
    if (data.password !== data.confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    setIsLoading(true);
    try {
      await registerUser(data);
      toast.success('Conta criada com sucesso!');
      navigate('/dashboard');
    } catch (error) {
      toast.error('Erro ao criar conta. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <BuildingOfficeIcon className="h-12 w-12 text-blue-600" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
          Criar nova conta
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Ou{' '}
          <Link
            to="/login"
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            entrar na sua conta existente
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {/* Nome */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Nome completo
              </label>
              <div className="mt-1">
                <input
                  {...register('name', {
                    required: 'Nome é obrigatório',
                    minLength: {
                      value: 2,
                      message: 'Nome deve ter pelo menos 2 caracteres'
                    }
                  })}
                  type="text"
                  className="input-field"
                  placeholder="Seu nome completo"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <div className="mt-1">
                <input
                  {...register('email', {
                    required: 'Email é obrigatório',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Email inválido'
                    }
                  })}
                  type="email"
                  className="input-field"
                  placeholder="seu@email.com"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>
            </div>

            {/* Telefone */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Telefone (opcional)
              </label>
              <div className="mt-1">
                <input
                  {...register('phone')}
                  type="tel"
                  className="input-field"
                  placeholder="+351 123 456 789"
                />
              </div>
            </div>

            {/* Role */}
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                Tipo de conta
              </label>
              <div className="mt-1">
                <select
                  {...register('role', { required: 'Tipo de conta é obrigatório' })}
                  className="input-field"
                >
                  <option value="">Selecione o tipo</option>
                  <option value="SINDICO">Síndico</option>
                  <option value="MORADOR">Morador</option>
                  <option value="PROFISSIONAL">Profissional</option>
                </select>
                {errors.role && (
                  <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
                )}
              </div>
            </div>

            {/* Campos condicionais baseados no role */}
            {(watchRole === 'SINDICO' || watchRole === 'MORADOR') && (
              <div>
                <label htmlFor="buildingName" className="block text-sm font-medium text-gray-700">
                  Nome do condomínio
                </label>
                <div className="mt-1">
                  <input
                    {...register('buildingName', {
                      required: watchRole === 'SINDICO' || watchRole === 'MORADOR' ? 'Nome do condomínio é obrigatório' : false
                    })}
                    type="text"
                    className="input-field"
                    placeholder="Residencial ABC"
                  />
                  {errors.buildingName && (
                    <p className="mt-1 text-sm text-red-600">{errors.buildingName.message}</p>
                  )}
                </div>
              </div>
            )}

            {watchRole === 'MORADOR' && (
              <div>
                <label htmlFor="apartmentNumber" className="block text-sm font-medium text-gray-700">
                  Número do apartamento
                </label>
                <div className="mt-1">
                  <input
                    {...register('apartmentNumber', {
                      required: watchRole === 'MORADOR' ? 'Número do apartamento é obrigatório' : false
                    })}
                    type="text"
                    className="input-field"
                    placeholder="2A, 101, etc."
                  />
                  {errors.apartmentNumber && (
                    <p className="mt-1 text-sm text-red-600">{errors.apartmentNumber.message}</p>
                  )}
                </div>
              </div>
            )}

            {/* Senha */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Senha
              </label>
              <div className="mt-1 relative">
                <input
                  {...register('password', {
                    required: 'Senha é obrigatória',
                    minLength: {
                      value: 8,
                      message: 'Senha deve ter pelo menos 8 caracteres'
                    },
                    pattern: {
                      value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                      message: 'Senha deve conter pelo menos: 1 minúscula, 1 maiúscula e 1 número'
                    }
                  })}
                  type={showPassword ? 'text' : 'password'}
                  className="input-field pr-10"
                  placeholder="Sua senha segura"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            {/* Confirmar Senha */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirmar senha
              </label>
              <div className="mt-1 relative">
                <input
                  {...register('confirmPassword', {
                    required: 'Confirmação de senha é obrigatória',
                    validate: value => value === watchPassword || 'As senhas não coincidem'
                  })}
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="input-field pr-10"
                  placeholder="Confirme sua senha"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Termos e Privacidade */}
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  {...register('acceptTerms', { required: 'Você deve aceitar os termos de uso' })}
                  id="accept-terms"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="accept-terms" className="ml-2 block text-sm text-gray-900">
                  Aceito os{' '}
                  <a href="#" className="text-blue-600 hover:text-blue-500">
                    termos de uso
                  </a>
                </label>
              </div>
              {errors.acceptTerms && (
                <p className="text-sm text-red-600">{errors.acceptTerms.message}</p>
              )}

              <div className="flex items-center">
                <input
                  {...register('acceptPrivacy', { required: 'Você deve aceitar a política de privacidade' })}
                  id="accept-privacy"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="accept-privacy" className="ml-2 block text-sm text-gray-900">
                  Aceito a{' '}
                  <a href="#" className="text-blue-600 hover:text-blue-500">
                    pol��tica de privacidade
                  </a>
                </label>
              </div>
              {errors.acceptPrivacy && (
                <p className="text-sm text-red-600">{errors.acceptPrivacy.message}</p>
              )}
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="loading"></div>
                ) : (
                  'Criar Conta'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;