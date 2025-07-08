import React, { useState } from 'react';
import { 
  HomeIcon,
  CurrencyEuroIcon,
  ChatBubbleLeftRightIcon,
  ShoppingBagIcon,
  UserGroupIcon,
  Cog6ToothIcon,
  BellIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon,
  BuildingOfficeIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';

const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  // Sidebar items baseados no role do usuário
  const getSidebarItems = () => {
    const baseItems = [
      { id: 'dashboard', name: 'Dashboard', icon: HomeIcon },
      { id: 'communication', name: 'Comunicação', icon: ChatBubbleLeftRightIcon },
      { id: 'marketplace', name: 'Marketplace', icon: ShoppingBagIcon },
    ];

    if (user?.role === 'SINDICO') {
      return [
        ...baseItems,
        { id: 'financial', name: 'Financeiro', icon: CurrencyEuroIcon },
        { id: 'residents', name: 'Moradores', icon: UserGroupIcon },
        { id: 'settings', name: 'Configurações', icon: Cog6ToothIcon },
      ];
    }

    if (user?.role === 'ADMIN') {
      return [
        ...baseItems,
        { id: 'financial', name: 'Financeiro', icon: CurrencyEuroIcon },
        { id: 'residents', name: 'Moradores', icon: UserGroupIcon },
        { id: 'buildings', name: 'Condomínios', icon: BuildingOfficeIcon },
        { id: 'settings', name: 'Configurações', icon: Cog6ToothIcon },
      ];
    }

    // MORADOR - acesso limitado
    return [
      ...baseItems,
      { id: 'payments', name: 'Meus Pagamentos', icon: CurrencyEuroIcon },
      { id: 'profile', name: 'Meu Perfil', icon: Cog6ToothIcon },
    ];
  };

  const sidebarItems = getSidebarItems();

  // Estatísticas baseadas no role do usuário
  const getStats = () => {
    if (user?.role === 'SINDICO') {
      return [
        {
          name: 'Receitas do Mês',
          value: '€2.450',
          change: '+12%',
          changeType: 'increase',
          icon: CurrencyEuroIcon,
        },
        {
          name: 'Apartamentos',
          value: '45',
          change: '42 ocupados',
          changeType: 'neutral',
          icon: BuildingOfficeIcon,
        },
        {
          name: 'Inadimplentes',
          value: '3',
          change: '-2 este mês',
          changeType: 'decrease',
          icon: ExclamationTriangleIcon,
        },
        {
          name: 'Ocorrências',
          value: '12',
          change: '+3 esta semana',
          changeType: 'increase',
          icon: ClockIcon,
        },
      ];
    }

    if (user?.role === 'ADMIN') {
      return [
        {
          name: 'Total Condomínios',
          value: '8',
          change: '+2 este mês',
          changeType: 'increase',
          icon: BuildingOfficeIcon,
        },
        {
          name: 'Receita Total',
          value: '€18.750',
          change: '+8%',
          changeType: 'increase',
          icon: CurrencyEuroIcon,
        },
        {
          name: 'Usuários Ativos',
          value: '342',
          change: '+15 esta semana',
          changeType: 'increase',
          icon: UserGroupIcon,
        },
        {
          name: 'Tickets Suporte',
          value: '7',
          change: '-3 hoje',
          changeType: 'decrease',
          icon: ExclamationTriangleIcon,
        },
      ];
    }

    // MORADOR
    return [
      {
        name: 'Minha Fatura',
        value: '€85,50',
        change: 'Vence em 5 dias',
        changeType: 'neutral',
        icon: CurrencyEuroIcon,
      },
      {
        name: 'Meu Apartamento',
        value: user?.apartmentNumber || '2A',
        change: 'Bloco A',
        changeType: 'neutral',
        icon: BuildingOfficeIcon,
      },
      {
        name: 'Minhas Mensagens',
        value: '3',
        change: '1 não lida',
        changeType: 'increase',
        icon: ChatBubbleLeftRightIcon,
      },
      {
        name: 'Próximos Eventos',
        value: '2',
        change: 'Esta semana',
        changeType: 'neutral',
        icon: ClockIcon,
      },
    ];
  };

  const stats = getStats();

  // Atividades recentes baseadas no role do usuário
  const getRecentActivities = () => {
    if (user?.role === 'SINDICO') {
      return [
        {
          id: 1,
          type: 'payment',
          message: 'João Silva (Apt 2A) efetuou pagamento',
          time: '2 min atrás',
          icon: CheckCircleIcon,
          iconColor: 'text-green-500',
        },
        {
          id: 2,
          type: 'maintenance',
          message: 'Manutenção do elevador agendada',
          time: '15 min atrás',
          icon: ClockIcon,
          iconColor: 'text-yellow-500',
        },
        {
          id: 3,
          type: 'alert',
          message: 'Vazamento reportado - Apt 3B',
          time: '1 hora atrás',
          icon: ExclamationTriangleIcon,
          iconColor: 'text-red-500',
        },
        {
          id: 4,
          type: 'message',
          message: 'Nova mensagem no chat geral',
          time: '2 horas atrás',
          icon: ChatBubbleLeftRightIcon,
          iconColor: 'text-blue-500',
        },
      ];
    }

    if (user?.role === 'ADMIN') {
      return [
        {
          id: 1,
          type: 'system',
          message: 'Novo condomínio "Quinta das Flores" adicionado',
          time: '5 min atrás',
          icon: BuildingOfficeIcon,
          iconColor: 'text-blue-500',
        },
        {
          id: 2,
          type: 'support',
          message: 'Ticket de suporte #1234 resolvido',
          time: '30 min atrás',
          icon: CheckCircleIcon,
          iconColor: 'text-green-500',
        },
        {
          id: 3,
          type: 'user',
          message: '15 novos usuários registrados hoje',
          time: '1 hora atrás',
          icon: UserGroupIcon,
          iconColor: 'text-purple-500',
        },
        {
          id: 4,
          type: 'payment',
          message: 'Receita total: €18.750 (+8%)',
          time: '2 horas atrás',
          icon: CurrencyEuroIcon,
          iconColor: 'text-green-500',
        },
      ];
    }

    // MORADOR
    return [
      {
        id: 1,
        type: 'payment',
        message: 'Sua fatura de julho foi gerada',
        time: '1 dia atrás',
        icon: CurrencyEuroIcon,
        iconColor: 'text-blue-500',
      },
      {
        id: 2,
        type: 'message',
        message: 'Nova mensagem do síndico',
        time: '2 dias atrás',
        icon: ChatBubbleLeftRightIcon,
        iconColor: 'text-green-500',
      },
      {
        id: 3,
        type: 'event',
        message: 'Assembleia marcada para 15/07',
        time: '3 dias atrás',
        icon: ClockIcon,
        iconColor: 'text-yellow-500',
      },
      {
        id: 4,
        type: 'marketplace',
        message: 'Novo item no marketplace',
        time: '1 semana atrás',
        icon: ShoppingBagIcon,
        iconColor: 'text-purple-500',
      },
    ];
  };

  const recentActivities = getRecentActivities();

  const upcomingEvents = [
    {
      id: 1,
      title: 'Assembleia Ordinária',
      date: '15 Jul 2024',
      time: '19:00',
      type: 'assembly',
    },
    {
      id: 2,
      title: 'Manutenção Elevador A',
      date: '18 Jul 2024',
      time: '09:00',
      type: 'maintenance',
    },
    {
      id: 3,
      title: 'Limpeza Caixa d\'Água',
      date: '22 Jul 2024',
      time: '08:00',
      type: 'maintenance',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg">
        <div className="flex items-center justify-center h-16 px-4 border-b border-gray-200">
          <BuildingOfficeIcon className="h-8 w-8 text-blue-600" />
          <span className="ml-2 text-xl font-bold text-gray-900">Vizinho Virtual</span>
        </div>
        
        <nav className="mt-8 px-4">
          <ul className="space-y-2">
            {sidebarItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => setActiveTab(item.id)}
                  className={`sidebar-item w-full ${
                    activeTab === item.id ? 'active' : ''
                  }`}
                >
                  <item.icon className="h-5 w-5 mr-3" />
                  {item.name}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* Main Content */}
      <div className="ml-64">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">
                {activeTab === 'dashboard' && 'Dashboard'}
                {activeTab === 'financial' && 'Gestão Financeira'}
                {activeTab === 'communication' && 'Comunicação'}
                {activeTab === 'marketplace' && 'Marketplace'}
                {activeTab === 'residents' && 'Moradores'}
                {activeTab === 'settings' && 'Configurações'}
                {activeTab === 'buildings' && 'Condomínios'}
                {activeTab === 'payments' && 'Meus Pagamentos'}
                {activeTab === 'profile' && 'Meu Perfil'}
              </h1>
              <span className={`ml-4 px-3 py-1 text-xs font-medium rounded-full ${
                user?.role === 'SINDICO' ? 'bg-blue-100 text-blue-800' :
                user?.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' :
                'bg-green-100 text-green-800'
              }`}>
                {user?.role === 'SINDICO' && '👨‍💼 Síndico'}
                {user?.role === 'ADMIN' && '⚙️ Administrador'}
                {user?.role === 'MORADOR' && '🏠 Morador'}
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="relative">
                <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              {/* Notifications */}
              <button className="relative p-2 text-gray-400 hover:text-gray-500">
                <BellIcon className="h-6 w-6" />
                <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400"></span>
              </button>
              
              {/* User Menu */}
              <div className="relative">
                <button className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {user?.name?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-900">{user?.name || 'Usuário'}</p>
                    <p className="text-xs text-gray-500">{user?.role || 'SINDICO'}</p>
                  </div>
                  <ChevronDownIcon className="h-4 w-4 text-gray-400" />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        {activeTab === 'dashboard' && (
          <main className="p-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {stats.map((stat) => (
                <div key={stat.name} className="card">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <stat.icon className="h-8 w-8 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                      <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                      <p className={`text-sm flex items-center ${
                        stat.changeType === 'increase' ? 'text-green-600' :
                        stat.changeType === 'decrease' ? 'text-red-600' : 'text-gray-500'
                      }`}>
                        {stat.changeType === 'increase' && <ArrowUpIcon className="h-4 w-4 mr-1" />}
                        {stat.changeType === 'decrease' && <ArrowDownIcon className="h-4 w-4 mr-1" />}
                        {stat.change}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Activities */}
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Atividades Recentes</h3>
                <div className="space-y-4">
                  {recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-3">
                      <activity.icon className={`h-5 w-5 mt-0.5 ${activity.iconColor}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900">{activity.message}</p>
                        <p className="text-xs text-gray-500">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Upcoming Events */}
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Próximos Eventos</h3>
                <div className="space-y-4">
                  {upcomingEvents.map((event) => (
                    <div key={event.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{event.title}</p>
                        <p className="text-xs text-gray-500">{event.date} às {event.time}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        event.type === 'assembly' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {event.type === 'assembly' ? 'Assembleia' : 'Manutenção'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Ações Rápidas</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {user?.role === 'SINDICO' && (
                  <>
                    <button className="p-4 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow text-center">
                      <CurrencyEuroIcon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                      <span className="text-sm font-medium text-gray-900">Nova Fatura</span>
                    </button>
                    <button className="p-4 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow text-center">
                      <ChatBubbleLeftRightIcon className="h-8 w-8 text-green-600 mx-auto mb-2" />
                      <span className="text-sm font-medium text-gray-900">Enviar Aviso</span>
                    </button>
                    <button className="p-4 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow text-center">
                      <UserGroupIcon className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                      <span className="text-sm font-medium text-gray-900">Nova Assembleia</span>
                    </button>
                    <button className="p-4 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow text-center">
                      <ExclamationTriangleIcon className="h-8 w-8 text-red-600 mx-auto mb-2" />
                      <span className="text-sm font-medium text-gray-900">Ver Ocorrências</span>
                    </button>
                    <button className="p-4 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow text-center">
                      <ShoppingBagIcon className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                      <span className="text-sm font-medium text-gray-900">Marketplace</span>
                    </button>
                    <button className="p-4 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow text-center">
                      <Cog6ToothIcon className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                      <span className="text-sm font-medium text-gray-900">Configurações</span>
                    </button>
                  </>
                )}

                {user?.role === 'ADMIN' && (
                  <>
                    <button className="p-4 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow text-center">
                      <BuildingOfficeIcon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                      <span className="text-sm font-medium text-gray-900">Novo Condomínio</span>
                    </button>
                    <button className="p-4 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow text-center">
                      <UserGroupIcon className="h-8 w-8 text-green-600 mx-auto mb-2" />
                      <span className="text-sm font-medium text-gray-900">Gerenciar Usuários</span>
                    </button>
                    <button className="p-4 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow text-center">
                      <CurrencyEuroIcon className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                      <span className="text-sm font-medium text-gray-900">Relatórios</span>
                    </button>
                    <button className="p-4 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow text-center">
                      <ExclamationTriangleIcon className="h-8 w-8 text-red-600 mx-auto mb-2" />
                      <span className="text-sm font-medium text-gray-900">Suporte</span>
                    </button>
                    <button className="p-4 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow text-center">
                      <ChatBubbleLeftRightIcon className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                      <span className="text-sm font-medium text-gray-900">Comunicados</span>
                    </button>
                    <button className="p-4 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow text-center">
                      <Cog6ToothIcon className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                      <span className="text-sm font-medium text-gray-900">Sistema</span>
                    </button>
                  </>
                )}

                {user?.role === 'MORADOR' && (
                  <>
                    <button className="p-4 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow text-center">
                      <CurrencyEuroIcon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                      <span className="text-sm font-medium text-gray-900">Ver Fatura</span>
                    </button>
                    <button className="p-4 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow text-center">
                      <ChatBubbleLeftRightIcon className="h-8 w-8 text-green-600 mx-auto mb-2" />
                      <span className="text-sm font-medium text-gray-900">Mensagens</span>
                    </button>
                    <button className="p-4 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow text-center">
                      <ExclamationTriangleIcon className="h-8 w-8 text-red-600 mx-auto mb-2" />
                      <span className="text-sm font-medium text-gray-900">Reportar Problema</span>
                    </button>
                    <button className="p-4 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow text-center">
                      <ShoppingBagIcon className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                      <span className="text-sm font-medium text-gray-900">Marketplace</span>
                    </button>
                    <button className="p-4 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow text-center">
                      <ClockIcon className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                      <span className="text-sm font-medium text-gray-900">Eventos</span>
                    </button>
                    <button className="p-4 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow text-center">
                      <Cog6ToothIcon className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                      <span className="text-sm font-medium text-gray-900">Meu Perfil</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </main>
        )}

        {/* Other Tab Contents */}
        {activeTab !== 'dashboard' && (
          <main className="p-6">
            <div className="card text-center py-12">
              <div className="text-gray-400 mb-4">
                <Cog6ToothIcon className="h-16 w-16 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {activeTab === 'financial' && 'Gestão Financeira'}
                {activeTab === 'communication' && 'Sistema de Comunicação'}
                {activeTab === 'marketplace' && 'Marketplace Interno'}
                {activeTab === 'residents' && 'Gestão de Moradores'}
                {activeTab === 'settings' && 'Configurações do Sistema'}
              </h3>
              <p className="text-gray-500 mb-6">
                Esta funcionalidade está em desenvolvimento e será implementada em breve.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
                <p className="text-sm text-blue-700">
                  <strong>🚀 Em Desenvolvimento:</strong><br />
                  Esta seção faz parte do roadmap de desenvolvimento e será implementada nas próximas sprints.
                </p>
              </div>
            </div>
          </main>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;