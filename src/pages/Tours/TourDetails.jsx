import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Tab, Nav, Accordion, Button, Badge, Card, Form, Spinner, Alert } from 'react-bootstrap';
import { Link, useParams, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import ImageGallery from 'react-image-gallery';
import { FaMapMarkerAlt, FaCalendarAlt, FaUsers, FaLanguage, FaCheck, FaTimes, FaStar, FaStarHalfAlt, FaRegStar, FaPhoneAlt, FaClock, FaInfoCircle, FaQuestionCircle, FaLightbulb, FaUtensils, FaBed, FaHiking, FaChevronDown, FaChevronUp, FaQuoteLeft, FaQuoteRight, FaHotel, FaChild, FaTicketAlt, FaPercent, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { getTourById, getGroupTourById, getDayTourById, getAgentDiscountRate, calculateTourDiscount } from '../../utils/api';
import { addToCart } from '../../store/slices/bookingSlice';
import { formatDate, calculateDiscountPrice } from '../../utils/helpers';
import PriceDisplay from '../../components/PriceDisplay';
import './tourDetails.css';
import 'react-image-gallery/styles/css/image-gallery.css';

// 导入默认图片
import defaultImage from '../../assets/images/new/1.jpg';

// 主题色
const themeColor = "#ff6b6b";

const TourDetails = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [adultCount, setAdultCount] = useState(2);
  const [childCount, setChildCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tourData, setTourData] = useState(null);
  const [tourType, setTourType] = useState('');
  const [itinerary, setItinerary] = useState([]);
  const [highlights, setHighlights] = useState([]);
  const [inclusions, setInclusions] = useState([]);
  const [exclusions, setExclusions] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [tips, setTips] = useState([]);
  const [images, setImages] = useState([]);
  const [discountedPrice, setDiscountedPrice] = useState(null);
  const [loadingDiscount, setLoadingDiscount] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useSelector(state => state.auth);
  const dispatch = useDispatch();
  
  // 从URL路径和查询参数中确定类型
  const determineType = () => {
    // 1. 首先从路径中判断，这是最优先的
    if (location.pathname.includes('/day-tours/')) {
      return 'day';
    } else if (location.pathname.includes('/group-tours/')) {
      return 'group';
    }
    
    // 2. 从查询参数中获取
    const searchParams = new URLSearchParams(location.search);
    const typeParam = searchParams.get('type');
    if (typeParam) {
      return typeParam;
    }
    
    // 3. 默认值
    return 'day';
  };
  
  // 获取类型参数
  const type = determineType();
  
  // 检查用户是否是代理商
  const userRole = user?.role || localStorage.getItem('userType');
  const isAgent = userRole === 'agent';
  const agentId = user?.agentId || localStorage.getItem('agentId');
  const discountRate = user?.discountRate || localStorage.getItem('discountRate');

  // 获取今天的日期作为最小日期
  const today = new Date().toISOString().split('T')[0];

  const fetchingRef = useRef(false); // 用于追踪请求状态
  const fetchTimeoutRef = useRef(null); // 用于存储防抖定时器
  const retryCountRef = useRef(0); // 用于追踪重试次数
  const MAX_RETRIES = 2; // 最大重试次数

  // 格式化日期显示
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
    });
  };

  useEffect(() => {
    const fetchTourDetails = async () => {
      // 如果已经在请求中，直接返回
      if (fetchingRef.current) {
        console.log('请求已在进行中，跳过重复请求');
        return;
      }

      try {
        // 标记为正在请求
        fetchingRef.current = true;
        setLoading(true);
        setError(null);
        
        // 确定获取的旅游类型和ID
        const tourId = id;
        const apiTourType = type === 'day' ? 'day' : 'group';
        console.log(`获取旅游信息: ID=${tourId}, 类型=${apiTourType}`);
        
        // 设置页面状态
        setTourType(apiTourType === 'day' ? 'day_tour' : 'group_tour');
        
        // 获取旅游详情
        let response;
        try {
          response = await getTourById(tourId, apiTourType);
        } catch (error) {
          console.error(`获取${apiTourType}类型旅游数据失败:`, error);
          response = null;
        }
        
        // 如果没有获取到数据，尝试另一种类型
        if (!response || !response.data) {
          const alternativeType = apiTourType === 'day' ? 'group' : 'day';
          console.log(`尝试获取${alternativeType}类型旅游数据...`);
          
          try {
            response = await getTourById(tourId, alternativeType);
            
            if (response && response.data) {
              console.log(`成功使用${alternativeType}类型获取数据`);
              // 更新类型
              setTourType(alternativeType === 'day' ? 'day_tour' : 'group_tour');
            }
          } catch (altError) {
            console.error(`获取${alternativeType}类型旅游数据也失败:`, altError);
          }
        }
        
        // 处理获取到的旅游数据
        if (response && response.code === 1 && response.data) {
          const tourData = response.data;
          console.log('获取到的旅游数据:', tourData);
          setTourData(tourData);
          
          // 处理类型特定的数据
          processTourData(tourData, apiTourType);
        } else {
          console.error('无法获取有效的旅游数据:', response);
          setError('无法获取旅游数据，请稍后重试');
          setImages([]);
        }
        
        // 请求完成，重置状态
        fetchingRef.current = false;
        retryCountRef.current = 0;
        setLoading(false);
      } catch (err) {
        console.error('获取旅游详情失败:', err);
        setError('获取旅游详情失败，请稍后重试');
        fetchingRef.current = false;
        setLoading(false);
        setImages([]);
      }
    };
    
    const processTourData = (tourData, tourType) => {
      try {
        // 处理基本数据
        if (tourData.highlights) setHighlights(Array.isArray(tourData.highlights) ? tourData.highlights : [tourData.highlights]);
        if (tourData.inclusions) setInclusions(Array.isArray(tourData.inclusions) ? tourData.inclusions : [tourData.inclusions]);
        if (tourData.exclusions) setExclusions(Array.isArray(tourData.exclusions) ? tourData.exclusions : [tourData.exclusions]);
        if (tourData.faqs) setFaqs(Array.isArray(tourData.faqs) ? tourData.faqs : [tourData.faqs]);
        if (tourData.tips) setTips(Array.isArray(tourData.tips) ? tourData.tips : [tourData.tips]);
        
        // 处理行程
        if (tourData.itinerary) {
          if (tourType === 'day') {
            setItinerary(Array.isArray(tourData.itinerary) ? tourData.itinerary.map(item => ({
              ...item,
              day_number: 1,
              type: 'time_slot'
            })) : [{
              day_number: 1,
              type: 'time_slot',
              description: tourData.itinerary
            }]);
          } else {
            setItinerary(Array.isArray(tourData.itinerary) ? tourData.itinerary : [tourData.itinerary]);
          }
        }
        
        // 处理图片
        processImages(tourData);
      } catch (processError) {
        console.error('处理旅游数据时出错:', processError);
      }
    };
    
    const processImages = (tourData) => {
      try {
        console.log('开始处理图片数据:', tourData);
        if (tourData && tourData.images && Array.isArray(tourData.images) && tourData.images.length > 0) {
          // 存在多张图片，直接使用后端提供的图片数组
          console.log('处理后端提供的多张图片：', tourData.images.length, '张');
          const galleryImages = tourData.images.map((img, index) => {
            // 对阿里云OSS图片URL进行处理以解决CORS问题
            const imageUrl = img.image_url ? proxyImageUrl(img.image_url) : '';
            
            return {
              original: imageUrl,
              thumbnail: imageUrl,
              description: img.description || `${tourData?.title || tourData?.name} 图片 ${index + 1}`,
              originalAlt: img.description || `${tourData?.title || tourData?.name} 图片`,
              thumbnailAlt: img.description || `${tourData?.title || tourData?.name} 缩略图`,
              location: tourData?.location || '塔斯马尼亚'
            };
          });
          console.log('轮播图数据处理完成:', galleryImages);
          setImages(galleryImages);
        } else if (tourData && tourData.coverImage) {
          // 只有封面图
          console.log('使用封面图:', tourData.coverImage);
          const coverImageUrl = proxyImageUrl(tourData.coverImage);
          
          setImages([
            {
              original: coverImageUrl,
              thumbnail: coverImageUrl,
              description: tourData?.description?.slice(0, 100) || `${tourData?.title || tourData?.name} 封面图`,
              originalAlt: tourData?.title || tourData?.name,
              thumbnailAlt: `${tourData?.title || tourData?.name} 缩略图`,
              location: tourData?.location || '塔斯马尼亚'
            }
          ]);
        } else {
          // 没有图片，返回空数组
          console.log('没有找到图片数据');
          setImages([]);
        }
      } catch (error) {
        console.error('处理图片时出错:', error);
        setImages([]);
      }
    };
    
    // 处理阿里云OSS图片URL，解决CORS问题
    const proxyImageUrl = (url) => {
      if (!url) return '';
      
      // 方法1: 使用后端代理 - 如果后端有提供图片代理API
      // return `${process.env.REACT_APP_API_URL}/api/proxy-image?url=${encodeURIComponent(url)}`;
      
      // 方法2: 将HTTP改为HTTPS（如果问题是协议不匹配）
      if (url.startsWith('http:') && window.location.protocol === 'https:') {
        return url.replace('http:', 'https:');
      }
      
      // 方法3: 使用公共图片代理服务
      // 注意: 生产环境中应该使用自己的代理或确保阿里云OSS配置了正确的CORS
      return `https://images.weserv.nl/?url=${encodeURIComponent(url)}`;
      
      // 方法4: 如果您在开发环境中，可以尝试直接返回URL（需要禁用浏览器的CORS检查）
      // return url;
    };
    
    // 获取数据
    fetchTourDetails();
    
    // 清理函数
    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, [id, location.pathname, location.search]);

  // 获取折扣价格
  const fetchDiscountPrice = async () => {
    if (tourData && isAgent && agentId && !loadingDiscount) {
      try {
        setLoadingDiscount(true);
        console.log('开始计算折扣价格:', { tourData, isAgent, agentId });
        
        // 确保价格为数值
        const originalPrice = Number(tourData.price) || 0;
        const tourId = Number(id) || 0;
        
        if (originalPrice <= 0 || tourId <= 0) {
          console.warn('价格或ID无效，无法计算折扣', { originalPrice, tourId });
          setDiscountedPrice(originalPrice);
          setLoadingDiscount(false);
          return;
        }
        
        // 确定旅游类型
        let effectiveTourType;
        
        // 优先使用tourData中的类型信息
        if (tourData.tour_type) {
          console.log(`使用API返回的tourData.tour_type: ${tourData.tour_type}`);
          if (tourData.tour_type.includes('day')) {
            effectiveTourType = 'day';
          } else if (tourData.tour_type.includes('group')) {
            effectiveTourType = 'group';
          } else {
            effectiveTourType = 'day'; // 默认值
          }
        }
        // 其次使用页面上的状态和URL中的类型
        else {
          const urlTourType = type || tourType;
          
          console.log(`使用页面状态的类型: ${urlTourType}`);
          
          // 从不同来源获取tourType，确保最终得到正确的值
          if (typeof urlTourType === 'string') {
            if (urlTourType.includes('day') || urlTourType === 'day') {
              effectiveTourType = 'day';
            } else if (urlTourType.includes('group') || urlTourType === 'group') {
              effectiveTourType = 'group';
            } else if (window.location.pathname.includes('day-tours')) {
              effectiveTourType = 'day';
            } else if (window.location.pathname.includes('group-tours')) {
              effectiveTourType = 'group';
            } else {
              effectiveTourType = 'day'; // 默认值
            }
          } else {
            effectiveTourType = 'day'; // 默认值
          }
        }
        
        console.log(`执行折扣计算: 产品ID=${tourId}, 类型=${effectiveTourType}, 原价=${originalPrice}`);
        
        // 多次尝试调用API以确保请求成功
        let attempts = 0;
        let success = false;
        let discountResult = null;
        
        while (attempts < 3 && !success) {
          try {
            discountResult = await calculateTourDiscount({
              tourId: tourId,
              tourType: effectiveTourType,
              originalPrice: originalPrice,
              agentId: agentId
            });
            
            if (discountResult && !discountResult.error) {
              success = true;
            } else {
              console.warn(`第${attempts + 1}次计算折扣失败:`, discountResult);
              await new Promise(resolve => setTimeout(resolve, 500)); // 延迟500ms再试
            }
          } catch (retryError) {
            console.error(`第${attempts + 1}次计算折扣出错:`, retryError);
          }
          attempts++;
        }
        
        console.log('折扣价格计算结果:', discountResult);
        
        if (success && discountResult.discountedPrice !== undefined) {
          setDiscountedPrice(discountResult.discountedPrice);
          console.log(`后端计算折扣: 原价=${originalPrice}, 折扣价=${discountResult.discountedPrice}, 折扣率=${discountResult.discountRate}`);
        } else {
          console.warn('无法获取有效的折扣价格，使用原价');
          setDiscountedPrice(originalPrice);
        }
        
        setLoadingDiscount(false);
      } catch (error) {
        console.error('计算折扣价格失败:', error);
        setDiscountedPrice(tourData.price);
        setLoadingDiscount(false);
      }
    } else {
      console.log('不需要计算折扣价格:', { 
        tourDataExists: !!tourData, 
        isAgent, 
        agentIdExists: !!agentId, 
        loadingDiscount 
      });
    }
  };

  // 当旅游详情加载完成且用户是代理商时，获取折扣价格
  useEffect(() => {
    fetchDiscountPrice();
  }, [tourData, isAgent, agentId]);

  // 渲染星级评分
  const renderRating = (rating) => {
    const ratingNum = parseFloat(rating);
    const fullStars = Math.floor(ratingNum);
    const hasHalfStar = ratingNum % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    return (
      <div className="d-flex align-items-center">
        {[...Array(fullStars)].map((_, i) => (
          <FaStar key={`full-${i}`} className="text-warning me-1" />
        ))}
        {hasHalfStar && <FaStarHalfAlt className="text-warning me-1" />}
        {[...Array(emptyStars)].map((_, i) => (
          <FaRegStar key={`empty-${i}`} className="text-warning me-1" />
        ))}
        <span className="ms-1 text-muted">{tourData?.reviews}</span>
      </div>
    );
  };

  // 计算总价
  const calculateTotalPrice = () => {
    const basePrice = parseFloat(tourData?.price || 0);
    return (adultCount * basePrice + childCount * basePrice * 0.7).toFixed(2);
  };

  // 渲染主要内容
  const renderContent = () => {
    if (loading) {
      return (
        <Container className="py-5 text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">正在加载旅游详情...</p>
        </Container>
      );
    }

    if (error) {
      return (
        <Container className="py-5">
          <Alert variant="danger">
            <Alert.Heading>加载失败</Alert.Heading>
            <p>{error}</p>
            <hr />
            <div className="d-flex justify-content-between">
              <Button onClick={() => navigate(-1)} variant="outline-danger">返回上一页</Button>
              <Button onClick={() => window.location.reload()} variant="outline-primary">重新加载</Button>
            </div>
          </Alert>
        </Container>
      );
    }

    if (!tourData) {
      return (
        <Container className="py-5">
          <Alert variant="warning">
            <Alert.Heading>未找到旅游信息</Alert.Heading>
            <p>未能找到相关旅游产品的详细信息。</p>
            <Button onClick={() => navigate('/tours')} variant="outline-primary">返回旅游列表</Button>
          </Alert>
        </Container>
      );
    }

    return (
      <div className="tour-details-page">
        {/* 面包屑导航 */}
        <Container>
          <div className="breadcrumbs mb-4">
            <Link to="/">首页</Link> / 
            {tourType === 'day_tour' ? (
              <Link to="/tours?tourTypes=day_tour">一日游</Link>
            ) : (
              <Link to="/tours?tourTypes=group_tour">跟团游</Link>
            )} / 
            <span>{tourData?.title || tourData?.name}</span>
          </div>
        </Container>

        {/* 页面标题 */}
        <Container>
          <div className="tour-header mb-4">
            <h1 className="tour-title">{tourData?.title || tourData?.name}</h1>
            <div className="d-flex flex-wrap align-items-center gap-3 mt-2 tour-meta">
              {tourType === 'day_tour' ? (
                // 一日游特有信息
                <>
                  
                  {tourData?.departureTime && (
                    <div className="tour-departure-time">
                      <FaClock className="me-1 text-primary" />
                      <span>出发时间: {tourData.departureTime}</span>
                    </div>
                  )}
                </>
              ) : (
                // 跟团游特有信息
                <>
                  
                  {tourData?.departureInfo && (
                    <div className="tour-departure-info">
                      <FaInfoCircle className="me-1 text-primary" />
                      <span>出发信息: {tourData.departureInfo}</span>
                    </div>
                  )}
                </>
              )}
              
              <div className="tour-location">
                <FaMapMarkerAlt className="me-1 text-danger" />
                <span>{tourData?.location || '塔斯马尼亚'}</span>
              </div>
              
              {tourData?.groupSize && (
                <div className="tour-group-size">
                  <FaUsers className="me-1 text-primary" />
                  <span>团队规模: {tourData.groupSize}</span>
                </div>
              )}
              
              {tourData?.language && (
                <div className="tour-language">
                  <FaLanguage className="me-1 text-primary" />
                  <span>导游语言: {tourData.language}</span>
                </div>
              )}
              
              <div className="tour-rating ms-auto">
                {renderRating(tourData?.rating || 4.5)}
              </div>
            </div>
          </div>
        </Container>
        
        {/* 旅游图片轮播 */}
        <Container className="mb-5">
          <div className="gallery-section">
            <div className="gallery-header">
              <h3 className="section-title">探索{tourData?.title || tourData?.name}的精彩瞬间</h3>
              <p className="section-subtitle">浏览全部{images.length}张图片，了解更多景点细节</p>
            </div>
            {renderImageGallery()}
          </div>
        </Container>

        {/* 主要内容区域 */}
        <Container className="main-content mb-5">
          <Row>
            <Col lg={8}>
              <Tab.Container id="tour-tabs" defaultActiveKey="overview">
                <div className="tour-tabs-wrapper">
                  <Nav variant="tabs" className="tour-tabs mb-4">
                    <Nav.Item>
                      <Nav.Link eventKey="overview" onClick={() => setActiveTab('overview')}>行程概况</Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                      <Nav.Link eventKey="itinerary" onClick={() => setActiveTab('itinerary')}>行程安排</Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                      <Nav.Link eventKey="fees" onClick={() => setActiveTab('fees')}>费用说明</Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                      <Nav.Link eventKey="location" onClick={() => setActiveTab('location')}>地图位置</Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                      <Nav.Link eventKey="faq" onClick={() => setActiveTab('faq')}>常见问题</Nav.Link>
                    </Nav.Item>
                  </Nav>

                  <Tab.Content>
                    <Tab.Pane eventKey="overview">
                      <div className="tour-description mb-4">
                        <h3 className="section-title">行程介绍</h3>
                        <p>{tourData?.description || tourData?.intro || tourData?.des}</p>
                      </div>

                      <div className="tour-highlights mb-4">
                        <h3 className="section-title">行程亮点</h3>
                        {highlights && highlights.length > 0 ? (
                          <ul className="highlights-list">
                            {highlights.map((highlight, index) => (
                              <li key={index}>{highlight}</li>
                            ))}
                          </ul>
                        ) : (
                          <Alert variant="info">暂无亮点信息，请联系客服了解详情。</Alert>
                        )}
                      </div>

                      <div className="mb-4">
                        <h3 className="section-title">旅行贴士</h3>
                        <Card>
                          <Card.Body>
                            {tips && tips.length > 0 ? (
                              <ul className="tips-list">
                                {tips.map((tip, index) => (
                                  <li key={index} className="d-flex">
                                    <FaLightbulb className="text-warning mt-1 me-2" />
                                    <span>{tip}</span>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <Alert variant="info">暂无旅行贴士，请联系客服了解详情。</Alert>
                            )}
                          </Card.Body>
                        </Card>
                      </div>
                    </Tab.Pane>

                    <Tab.Pane eventKey="itinerary">
                      <h3 className="section-title">详细行程</h3>
                      {itinerary && itinerary.length > 0 ? (
                        <>
                          {tourType === 'day_tour' ? (
                            // 一日游行程展示（按时间段）
                            <div className="day-tour-itinerary">
                              <h4 className="mb-3">行程安排</h4>
                              <div className="timeline">
                                {itinerary.map((item, index) => (
                                  <div className="timeline-item" key={index}>
                                    <div className="timeline-badge">
                                      <FaClock className="text-white" />
                                    </div>
                                    <div className="timeline-panel">
                                      <div className="timeline-heading">
                                        <h5 className="timeline-title">
                                          <span className="time">{item.time_slot}</span> - {item.activity}
                                        </h5>
                                        {item.location && (
                                          <p className="timeline-location">
                                            <FaMapMarkerAlt className="me-1 text-danger" />
                                            {item.location}
                                          </p>
                                        )}
                                      </div>
                                      {item.description && (
                                        <div className="timeline-body mt-2">
                                          <p>{item.description}</p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            // 跟团游行程展示（按天）
                            <Accordion defaultActiveKey="0" className="itinerary-accordion">
                              {itinerary.map((day, index) => (
                                <Accordion.Item eventKey={index.toString()} key={index}>
                                  <Accordion.Header>
                                    {day.title ? (
                                      <span dangerouslySetInnerHTML={{ __html: day.title }} />
                                    ) : (
                                      <span>第{day.day_number || (index + 1)}天</span>
                                    )}
                                  </Accordion.Header>
                                  <Accordion.Body>
                                    <div className="day-details">
                                      {day.des && <p className="day-description">{day.des}</p>}
                                      {day.description && <p className="day-description">{day.description}</p>}
                                      
                                      {day.image && (
                                        <div className="day-image mb-3">
                                          <img src={day.image} alt={`第${day.day_number || (index + 1)}天景点`} className="img-fluid rounded" />
                                        </div>
                                      )}
                                      
                                      {day.meals && (
                                        <div className="day-meals mb-2">
                                          <strong className="me-2">餐食:</strong>
                                          <span>{day.meals}</span>
                                        </div>
                                      )}
                                      
                                      {day.accommodation && (
                                        <div className="day-accommodation mb-2">
                                          <strong className="me-2">住宿:</strong>
                                          <span>{day.accommodation}</span>
                                        </div>
                                      )}
                                      
                                      {day.activities && day.activities.length > 0 && (
                                        <div className="day-activities">
                                          <strong className="me-2">活动:</strong>
                                          <div className="d-flex flex-wrap">
                                            {day.activities.map((activity, i) => (
                                              <Badge
                                                key={i}
                                                bg="light"
                                                text="dark"
                                                className="me-2 mb-2 p-2"
                                              >
                                                {activity}
                                              </Badge>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </Accordion.Body>
                                </Accordion.Item>
                              ))}
                            </Accordion>
                          )}
                        </>
                      ) : (
                        <Alert variant="info">暂无详细行程信息，请联系客服了解详情。</Alert>
                      )}
                    </Tab.Pane>

                    <Tab.Pane eventKey="fees">
                      <div className="fees-section">
                        <div className="included-fees mb-4">
                          <h3 className="section-title">费用包含</h3>
                          {inclusions && inclusions.length > 0 ? (
                            <ul className="included-list">
                              {inclusions.map((item, index) => (
                                <li key={index} className="d-flex">
                                  <FaCheck style={{ color: themeColor }} className="mt-1 me-2" />
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <Alert variant="info">暂无费用包含信息，请联系客服了解详情。</Alert>
                          )}
                        </div>
                        
                        <div className="excluded-fees mb-4">
                          <h3 className="section-title">费用不包含</h3>
                          {exclusions && exclusions.length > 0 ? (
                            <ul className="excluded-list">
                              {exclusions.map((item, index) => (
                                <li key={index} className="d-flex">
                                  <FaTimes className="text-danger mt-1 me-2" />
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <Alert variant="info">暂无费用不包含信息，请联系客服了解详情。</Alert>
                          )}
                        </div>
                      </div>
                    </Tab.Pane>

                    <Tab.Pane eventKey="location">
                      <h3 className="section-title">地图位置</h3>
                      <div className="map-container">
                        {tourData?.mapLocation ? (
                          <iframe
                            src={tourData.mapLocation}
                            width="100%"
                            height="450"
                            style={{ border: 0 }}
                            allowFullScreen=""
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                            title="地图位置"
                          ></iframe>
                        ) : (
                          <Alert variant="info">暂无地图信息</Alert>
                        )}
                      </div>
                    </Tab.Pane>

                    <Tab.Pane eventKey="faq">
                      <h3 className="section-title">常见问题</h3>
                      {faqs && faqs.length > 0 ? (
                        <Accordion className="faq-accordion">
                          {faqs.map((faq, index) => (
                            <Accordion.Item eventKey={index.toString()} key={index}>
                              <Accordion.Header>
                                <div className="d-flex align-items-center">
                                  <FaQuestionCircle className="text-primary me-2" />
                                  <span>{faq.question}</span>
                                </div>
                              </Accordion.Header>
                              <Accordion.Body>
                                <p>{faq.answer}</p>
                              </Accordion.Body>
                            </Accordion.Item>
                          ))}
                        </Accordion>
                      ) : (
                        <Alert variant="info">暂无常见问题信息，请联系客服了解详情。</Alert>
                      )}
                    </Tab.Pane>
                  </Tab.Content>
                </div>
              </Tab.Container>
            </Col>
            
            <Col lg={4}>
              <div className="tour-sidebar">
                {/* 预订卡片 */}
                <Card className="booking-card mb-4">
                  <Card.Body>
                    <div className="price-section mb-4">
                      <h5 className="mb-2">价格</h5>
                      <div className="text-end">
                        {loadingDiscount ? (
                          <Spinner animation="border" size="sm" />
                        ) : (
                          <PriceDisplay 
                            originalPrice={Number(tourData?.price || 0)}
                            discountedPrice={isAgent ? discountedPrice : null}
                            currency="¥"
                            size="large"
                            showBadge={true}
                          />
                        )}
                      </div>
                      
                      {isAgent && discountRate && (
                        <div className="agent-info mt-2">
                          <Badge bg="info" className="d-flex align-items-center">
                            <FaPercent className="me-1" /> 代理商折扣率: {Math.round(discountRate * 100)}%
                          </Badge>
                        </div>
                      )}
                    </div>
                    
                    <div className="tour-details-section mb-4">
                      <h5 className="mb-2">行程详情</h5>
                      <div className="tour-info-list">
                        <div className="tour-info-row d-flex align-items-center mb-2">
                          <FaInfoCircle className="text-danger me-2" />
                          <span>请咨询客服了解详细出发信息</span>
                        </div>
                        <div className="tour-info-row d-flex align-items-center mb-2">
                          <FaUsers className="text-danger me-2" />
                          <span>2-16人</span>
                        </div>
                        <div className="tour-info-row d-flex align-items-center mb-0">
                          <FaLanguage className="text-danger me-2" />
                          <span>中文导游</span>
                        </div>
                      </div>
                    </div>

                    {isAuthenticated ? (
                      <Link to={`/booking/${id}`} className="d-block mb-3">
                        <Button variant="primary" style={{ backgroundColor: '#FF6B6B', borderColor: '#FF6B6B' }} size="lg" className="w-100 py-2">
                          立即预订
                        </Button>
                      </Link>
                    ) : (
                      <Link to={`/login`} state={{ from: `/booking/${id}`, message: "请先登录后再进行预订" }} className="d-block mb-3">
                        <Button variant="primary" style={{ backgroundColor: '#FF6B6B', borderColor: '#FF6B6B' }} size="lg" className="w-100 py-2">
                          立即预订
                        </Button>
                      </Link>
                    )}
                    
                    <Button variant="outline-secondary" className="w-100 py-2">
                      加入收藏
                    </Button>
                  </Card.Body>
                </Card>

                {/* 帮助卡片 */}
                <Card className="help-card">
                  <Card.Body>
                    <h5 className="mb-3">需要帮助?</h5>
                    <div className="contact-info mb-3">
                      <div className="d-flex align-items-center mb-2">
                        <FaPhoneAlt style={{ color: themeColor }} className="me-2" />
                        <div>
                          <div className="phone-number fw-bold">400-123-4567</div>
                          <small className="text-muted">周一至周日 9:00-18:00</small>
                        </div>
                      </div>
                    </div>
                    <div className="help-options">
                      <Button variant="outline-primary" style={{ borderColor: themeColor, color: themeColor }} size="sm" className="me-2 mb-2">
                        在线咨询
                      </Button>
                      <Button variant="outline-primary" style={{ borderColor: themeColor, color: themeColor }} size="sm" className="me-2 mb-2">
                        预约回电
                      </Button>
                      <Button variant="outline-primary" style={{ borderColor: themeColor, color: themeColor }} size="sm" className="mb-2">
                        邮件咨询
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </div>
            </Col>
          </Row>
        </Container>
      </div>
    );
  };

  // 渲染轮播图组件
  const renderImageGallery = () => {
    // 如果没有图片数据，则不显示轮播图
    if (!images || images.length === 0) {
      return (
        <div className="text-center py-4">
          <p className="text-muted">暂无图片</p>
        </div>
      );
    }

    return (
      <div className="custom-gallery-wrapper">
        <ImageGallery
          items={images}
          showPlayButton={false}
          showFullscreenButton={false}
          showThumbnails={true}
          showNav={true}
          showBullets={false}
          showIndex={false}
          lazyLoad={true}
          thumbnailPosition="bottom"
          slideDuration={300}
          slideInterval={5000}
          startIndex={0}
          additionalClass="tour-image-gallery modern-gallery"
          useBrowserFullscreen={false}
          preventDefaultTouchmoveEvent={true}
          swipingTransitionDuration={400}
          slideOnThumbnailOver={false}
          useWindowKeyDown={true}
          infinite={true}
          onSlide={(currentIndex) => setActiveIndex(currentIndex)}
          renderCustomControls={() => (
            <div className="image-counter">
              <span>{activeIndex + 1}</span>
              <span className="divider">/</span>
              <span className="total">{images.length}</span>
            </div>
          )}
          renderLeftNav={(onClick, disabled) => (
            <button
              type="button"
              className="gallery-nav gallery-nav-left"
              disabled={disabled}
              onClick={onClick}
              aria-label="上一张"
            >
              <div className="nav-icon-container">
                <FaChevronLeft size={18} />
              </div>
            </button>
          )}
          renderRightNav={(onClick, disabled) => (
            <button
              type="button"
              className="gallery-nav gallery-nav-right"
              disabled={disabled}
              onClick={onClick}
              aria-label="下一张"
            >
              <div className="nav-icon-container">
                <FaChevronRight size={18} />
              </div>
            </button>
          )}
          renderThumbInner={(item) => (
            <div className="custom-thumbnail">
              <div className="thumbnail-loading-placeholder"></div>
              <img 
                src={item.thumbnail} 
                alt={item.thumbnailAlt || "缩略图"} 
                title={item.description || ""}
                className="thumbnail-image"
                loading="lazy"
                onLoad={(e) => {
                  e.target.classList.add('loaded');
                  const placeholder = e.target.previousElementSibling;
                  if (placeholder) placeholder.style.display = 'none';
                }}
                onError={(e) => {
                  console.log('缩略图加载失败');
                  const placeholder = e.target.previousElementSibling;
                  if (placeholder) placeholder.style.display = 'none';
                }}
              />
            </div>
          )}
          renderItem={(item, index) => (
            <div className="custom-gallery-slide">
              <div className="image-gradient-overlay"></div>
              <div className="slide-location">
                <FaMapMarkerAlt className="location-icon" /> 
                <span>{item.location || tourData?.location || '塔斯马尼亚'}</span>
              </div>
              
              <div className="image-loading-placeholder"></div>
              <img
                src={item.original}
                alt={item.originalAlt || "景点图片"}
                className="main-image"
                loading={index === 0 ? "eager" : "lazy"}
                onLoad={(e) => {
                  e.target.classList.add('loaded');
                  const placeholder = e.target.previousElementSibling;
                  if (placeholder) placeholder.style.display = 'none';
                }}
                onError={(e) => {
                  console.log('主图加载失败');
                  const placeholder = e.target.previousElementSibling;
                  if (placeholder) placeholder.style.display = 'none';
                }}
              />
              
              {item.description && (
                <div className="slide-description">
                  <span>{item.description}</span>
                </div>
              )}
            </div>
          )}
        />
        <div className="gallery-info d-none d-md-block">
          <div className="tour-info-tag">
            <span>探索{tourData?.title || tourData?.name}的精彩瞬间</span>
          </div>
          <div className="gallery-count-info">
            共{images.length}张精选照片
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="tour-details-page">
      {renderContent()}
    </div>
  );
};

export default TourDetails;