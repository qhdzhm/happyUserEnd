import React, { useState, useEffect } from "react";
import { Button, Container } from "react-bootstrap";
import "../Banner/banner.css";
import AdvanceSearch from "../AdvanceSearch/AdvanceSearch";

const Banner = () => {
  const [isPaused, setIsPaused] = useState(false);

  const handleVideoControl = () => {
    setIsPaused(!isPaused);
    const video = document.querySelector(".video-container video");
    if (video) {
      if (isPaused) {
        video.play();
      } else {
        video.pause();
      }
    }
  };

  // Add useEffect to ensure proper fullscreen display
  useEffect(() => {
    // Set the body and html elements to have full height
    document.documentElement.style.height = '100%';
    document.body.style.height = '100%';
    document.body.style.overflow = 'auto';
    
    // Ensure the banner is at the top
    window.scrollTo(0, 0);
    
    return () => {
      // Cleanup styles when component unmounts
      document.documentElement.style.height = '';
      document.body.style.height = '';
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <>
      <section className="slider fullscreen-banner">
        <div className="video-container">
          <video className="d-block w-100" autoPlay={!isPaused} muted loop>
            <source
              src={require("../../assets/videos/tasmania.mp4")}
              type="video/mp4"
            />
            您的浏览器不支持视频标签。
          </video>
          <Container fluid className="banner-content-container">
            <div className="banner-content">
              <div className="travel-tag">TRAVEL</div>
              <h1 className="banner-title">
                WONDERFUL.
                <br />
                ISLAND
              </h1>
              <p className="banner-description">
                探索塔斯马尼亚的壮丽自然风光和独特人文魅力，体验难忘的旅行时光
              </p>
              
              {/* 添加搜索框到banner中 */}
              <div className="banner-search-container">
                <h2 className="search-title">搜索你的旅程</h2>
                <div className="banner-search-box">
                  <AdvanceSearch inBanner={true} />
                </div>
              </div>
            </div>
          </Container>
          <div className="social-icons">
            <a href="#" className="social-icon"><i className="bi bi-facebook"></i></a>
            <a href="#" className="social-icon"><i className="bi bi-instagram"></i></a>
            <a href="#" className="social-icon"><i className="bi bi-twitter"></i></a>
          </div>
          <Button
            variant="light"
            className="video-control-btn"
            onClick={handleVideoControl}
          >
            <i
              className={`bi bi-${isPaused ? "play-fill" : "pause-fill"}`}
            ></i>
          </Button>
        </div>
      </section>
    </>
  );
};

export default Banner;
