import React, { useEffect, useState } from "react";
import {
  Container,
  Row,
  Navbar,
  Offcanvas,
  Nav,
  NavDropdown,
} from "react-bootstrap";
import { NavLink } from "react-router-dom";
import "../Header/header.css";

import logo from "../../../assets/images/logo/logo.png";

const Header = () => {
  const [open, setOpen] = useState(false);

  const toggleMenu = () => {
    setOpen(!open);
  };

  useEffect(()=>{
    window.addEventListener("scroll", isSticky);
    return ()=>{
      window.removeEventListener("scroll", isSticky)
    }
  })

  // sticky Header 
  const isSticky=(e)=>{
    const header = document.querySelector('.header-section');
    const scrollTop = window.scrollY;
    scrollTop >= 120 ? header.classList.add('is-sticky') :
    header.classList.remove('is-sticky')
  }

  const closeMenu =()=>{
    if(window.innerWidth <= 991){
      setOpen(false)
    }
  }
 
  return (
    <>
      {/* 顶部信息栏 */}
      <div className="top-info-bar">
        <Container>
          <div className="top-info-content">
            <div className="contact-info">
              <a href="tel:+61398765432"><i className="bi bi-telephone-fill"></i> +61 3 9876 5432</a>
              <a href="mailto:info@happytassieholiday.com"><i className="bi bi-envelope-fill"></i> info@happytassieholiday.com</a>
            </div>
            <div className="social-links">
              <a href="#"><i className="bi bi-facebook"></i></a>
              <a href="#"><i className="bi bi-instagram"></i></a>
              <a href="#"><i className="bi bi-twitter"></i></a>
            </div>
          </div>
        </Container>
      </div>
      
      {/* 主导航栏 */}
      <header className="header-section">
        <Container>
          <Navbar expand="lg" className="p-0">
            {/* Logo Section  */}
            <Navbar.Brand>
              <NavLink to="/" className="logo-link">
                <div className="logo-container">
                  <img 
                    src={logo} 
                    alt="Happy Tassie Holiday" 
                    className="brand-logo"
                  />
                </div>
              </NavLink>
            </Navbar.Brand>
            {/* End Logo Section  */}

            <Navbar.Offcanvas
              id={`offcanvasNavbar-expand-lg`}
              aria-labelledby={`offcanvasNavbarLabel-expand-lg`}
              placement="start"
              show={open}
            >
              {/*mobile Logo Section  */}
              <Offcanvas.Header>
                <div className="logo">
                  <div className="logo-container-mobile">
                    <img 
                      src={logo}
                      alt="Happy Tassie Holiday" 
                      className="mobile-logo"
                    />
                  </div>
                </div>
                <span className="navbar-toggler ms-auto"  onClick={toggleMenu}>
                  <i className="bi bi-x-lg"></i>
                </span>
              </Offcanvas.Header>
              {/*end mobile Logo Section  */}

              <Offcanvas.Body>
                <Nav className="justify-content-end flex-grow-1 pe-3">
                  <NavLink className="nav-link" to="/" onClick={closeMenu}>
                    首页
                  </NavLink>
                  <NavLink className="nav-link" to="/about-us" onClick={closeMenu}>
                    关于我们
                  </NavLink>
                  <NavLink className="nav-link" to="/tours" onClick={closeMenu}>
                    旅游路线
                  </NavLink>

                  <NavDropdown
                    title="目的地"
                    id={`offcanvasNavbarDropdown-expand-lg`}
                  >
                   
                      
                    <NavLink className="nav-link text-dark" to="/destinations" onClick={closeMenu}>
                    西班牙旅游
                  </NavLink>
                  
                   
                  </NavDropdown>
                  <NavLink className="nav-link" to="/gallery" onClick={closeMenu}>
                    图片库
                  </NavLink>
                  <NavLink className="nav-link" to="/contact-us" onClick={closeMenu}>
                    联系我们
                  </NavLink>
                  <NavLink className="booking-btn d-block d-sm-none mt-3" to="/booking" onClick={closeMenu}>
                    立即预订
                  </NavLink>
                </Nav>
              </Offcanvas.Body>
            </Navbar.Offcanvas>
            <div className="ms-md-4 ms-2">
              <NavLink to="/booking" className="booking-btn d-none d-sm-inline-block">
                立即预订
              </NavLink>
              <li className="d-inline-block d-lg-none ms-3 toggle_btn">
                <i className={open ? "bi bi-x-lg" : "bi bi-list"}  onClick={toggleMenu}></i>
              </li>
            </div>
          </Navbar>
        </Container>
      </header>
    </>
  );
};

export default Header;
