import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

// Set default axios configuration
axios.defaults.baseURL = API_URL;
axios.defaults.timeout = 10000;

interface User {
  id: string;
  name: string;
  email: string;
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
  register: (name: string, email: string, password: string) => Promise<void>;
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
          // Set authorization header
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          try {
            // Verify token and get user data
            const response = await axios.get('/auth/profile');
            setUser(response.data);
          } catch (error) {
            console.error('Token verification failed:', error);
            // Clear invalid token
            localStorage.removeItem('token');
            delete axios.defaults.headers.common['Authorization'];
          }
        } else if (adminToken) {
          // Set authorization header for admin
          axios.defaults.headers.common['Authorization'] = `Bearer ${adminToken}`;
          
          // Set admin data from localStorage
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
      
      // Store token and set header
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Clear any admin data
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminData');
      setAdmin(null);
      
      setUser(userData);
    } catch (error: any) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      const response = await axios.post('/auth/register', { name, email, password });
      const { token, user: userData } = response.data;
      
      // Store token and set header
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
      console.log('AuthContext: Attempting admin login');
      const response = await axios.post('/auth/admin/login', { email, password });
      const { token, admin: adminData } = response.data;
      
      console.log('AuthContext: Admin login response received', { token: '***', adminData });
      
      // Store admin token and data
      localStorage.setItem('adminToken', token);
      localStorage.setItem('adminData', JSON.stringify(adminData));
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Clear any user data
      localStorage.removeItem('token');
      setUser(null);
      
      setAdmin(adminData);
      console.log('AuthContext: Admin state updated');
    } catch (error: any) {
      console.error('AuthContext: Admin login error:', error);
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
