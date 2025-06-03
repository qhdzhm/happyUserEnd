import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, ListGroup, Badge, Spinner } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './User.css';
import { getAgentCredit, updatePassword } from '../../services/agentService';
import { FaKey, FaLock } from 'react-icons/fa';

const AgentCenter = () => {
  const { user, userType } = useSelector(state => state.auth);
  const [agentInfo, setAgentInfo] = useState({
    id: '',
    username: '',
    companyName: '',
    contactPerson: '',
    phone: '',
    email: '',
    discountRate: 0,
    status: 1
  });
  const [creditInfo, setCreditInfo] = useState({
    totalCredit: 0,
    availableCredit: 0,
    usedCredit: 0,
    isFrozen: false
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    orderCount: 0,
    totalSales: 0,
    savedAmount: 0
  });

  // Add password change state
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState(null);
  const [passwordSuccess, setPasswordSuccess] = useState(null);

  // Fetch agent information from the server
  useEffect(() => {
    const fetchAgentInfo = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Get the token from localStorage
        const token = localStorage.getItem('token');
        
        if (!token) {
          setError('未登录或会话已过期，请重新登录');
          setIsLoading(false);
          return;
        }
        
        // Fetch agent profile data
        const response = await axios.get('/api/agent/profile', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.data.code === 1) {
          const profileData = response.data.data;
          // 确保所有必要字段都有值
          setAgentInfo({
            id: profileData.id,
            username: profileData.username || '',
            companyName: profileData.companyName || '',
            contactPerson: profileData.contactPerson || '',
            phone: profileData.phone || '',
            email: profileData.email || '',
            discountRate: profileData.discountRate || 0,
            status: profileData.status || 1
          });
          
          // 获取信用额度信息
          try {
            const creditResponse = await getAgentCredit();
            if (creditResponse && creditResponse.code === 1) {
              setCreditInfo(creditResponse.data);
            }
          } catch (creditErr) {
            console.error('获取信用额度信息失败:', creditErr);
          }
          
          // Also fetch agent statistics
          const statsResponse = await axios.get('/api/agent/statistics', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (statsResponse.data.code === 1) {
            setStats(statsResponse.data.data);
          }
        } else {
          setError(response.data.msg || '获取代理商信息失败');
        }
      } catch (err) {
        console.error('Error fetching agent info:', err);
        setError('获取代理商信息时出错: ' + (err.response?.data?.msg || err.message));
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAgentInfo();
  }, []);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setAgentInfo({
      ...agentInfo,
      [name]: value
    });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      
      // Get the token from localStorage
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('未登录或会话已过期，请重新登录');
        setIsLoading(false);
        return;
      }
      
      // 确保包含ID和其他必要字段
      const updateData = {
        ...agentInfo,
        // 确保以下字段存在
        id: agentInfo.id,          // 必须包含ID
        username: agentInfo.username,  // 保留用户名
        status: agentInfo.status,      // 保留状态
        discountRate: agentInfo.discountRate,  // 保留折扣率
        email: agentInfo.email     // 确保包含邮箱
      };
      
      console.log('提交更新的代理商信息:', updateData);
      
      // Submit updated profile data
      const response = await axios.put('/api/agent/profile', updateData, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data.code === 1) {
        toast.success('代理商信息更新成功');
        setIsEditing(false);
      } else {
        setError(response.data.msg || '更新代理商信息失败');
      }
    } catch (err) {
      console.error('Error updating agent info:', err);
      setError('更新代理商信息时出错: ' + (err.response?.data?.msg || err.message));
    } finally {
      setIsLoading(false);
    }
  };

  // Cancel editing
  const handleCancel = () => {
    // Fetch the original data again
    setIsEditing(false);
    // Could refetch the data here to reset form, but for simplicity we're just toggling edit mode
  };

  // Handle password form input changes
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData({
      ...passwordData,
      [name]: value
    });
  };

  // Handle password form submission
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    // Form validation
    if (!passwordData.oldPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setPasswordError('请填写所有密码字段');
      return;
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('新密码和确认密码不匹配');
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      setPasswordError('新密码长度不能少于6位');
      return;
    }
    
    setPasswordLoading(true);
    setPasswordError(null);
    setPasswordSuccess(null);
    
    try {
      // Call API to change password
      const response = await updatePassword({
        oldPassword: passwordData.oldPassword,
        newPassword: passwordData.newPassword
      });
      
      if (response && response.code === 1) {
        setPasswordSuccess('密码修改成功');
        setPasswordData({
          oldPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        toast.success('密码修改成功');
      } else {
        setPasswordError(response?.msg || '密码修改失败');
      }
    } catch (err) {
      console.error('修改密码失败:', err);
      setPasswordError(err.response?.data?.msg || err.message || '修改密码失败，请稍后再试');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <Container className="py-5">
      <h2 className="mb-4">代理商中心</h2>
      
      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}
      
      <Row>
        {/* Agent profile information */}
        <Col lg={8}>
          <Card className="mb-4 shadow-sm">
            <Card.Header className="bg-primary text-white">
              <h5 className="mb-0">代理商账户信息</h5>
            </Card.Header>
            <Card.Body>
              {isLoading ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">加载中...</span>
                  </div>
                  <p className="mt-2">正在加载数据...</p>
                </div>
              ) : (
                <Form onSubmit={handleSubmit}>
                  <input type="hidden" name="id" value={agentInfo.id || ''} />
                  
                  <Row>
                    <Form.Group as={Col} md={6} className="mb-3">
                      <Form.Label>用户名</Form.Label>
                      <Form.Control
                        type="text"
                        name="username"
                        value={agentInfo.username}
                        disabled
                      />
                      <Form.Text className="text-muted">
                        用户名不可修改
                      </Form.Text>
                    </Form.Group>
                    
                    <Form.Group as={Col} md={6} className="mb-3">
                      <Form.Label>公司名称</Form.Label>
                      <Form.Control
                        type="text"
                        name="companyName"
                        value={agentInfo.companyName || ''}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                      />
                    </Form.Group>
                  </Row>
                  
                  <Row>
                    <Form.Group as={Col} md={6} className="mb-3">
                      <Form.Label>联系人</Form.Label>
                      <Form.Control
                        type="text"
                        name="contactPerson"
                        value={agentInfo.contactPerson || ''}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                      />
                    </Form.Group>
                    
                    <Form.Group as={Col} md={6} className="mb-3">
                      <Form.Label>电话</Form.Label>
                      <Form.Control
                        type="text"
                        name="phone"
                        value={agentInfo.phone || ''}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                      />
                    </Form.Group>
                  </Row>
                  
                  <Row>
                    <Form.Group as={Col} md={6} className="mb-3">
                      <Form.Label>邮箱</Form.Label>
                      <Form.Control
                        type="email"
                        name="email"
                        value={agentInfo.email || ''}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                      />
                      <Form.Text className="text-muted">
                        您可以修改邮箱地址
                      </Form.Text>
                    </Form.Group>
                    
                    <Form.Group as={Col} md={6} className="mb-3">
                      <Form.Label>折扣率</Form.Label>
                      <Form.Control
                        type="text"
                        value={`${(agentInfo.discountRate * 100).toFixed(0)}%`}
                        disabled
                      />
                      <Form.Text className="text-muted">
                        折扣率由系统设置，不可修改
                      </Form.Text>
                    </Form.Group>
                  </Row>
                  
                  <div className="d-flex justify-content-end mt-3">
                    {isEditing ? (
                      <>
                        <Button 
                          variant="outline-secondary" 
                          className="me-2"
                          onClick={handleCancel}
                        >
                          取消
                        </Button>
                        <Button 
                          variant="primary" 
                          type="submit"
                          disabled={isLoading}
                        >
                          {isLoading ? '保存中...' : '保存'}
                        </Button>
                      </>
                    ) : (
                      <Button 
                        variant="primary" 
                        onClick={() => setIsEditing(true)}
                      >
                        编辑
                      </Button>
                    )}
                  </div>
                  
                  {/* 开发模式调试信息 */}
                  {process.env.NODE_ENV === 'development' && (
                    <div className="mt-4 p-2 border rounded bg-light small">
                      <p className="mb-1 fw-bold">调试信息（仅开发环境可见）:</p>
                      <pre className="mb-0" style={{fontSize: '10px'}}>
                        {JSON.stringify({
                          id: agentInfo.id, 
                          username: agentInfo.username, 
                          email: agentInfo.email,
                          phone: agentInfo.phone,
                          contactPerson: agentInfo.contactPerson,
                          companyName: agentInfo.companyName,
                          status: agentInfo.status,
                          discountRate: agentInfo.discountRate
                        }, null, 2)}
                      </pre>
                    </div>
                  )}
                </Form>
              )}
            </Card.Body>
          </Card>

          {/* Password Change Form */}
          <Card className="mb-4 shadow-sm">
            <Card.Header className="bg-primary text-white">
              <h5 className="mb-0"><FaKey className="me-2" />修改密码</h5>
            </Card.Header>
            <Card.Body>
              {passwordError && (
                <Alert variant="danger">{passwordError}</Alert>
              )}
              
              {passwordSuccess && (
                <Alert variant="success">{passwordSuccess}</Alert>
              )}
              
              <Form onSubmit={handlePasswordSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>当前密码</Form.Label>
                  <Form.Control
                    type="password"
                    name="oldPassword"
                    value={passwordData.oldPassword}
                    onChange={handlePasswordChange}
                    placeholder="请输入当前密码"
                    required
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>新密码</Form.Label>
                  <Form.Control
                    type="password"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    placeholder="请输入新密码 (至少6位)"
                    required
                    minLength={6}
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>确认新密码</Form.Label>
                  <Form.Control
                    type="password"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    placeholder="请再次输入新密码"
                    required
                    minLength={6}
                  />
                </Form.Group>
                
                <div className="text-end">
                  <Button 
                    variant="primary" 
                    type="submit" 
                    disabled={passwordLoading}
                  >
                    {passwordLoading ? (
                      <>
                        <Spinner as="span" animation="border" size="sm" className="me-2" />
                        处理中...
                      </>
                    ) : '修改密码'}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
        
        {/* Agent statistics */}
        <Col lg={4}>
          <Card className="mb-4 shadow-sm">
            <Card.Header className="bg-primary text-white">
              <h5 className="mb-0">代理商数据统计</h5>
            </Card.Header>
            <Card.Body>
              {isLoading ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">加载中...</span>
                  </div>
                </div>
              ) : (
                <ListGroup variant="flush">
                  <ListGroup.Item className="d-flex justify-content-between align-items-center">
                    <span>订单总数</span>
                    <Badge bg="primary" pill>{stats.orderCount}</Badge>
                  </ListGroup.Item>
                  <ListGroup.Item className="d-flex justify-content-between align-items-center">
                    <span>总交易金额</span>
                    <span className="text-primary fw-bold">¥{stats.totalSales?.toFixed(2) || '0.00'}</span>
                  </ListGroup.Item>
                  <ListGroup.Item className="d-flex justify-content-between align-items-center">
                    <span>折扣优惠总额</span>
                    <span className="text-success fw-bold">¥{stats.savedAmount?.toFixed(2) || '0.00'}</span>
                  </ListGroup.Item>
                  <ListGroup.Item className="d-flex justify-content-between align-items-center">
                    <span>当前折扣率</span>
                    <span className="badge bg-success">{(agentInfo.discountRate * 100).toFixed(0)}% OFF</span>
                  </ListGroup.Item>
                  <ListGroup.Item className="d-flex justify-content-between align-items-center">
                    <span>可用信用额度</span>
                    <span className="text-primary fw-bold">¥{creditInfo.availableCredit?.toFixed(2) || '0.00'}</span>
                  </ListGroup.Item>
                </ListGroup>
              )}
            </Card.Body>
          </Card>
          
          <Card className="shadow-sm mb-4">
            <Card.Header className="bg-primary text-white">
              <h5 className="mb-0">账户状态</h5>
            </Card.Header>
            <Card.Body>
              <div className="d-flex align-items-center mb-3">
                <div className={`status-indicator ${agentInfo.status === 1 ? 'active' : 'inactive'} me-2`}></div>
                <span className="fw-bold">{agentInfo.status === 1 ? '账户正常' : '账户已禁用'}</span>
              </div>
              <p className="text-muted small mb-0">
                {agentInfo.status === 1 
                  ? '您的账户状态正常，可以正常使用所有功能。' 
                  : '您的账户目前已被禁用，请联系管理员。'}
              </p>
            </Card.Body>
          </Card>
          
          {/* 添加信用额度状态卡片 */}
          <Card className="shadow-sm">
            <Card.Header className="bg-info text-white">
              <h5 className="mb-0">信用额度状态</h5>
            </Card.Header>
            <Card.Body>
              <div className="d-flex align-items-center mb-3">
                <div className={`status-indicator ${!creditInfo.isFrozen ? 'active' : 'inactive'} me-2`}></div>
                <span className="fw-bold">
                  {!creditInfo.isFrozen ? '信用额度正常' : '信用额度已冻结'}
                </span>
              </div>
              <p className="text-muted small mb-0">
                {!creditInfo.isFrozen 
                  ? '您的信用额度状态正常，可以正常使用信用额度支付订单。' 
                  : '您的信用额度已被冻结，暂时无法使用信用额度支付，请联系客服。'}
              </p>
              
              <div className="mt-3">
                <div className="d-flex justify-content-between">
                  <span className="small text-muted">总额度:</span>
                  <span className="fw-bold">¥{creditInfo.totalCredit?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="d-flex justify-content-between">
                  <span className="small text-muted">已用额度:</span>
                  <span className="fw-bold">¥{creditInfo.usedCredit?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="d-flex justify-content-between">
                  <span className="small text-muted">可用额度:</span>
                  <span className="fw-bold text-success">¥{creditInfo.availableCredit?.toFixed(2) || '0.00'}</span>
                </div>
              </div>
              
              {creditInfo.isFrozen && (
                <Alert variant="warning" className="mt-3 mb-0 py-2 small">
                  <strong>警告:</strong> 信用额度已冻结，无法使用信用额度支付。请联系客服了解详情。
                </Alert>
              )}
              
              <div className="d-flex justify-content-end mt-3">
                <Link to="/credit-transactions" className="btn btn-sm btn-outline-primary">
                  查看交易记录 &raquo;
                </Link>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default AgentCenter; 