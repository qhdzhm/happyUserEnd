import { Route, Routes, useLocation } from "react-router-dom";
import { useEffect } from "react";
import "./App.css";
import Home from "./pages/Home/Home";
import Header from "./components/Common/Header/Header";
import Footer from "./components/Common/Footer/Footer";
import About from "./pages/About/About";
import Contact from "./pages/Contact/Contact";
import Tours from "./pages/Tours/Tours";
import TourDetails from "./pages/Tours/TourDetails";
import Booking from "./pages/Booking/Booking";
import Destinations from "./pages/Destinations/Destinations";
import PhotoGallery from "./pages/PhotoGallery/PhotoGallery";
import Search from "./pages/Search/Search";

function App() {
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
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="about-us" element={<About />} />
        <Route path="contact-us" element={<Contact />} />
        <Route path="tours" element={<Tours />} />
        <Route path="tour-details" element={<TourDetails />} />
        <Route path="tour-details/:id" element={<TourDetails />} />
        <Route path="booking" element={<Booking />} />
        <Route path="destinations" element={<Destinations />} />
        <Route path="gallery" element={<PhotoGallery />} />
        <Route path="search" element={<Search />} />
      </Routes>
      <Footer />
    </>
  );
}

export default App;
