import React, { useState, useRef, useEffect, useCallback } from "react";
import Banner from "../../components/Banner/Banner";
import AdvanceSearch from "../../components/AdvanceSearch/AdvanceSearch";
import Features from "../../components/Features/Features";
import { Container, Row, Col, Card, Button, Spinner, Form, InputGroup, Alert, Carousel } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";

import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

import "./home.css";

import Gallery from "../../components/Gallery/Gallery";
import Cards from "../../components/Cards/Cards";
// import PopularCard from "../../components/Cards/PopularCard";
import { FaMapMarkerAlt, FaCalendarAlt, FaStar, FaArrowRight, FaChevronLeft, FaChevronRight, FaSearch } from 'react-icons/fa';
import { MdLocationOn, MdDateRange, MdPeople } from 'react-icons/md';
import * as api from '../../utils/api';
import PriceDisplay from '../../components/PriceDisplay';
import { useSelector } from 'react-redux';

// 导入图片
import themeNature from "../../assets/images/new/1.jpg";
import themeBeach from "../../assets/images/new/2.jpg";
import themeCulture from "../../assets/images/new/3.jpg";
import themeFood from "../../assets/images/new/4.jpg";

const Home = () => {
  // 创建引用来控制轮播
  const dayToursSliderRef = useRef(null);
  const groupToursSliderRef = useRef(null);
  
  // 状态管理
  const [dayTours, setDayTours] = useState([]);
  const [groupTours, setGroupTours] = useState([]);
  const [hotTours, setHotTours] = useState([]);
  const [recommendedTours, setRecommendedTours] = useState([]);
  const [loading, setLoading] = useState({
    dayTours: true,
    groupTours: true,
    hotTours: true,
    recommendedTours: true
  });
  const [error, setError] = useState({
    dayTours: null,
    groupTours: null,
    hotTours: null,
    recommendedTours: null
  });

  // 添加请求状态引用
  const requestsInProgress = useRef({
    dayTours: false,
    groupTours: false,
    hotTours: false,
    recommendedTours: false
  });

  const [discountPrices, setDiscountPrices] = useState({});
  const [loadingDiscounts, setLoadingDiscounts] = useState(false);
  
  // 修改useEffect
  useEffect(() => {
    // 获取一日游数据
    const fetchDayTours = async () => {
      // 如果已经在请求中，则跳过
      if (requestsInProgress.current.dayTours) {
        console.log('一日游数据请求正在进行中，跳过重复请求');
        return;
      }
      
      requestsInProgress.current.dayTours = true;
      try {
        // 设置超时处理
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('请求超时')), 8000)
        );
        
        console.log('开始获取一日游数据...');
        const fetchPromise = api.getAllDayTours();
        const response = await Promise.race([fetchPromise, timeoutPromise]);
        
        // 处理响应数据
        if (response && response.code === 1 && response.data) {
          // 从 response.data 中获取 records
          const records = response.data.records || response.data;
          
          if (Array.isArray(records) && records.length > 0) {
            setDayTours(records);
            console.log(records);
            
            // 如果是代理商，获取折扣价格
            const userType = localStorage.getItem('userType');
            const agentId = localStorage.getItem('agentId');
            if (userType === 'agent' && agentId) {
              try {
                // 为第一个产品获取折扣价格，确保API调用
                if (records[0] && records[0].price) {
                  console.log('执行单一折扣计算，确保API调用');
                  const discountResult = await api.calculateTourDiscount({
                    tourId: records[0].id,
                    tourType: 'day-tour',
                    originalPrice: records[0].price,
                    agentId: agentId
                  });
                  console.log('折扣计算结果:', discountResult);
                  
                  // 更新折扣价格状态
                  setDiscountPrices(prev => ({
                    ...prev,
                    [records[0].id]: discountResult.discountedPrice
                  }));
                }
              } catch (discountError) {
                console.error('计算折扣价格失败:', discountError);
              }
            }
          } else {
            console.warn("API返回的一日游数据为空");
            setDayTours([]);
          }
        } else {
          console.warn("API返回错误", response);
          setDayTours([]);
        }
        setLoading(prev => ({ ...prev, dayTours: false }));
      } catch (err) {
        console.error("获取一日游失败:", err);
        setDayTours([]);
        setError(prev => ({ ...prev, dayTours: "获取一日游数据失败" }));
        setLoading(prev => ({ ...prev, dayTours: false }));
      } finally {
        requestsInProgress.current.dayTours = false;
      }
    };
    
    console.log(dayTours);
    
    // 获取跟团游数据
    const fetchGroupTours = async () => {
      // 如果已经在请求中，则跳过
      if (requestsInProgress.current.groupTours) {
        console.log('跟团游数据请求正在进行中，跳过重复请求');
        return;
      }
      
      requestsInProgress.current.groupTours = true;
      try {
        // 设置超时处理
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('请求超时')), 8000)
        );
        
        const fetchPromise = api.getAllGroupTours();
        const response = await Promise.race([fetchPromise, timeoutPromise]);
        
        // 处理响应数据
        if (response && response.code === 1 && response.data) {
          // 从 response.data 中获取 records
          const records = response.data.records || response.data;
          
          if (Array.isArray(records) && records.length > 0) {
            setGroupTours(records);
          } else {
            console.warn("API返回的跟团游数据为空");
            setGroupTours([]);
          }
        } else {
          console.warn("API返回错误", response);
          setGroupTours([]);
        }
        setLoading(prev => ({ ...prev, groupTours: false }));
      } catch (err) {
        console.error("获取跟团游失败:", err);
        setGroupTours([]);
        setError(prev => ({ ...prev, groupTours: "获取跟团游数据失败" }));
        setLoading(prev => ({ ...prev, groupTours: false }));
      } finally {
        requestsInProgress.current.groupTours = false;
      }
    };

    // 获取热门旅游数据
    const fetchHotTours = async () => {
      // 如果已经在请求中，则跳过
      if (requestsInProgress.current.hotTours) {
        console.log('热门旅游数据请求正在进行中，跳过重复请求');
        return;
      }
      
      requestsInProgress.current.hotTours = true;
      try {
        // 设置超时处理
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('请求超时')), 8000)
        );
        
        const fetchPromise = api.getHotTours(6);
        const response = await Promise.race([fetchPromise, timeoutPromise]);
        
        // Spring Boot返回的数据结构是 { code, msg, data }
        if (response && response.code === 1) {
          const data = response.data;
          if (Array.isArray(data) && data.length > 0) {
            setHotTours(data);
          } else {
            console.warn("API返回的热门旅游数据为空");
            setHotTours([]);
          }
        } else {
          console.warn("API返回错误", response);
          setHotTours([]);
        }
        setLoading(prev => ({ ...prev, hotTours: false }));
      } catch (err) {
        console.error("获取热门旅游失败:", err);
        setHotTours([]);
        setError(prev => ({ ...prev, hotTours: "获取热门旅游数据失败" }));
        setLoading(prev => ({ ...prev, hotTours: false }));
      } finally {
        requestsInProgress.current.hotTours = false;
      }
    };

    // 获取推荐旅游数据
    const fetchRecommendedTours = async () => {
      // 如果已经在请求中，则跳过
      if (requestsInProgress.current.recommendedTours) {
        console.log('推荐旅游数据请求正在进行中，跳过重复请求');
        return;
      }
      
      requestsInProgress.current.recommendedTours = true;
      try {
        // 设置超时处理
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('请求超时')), 8000)
        );
        
        const fetchPromise = api.getRecommendedTours(6);
        const response = await Promise.race([fetchPromise, timeoutPromise]);
        
        // Spring Boot返回的数据结构是 { code, msg, data }
        if (response && response.code === 1) {
          const data = response.data;
          if (Array.isArray(data) && data.length > 0) {
            setRecommendedTours(data);
          } else {
            console.warn("API返回的推荐旅游数据为空");
            setRecommendedTours([]);
          }
        } else {
          console.warn("API返回错误", response);
          setRecommendedTours([]);
        }
        setLoading(prev => ({ ...prev, recommendedTours: false }));
      } catch (err) {
        console.error("获取推荐旅游失败:", err);
        setRecommendedTours([]);
        setError(prev => ({ ...prev, recommendedTours: "获取推荐旅游数据失败" }));
        setLoading(prev => ({ ...prev, recommendedTours: false }));
      } finally {
        requestsInProgress.current.recommendedTours = false;
      }
    };

    fetchDayTours();
    fetchGroupTours();
    fetchHotTours();
    fetchRecommendedTours();
    
    // 确保轮播容器内的卡片高度一致
    const equalizeCardHeights = () => {
      if (dayToursSliderRef.current) {
        const dayTourCards = document.querySelectorAll('.daytour-card');
        let maxHeight = 0;
        dayTourCards.forEach(card => {
          card.style.height = 'auto';
          const height = card.offsetHeight;
          maxHeight = Math.max(maxHeight, height);
        });
        dayTourCards.forEach(card => {
          card.style.height = `${maxHeight}px`;
        });
      }
      
      if (groupToursSliderRef.current) {
        const groupTourCards = document.querySelectorAll('.grouptour-card');
        let maxHeight = 0;
        groupTourCards.forEach(card => {
          card.style.height = 'auto';
          const height = card.offsetHeight;
          maxHeight = Math.max(maxHeight, height);
        });
        groupTourCards.forEach(card => {
          card.style.height = `${maxHeight}px`;
        });
      }
    };
    
    // 在数据加载完成后，延迟执行高度均衡
    const timer = setTimeout(() => {
      equalizeCardHeights();
      window.addEventListener('resize', equalizeCardHeights);
    }, 500);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', equalizeCardHeights);
    };
    
  }, []);

  // 轮播设置
  const tourSliderSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 4,
    slidesToScroll: 4,
    arrows: false,
    autoplay: true,
    autoplaySpeed: 5000,
    pauseOnHover: true,
    swipeToSlide: true,
    cssEase: "cubic-bezier(0.165, 0.84, 0.44, 1)",
    responsive: [
      {
        breakpoint: 1200,
        settings: {
          slidesToShow: 3,
          slidesToScroll: 3,
          dots: true
        },
      },
      {
        breakpoint: 992,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 2,
          dots: true
        },
      },
      {
        breakpoint: 576,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
          dots: true,
          centerMode: true,
          centerPadding: '20px'
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

  // 加载指示器
  const LoadingSpinner = () => (
    <div className="text-center my-5">
      <Spinner animation="border" variant="primary" />
      <p className="mt-2">正在加载数据...</p>
    </div>
  );

  // 错误显示
  const ErrorMessage = ({ message }) => (
    <div className="text-center my-5 text-danger">
      <p>{message || "加载数据时发生错误，显示本地数据。"}</p>
    </div>
  );

  // 在Cards渲染前，批量预处理旅游产品数据
  const preprocessTourData = (tours) => {
    if (!tours || !Array.isArray(tours) || tours.length === 0) {
      return [];
    }
    
    // 批量获取，避免每个卡片单独请求
    console.log(`Home页面预处理${tours.length}个旅游产品数据`);
    
    return tours.map(tour => {
      // 检查数据来源，确定旅游类型
      let tourType = null;
      let apiTourType = null;
      
      // 识别旅游类型的逻辑
      const isMostLikelyDayTour = tour.day_tour_id || tour.tourCode?.includes('DT');
      const isMostLikelyGroupTour = tour.group_tour_id || tour.tourCode?.includes('GT');
      
      // 优先根据名称判断
      const nameIndicatesDayTour = (tour.name || tour.title || '')
        .toLowerCase()
        .includes('一日游');
        
      const nameIndicatesGroupTour = (tour.name || tour.title || '')
        .toLowerCase()
        .match(/跟团|团队|多日|日游(?!一日)/); // 匹配跟团，团队，多日，或者几日游(但不是一日游)
      
      // 打印识别结果
      console.log(`旅游ID=${tour.id}识别结果:`, {
        name: tour.name || tour.title,
        isMostLikelyDayTour,
        isMostLikelyGroupTour,
        nameIndicatesDayTour,
        nameIndicatesGroupTour
      });
      
      // 判断逻辑
      if (isMostLikelyDayTour || nameIndicatesDayTour) {
        tourType = 'day_tour';
        apiTourType = 'day';
      } 
      else if (isMostLikelyGroupTour || nameIndicatesGroupTour) {
        tourType = 'group_tour';
        apiTourType = 'group';
      }
      // 根据当前分组判断
      else if (window.location.pathname.includes('day-tours') || 
               window.location.href.includes('day-tours')) {
        tourType = 'day_tour';
        apiTourType = 'day';
      }
      else if (window.location.pathname.includes('group-tours') || 
               window.location.href.includes('group-tours')) {
        tourType = 'group_tour';
        apiTourType = 'group';
      }
      // 如果是在跟团游区域渲染的产品，默认为跟团游
      else if (tour.section === 'group_tours') {
        tourType = 'group_tour';
        apiTourType = 'group';
      }
      // 如果是在一日游区域渲染的产品，默认为一日游
      else if (tour.section === 'day_tours') {
        tourType = 'day_tour';
        apiTourType = 'day';
      }
      // 根据ID范围判断（通常ID 1-100为一日游，101-200为跟团游）
      else if (tour.id && tour.id <= 100) {
        tourType = 'day_tour';
        apiTourType = 'day';
      } else {
        tourType = 'group_tour';
        apiTourType = 'group';
      }
      
      console.log(`旅游ID=${tour.id}最终确定类型: ${tourType}, API类型: ${apiTourType}`);
      
      return {
        ...tour,
        name: tour.title || tour.name,
        image: tour.coverImage || tour.image || tour.image_url || '/images/placeholder.jpg',
        tours: tourType === 'day_tour' ? "一日游" : "跟团游",
        shortDes: tour.description,
        type: tourType,         // 设置前端类型
        tour_type: tourType,    // 设置tour_type字段
        api_tour_type: apiTourType, // 设置后端API需要的类型值
        price: Number(tour.price || 0),
        rating: tour.rating || "4.5"
      };
    });
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
            <Row className="mb-3">
              <Col>
                <div className="section-title-container">
                  <h2 className="section-title">精彩一日游</h2>
                  <Link to="/tours?tourTypes=day_tour" className="view-all-link">查看全部</Link>
                </div>
              </Col>
            </Row>

            {/* 一日游列表 */}
            <div className="day-tours">
              <div className="tour-slider-container">
                {error.dayTours ? (
                  <div className="error-message">{error.dayTours}</div>
                ) : loading.dayTours ? (
                  <div className="loading-container">
                    <div className="loader"></div>
                    <p>正在加载精彩一日游...</p>
                  </div>
                ) : dayTours.length === 0 ? (
                  <div className="no-data-message">暂无一日游数据</div>
                ) : (
                  <Slider ref={dayToursSliderRef} {...tourSliderSettings}>
                    {preprocessTourData(dayTours.slice(0, 8).map(tour => ({
                      ...tour,
                      section: 'day_tours' // 标记为一日游部分
                    }))).map((tour) => (
                      <div key={tour.id} className="tour-slide-item">
                        <Cards destination={tour} />
                      </div>
                    ))}
                  </Slider>
                )}
                {!loading.dayTours && dayTours.length > 0 && (
                  <>
                    <button 
                      className="slider-arrow slider-arrow-left" 
                      onClick={() => dayToursSliderRef.current.slickPrev()}
                    >
                      <FaChevronLeft />
                    </button>
                    <button 
                      className="slider-arrow slider-arrow-right" 
                      onClick={() => dayToursSliderRef.current.slickNext()}
                    >
                      <FaChevronRight />
                    </button>
                  </>
                )}
              </div>
            </div>
          </Container>
        </section>

        {/* 跟团游部分 */}
        <section className="group-tours-section py-5 bg-light">
          <Container>
            <Row className="mb-3">
              <Col>
                <div className="section-title-container">
                  <h2 className="section-title">热门跟团游</h2>
                  <Link to="/tours?tourTypes=group_tour" className="view-all-link">查看全部</Link>
                </div>
              </Col>
            </Row>

            {/* 跟团游列表 */}
            <div className="group-tours">
              <div className="tour-slider-container">
                {error.groupTours ? (
                  <div className="error-message">{error.groupTours}</div>
                ) : loading.groupTours ? (
                  <div className="loading-container">
                    <div className="loader"></div>
                    <p>正在加载精彩跟团游...</p>
                  </div>
                ) : groupTours.length === 0 ? (
                  <div className="no-data-message">暂无跟团游数据</div>
                ) : (
                  <Slider ref={groupToursSliderRef} {...tourSliderSettings}>
                    {preprocessTourData(groupTours.slice(0, 8).map(tour => ({
                      ...tour,
                      section: 'group_tours' // 标记为跟团游部分
                    }))).map((tour) => (
                      <div key={tour.id} className="tour-slide-item">
                        <Cards destination={tour} />
                      </div>
                    ))}
                  </Slider>
                )}
                {!loading.groupTours && groupTours.length > 0 && (
                  <>
                    <button 
                      className="slider-arrow slider-arrow-left" 
                      onClick={() => groupToursSliderRef.current.slickPrev()}
                    >
                      <FaChevronLeft />
                    </button>
                    <button 
                      className="slider-arrow slider-arrow-right" 
                      onClick={() => groupToursSliderRef.current.slickNext()}
                    >
                      <FaChevronRight />
                    </button>
                  </>
                )}
              </div>
            </div>
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

{/* 旅行主题部分 */}


        {/* 客户评价部分 */}
        <section className="testimonials-section py-5 bg-light">
          <Container>
            <Row className="mb-4">
              <Col className="text-center">
                <h2 className="section-title">客户评价</h2>
                <p className="text-muted">听听我们的客户怎么说</p>
              </Col>
            </Row>
            <Row>
              <Col md={4} className="mb-4">
                <Card className="testimonial-card h-100 border-0 shadow-sm">
                  <Card.Body>
                    <div className="testimonial-rating mb-3">
                      <FaStar className="text-warning" />
                      <FaStar className="text-warning" />
                      <FaStar className="text-warning" />
                      <FaStar className="text-warning" />
                      <FaStar className="text-warning" />
                    </div>
                    <Card.Text className="testimonial-text mb-4">
                      "我和家人参加了酒杯湾一日游，风景太美了！导游非常专业，给我们介绍了很多当地的历史和文化，让这次旅行变得更加难忘。强烈推荐给想要深度体验塔斯马尼亚的游客。"
                    </Card.Text>
                    <div className="testimonial-author d-flex align-items-center">
                      <div className="testimonial-author-info">
                        <h5 className="mb-0">王先生</h5>
                        <p className="text-muted mb-0">来自上海</p>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={4} className="mb-4">
                <Card className="testimonial-card h-100 border-0 shadow-sm">
                  <Card.Body>
                    <div className="testimonial-rating mb-3">
                      <FaStar className="text-warning" />
                      <FaStar className="text-warning" />
                      <FaStar className="text-warning" />
                      <FaStar className="text-warning" />
                      <FaStar className="text-warning" />
                    </div>
                    <Card.Text className="testimonial-text mb-4">
                      "塔斯马尼亚五日游超出了我的期望！住宿、餐饮都安排得很好，行程紧凑但不赶，让我们有足够的时间欣赏每个景点。尤其是摇篮山，太美了，以后有机会还想再去！"
                    </Card.Text>
                    <div className="testimonial-author d-flex align-items-center">
                      <div className="testimonial-author-info">
                        <h5 className="mb-0">李女士</h5>
                        <p className="text-muted mb-0">来自北京</p>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={4} className="mb-4">
                <Card className="testimonial-card h-100 border-0 shadow-sm">
                  <Card.Body>
                    <div className="testimonial-rating mb-3">
                      <FaStar className="text-warning" />
                      <FaStar className="text-warning" />
                      <FaStar className="text-warning" />
                      <FaStar className="text-warning" />
                      <FaStar className="text-warning" />
                    </div>
                    <Card.Text className="testimonial-text mb-4">
                      "作为一个摄影爱好者，我参加了摇篮山跟团游，导游知道我对摄影感兴趣，特意带我们去了几个绝佳的拍摄点。服务非常贴心，行程安排也很合理，让我拍到了很多满意的照片。"
                    </Card.Text>
                    <div className="testimonial-author d-flex align-items-center">
                      <div className="testimonial-author-info">
                        <h5 className="mb-0">张先生</h5>
                        <p className="text-muted mb-0">来自广州</p>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Container>
        </section>
        {/* 精彩瞬间部分 */}
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

export default Home;
