import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser, clearError } from '../../store/slices/authSlice';
import './Auth.css';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [passwordError, setPasswordError] = useState('');
  
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { loading, error, isAuthenticated } = useSelector(state => state.auth);
  
  // 获取用户尝试访问的页面路径，如果没有则默认为首页
  const from = location.state?.from || '/';
  // 获取重定向消息
  const redirectMessage = location.state?.message || '';
  
  // 当认证状态改变时，重定向到之前的页面
  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);
  
  // 组件卸载时清除错误
  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');
    
    // 验证密码是否匹配
    if (formData.password !== formData.confirmPassword) {
      setPasswordError('两次输入的密码不匹配');
      return;
    }
    
    // 提交注册信息，不包含确认密码字段
    const { confirmPassword, ...registerData } = formData;
    dispatch(registerUser(registerData));
  };
  
  return (
    <div className="auth-container">
      <div className="auth-form-container">
        <h2>注册</h2>
        {error && <div className="auth-error">{error}</div>}
        {passwordError && <div className="auth-error">{passwordError}</div>}
        {redirectMessage && <div className="auth-message">{redirectMessage}</div>}
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="name">姓名</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="email">邮箱</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">密码</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength="6"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="confirmPassword">确认密码</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              minLength="6"
            />
          </div>
          
          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? '注册中...' : '注册'}
          </button>
        </form>
        
        <div className="auth-links">
          <p>
            已有账号？ <Link to="/login" state={location.state}>立即登录</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register; 