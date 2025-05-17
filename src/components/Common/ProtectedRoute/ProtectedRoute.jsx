import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Spinner, Alert } from 'react-bootstrap';

/**
 * 受保护的路由组件
 * 用于需要用户登录才能访问的页面
 * 如果用户未登录，将重定向到登录页面
 * 
 * @param {Object} props 组件参数
 * @param {React.ReactNode} props.children 子组件
 * @param {string[]} [props.requiredRoles] 需要的角色数组 ['admin', 'agent']
 * @param {boolean} [props.checkToken=true] 是否检查token
 * @param {boolean} [props.agentRedirect=false] 是否将代理商重定向到代理商中心
 */
const ProtectedRoute = ({ 
  children, 
  requiredRoles = [], 
  checkToken = true,
  agentRedirect = false
}) => {
  const location = useLocation();
  const { isAuthenticated, loading, user } = useSelector(state => state.auth);
  const [showRedirectMessage, setShowRedirectMessage] = useState(false);
  
  // 从localStorage获取token
  const token = localStorage.getItem('token');
  const userType = localStorage.getItem('userType') || 'regular';
  
  // 检查用户权限
  const checkUserPermission = () => {
    if (requiredRoles.length === 0) return true;
    
    const userRole = userType === 'agent' ? 'agent' : 'user';
    return requiredRoles.includes(userRole);
  };
  
  // 确定是否需要重定向到代理商中心
  const shouldRedirectToAgentCenter = 
    agentRedirect && 
    userType === 'agent' && 
    location.pathname === '/profile';
  
  // 只在初始挂载时检查是否需要显示重定向消息
  useEffect(() => {
    if (shouldRedirectToAgentCenter) {
      setShowRedirectMessage(true);
      
      // 短暂延迟后隐藏消息 - 实际重定向会在render中通过Navigate组件处理
      const timer = setTimeout(() => {
        setShowRedirectMessage(false);
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, []);  // 空依赖数组，确保只在组件挂载时执行一次
  
  // 如果加载中，显示加载指示器
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}>
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }
  
  // 如果不需要检查token，直接渲染子组件
  if (!checkToken) {
    return children;
  }
  
  // 检查是否已登录
  const isAuthorized = isAuthenticated || token;
  
  if (!isAuthorized) {
    // 如果用户未登录，重定向到登录页面，并记录当前尝试访问的URL
    return <Navigate to="/login" state={{ 
      from: location.pathname, 
      message: '您需要登录才能访问此页面' 
    }} replace />;
  }
  
  // 检查用户角色权限
  if (!checkUserPermission()) {
    return <Navigate to="/" state={{ 
      message: '您没有权限访问此页面' 
    }} replace />;
  }
  
  // 如果需要重定向到代理商中心
  if (shouldRedirectToAgentCenter) {
    // 如果正在显示重定向消息
    if (showRedirectMessage) {
      return (
        <div className="container mt-4">
          <Alert variant="info" className="d-flex align-items-center">
            <span>正在将您重定向到代理商中心</span>
            <Spinner animation="border" size="sm" className="ms-2" />
          </Alert>
        </div>
      );
    }
    
    // 消息显示完毕后进行实际重定向
    return <Navigate to="/agent-center" replace />;
  }
  
  // 如果用户已登录且有权限，正常显示子组件
  return children;
};

export default ProtectedRoute; 