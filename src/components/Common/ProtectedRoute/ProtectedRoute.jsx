import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Spinner } from 'react-bootstrap';

/**
 * 受保护的路由组件
 * 用于需要用户登录才能访问的页面
 * 如果用户未登录，将重定向到登录页面
 * 
 * @param {Object} props 组件参数
 * @param {React.ReactNode} props.children 子组件
 * @param {string[]} [props.requiredRoles] 需要的角色数组 ['admin', 'agent']
 * @param {boolean} [props.checkToken=true] 是否检查token
 */
const ProtectedRoute = ({ 
  children, 
  requiredRoles = [], 
  checkToken = true 
}) => {
  const location = useLocation();
  const { isAuthenticated, loading, user } = useSelector(state => state.auth);
  
  // 从localStorage获取token
  const token = localStorage.getItem('token');
  const userType = localStorage.getItem('userType') || 'regular';
  
  // 检查用户权限
  const checkUserPermission = () => {
    if (requiredRoles.length === 0) return true;
    
    const userRole = userType === 'agent' ? 'agent' : 'user';
    return requiredRoles.includes(userRole);
  };
  
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
  
  // 如果用户已登录且有权限，正常显示子组件
  return children;
};

export default ProtectedRoute; 