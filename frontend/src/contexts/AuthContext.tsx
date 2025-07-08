import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'SINDICO' | 'MORADOR' | 'PROFISSIONAL' | 'ADMIN';
  buildingId?: string;
  apartmentNumber?: string;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (userData: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Verificar se há um usuário logado no localStorage
    const checkAuth = () => {
      try {
        const token = localStorage.getItem('authToken');
        const userData = localStorage.getItem('userData');
        
        if (token && userData) {
          setUser(JSON.parse(userData));
        }
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    
    try {
      // Simular login para demo
      // Em produção, fazer chamada real para API
      
      // Credenciais de demo
      const demoUsers = {
        'sindico@demo.com': {
          id: '1',
          email: 'sindico@demo.com',
          name: 'João Silva',
          role: 'SINDICO' as const,
          buildingId: 'building-1',
          emailVerified: true,
          twoFactorEnabled: false,
        },
        'morador@demo.com': {
          id: '2',
          email: 'morador@demo.com',
          name: 'Maria Santos',
          role: 'MORADOR' as const,
          buildingId: 'building-1',
          apartmentNumber: '2A',
          emailVerified: true,
          twoFactorEnabled: false,
        },
        'admin@demo.com': {
          id: '3',
          email: 'admin@demo.com',
          name: 'Admin Sistema',
          role: 'ADMIN' as const,
          emailVerified: true,
          twoFactorEnabled: true,
        },
      };

      // Simular delay de rede
      await new Promise(resolve => setTimeout(resolve, 1000));

      const demoUser = demoUsers[email as keyof typeof demoUsers];
      
      if (demoUser && password === 'demo123') {
        const token = 'demo-jwt-token-' + Date.now();
        
        localStorage.setItem('authToken', token);
        localStorage.setItem('userData', JSON.stringify(demoUser));
        
        setUser(demoUser);
      } else {
        throw new Error('Credenciais inválidas');
      }
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: any): Promise<void> => {
    setIsLoading(true);
    
    try {
      // Simular registro para demo
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const newUser: User = {
        id: 'new-user-' + Date.now(),
        email: userData.email,
        name: userData.name,
        role: userData.role || 'MORADOR',
        buildingId: userData.buildingId,
        apartmentNumber: userData.apartmentNumber,
        emailVerified: false,
        twoFactorEnabled: false,
      };

      const token = 'demo-jwt-token-' + Date.now();
      
      localStorage.setItem('authToken', token);
      localStorage.setItem('userData', JSON.stringify(newUser));
      
      setUser(newUser);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    register,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};