import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

// ✅ Use environment variable for base API URL
const API_URL = `${import.meta.env.VITE_API_BASE_URL}/api`;

// Set default axios configuration
axios.defaults.baseURL = API_URL;
axios.defaults.timeout = 10000;

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  walletBalance: number;
  demoPlayed: boolean;
}

interface Admin {
  id: string;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  admin: Admin | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, phone: string, password: string) => Promise<void>;
  adminLogin: (email: string, password: string) => Promise<void>;
  logout: () => void;
  adminLogout: () => void;
  updateUser: (userData: Partial<User>) => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        const adminToken = localStorage.getItem('adminToken');
        
        if (token) {
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          try {
            const response = await axios.get('/auth/profile');
            setUser(response.data);
          } catch (error) {
            console.error('Token verification failed:', error);
            localStorage.removeItem('token');
            delete axios.defaults.headers.common['Authorization'];
          }
        } else if (adminToken) {
          axios.defaults.headers.common['Authorization'] = `Bearer ${adminToken}`;
          const adminData = localStorage.getItem('adminData');
          if (adminData) {
            try {
              setAdmin(JSON.parse(adminData));
            } catch (error) {
              console.error('Invalid admin data in localStorage:', error);
              localStorage.removeItem('adminData');
              localStorage.removeItem('adminToken');
              delete axios.defaults.headers.common['Authorization'];
            }
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await axios.post('/auth/login', { email, password });
      const { token, user: userData } = response.data;
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminData');
      setAdmin(null);
      setUser(userData);
    } catch (error: any) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (name: string, email: string, phone: string, password: string) => {
    try {
      const response = await axios.post('/auth/register', { name, email, phone, password });
      const { token, user: userData } = response.data;
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(userData);
    } catch (error: any) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const adminLogin = async (email: string, password: string) => {
    try {
      const response = await axios.post('/auth/admin/login', { email, password });
      const { token, admin: adminData } = response.data;
      localStorage.setItem('adminToken', token);
      localStorage.setItem('adminData', JSON.stringify(adminData));
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.removeItem('token');
      setUser(null);
      setAdmin(adminData);
    } catch (error: any) {
      console.error('Admin login error:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const adminLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminData');
    delete axios.defaults.headers.common['Authorization'];
    setAdmin(null);
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...userData });
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      admin,
      login,
      register,
      adminLogin,
      logout,
      adminLogout,
      updateUser,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  );
};