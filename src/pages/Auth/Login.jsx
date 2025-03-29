import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, clearError } from '../../store/slices/authSlice';
import { Alert, Spinner, Button, Form, Tabs, Tab } from 'react-bootstrap';
import './Auth.css';

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    userType: 'regular' // 默认为普通用户
  });
  
  const [userType, setUserType] = useState('regular'); // 用户类型：regular 或 agent
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
  
  const handleUserTypeChange = (key) => {
    setUserType(key);
    setFormData(prev => ({
      ...prev,
      userType: key,
      username: '' // 切换类型时清空用户名，避免错误登录
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 验证表单
    if (!formData.username.trim()) {
      // 针对不同用户类型显示不同提示
      const fieldName = userType === 'agent' ? '代理账号' : '用户名';
      dispatch({ 
        type: 'auth/loginUser/rejected', 
        payload: `请输入${fieldName}` 
      });
      return;
    }
    
    if (!formData.password) {
      dispatch({ 
        type: 'auth/loginUser/rejected', 
        payload: '请输入密码' 
      });
      return;
    }
    
    // 确保用户类型正确
    const loginData = {
      username: formData.username,
      password: formData.password,
      userType // 使用当前选择的用户类型
    };
    
    // 分发登录action
    dispatch(loginUser(loginData));
  };
  
  // 自动填充测试账号
  const fillTestAccount = (type) => {
    if (type === 'regular') {
      setFormData({
        username: 'user1',
        password: '123456',
        userType: 'regular'
      });
    } else if (type === 'agent') {
      setFormData({
        username: 'agent1',
        password: '123456',
        userType: 'agent'
      });
    }
  };
  
  return (
    <div className="auth-container">
      <div className="auth-form-container">
        <h2>登录</h2>
        
        {error && (
          <Alert variant="danger">
            {error}
          </Alert>
        )}
        
        {redirectMessage && (
          <Alert variant="info">
            {redirectMessage}
          </Alert>
        )}
        
        <Tabs
          activeKey={userType}
          onSelect={handleUserTypeChange}
          className="mb-3 user-type-tabs"
          fill
        >
          <Tab eventKey="regular" title="普通用户">
            <div className="auth-message mb-3">
              <strong>测试账号：</strong> user1<br />
              <strong>测试密码：</strong> 123456
              <Button 
                variant="outline-primary"
                size="sm"
                className="ms-2" 
                onClick={() => fillTestAccount('regular')}
              >
                自动填充
              </Button>
            </div>
          </Tab>
          <Tab eventKey="agent" title="旅行社代理">
            <div className="auth-message mb-3">
              <strong>测试账号：</strong> agent1<br />
              <strong>测试密码：</strong> 123456
              <Button 
                variant="outline-primary"
                size="sm"
                className="ms-2" 
                onClick={() => fillTestAccount('agent')}
              >
                自动填充
              </Button>
            </div>
          </Tab>
        </Tabs>
        
        <Form onSubmit={handleSubmit} className="auth-form">
          <Form.Group className="mb-3">
            <Form.Label>{userType === 'agent' ? '代理账号' : '用户名'}</Form.Label>
            <Form.Control
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              placeholder={userType === 'agent' ? "输入代理账号" : "输入用户名"}
              className={userType === 'agent' ? 'agent-input' : ''}
            />
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label>密码</Form.Label>
            <Form.Control
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="输入密码"
            />
          </Form.Group>
          
          <Button 
            type="submit" 
            variant={userType === 'agent' ? 'success' : 'primary'} 
            className="w-100" 
            disabled={loading}
          >
            {loading ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                />{' '}
                登录中...
              </>
            ) : userType === 'agent' ? '代理商登录' : '用户登录'}
          </Button>
        </Form>
        
        <div className="auth-links mt-3">
          {userType === 'regular' && (
            <p>
              还没有账号？ <Link to="/register" state={location.state}>立即注册</Link>
            </p>
          )}
          {userType === 'agent' && (
            <p>
              需要成为代理商？ <Link to="/contact-us" state={{ subject: '代理商合作申请' }}>联系我们</Link>
            </p>
          )}
          <p>
            <Link to="/forgot-password">忘记密码？</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login; 