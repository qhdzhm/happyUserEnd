import React, { useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";

// 页面组件导入
import Home from "./pages/Home/Home";
import About from "./pages/About/About";
import Contact from "./pages/Contact/Contact";
import Tours from "./pages/Tours/Tours";
import TourDetails from "./pages/Tours/TourDetails";
import Booking from "./pages/Booking/Booking";
import TravelRegions from "./pages/TravelRegions/TravelRegions";
import RegionDetail from "./pages/Destinations/RegionDetail";
import PhotoGallery from "./pages/PhotoGallery/PhotoGallery";
import Search from "./pages/Search/Search";
import NotFound from "./pages/Error/NotFound";

// 认证页面
import Login from "./pages/Auth/Login";
import Register from "./pages/Auth/Register";

// 用户页面
import UserProfile from "./pages/User/UserProfile";

// 布局组件
import Header from "./components/Common/Header/Header";
import Footer from "./components/Common/Footer/Footer";
import Notification from "./components/Common/Notification/Notification";
import Loader from "./components/Common/Loader/Loader";

// 受保护的路由组件
import ProtectedRoute from "./components/Common/ProtectedRoute/ProtectedRoute";

// 滚动到顶部组件
const ScrollToTop = () => {
  const { pathname } = useLocation();
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  
  return null;
};

// 路由布局组件
const Layout = ({ children }) => {
  const location = useLocation();
  
  useEffect(() => {
    // 检查当前路径是否为首页
    if (location.pathname === '/') {
      document.body.classList.add('home-page');
    } else {
      document.body.classList.remove('home-page');
    }
  }, [location]);

  return (
    <>
      <ScrollToTop />
      <Header />
      {children}
      <Footer />
      <Notification />
      <Loader />
    </>
  );
};

// 路由配置
const AppRouter = () => {
  return (
    <Layout>
      <Routes>
        {/* 公共页面 */}
        <Route path="/" element={<Home />} />
        <Route path="about-us" element={<About />} />
        <Route path="contact-us" element={<Contact />} />
        <Route path="tours" element={<Tours />} />
        <Route path="tour-details" element={<TourDetails />} />
        <Route path="tour-details/:id" element={<TourDetails />} />
        
        {/* 新增旅游详情路由 */}
        <Route path="day-tours/:id" element={<TourDetails type="day" />} />
        <Route path="group-tours/:id" element={<TourDetails type="group" />} />
        
        <Route path="destinations" element={<TravelRegions />} />
        <Route path="region-detail/:id" element={<RegionDetail />} />
        <Route path="gallery" element={<PhotoGallery />} />
        <Route path="search" element={<Search />} />
        
        {/* 认证页面 */}
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        
        {/* 普通用户页面 */}
        <Route path="booking" element={
          <ProtectedRoute requiredRoles={['user', 'agent']}>
            <Booking />
          </ProtectedRoute>
        } />
        <Route path="profile" element={
          <ProtectedRoute requiredRoles={['user', 'agent']}>
            <UserProfile />
          </ProtectedRoute>
        } />
        
        {/* 404页面路由 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  );
};

export default AppRouter; 