import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Header from '../components/Common/Header/Header';
import HeaderDiscount from '../components/Header/HeaderDiscount';
import Footer from '../components/Common/Footer/Footer';
import { getAgentDiscountRate, calculateTourDiscount } from '../utils/api';

const MainLayout = ({ children }) => {
  const location = useLocation();
  const { user } = useSelector(state => state.auth);
  
  // 检查用户是否是代理商
  const userRole = user?.role || localStorage.getItem('userType');
  const isAgent = userRole === 'agent';
  const agentId = localStorage.getItem('agentId');
  
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

  // 检查代理商身份并请求折扣率
  useEffect(() => {
    const fetchAgentData = async () => {
      try {
        if (isAgent && agentId) {
          console.log('MainLayout - 检测到代理商身份，开始获取折扣率...', agentId);
          
          // 确保agentId是数字而非字符串
          const numericAgentId = parseInt(agentId, 10);
          if (isNaN(numericAgentId)) {
            console.warn('MainLayout - 代理商ID无效:', agentId);
            return;
          }
          
          // 获取代理商折扣率
          const discountInfo = await getAgentDiscountRate(numericAgentId);
          console.log('MainLayout - 获取到代理商折扣信息:', discountInfo);
          
          if (discountInfo && discountInfo.discountRate) {
            // 保存折扣率到localStorage
            localStorage.setItem('discountRate', discountInfo.discountRate);
            
            // 测试单个产品的折扣计算
            setTimeout(async () => {
              try {
                const testPrice = 100;
                console.log('MainLayout - 测试折扣计算API...');
                const discountResult = await calculateTourDiscount({
                  tourId: 1,
                  tourType: 'day-tour',
                  originalPrice: testPrice,
                  agentId: numericAgentId
                });
                console.log('MainLayout - 折扣计算测试结果:', discountResult);
                if (discountResult && discountResult.discountedPrice) {
                  console.log(`MainLayout - 原价: $${testPrice}, 折扣价: $${discountResult.discountedPrice}`);
                }
              } catch (error) {
                console.error('MainLayout - 折扣计算测试失败:', error);
              }
            }, 1000);
          } else {
            console.warn('MainLayout - 获取到无效的折扣率信息:', discountInfo);
          }
        }
      } catch (error) {
        console.error('MainLayout - 获取代理商数据失败:', error);
      }
    };
    
    fetchAgentData();
  }, [isAgent, agentId]);

  return (
    <div className="d-flex flex-column min-vh-100">
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
