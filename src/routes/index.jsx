import React, { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';

// 页面组件导入
import Home from '../pages/Home/Home';
import About from '../pages/About/About';
import Contact from '../pages/Contact/Contact';
import Tours from '../pages/Tours/Tours';
import TourDetails from '../pages/Tours/TourDetails';
import Booking from '../pages/Booking/Booking';
import TravelRegions from '../pages/TravelRegions/TravelRegions';
import RegionDetail from '../pages/Destinations/RegionDetail';
import PhotoGallery from '../pages/PhotoGallery/PhotoGallery';
import Search from '../pages/Search/Search';
import NotFound from '../pages/OrderDetail/NotFound';
import OrderSuccess from '../pages/OrderSuccess/OrderSuccess';
import OrderDetail from '../pages/OrderDetail/OrderDetail';
import Cart from '../pages/Cart/Cart';
import Checkout from '../pages/Checkout/Checkout';
import Payment from '../pages/Payment/Payment';

// 认证页面
import Login from '../pages/Auth/Login';
import Register from '../pages/Auth/Register';
import WechatCallback from '../pages/Auth/WechatCallback';

// 用户页面
import Profile from '../pages/User/Profile';
import Orders from '../pages/User/Orders';
import AgentCenter from '../pages/User/AgentCenter';
import CreditTransactions from '../pages/User/CreditTransactions';

// 受保护的路由组件
import ProtectedRoute from '../components/Common/ProtectedRoute/ProtectedRoute';

// 滚动到顶部组件
const ScrollToTop = () => {
  const { pathname } = useLocation();
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  
  return null;
};

const AppRoutes = () => {
  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* 公共页面 */}
        <Route path="/" element={<Home />} />
        <Route path="/about-us" element={<About />} />
        <Route path="/contact-us" element={<Contact />} />
        <Route path="/tours" element={<Tours />} />
        <Route path="/tour-details" element={<TourDetails />} />
        <Route path="/tour-details/:id" element={<TourDetails />} />
        
        {/* 旅游详情路由 */}
        <Route path="/day-tours/:id" element={<TourDetails type="day" />} />
        <Route path="/group-tours/:id" element={<TourDetails type="group" />} />
        
        <Route path="/destinations" element={<TravelRegions />} />
        <Route path="/region-detail/:id" element={<RegionDetail />} />
        <Route path="/gallery" element={<PhotoGallery />} />
        <Route path="/search" element={<Search />} />
        
        {/* 认证页面 */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/wx-callback" element={<WechatCallback />} />
        
        {/* 购物车和结账 */}
        <Route path="/cart" element={<Cart />} />
        
        {/* 受保护的路由 */}
        <Route path="/checkout" element={
          <ProtectedRoute requiredRoles={['user', 'agent']}>
            <Checkout />
          </ProtectedRoute>
        } />
        <Route path="/booking" element={
          <ProtectedRoute requiredRoles={['user', 'agent']}>
            <Booking />
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute requiredRoles={['user', 'agent']} agentRedirect={true}>
            <Profile />
          </ProtectedRoute>
        } />
        
        {/* 代理商中心 */}
        <Route path="/agent-center" element={
          <ProtectedRoute requiredRoles={['agent']}>
            <AgentCenter />
          </ProtectedRoute>
        } />
        
        {/* 信用交易记录 */}
        <Route path="/credit-transactions" element={
          <ProtectedRoute requiredRoles={['agent']}>
            <CreditTransactions />
          </ProtectedRoute>
        } />
        
        {/* 订单相关路由 */}
        <Route path="/orders/:orderId" element={
          <ProtectedRoute requiredRoles={['user', 'agent']}>
            <OrderDetail />
          </ProtectedRoute>
        } />
        <Route path="/user/orders/:orderId" element={
          <ProtectedRoute requiredRoles={['user', 'agent']}>
            <OrderDetail />
          </ProtectedRoute>
        } />
        <Route path="/order-detail/:orderNumber" element={
          <ProtectedRoute requiredRoles={['user', 'agent']}>
            <OrderDetail />
          </ProtectedRoute>
        } />
        <Route path="/orders" element={
          <ProtectedRoute requiredRoles={['user', 'agent']}>
            <Orders />
          </ProtectedRoute>
        } />
        
        {/* 支付页面路由 */}
        <Route path="/payment/:orderId" element={
          <ProtectedRoute requiredRoles={['user', 'agent']}>
            <Payment />
          </ProtectedRoute>
        } />
        
        {/* 订单成功页面 */}
        <Route path="/booking/success" element={
          <ProtectedRoute requiredRoles={['user', 'agent']}>
            <OrderSuccess />
          </ProtectedRoute>
        } />
        <Route path="/booking/success/:orderId" element={
          <ProtectedRoute requiredRoles={['user', 'agent']}>
            <OrderSuccess />
          </ProtectedRoute>
        } />
        <Route path="/order-success" element={
          <ProtectedRoute requiredRoles={['user', 'agent']}>
            <OrderSuccess />
          </ProtectedRoute>
        } />
        <Route path="/order-success/:orderId" element={
          <ProtectedRoute requiredRoles={['user', 'agent']}>
            <OrderSuccess />
          </ProtectedRoute>
        } />
        
        {/* 404页面路由 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

export default AppRoutes; 