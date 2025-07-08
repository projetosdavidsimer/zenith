import React from 'react';
import { Link } from 'react-router-dom';
import { 
  BuildingOfficeIcon, 
  CurrencyEuroIcon, 
  ChatBubbleLeftRightIcon,
  ShoppingBagIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  DevicePhoneMobileIcon,
  GlobeEuropeAfricaIcon,
  CheckIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

const LandingPage: React.FC = () => {
  const features = [
    {
      icon: CurrencyEuroIcon,
      title: 'Gestão Financeira Completa',
      description: 'Faturas, pagamentos, relatórios e controle de inadimplência automatizados.'
    },
    {
      icon: ChatBubbleLeftRightIcon,
      title: 'Comunicação Integrada',
      description: 'Chat, avisos, notificações e assembleias digitais em uma plataforma.'
    },
    {
      icon: ShoppingBagIcon,
      title: 'Marketplace Interno',
      description: 'Vendas entre moradores com sistema de avaliações e transações seguras.'
    },
    {
      icon: UserGroupIcon,
      title: 'Profissionais Verificados',
      description: 'Rede de prestadores de serviços com verificação e sistema de comissões.'
    },
    {
      icon: ShieldCheckIcon,
      title: 'Sistema de Segurança',
      description: 'Botão de pânico, registro de ocorrências e números de emergência.'
    },
    {
      icon: DevicePhoneMobileIcon,
      title: 'Multi-plataforma',
      description: 'Acesso via web e aplicativo mobile para iOS e Android.'
    }
  ];

  const plans = [
    {
      name: 'Básico',
      price: '29',
      currency: '€',
      period: '/mês',
      apartments: 'Até 20 apartamentos',
      features: [
        'Gestão financeira básica',
        'Chat e comunicação',
        'Marketplace interno',
        'Suporte por email'
      ],
      popular: false
    },
    {
      name: 'Profissional',
      price: '59',
      currency: '€',
      period: '/mês',
      apartments: 'Até 50 apartamentos',
      features: [
        'Todas as funcionalidades básicas',
        'Assembleias digitais',
        'Relatórios avançados',
        'Profissionais Plus',
        'Suporte prioritário'
      ],
      popular: true
    },
    {
      name: 'Enterprise',
      price: '99',
      currency: '€',
      period: '/mês',
      apartments: 'Apartamentos ilimitados',
      features: [
        'Todas as funcionalidades',
        'API personalizada',
        'Integrações customizadas',
        'Suporte 24/7',
        'Gerente de conta dedicado'
      ],
      popular: false
    }
  ];

  const markets = [
    { country: 'Portugal', flag: '🇵🇹', status: 'Lançamento Q1 2024' },
    { country: 'Espanha', flag: '🇪🇸', status: 'Q2 2024' },
    { country: 'França', flag: '🇫🇷', status: 'Q3 2024' },
    { country: 'Brasil', flag: '🇧🇷', status: 'Q4 2024' }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <BuildingOfficeIcon className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">Vizinho Virtual</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/login"
                className="text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Entrar
              </Link>
              <Link
                to="/register"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Começar Grátis
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              O Futuro da Gestão
              <br />
              <span className="text-blue-200">Condominial</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto">
              Plataforma SaaS completa para síndicos e moradores. 
              Gestão financeira, comunicação, marketplace e muito mais.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-3 rounded-lg text-lg font-semibold inline-flex items-center justify-center"
              >
                Começar Grátis
                <ArrowRightIcon className="ml-2 h-5 w-5" />
              </Link>
              <button className="border-2 border-white text-white hover:bg-white hover:text-blue-600 px-8 py-3 rounded-lg text-lg font-semibold">
                Ver Demo
              </button>
            </div>
            <p className="mt-4 text-blue-200">
              ✨ Teste grátis por 30 dias • Sem cartão de crédito
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Tudo que você precisa em uma plataforma
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Simplifique a gestão do seu condomínio com ferramentas modernas e intuitivas
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white p-8 rounded-xl shadow-soft hover:shadow-medium transition-shadow">
                <feature.icon className="h-12 w-12 text-blue-600 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Planos para todos os tamanhos
            </h2>
            <p className="text-xl text-gray-600">
              Escolha o plano ideal para o seu condomínio
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <div 
                key={index} 
                className={`relative bg-white rounded-xl shadow-soft hover:shadow-medium transition-shadow p-8 ${
                  plan.popular ? 'ring-2 ring-blue-600' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                      Mais Popular
                    </span>
                  </div>
                )}
                
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <div className="flex items-baseline justify-center">
                    <span className="text-4xl font-bold text-gray-900">{plan.currency}{plan.price}</span>
                    <span className="text-gray-500 ml-1">{plan.period}</span>
                  </div>
                  <p className="text-gray-600 mt-2">{plan.apartments}</p>
                </div>
                
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center">
                      <CheckIcon className="h-5 w-5 text-green-500 mr-3" />
                      <span className="text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <button 
                  className={`w-full py-3 px-4 rounded-lg font-semibold ${
                    plan.popular 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                  }`}
                >
                  Começar Agora
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Markets Section */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <GlobeEuropeAfricaIcon className="h-16 w-16 text-blue-600 mx-auto mb-4" />
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Expansão Internacional
            </h2>
            <p className="text-xl text-gray-600">
              Levando inovação para a gestão condominial em múltiplos países
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {markets.map((market, index) => (
              <div key={index} className="bg-white p-6 rounded-xl shadow-soft text-center">
                <div className="text-4xl mb-3">{market.flag}</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{market.country}</h3>
                <p className="text-sm text-gray-600">{market.status}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-blue-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Pronto para revolucionar seu condomínio?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Junte-se a centenas de condomínios que já transformaram sua gestão
          </p>
          <Link
            to="/register"
            className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-4 rounded-lg text-lg font-semibold inline-flex items-center"
          >
            Começar Teste Grátis
            <ArrowRightIcon className="ml-2 h-5 w-5" />
          </Link>
          <p className="mt-4 text-blue-200 text-sm">
            30 dias grátis • Sem compromisso • Suporte incluído
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <BuildingOfficeIcon className="h-8 w-8 text-blue-400" />
                <span className="ml-2 text-xl font-bold">Vizinho Virtual</span>
              </div>
              <p className="text-gray-400">
                O futuro da gestão condominial está aqui.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Produto</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Funcionalidades</a></li>
                <li><a href="#" className="hover:text-white">Preços</a></li>
                <li><a href="#" className="hover:text-white">Demo</a></li>
                <li><a href="#" className="hover:text-white">API</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Empresa</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Sobre</a></li>
                <li><a href="#" className="hover:text-white">Blog</a></li>
                <li><a href="#" className="hover:text-white">Carreiras</a></li>
                <li><a href="#" className="hover:text-white">Contato</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Suporte</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Central de Ajuda</a></li>
                <li><a href="#" className="hover:text-white">Documentaç��o</a></li>
                <li><a href="#" className="hover:text-white">Status</a></li>
                <li><a href="#" className="hover:text-white">Privacidade</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Vizinho Virtual. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;