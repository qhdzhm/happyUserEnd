import React, { useState, useEffect } from 'react';
import ChatBot from './ChatBot';

const GlobalChatBot = () => {
    const [userInfo, setUserInfo] = useState(null);
    const [userType, setUserType] = useState(1); // 默认普通用户

    useEffect(() => {
        // 从localStorage或其他地方获取用户信息
        const getUserInfo = () => {
            try {
                // 尝试多种方式获取用户信息
                let user = null;
                let userId = null;
                
                // 方式1: 从localStorage获取user对象
                const userStr = localStorage.getItem('user');
                if (userStr) {
                    user = JSON.parse(userStr);
                    userId = user.id || user.userId || user.customerId;
                }
                
                // 方式2: 如果没有user对象，尝试获取单独存储的用户ID
                if (!userId) {
                    userId = localStorage.getItem('userId') || 
                             localStorage.getItem('customerId') ||
                             localStorage.getItem('agentId');
                }
                
                // 方式3: 从token中解析用户ID（如果需要）
                if (!userId) {
                    const token = localStorage.getItem('token') || localStorage.getItem('agent-token');
                    if (token) {
                        try {
                            // 这里可以解析JWT token获取用户ID
                            // 暂时生成一个临时ID
                            userId = 'temp_' + Date.now();
                        } catch (error) {
                            console.warn('解析token失败:', error);
                        }
                    }
                }
                
                if (user || userId) {
                    setUserInfo({ ...user, id: userId });
                    
                    // 判断用户类型
                    const agentToken = localStorage.getItem('agent-token');
                    const userTypeFromStorage = localStorage.getItem('userType');
                    
                    const isAgent = agentToken || 
                                   user?.role === 'agent' || 
                                   user?.role === 'agent_operator' ||
                                   user?.userType === 'agent_operator' ||
                                   user?.type === 'agent_operator' ||
                                   userTypeFromStorage === 'agent' ||
                                   userTypeFromStorage === 'agent_operator';
                    
                    console.log('聊天机器人用户信息:', { user, userId, agentToken, userTypeFromStorage });
                    console.log('判断为代理商用户:', isAgent);
                    
                    setUserType(isAgent ? 2 : 1);
                } else {
                    // 未登录用户，使用默认设置，但仍可以使用AI聊天
                    console.log('未检测到用户登录信息，使用访客模式');
                    setUserType(1);
                    setUserInfo({ id: 'guest_' + Date.now() });
                }
            } catch (error) {
                console.error('解析用户信息失败:', error);
                setUserType(1);
                setUserInfo({ id: 'error_' + Date.now() });
            }
        };

        getUserInfo();

        // 监听用户登录状态变化
        const handleStorageChange = (e) => {
            if (e.key === 'user' || e.key === 'agent-token' || e.key === 'token' || e.key === 'userType') {
                console.log('检测到用户状态变化，重新获取用户信息');
                getUserInfo();
            }
        };

        window.addEventListener('storage', handleStorageChange);
        
        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);

    return (
        <ChatBot 
            userType={userType}
            userId={userInfo?.id || null}
        />
    );
};

export default GlobalChatBot; 