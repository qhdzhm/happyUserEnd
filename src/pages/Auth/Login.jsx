import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, clearError } from '../../store/slices/authSlice';
import { Alert, Spinner, Button, Form, Tabs, Tab } from 'react-bootstrap';
import WechatLogin from '../../components/WechatLogin';
import { toast } from 'react-toastify';
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
  // 获取从详情页传递的旅游详情数据
  const tourDetails = location.state?.tourDetails || null;
  
  // 当认证状态改变时，重定向到之前的页面
  useEffect(() => {
    if (isAuthenticated) {
      // 判断是否有旅游详情数据需要传递
      if (tourDetails) {
        // 将详情页的数据传递给预订页面
        navigate(from, { 
          replace: true,
          state: {
            ...tourDetails,
            // 保留其他可能的状态数据
            ...(location.state && location.state !== tourDetails ? 
               Object.entries(location.state)
                .filter(([key]) => key !== 'from' && key !== 'message' && key !== 'tourDetails')
                .reduce((obj, [key, val]) => ({ ...obj, [key]: val }), {}) 
               : {})
          } 
        });
      } else {
        navigate(from, { replace: true });
      }
    }
  }, [isAuthenticated, navigate, from, tourDetails, location.state]);
  
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
      toast.error(`请输入${fieldName}`);
      return;
    }
    
    if (!formData.password) {
      dispatch({ 
        type: 'auth/loginUser/rejected', 
        payload: '请输入密码' 
      });
      toast.error('请输入密码');
      return;
    }
    
    try {
      // 确保用户类型正确
      const loginData = {
        username: formData.username,
        password: formData.password,
        userType // 使用当前选择的用户类型
      };
      
      // 分发登录action
      await dispatch(loginUser(loginData)).unwrap();
    } catch (error) {
      // 错误会被authSlice中的rejected处理器捕获并显示
      console.error('登录错误:', error);
      
      // 根据错误类型显示更友好的提示
      if (error.includes('密码错误') || error.includes('账号或密码错误') || error.includes('用户名或密码错误')) {
        toast.error('账号或密码错误，请重新输入', { 
          position: "top-center",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true
        });
      } else if (error.includes('不存在')) {
        toast.error('用户账号不存在，请检查输入或注册新账号');
      } else if (error.includes('服务器')) {
        toast.error('服务器连接异常，请稍后再试');
      } else {
        toast.error('登录失败，请检查您的输入或联系客服');
      }
    }
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
    } else if (type === 'operator') {
      setFormData({
        username: 'operator1',
        password: '123456',
        userType: 'agent'  // 操作员使用agent登录接口
      });
    }
  };
  
  // 处理登录成功后的回调
  const handleLoginSuccess = () => {
    // 登录成功后的处理逻辑已经在useEffect中实现
  };
  
  return (
    <div className="auth-container">
      <div className="auth-form-container">
        <h2>登录</h2>
        
        {/* 显示明显的密码错误提示 */}
        {error && (
          <div className="login-error" style={{
            padding: '10px',
            backgroundColor: '#ffebee',
            color: '#d32f2f',
            border: '1px solid #f44336',
            borderRadius: '4px',
            marginBottom: '15px',
            fontSize: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <strong>登录失败：</strong> {error}
          </div>
        )}
        
        {error && (
          <Alert variant="danger">
            <strong>登录失败：</strong> {error}
            {error.includes('密码错误') && (
              <div className="mt-2 small">
                <strong>提示：</strong> 如果您最近修改过密码，请使用新密码登录。如果您忘记了密码，请联系客服重置。
              </div>
            )}
            {error.includes('账号或密码错误') && (
              <div className="mt-2 small">
                <strong>提示：</strong> 请检查您的输入是否正确。如果您忘记了密码，可以点击下方的"忘记密码"链接。
              </div>
            )}
            {error.includes('用户名或密码错误') && (
              <div className="mt-2 small">
                <strong>提示：</strong> 请检查您的用户名和密码是否正确。如果您正在使用已修改的密码，请确保使用最新密码。
              </div>
            )}
            {error.includes('登录失败') && !error.includes('密码错误') && !error.includes('账号或密码错误') && !error.includes('用户名或密码错误') && (
              <div className="mt-2 small">
                <strong>提示：</strong> 登录失败可能是由于用户名或密码错误，或者账号状态异常。如需帮助，请联系客服。
              </div>
            )}
            {error.includes('服务器') && (
              <div className="mt-2 small">
                <strong>提示：</strong> 服务器连接异常，请稍后再试或联系客服。
              </div>
            )}
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
              <strong>代理商主账号：</strong> agent1 / 123456<br />
              <strong>操作员账号：</strong> operator1 / 123456<br />
              <small className="text-muted">
                操作员登录后看到原价，但享受代理商折扣
              </small>
              <Button 
                variant="outline-primary"
                size="sm"
                className="ms-2" 
                onClick={() => fillTestAccount('agent')}
              >
                自动填充代理商
              </Button>
              <Button 
                variant="outline-secondary"
                size="sm"
                className="ms-2" 
                onClick={() => fillTestAccount('operator')}
              >
                自动填充操作员
              </Button>
            </div>
          </Tab>
        </Tabs>
        
        <Form onSubmit={handleSubmit} className="auth-form">
          <Form.Group className="mb-3">
            <Form.Label>{userType === 'agent' ? '代理账号' : userType === 'operator' ? '操作员账号' : '用户名'}</Form.Label>
            <Form.Control
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              placeholder={userType === 'agent' ? "输入代理账号" : userType === 'operator' ? "输入操作员账号" : "输入用户名"}
              className={userType === 'agent' ? 'agent-input' : userType === 'operator' ? 'operator-input' : ''}
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
            variant={userType === 'agent' ? 'success' : userType === 'operator' ? 'secondary' : 'primary'} 
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
            ) : userType === 'agent' ? '代理商登录' : userType === 'operator' ? '操作员登录' : '用户登录'}
          </Button>
          
          {userType === 'regular' && (
            <div className="wechat-login-container mt-3">
              <div className="divider">
                <span>或</span>
              </div>
              <WechatLogin onLoginSuccess={handleLoginSuccess} />
            </div>
          )}
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