import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from '../pages/Home/Home';
import Tours from '../pages/Tours/Tours';
import TourDetails from '../pages/Tours/TourDetails';
import Search from '../pages/Search/Search';
import Login from '../pages/Auth/Login';
import Register from '../pages/Auth/Register';
import Profile from '../pages/User/Profile';
import Orders from '../pages/User/Orders';
import Cart from '../pages/Cart/Cart';
import Checkout from '../pages/Checkout/Checkout';
import NotFound from '../pages/NotFound';
import About from '../pages/About/About';
import TravelRegions from '../pages/TravelRegions/TravelRegions';
import PhotoGallery from '../pages/PhotoGallery/PhotoGallery';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/tours" element={<Tours />} />
      <Route path="/tours/:id" element={<TourDetails />} />
      <Route path="/day-tours/:id" element={<TourDetails />} />
      <Route path="/group-tours/:id" element={<TourDetails />} />
      <Route path="/search" element={<Search />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/orders" element={<Orders />} />
      <Route path="/cart" element={<Cart />} />
      <Route path="/checkout" element={<Checkout />} />
      <Route path="/about-us" element={<About />} />
      <Route path="/destinations" element={<TravelRegions />} />
      <Route path="/region-detail/:id" element={<TravelRegions />} />
      <Route path="/gallery" element={<PhotoGallery />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes; 