import React, { useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { setAuth } from './store/slices/authSlice';
import { getAgentDiscountRate, clearPriceCache } from './utils/api';
import MainLayout from './layouts/MainLayout';
import AppRoutes from './routes';
import Loading from './components/Loading';
import { STORAGE_KEYS } from './utils/constants';
import "./App.css";
import ErrorHandler from './components/Error/ErrorHandler';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// 缓存自动清理的时间间隔 (30分钟)
const CACHE_AUTO_CLEAR_INTERVAL = 30 * 60 * 1000;

function App() {
  const dispatch = useDispatch();
  const { loading } = useSelector(state => state.auth);
  
  // 当组件挂载时，从localStorage恢复用户会话状态
  useEffect(() => {
    // 检查本地存储的会话状态
    const sessionState = {
      token: localStorage.getItem('token'),
      userType: localStorage.getItem('userType') || 'regular',
      username: localStorage.getItem('username')
    };
    console.log('检查本地存储的会话状态:', sessionState);

    // 如果有token，设置认证状态
    if (sessionState.token) {
      dispatch(setAuth({
        isAuthenticated: true,
        user: {
          id: localStorage.getItem('userId'),
          username: sessionState.username,
          userType: sessionState.userType
        }
      }));
    }
  }, [dispatch]);
  
  /**
   * 检查会话状态并获取代理商折扣率（如果需要）
   */
  useEffect(() => {
    const checkSession = async () => {
      try {
        // 从localStorage获取会话状态
        const sessionState = {
          token: localStorage.getItem(STORAGE_KEYS.TOKEN),
          userType: localStorage.getItem('userType'),
          username: localStorage.getItem('username')
        };

        console.log('检查本地存储的会话状态:', sessionState);

        // 如果有token，更新Redux认证状态
        if (sessionState.token) {
          // 根据用户类型和是否已经有折扣率决定是否需要获取折扣率
          const isAuthenticated = !!sessionState.token;
          const isAgent = sessionState.userType === 'agent';
          
          // 如果是代理商，则获取最新的折扣率
          if (isAuthenticated && isAgent) {
            console.log('开始获取代理商折扣率...');
            try {
              // 调用后端API获取折扣率
              await getAgentDiscountRate();
              console.log('成功获取代理商折扣率');
            } catch (error) {
              console.error('获取代理商折扣率失败:', error);
            }
          }
          
          // 更新认证状态
          dispatch(setAuth({
            isAuthenticated: true,
            userType: sessionState.userType,
            username: sessionState.username
          }));
        }
      } catch (error) {
        console.error('检查会话状态失败:', error);
      }
    };

    checkSession();
  }, [dispatch]);
  
  // 添加缓存清理和监听localStorage变化的事件
  useEffect(() => {
    // 页面加载时清理价格缓存
    clearPriceCache();
    
    // 设置定时自动清理
    const autoCleanInterval = setInterval(() => {
      console.log('定时自动清理价格缓存');
      clearPriceCache();
    }, CACHE_AUTO_CLEAR_INTERVAL);
    
    // 监听storage事件，当其他页面/标签修改localStorage时触发
    const handleStorageChange = (e) => {
      if (e.key === 'token' || e.key === 'userType' || e.key === 'agentId') {
        console.log('用户登录状态变化，清理价格缓存');
        clearPriceCache();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // 清理函数
    return () => {
      clearInterval(autoCleanInterval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);
  
  return (
    <ErrorHandler>
      <ToastContainer position="top-right" autoClose={3000} />
      <Router>
        <MainLayout>
          {loading ? <Loading /> : <AppRoutes />}
        </MainLayout>
      </Router>
    </ErrorHandler>
  );
}

export default App;
