import React, { useState } from "react";
import { Button } from "react-bootstrap";
import "../Banner/banner.css";

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

  return (
    <>
      <section className="slider">
        <div className="video-container">
          <video className="d-block w-100" autoPlay={!isPaused} muted loop>
            <source
              src={require("../../assets/videos/tasmania.mp4")}
              type="video/mp4"
            />
            您的浏览器不支持视频标签。
          </video>
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
