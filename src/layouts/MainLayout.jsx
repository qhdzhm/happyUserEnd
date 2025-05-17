import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Header from '../components/Common/Header/Header';
import HeaderDiscount from '../components/Header/HeaderDiscount';
import Footer from '../components/Common/Footer/Footer';
import './MainLayout.css';

const MainLayout = ({ children }) => {
  const location = useLocation();
  const { user } = useSelector(state => state.auth);
  
  // 检查用户是否是代理商
  const userRole = user?.role || localStorage.getItem('userType');
  const isAgent = userRole === 'agent';
  
  useEffect(() => {
    // 检查当前路径是否为首页
    if (location.pathname === '/') {
      document.body.classList.add('home-page');
    } else {
      document.body.classList.remove('home-page');
    }
    
    // 组件卸载时清除类名
    return () => {
      document.body.classList.remove('home-page');
    };
  }, [location]);

  return (
    <div className="layout-container">
      {isAgent && <HeaderDiscount />}
      <Header />
      <main className="flex-grow-1">
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default MainLayout;
