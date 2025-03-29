import React, { useState, useEffect } from 'react';
import './User.css';

const UserProfile = () => {
  const [userData, setUserData] = useState({
    name: '张三',
    email: 'zhangsan@example.com',
    phone: '13800138000',
    address: '上海市浦东新区',
    avatar: 'https://via.placeholder.com/150'
  });
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: ''
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  
  useEffect(() => {
    // 初始化表单数据
    setFormData({
      name: userData.name,
      phone: userData.phone,
      address: userData.address
    });
  }, [userData]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // 这里应该调用API更新用户信息
      // 模拟更新成功
      setTimeout(() => {
        setUserData(prev => ({
          ...prev,
          ...formData
        }));
        setMessage({ text: '个人资料更新成功', type: 'success' });
        setIsEditing(false);
      }, 1000);
    } catch (err) {
      setMessage({ text: '更新失败，请稍后再试', type: 'error' });
    } finally {
      setLoading(false);
    }
  };
  
  const handleLogout = () => {
    // 清除localStorage中的token
    localStorage.removeItem('token');
    // 刷新页面，让ProtectedRoute组件重定向到登录页面
    window.location.reload();
  };
  
  return (
    <div className="user-profile-container">
      <div className="user-profile-header">
        <h1>个人资料</h1>
        <button className="logout-button" onClick={handleLogout}>
          退出登录
        </button>
      </div>
      
      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}
      
      <div className="user-profile-content">
        <div className="user-avatar-section">
          <img src={userData.avatar} alt="用户头像" className="user-avatar" />
          <button className="change-avatar-button">更换头像</button>
        </div>
        
        <div className="user-info-section">
          {isEditing ? (
            <form onSubmit={handleSubmit} className="user-form">
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
                  value={userData.email}
                  disabled
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="phone">电话</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="address">地址</label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                />
              </div>
              
              <div className="form-actions">
                <button type="submit" className="save-button" disabled={loading}>
                  {loading ? '保存中...' : '保存'}
                </button>
                <button
                  type="button"
                  className="cancel-button"
                  onClick={() => setIsEditing(false)}
                  disabled={loading}
                >
                  取消
                </button>
              </div>
            </form>
          ) : (
            <div className="user-info">
              <div className="info-item">
                <span className="info-label">姓名:</span>
                <span className="info-value">{userData.name}</span>
              </div>
              
              <div className="info-item">
                <span className="info-label">邮箱:</span>
                <span className="info-value">{userData.email}</span>
              </div>
              
              <div className="info-item">
                <span className="info-label">电话:</span>
                <span className="info-value">{userData.phone}</span>
              </div>
              
              <div className="info-item">
                <span className="info-label">地址:</span>
                <span className="info-value">{userData.address}</span>
              </div>
              
              <button
                className="edit-button"
                onClick={() => setIsEditing(true)}
              >
                编辑资料
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile; 