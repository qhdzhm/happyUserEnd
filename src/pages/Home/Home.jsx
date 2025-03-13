import React, { useState, useRef } from "react";
import Banner from "../../components/Banner/Banner";
import AdvanceSearch from "../../components/AdvanceSearch/AdvanceSearch";
import Features from "../../components/Features/Features";
import { Container, Row, Col, Card, Button } from "react-bootstrap";
import { Link } from "react-router-dom";

import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

import "./home.css";

import Gallery from "../../components/Gallery/Gallery";
import Cards from "../../components/Cards/Cards";
import { destinationsData, popularsData, tasmaniaAttractions, GroupTourThemes } from "../../utils/data";
import PopularCard from "../../components/Cards/PopularCard";
import { FaMapMarkerAlt, FaCalendarAlt, FaStar, FaArrowRight, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

// 导入图片
import themeNature from "../../assets/images/new/1.jpg";
import themeBeach from "../../assets/images/new/2.jpg";
import themeCulture from "../../assets/images/new/3.jpg";
import themeFood from "../../assets/images/new/4.jpg";

const Home = () => {
  // 创建引用来控制轮播
  const dayToursSliderRef = useRef(null);
  const groupToursSliderRef = useRef(null);
  
  // 获取所有一日游产品
  const allDayTours = tasmaniaAttractions
    .filter(tour => {
      const tourTypes = Array.isArray(tour.tourType) ? tour.tourType : [tour.tourType];
      return tourTypes.includes("一日游");
    })
    .map(tour => ({
      id: tour.id,
      title: tour.name,
      description: tour.description,
      image: tour.image,
      duration: tour.duration,
      price: tour.price,
      rating: tour.rating,
      location: tour.location
    }));

  // 获取所有跟团游产品
  const allGroupTours = popularsData
    .filter(tour => {
      const tourTypes = Array.isArray(tour.tourType) ? tour.tourType : [tour.tourType];
      return tourTypes.includes("跟团游");
    })
    .map(tour => ({
      id: tour.id,
      title: tour.title,
      description: tour.shortDes || "精心设计的跟团游路线，带您探索塔斯马尼亚的精彩。",
      image: tour.image,
      days: tour.days,
      price: tour.afterDiscount || tour.price,
      rating: tour.rating,
      location: tour.location.split('，')[0].replace('出发', '')
    }));

  // 轮播设置
  const tourSliderSettings = {
    dots: false,
    infinite: true,
    speed: 500,
    slidesToShow: 4,
    slidesToScroll: 1,
    arrows: false,
    responsive: [
      {
        breakpoint: 1200,
        settings: {
          slidesToShow: 3,
          slidesToScroll: 1,
        },
      },
      {
        breakpoint: 992,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1,
        },
      },
      {
        breakpoint: 576,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
        },
      },
    ],
  };

  var settings = {
    dots: false,
    infinite: true,
    autoplay: true,
    slidesToShow: 4,
    slidesToScroll: 1,

    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 4,
          slidesToScroll: 1,
          infinite: false,
          dots: true,
          autoplay: true,
        },
      },
      {
        breakpoint: 991,
        settings: {
          slidesToShow: 3,
          slidesToScroll: 1,
          infinite: false,
          dots: true,
        },
      },
      {
        breakpoint: 600,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 2,
          autoplay: true,
          prevArrow: false,
          nextArrow: false,
        },
      },
      {
        breakpoint: 480,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
          prevArrow: false,
          nextArrow: false,
        },
      },
    ],
  };

  return (
    <>
      <Banner />
      <AdvanceSearch />
      <div className="home-content">
        <Features />

        {/* 一日游部分 */}
        <section className="day-tours-section py-5">
          <Container>
            <Row className="mb-4">
              <Col md="8">
                <div className="section-title">
                  <h2>精彩一日游</h2>
                  <p className="text-muted">探索塔斯马尼亚的自然风光与文化体验</p>
                </div>
              </Col>
              <Col md="4" className="d-flex align-items-center justify-content-end">
                <Link to="/tours?tourTypes=一日游" className="view-more-btn">
                  查看更多 <FaArrowRight className="ms-2" />
                </Link>
              </Col>
            </Row>

            <div className="position-relative tour-slider-container">
              {/* 左箭头 */}
              <button 
                className="slider-arrow slider-arrow-left" 
                onClick={() => dayToursSliderRef.current.slickPrev()}
              >
                <FaChevronLeft />
              </button>
              
              {/* 轮播内容 */}
              <Slider ref={dayToursSliderRef} {...tourSliderSettings}>
                {allDayTours.map((tour) => (
                  <div className="px-2" key={tour.id}>
                    <Card className="featured-tour-card h-100">
                      <div className="featured-image">
                        <img src={tour.image} alt={tour.title} className="img-fluid" />
                        <div className="tour-duration">
                          <FaCalendarAlt /> {tour.duration}
                        </div>
                      </div>
                      <Card.Body>
                        <Card.Title>{tour.title}</Card.Title>
                        <div className="tour-rating mb-2">
                          <FaStar className="text-warning" /> {tour.rating}
                        </div>
                        <Card.Text>{tour.description.substring(0, 80)}...</Card.Text>
                        <div className="tour-location">
                          <FaMapMarkerAlt className="me-2" />
                          {tour.location}
                        </div>
                      </Card.Body>
                      <Card.Footer className="bg-white">
                        <div className="d-flex justify-content-between align-items-center">
                          <div className="tour-price">
                            <span className="text-muted">价格</span>
                            <h5 className="text-primary mb-0">¥{tour.price}</h5>
                          </div>
                          <Link to={`/tour-details/${tour.id}`} className="btn btn-primary">
                            查看详情
                          </Link>
                        </div>
                      </Card.Footer>
                    </Card>
                  </div>
                ))}
              </Slider>
              
              {/* 右箭头 */}
              <button 
                className="slider-arrow slider-arrow-right" 
                onClick={() => dayToursSliderRef.current.slickNext()}
              >
                <FaChevronRight />
              </button>
            </div>
          </Container>
        </section>

        {/* 跟团游部分 */}
        <section className="group-tours-section py-5 bg-light">
          <Container>
            <Row className="mb-4">
              <Col md="8">
                <div className="section-title">
                  <h2>精选跟团游</h2>
                  <p className="text-muted">深度体验塔斯马尼亚的自然风光与人文魅力</p>
                </div>
              </Col>
              <Col md="4" className="d-flex align-items-center justify-content-end">
                <Link to="/tours?tourTypes=跟团游" className="view-more-btn">
                  查看更多 <FaArrowRight className="ms-2" />
                </Link>
              </Col>
            </Row>

            <div className="position-relative tour-slider-container">
              {/* 左箭头 */}
              <button 
                className="slider-arrow slider-arrow-left" 
                onClick={() => groupToursSliderRef.current.slickPrev()}
              >
                <FaChevronLeft />
              </button>
              
              {/* 轮播内容 */}
              <Slider ref={groupToursSliderRef} {...tourSliderSettings}>
                {allGroupTours.map((tour) => (
                  <div className="px-2" key={tour.id}>
                    <Card className="featured-tour-card h-100">
                      <div className="featured-image">
                        <img src={tour.image} alt={tour.title} className="img-fluid" />
                        <div className="tour-days">
                          <FaCalendarAlt /> {tour.days}
                        </div>
                      </div>
                      <Card.Body>
                        <Card.Title>{tour.title}</Card.Title>
                        <div className="tour-rating mb-2">
                          <FaStar className="text-warning" /> {tour.rating}
                        </div>
                        <Card.Text>{tour.description}</Card.Text>
                        <div className="tour-location">
                          <FaMapMarkerAlt className="me-2" />
                          {tour.location}
                        </div>
                      </Card.Body>
                      <Card.Footer className="bg-white">
                        <div className="d-flex justify-content-between align-items-center">
                          <div className="tour-price">
                            <span className="text-muted">起价</span>
                            <h5 className="text-primary mb-0">¥{tour.price}</h5>
                          </div>
                          <Link to={`/tour-details/${tour.id}`} className="btn btn-primary">
                            查看详情
                          </Link>
                        </div>
                      </Card.Footer>
                    </Card>
                  </div>
                ))}
              </Slider>
              
              {/* 右箭头 */}
              <button 
                className="slider-arrow slider-arrow-right" 
                onClick={() => groupToursSliderRef.current.slickNext()}
              >
                <FaChevronRight />
              </button>
            </div>
          </Container>
        </section>

        {/* 旅游主题部分 */}
        <section className="theme-section py-5">
          <Container>
            <Row className="mb-4">
              <Col md="12">
                <div className="section-title text-center">
                  <h2>探索旅行主题</h2>
                  <p className="text-muted">选择您感兴趣的主题，开启难忘旅程</p>
                </div>
              </Col>
            </Row>
            <Row>
              {GroupTourThemes.slice(0, 4).map((theme, index) => (
                <Col lg={3} md={6} className="mb-4" key={index}>
                  <Card className="theme-card">
                    <div className="theme-image">
                      <img src={[themeNature, themeBeach, themeCulture, themeFood][index]} alt={theme} className="img-fluid" />
                    </div>
                    <Card.Body>
                      <h4>{theme}</h4>
                      <p>{getThemeDescription(theme)}</p>
                      <Link to={`/tours?themes=${theme}`} className="btn btn-outline-primary">
                        查看路线
                      </Link>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          </Container>
        </section>

        <section className="call_us">
          <Container>
            <Row className="align-items-center">
              <Col md="8">
                <div className="section-title">
                  <h5 className="title">开启旅程</h5>
                  <h2 className="heading">准备好一场难忘的旅行了吗？</h2>
                  <p className="text">塔斯马尼亚拥有澳大利亚最美丽的自然风光，让我们带您领略这片净土的魅力，创造终生难忘的回忆。</p>
                </div>
              </Col>
              <Col md="4" className="text-center mt-3 mt-md-0">
                <a
                  href="tel:6398312365"
                  className="secondary_btn bounce"
                  rel="no"
                >
                  联系我们
                </a>
              </Col>
            </Row>
          </Container>
          <div className="overlay"></div>
        </section>

        <section className="gallery">
          <Container>
            <Row className="mb-4">
              <Col md="12">
                <div className="section-title text-center">
                  <h2>精彩瞬间</h2>
                  <p className="text-muted">记录塔斯马尼亚的美丽风光与难忘时刻</p>
                </div>
              </Col>
            </Row>
            <Row>
              <Col md="12">
                <Gallery />
              </Col>
            </Row>
          </Container>
        </section>
      </div>
    </>
  );
};

// 获取主题描述
function getThemeDescription(theme) {
  switch (theme) {
    case "休闲度假":
      return "放松身心，享受悠闲的度假时光";
    case "探险体验":
      return "挑战自我，体验刺激的户外探险活动";
    case "文化探索":
      return "了解当地历史文化，探索人文景观";
    case "美食之旅":
      return "品尝当地美食，探访特色餐厅和市场";
    default:
      return "探索塔斯马尼亚的精彩主题";
  }
}

export default Home;
