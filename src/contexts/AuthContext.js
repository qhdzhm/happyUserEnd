import React, { createContext, useState, useEffect } from 'react';
import { login, logout, clearPriceCache } from '../utils/api';

// 创建认证上下文
export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 初始化时从localStorage加载用户状态
  useEffect(() => {
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    const userType = localStorage.getItem('userType');
    const agentId = localStorage.getItem('agentId');
    
    if (token && username) {
      setCurrentUser({
        username,
        userType,
        agentId: agentId ? parseInt(agentId, 10) : null,
        isAuthenticated: true
      });
    }
    
    setLoading(false);
  }, []);

  // 登录方法
  const handleLogin = async (credentials) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await login(credentials);
      
      if (response && response.code === 1 && response.data) {
        setCurrentUser({
          username: response.data.username || credentials.username,
          userType: response.data.userType || 'regular',
          agentId: response.data.agentId ? parseInt(response.data.agentId, 10) : null,
          isAuthenticated: true
        });
        
        // 清空价格缓存，确保获取最新折扣价格
        clearPriceCache();
        
        return true;
      } else {
        setError(response?.msg || '登录失败');
        return false;
      }
    } catch (err) {
      setError(err.message || '登录过程中出现错误');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // 登出方法
  const handleLogout = () => {
    logout();
    setCurrentUser(null);
    
    // 清空价格缓存，确保下一个用户获取正确的价格
    clearPriceCache();
  };

  // 提供全局认证上下文
  const value = {
    currentUser,
    loading,
    error,
    login: handleLogin,
    logout: handleLogout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext; 