import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { authService } from '../services/authService';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: User, rememberMe: boolean) => void;
  logout: () => void;
  updateCurrentUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken =
        localStorage.getItem('finpay_token') || sessionStorage.getItem('finpay_token');

      if (storedToken) {
        setToken(storedToken);
        try {
          const profile = await authService.getMe();
          setUser(profile);
        } catch {
          localStorage.removeItem('finpay_token');
          sessionStorage.removeItem('finpay_token');
          localStorage.removeItem('finpay_user');
          sessionStorage.removeItem('finpay_user');
          setUser(null);
          setToken(null);
        }
      }
      setIsLoading(false);
    };

    initializeAuth();

    // Listen for unauthorized events from axios interceptor
    const handleUnauthorized = () => {
      setUser(null);
      setToken(null);
    };
    window.addEventListener('finpay_auth_unauthorized', handleUnauthorized);
    return () => window.removeEventListener('finpay_auth_unauthorized', handleUnauthorized);
  }, []);

  const login = (newToken: string, newUser: User, rememberMe: boolean) => {
    setToken(newToken);
    setUser(newUser);
    if (rememberMe) {
      localStorage.setItem('finpay_token', newToken);
      localStorage.setItem('finpay_user', JSON.stringify(newUser));
      sessionStorage.removeItem('finpay_token');
      sessionStorage.removeItem('finpay_user');
    } else {
      sessionStorage.setItem('finpay_token', newToken);
      sessionStorage.setItem('finpay_user', JSON.stringify(newUser));
      localStorage.removeItem('finpay_token');
      localStorage.removeItem('finpay_user');
    }
  };

  const logout = () => {
    localStorage.removeItem('finpay_token');
    sessionStorage.removeItem('finpay_token');
    localStorage.removeItem('finpay_user');
    sessionStorage.removeItem('finpay_user');
    setUser(null);
    setToken(null);
  };

  const updateCurrentUser = (updatedUser: User) => {
    setUser(updatedUser);
    if (localStorage.getItem('finpay_token')) {
      localStorage.setItem('finpay_user', JSON.stringify(updatedUser));
    } else if (sessionStorage.getItem('finpay_token')) {
      sessionStorage.setItem('finpay_user', JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        logout,
        updateCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
