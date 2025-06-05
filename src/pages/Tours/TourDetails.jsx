import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Container, Row, Col, Tab, Nav, Accordion, Button, Badge, Card, Form, Spinner, Alert, Modal } from 'react-bootstrap';
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
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { getHotelPrices, calculateTourPrice } from '../../services/bookingService';

// 导入默认图片
import defaultImage from '../../assets/images/new/1.jpg';

// 日期选择器自定义样式
const datePickerStyles = {
  zIndex: 9999,
  position: 'relative'
};

// 主题色
const themeColor = "#ff6b6b";

const TourDetails = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 7); // 默认结束日期为7天后
    return date;
  });
  const [adultCount, setAdultCount] = useState(2);
  const [childCount, setChildCount] = useState(0);
  const [roomCount, setRoomCount] = useState(1);
  const [selectedAdultCount, setSelectedAdultCount] = useState(2); // 用户选择的成人数量
  const [selectedChildCount, setSelectedChildCount] = useState(0); // 用户选择的儿童数量
  const [selectedRoomCount, setSelectedRoomCount] = useState(1); // 用户选择的房间数量
  const [selectedDate, setSelectedDate] = useState(new Date()); // 用户选择的日期 - 确保初始化为Date对象
  const [requiresDateSelection, setRequiresDateSelection] = useState(false); // 是否需要选择日期
  const [calculatedPrice, setCalculatedPrice] = useState(null); // 计算的价格信息
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
  const [selectedHotelLevel, setSelectedHotelLevel] = useState('4星');
  const [hotelPrices, setHotelPrices] = useState([]);
  const [hotelPriceDifference, setHotelPriceDifference] = useState(0);
  const [isPriceLoading, setIsPriceLoading] = useState(false);
  const [totalPrice, setTotalPrice] = useState(null);
  const [priceDebounceTimer, setPriceDebounceTimer] = useState(null); // 添加防抖定时器状态
  const [reviews, setReviews] = useState([]);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [childrenAges, setChildrenAges] = useState([]);
  const [showChildAgeInputs, setShowChildAgeInputs] = useState(false);
  
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, userType } = useSelector(state => state.auth);
  const dispatch = useDispatch();
  
  // 处理搜索参数
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    
    // 从搜索参数中获取并设置相关值
    const fromSearch = searchParams.get('fromSearch');
    if (fromSearch === 'true') {
      console.log('从搜索页面跳转，处理搜索参数...');
      
      // 处理日期参数
      const startDateParam = searchParams.get('startDate');
      if (startDateParam) {
        const parsedStartDate = new Date(startDateParam);
        if (!isNaN(parsedStartDate.getTime())) {
          setStartDate(parsedStartDate);
          setSelectedDate(parsedStartDate);
          console.log('设置开始日期:', parsedStartDate);
        }
      }
      
      const endDateParam = searchParams.get('endDate');
      if (endDateParam) {
        const parsedEndDate = new Date(endDateParam);
        if (!isNaN(parsedEndDate.getTime())) {
          setEndDate(parsedEndDate);
          console.log('设置结束日期:', parsedEndDate);
        }
      }
      
      // 处理人数参数
      const adultsParam = searchParams.get('adults');
      if (adultsParam && !isNaN(parseInt(adultsParam))) {
        const adults = parseInt(adultsParam);
        setAdultCount(adults);
        setSelectedAdultCount(adults);
        console.log('设置成人数量:', adults);
      }
      
      const childrenParam = searchParams.get('children');
      if (childrenParam && !isNaN(parseInt(childrenParam))) {
        const children = parseInt(childrenParam);
        setChildCount(children);
        setSelectedChildCount(children);
        console.log('设置儿童数量:', children);
        
        // 如果有儿童，需要设置年龄输入
        if (children > 0) {
          setShowChildAgeInputs(true);
          setChildrenAges(new Array(children).fill(8)); // 默认年龄为8岁
        }
      }
    }
  }, [location.search]);
  
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
  
  // 判断是否为代理商
  const isAgent = userType === 'agent' || localStorage.getItem('userType') === 'agent';
  const agentId = user?.agentId || localStorage.getItem('agentId');
  const discountRate = user?.discountRate || localStorage.getItem('discountRate');

  // 获取今天的日期作为最小日期
  const today = new Date().toISOString().split('T')[0];

  const fetchingRef = useRef(false); // 用于追踪请求状态
  const fetchTimeoutRef = useRef(null); // 用于存储防抖定时器
  const retryCountRef = useRef(0); // 用于追踪重试次数
  const MAX_RETRIES = 2; // 最大重试次数

  // 用于防止重复加载酒店价格的标志
  const initialLoadRef = useRef(false);

  // 用于跟踪API调用状态的标志
  const isCallingApiRef = useRef(false);

  // 用于防止酒店价格API重复调用的计数器
  const hotelPriceApiCallCountRef = useRef(0);

  // 使用ref记录最后一次请求的ID
  const lastRequestIdRef = useRef(0);

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
        // 从URL路径和类型参数确定API类型
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
        
        // 按照常规逻辑判断类型
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

  

  // 处理"立即预订"按钮点击
  const handleBookNow = () => {
    if (!tourData || !id) {
      setError('无效的旅游产品');
      return;
    }
    
    // 计算总人数
    const adultCount = selectedAdultCount || 1;
    const childCount = selectedChildCount || 0;
    const totalPeople = adultCount + childCount;
    const roomCount = selectedRoomCount || 1;
    
    console.log('预订信息:', {
      成人数: adultCount,
      儿童数: childCount,
      房间数: roomCount,
      选择的酒店: selectedHotelLevel
    });
    
    // 检查是否选择了日期（对于需要日期的产品）
    if (requiresDateSelection && !selectedDate) {
      setError('请选择旅游日期');
      return;
    }
    
    // 构建URL参数
    const params = new URLSearchParams();
    params.append('tourId', id);
    params.append('tourName', tourData.title || tourData.name || '');
    params.append('type', type);
    params.append('adultCount', adultCount);
    params.append('childCount', childCount);
    params.append('roomCount', roomCount); // 确保添加roomCount参数
    
    // 根据旅游类型添加不同的日期参数
    if (tourType === 'group_tour' || type === 'group') {
      // 跟团游：添加arrivalDate和departureDate
      if (startDate) {
        params.append('arrivalDate', startDate.toISOString().split('T')[0]);
      }
      
      if (endDate) {
        params.append('departureDate', endDate.toISOString().split('T')[0]);
      }
    } else {
      // 日游：只添加日期参数
      if (selectedDate) {
        params.append('date', selectedDate.toISOString().split('T')[0]);
      }
    }
    
    if (selectedHotelLevel) {
      params.append('hotelLevel', selectedHotelLevel);
    }
    
    // 如果有计算的价格，添加到URL
    if (calculatedPrice && calculatedPrice.totalPrice) {
      params.append('price', calculatedPrice.totalPrice);
    } else {
      // 否则使用产品基础价格
      params.append('price', tourData.price);
    }
    
    console.log('导航到预订页面，参数:', params.toString());
    console.log('传递的state数据:', {
      tourId: id,
      tourType: type,
      adultCount: adultCount,
      childCount: childCount,
      roomCount: roomCount, // 确保在state中传递roomCount
      hotelLevel: selectedHotelLevel,
      tourDate: selectedDate ? selectedDate.toISOString().split('T')[0] : 
              (startDate ? startDate.toISOString().split('T')[0] : null)
    });
    
    // 导航到预订页面，通过state传递更多详细数据
    navigate(`/booking?${params.toString()}`, {
      state: {
        tourId: id,
        tourType: type,
        adultCount: adultCount,
        childCount: childCount,
        roomCount: roomCount, // 确保在state中传递roomCount
        tourDate: selectedDate ? selectedDate.toISOString().split('T')[0] : 
                (startDate ? startDate.toISOString().split('T')[0] : null),
        bookingOptions: {
          hotelLevel: selectedHotelLevel,
          // 添加其他可能的选项
          totalPrice: calculatedPrice?.totalPrice || tourData.price,
          hotelPriceDifference: calculatedPrice?.hotelPriceDifference || 0,
          dailySingleRoomSupplement: calculatedPrice?.dailySingleRoomSupplement || 0
        },
        tourData: {
          title: tourData.title || tourData.name,
          imageUrl: tourData.imageUrl || tourData.coverImage,
          duration: tourData.duration,
          hotelNights: tourData.hotelNights || (tourData.duration ? tourData.duration - 1 : 0),
          highlights: tourData.highlights ? tourData.highlights.slice(0, 3) : []
        }
      }
    });
  };

  // 在产品详情页面添加日期选择器
  const renderDateSelectors = () => {
    return (
      <Card className="mb-4">
        <Card.Header>
          <h3 className="h5 mb-0">选择行程日期</h3>
        </Card.Header>
        <Card.Body>
          <Row>
            {tourType === 'group_tour' || type === 'group' ? (
              // 团体游显示起始和结束日期
              <>
                <Col md={6} className="mb-3">
                  <Form.Group>
                    <Form.Label><FaCalendarAlt className="me-2" />到达日期</Form.Label>
                    <DatePicker
                      selected={startDate}
                      onChange={date => setStartDate(date)}
                      selectsStart
                      startDate={startDate}
                      endDate={endDate}
                      minDate={new Date()}
                      className="form-control"
                      dateFormat="yyyy年MM月dd日"
                      calendarClassName="date-picker-calendar"
                      wrapperClassName="date-picker-wrapper"
                      showPopperArrow={false}
                      portalId="date-picker-portal"
                    />
                  </Form.Group>
                </Col>
                <Col md={6} className="mb-3">
                  <Form.Group>
                    <Form.Label><FaCalendarAlt className="me-2" />离开日期</Form.Label>
                    <DatePicker
                      selected={endDate}
                      onChange={date => setEndDate(date)}
                      selectsEnd
                      startDate={startDate}
                      endDate={endDate}
                      minDate={startDate}
                      className="form-control"
                      dateFormat="yyyy年MM月dd日"
                      calendarClassName="date-picker-calendar"
                      wrapperClassName="date-picker-wrapper"
                      showPopperArrow={false}
                      portalId="date-picker-portal"
                    />
                  </Form.Group>
                </Col>
              </>
            ) : (
              // 一日游只显示单个日期
              <Col md={12} className="mb-3">
                <Form.Group>
                  <Form.Label><FaCalendarAlt className="me-2" />旅游日期</Form.Label>
                  <DatePicker
                    selected={selectedDate}
                    onChange={handleDateChange}
                    minDate={new Date()}
                    className="form-control"
                    dateFormat="yyyy年MM月dd日"
                    calendarClassName="date-picker-calendar"
                    wrapperClassName="date-picker-wrapper"
                    showPopperArrow={false}
                    portalId="date-picker-portal"
                  />
                  <Form.Text className="text-muted">
                    请选择您计划的旅游日期
                  </Form.Text>
                </Form.Group>
              </Col>
            )}
          </Row>
        </Card.Body>
      </Card>
    );
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
                        {loadingDiscount || isPriceLoading ? (
                          <Spinner animation="border" size="sm" />
                        ) : (
                          <Card className="tour-price-card mb-4">
                            <Card.Header className="card-header-lg">
                              
                            </Card.Header>
                            <Card.Body>
                              <div className="price-display mb-3">
                                <PriceDisplay
                                  originalPrice={calculatedPrice?.nonAgentPrice}
                                  discountedPrice={calculatedPrice?.totalPrice}
                                  showBadge={true}
                                  size="large"
                                  hotelPriceDifference={calculatedPrice?.hotelPriceDifference}
                                  hotelNights={tourData?.hotelNights || (tourData.duration ? tourData.duration - 1 : 0)}
                                  baseHotelLevel={calculatedPrice?.baseHotelLevel || "4星"}
                                  dailySingleRoomSupplement={calculatedPrice?.dailySingleRoomSupplement}
                                  extraRoomFee={calculatedPrice?.extraRoomFee}
                                  isAgent={isAgent}
                                />
                              </div>
                              
                              {/* 显示酒店差价信息 */}
                              {(type === 'group' || tourType === 'group_tour') && (
                                <div className="hotel-price-note mt-2 py-1 px-2 rounded bg-light">
                                  {/* 添加代理商价格说明 */}
                                  {isAgent && calculatedPrice && calculatedPrice.nonAgentPrice && calculatedPrice.totalPrice && (
                                    <div className="d-flex align-items-center mb-2">
                                      <FaPercent className="text-primary me-2" />
                                      <span>
                                        代理商价格：<strong>${calculatedPrice.totalPrice.toFixed(2)}</strong>
                                        {calculatedPrice.nonAgentPrice > calculatedPrice.totalPrice && (
                                          <span className="text-success ms-1 fw-bold">
                                            (节省 ${(calculatedPrice.nonAgentPrice - calculatedPrice.totalPrice).toFixed(2)})
                                          </span>
                                        )}
                                      </span>
                                    </div>
                                  )}
                                  
                                  <div className="d-flex align-items-center">
                                    <FaHotel className="text-primary me-2" />
                                    <span>
                                      当前选择：<strong>{selectedHotelLevel}</strong> 
                                      {calculatedPrice && calculatedPrice.hotelPriceDifference > 0 && 
                                        <span className="text-danger ms-1 fw-bold">
                                          (+${Math.abs(calculatedPrice.hotelPriceDifference).toFixed(2)}/晚)
                                        </span>
                                      }
                                      {calculatedPrice?.hotelPriceDifference < 0 && 
                                        <span className="text-success ms-1 fw-bold">
                                          (-${Math.abs(calculatedPrice.hotelPriceDifference).toFixed(2)}/晚)
                                        </span>
                                      }
                                      {(calculatedPrice?.hotelPriceDifference === 0 || calculatedPrice?.hotelPriceDifference === undefined) && 
                                        <span className="text-muted ms-1">
                                          (基准价)
                                        </span>
                                      }
                                    </span>
                                  </div>
                                  
                                  <div className="d-flex align-items-center mt-2">
                                    <FaBed className="text-primary me-2" />
                                    <span>
                                      房间数：<strong>{calculatedPrice?.roomCount || roomCount}</strong>间
                                    </span>
                                  </div>
                                  
                                  {calculatedPrice && calculatedPrice.extraRoomFee > 0 && (
                                    <div className="d-flex align-items-center mt-2">
                                      <FaHotel className="text-success me-2" />
                                      <span>
                                        单房差：<strong>${calculatedPrice.extraRoomFee.toFixed(2)}</strong>
                                      </span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </Card.Body>
                          </Card>
                        )}
                      </div>
                      
                      

                      {/* 人数选择部分 - 移到前面 */}
                      <div className="passenger-selection-section mb-4">
                        <h5 className="mb-3">人数选择</h5>
                        <Form>
                          <Row>
                            <Col md={6} className="mb-3">
                              <Form.Group>
                                <Form.Label><FaUsers className="me-2" />成人数量</Form.Label>
                                <Form.Control
                                  type="number"
                                  min="1"
                                  value={adultCount}
                                  onChange={handleAdultCountChange}
                                />
                              </Form.Group>
                            </Col>
                            <Col md={6} className="mb-3">
                              <Form.Group>
                                <Form.Label><FaChild className="me-2" />儿童数量</Form.Label>
                                <Form.Control
                                  type="number"
                                  min="0"
                                  value={childCount}
                                  onChange={handleChildCountChange}
                                />
                              </Form.Group>
                            </Col>
                          </Row>
                          
                          {/* 儿童年龄输入区域 - 为每个儿童单独显示年龄输入框 */}
                          {childCount > 0 && (
                            <div className="children-ages mt-3">
                              <h6 className="mb-2">儿童年龄 <small className="text-muted">(请填写每位儿童的年龄)</small></h6>
                              <Row>
                                {Array.from({ length: childCount }).map((_, index) => (
                                  <Col md={4} key={index} className="mb-2">
                                    <Form.Group>
                                      <Form.Label className="small">儿童 {index + 1}</Form.Label>
                                      <Form.Control
                                        type="number"
                                        min="0"
                                        max="17"
                                        value={childrenAges[index] || 0}
                                        onChange={(e) => handleChildAgeChange(index, e.target.value)}
                                        placeholder="年龄"
                                      />
                                    </Form.Group>
                                  </Col>
                                ))}
                              </Row>
                              <div className="text-muted small mt-2">
                                <FaInfoCircle className="me-1" /> 儿童年龄将影响价格计算
                              </div>
                            </div>
                          )}
                        </Form>
                      </div>
                      
                      {/* 添加房间数量选择 */}
                      {(type === 'group' || tourType === 'group_tour') && (
                        <div className="room-selection-section mb-4">
                          <h5 className="mb-3">房间数量</h5>
                          <Form>
                            <Form.Group>
                              <Form.Label><FaBed className="me-2" />房间数</Form.Label>
                              <Form.Control
                                type="number"
                                min="1"
                                value={roomCount}
                                onChange={handleRoomCountChange}
                              />
                              <Form.Text className="text-muted">
                                建议选择{Math.ceil(adultCount/2)}间房间，您可以根据需求自由选择
                              </Form.Text>
                            </Form.Group>
                          </Form>
                        </div>
                      )}
                      
                      {/* 酒店选择部分 - 移到后面 */}
                      {(type === 'group' || tourType === 'group_tour') && (
                        <div className="hotel-selection-section mb-4">
                          <h5 className="mb-3">套餐类型</h5>
                          <div className="hotel-options">
                            <Form>
                              <Form.Group className="mb-2">
                                {/* 使用hotelPrices数据动态生成选项 */}
                                {hotelPrices && hotelPrices.length > 0 ? (
                                  hotelPrices.map((hotel) => (
                                    <Form.Check
                                      key={hotel.id}
                                      type="radio"
                                      id={`hotel-${hotel.hotelLevel}`}
                                      name="hotelLevel"
                                      label={
                                        <>
                                          {hotel.hotelLevel}酒店 
                                          <span className="ms-1">
                                            {hotel.isBaseLevel ? 
                                              '(基准价)' : 
                                              hotel.priceDifference > 0 ? 
                                                `(+${hotel.priceDifference}/晚)` : 
                                                `(-${Math.abs(hotel.priceDifference)}/晚)`
                                            }
                                          </span>
                                          <div className="small text-muted">{hotel.description}</div>
                                        </>
                                      }
                                      value={hotel.hotelLevel}
                                      checked={selectedHotelLevel === hotel.hotelLevel}
                                      onChange={handleHotelLevelChange}
                                      className="mb-2"
                                    />
                                  ))
                                ) : (
                                  <>
                                    <Form.Check
                                      type="radio"
                                      id="hotel-3"
                                      name="hotelLevel"
                                      label={<>3星酒店 (-$60/晚)<div className="small text-muted">标准三星级酒店</div></>}
                                      value="3星"
                                      checked={selectedHotelLevel === '3星'}
                                      onChange={handleHotelLevelChange}
                                      className="mb-2"
                                    />
                                    <Form.Check
                                      type="radio"
                                      id="hotel-4"
                                      name="hotelLevel"
                                      label={<>4星酒店 (基准价)<div className="small text-muted">舒适四星级酒店</div></>}
                                      value="4星"
                                      checked={selectedHotelLevel === '4星'}
                                      onChange={handleHotelLevelChange}
                                      className="mb-2"
                                    />
                                    <Form.Check
                                      type="radio"
                                      id="hotel-4.5"
                                      name="hotelLevel"
                                      label={<>4.5星酒店 (+$140/晚)<div className="small text-muted">高级四星半级酒店</div></>}
                                      value="4.5星"
                                      checked={selectedHotelLevel === '4.5星'}
                                      onChange={handleHotelLevelChange}
                                      className="mb-2"
                                    />
                                    <Form.Check
                                      type="radio"
                                      id="hotel-5"
                                      name="hotelLevel"
                                      label={<>5星酒店 (+$240/晚)<div className="small text-muted">豪华五星级酒店</div></>}
                                      value="5星"
                                      checked={selectedHotelLevel === '5星'}
                                      onChange={handleHotelLevelChange}
                                      className="mb-2"
                                    />
                                  </>
                                )}
                              </Form.Group>
                            </Form>
                          </div>
                          {isPriceLoading && (
                            <div className="mt-2 text-center">
                              <Spinner animation="border" size="sm" className="me-2" />
                              <span className="text-muted">计算价格中...</span>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* 添加日期选择器 */}
                      {renderDateSelectors()}

                      {isAuthenticated ? (
                        <Button 
                          variant="primary" 
                          style={{ backgroundColor: '#FF6B6B', borderColor: '#FF6B6B' }} 
                          size="lg" 
                          className="w-100 py-2 mb-3"
                          onClick={handleBookNow}
                        >
                          立即预订
                        </Button>
                      ) : (
                        <Button 
                          variant="primary" 
                          style={{ backgroundColor: '#FF6B6B', borderColor: '#FF6B6B' }} 
                          size="lg" 
                          className="w-100 py-2 mb-3"
                          onClick={() => {
                            // 构建与handleBookNow相同的URL参数
                            const params = new URLSearchParams();
                            params.append('tourId', id);
                            params.append('tourName', tourData.title || tourData.name || '');
                            params.append('type', type);
                            params.append('adultCount', adultCount);
                            params.append('childCount', childCount);
                            params.append('roomCount', roomCount);
                            
                            if (startDate) {
                              params.append('arrivalDate', startDate.toISOString().split('T')[0]);
                            }
                            
                            if (endDate) {
                              params.append('departureDate', endDate.toISOString().split('T')[0]);
                            }
                            
                            if (selectedDate) {
                              params.append('date', selectedDate.toISOString().split('T')[0]);
                            }
                            
                            if (selectedHotelLevel) {
                              params.append('hotelLevel', selectedHotelLevel);
                            }
                            
                            // 如果有计算的价格，添加到URL
                            if (calculatedPrice && calculatedPrice.totalPrice) {
                              params.append('price', calculatedPrice.totalPrice);
                            } else {
                              // 否则使用产品基础价格
                              params.append('price', tourData.price);
                            }
                            
                            // 准备登录后传递的state数据
                            const loginState = {
                              from: `/booking?${params.toString()}`,
                              message: "请先登录后再进行预订",
                              tourDetails: {
                                tourId: id,
                                tourType: type,
                                adultCount: adultCount,
                                childCount: childCount,
                                roomCount: roomCount,
                                tourDate: selectedDate ? selectedDate.toISOString().split('T')[0] : 
                                        (startDate ? startDate.toISOString().split('T')[0] : null),
                                bookingOptions: {
                                  hotelLevel: selectedHotelLevel,
                                  totalPrice: calculatedPrice?.totalPrice || tourData.price,
                                  hotelPriceDifference: calculatedPrice?.hotelPriceDifference || 0,
                                  dailySingleRoomSupplement: calculatedPrice?.dailySingleRoomSupplement || 0
                                },
                                tourData: {
                                  title: tourData.title || tourData.name,
                                  imageUrl: tourData.imageUrl || tourData.coverImage,
                                  duration: tourData.duration,
                                  hotelNights: tourData.hotelNights || (tourData.duration ? tourData.duration - 1 : 0),
                                  highlights: tourData.highlights ? tourData.highlights.slice(0, 3) : []
                                }
                              }
                            };
                            
                            // 导航到登录页面
                            navigate('/login', { state: loginState });
                          }}
                        >
                          立即预订
                        </Button>
                      )}
                      
                      <Button variant="outline-secondary" className="w-100 py-2">
                        加入收藏
                      </Button>
                    </div>
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

  // 处理成人数量变更
  const handleAdultCountChange = (e) => {
    const newAdultCount = parseInt(e.target.value) || 1;
    if (newAdultCount < 1) return;
    
    // 更新成人数量状态
    setAdultCount(newAdultCount);
    setSelectedAdultCount(newAdultCount);
    
    // 调用后端API获取价格 - 不自动调整房间数
    sendParamsToBackend(newAdultCount, childCount, roomCount, selectedHotelLevel);
  };
  
  // 处理儿童数量变更
  const handleChildCountChange = (e) => {
    const newChildCount = parseInt(e.target.value) || 0;
    if (newChildCount < 0) return;
    
    // 更新状态
    setChildCount(newChildCount);
    setSelectedChildCount(newChildCount);
    
    // 更新儿童年龄数组
    const newChildrenAges = [...childrenAges];
    if (newChildCount > childrenAges.length) {
      // 如果增加了儿童，添加新的年龄项，默认为0
      for (let i = childrenAges.length; i < newChildCount; i++) {
        newChildrenAges.push(0);
      }
    } else if (newChildCount < childrenAges.length) {
      // 如果减少了儿童，移除多余的年龄项
      newChildrenAges.splice(newChildCount);
    }
    
    setChildrenAges(newChildrenAges);
    setShowChildAgeInputs(newChildCount > 0);
    
    // 发送参数到后端，包括儿童年龄
    sendParamsToBackend(adultCount, newChildCount, roomCount, selectedHotelLevel, newChildrenAges);
  };
  
  // 处理房间数量变更
  const handleRoomCountChange = (e) => {
    const newRoomCount = parseInt(e.target.value) || 1;
    if (newRoomCount < 1) return;
    
    // 更新状态
    setRoomCount(newRoomCount);
    setSelectedRoomCount(newRoomCount);
    
    // 调用后端API获取价格
    sendParamsToBackend(adultCount, childCount, newRoomCount, selectedHotelLevel);
  };
  
  // 处理酒店星级变更
  const handleHotelLevelChange = (e) => {
    const newLevel = e.target.value;
    setSelectedHotelLevel(newLevel);
    
    // 调用后端API获取价格
    sendParamsToBackend(adultCount, childCount, roomCount, newLevel);
  };
  
  // 处理日期选择
  const handleDateChange = (date) => {
    console.log('日期选择器变更:', date);
    
    // 如果日期为null，设置为当前日期
    if (date === null) {
      setSelectedDate(new Date());
      return;
    }
    
    // 确保date是有效的Date对象
    if (date && date instanceof Date && !isNaN(date.getTime())) {
      setSelectedDate(date);
      
      // 日期变更后可能需要重新获取价格
      if (tourData) {
        sendParamsToBackend(adultCount, childCount, roomCount, selectedHotelLevel);
      }
    } else {
      console.error('无效的日期值:', date);
      // 如果传入的日期无效，则使用当前日期
      setSelectedDate(new Date());
    }
  };
  
  // 处理儿童年龄变化
  const handleChildAgeChange = (index, age) => {
    const newChildrenAges = [...childrenAges];
    newChildrenAges[index] = parseInt(age) || 0;
    setChildrenAges(newChildrenAges);
    
    // 直接发送更新后的参数到后端，不进行前端计算
    sendParamsToBackend(adultCount, childCount, roomCount, selectedHotelLevel, newChildrenAges);
  };
  
  // 向后端发送参数的简化函数
  const sendParamsToBackend = (adults, children, rooms, hotelLevel, ages = childrenAges) => {
    // 如果已经在调用API，避免重复调用
    if (isCallingApiRef.current) {
      console.log('API调用进行中，跳过重复请求');
      return;
    }
    
    // 设置API调用状态
    isCallingApiRef.current = true;
    
    // 设置价格加载状态
    setIsPriceLoading(true);
    
    // 生成唯一请求ID
    const requestId = Math.random().toString(36).substring(7);
    
    const requestTourId = id;
    const requestTourType = type === 'group' ? 'group_tour' : 'day_tour';
    const requestAdultCount = parseInt(adults, 10) || 1;
    const requestChildCount = parseInt(children, 10) || 0;
    const requestRoomCount = parseInt(rooms, 10) || 1;
    const requestHotelLevel = hotelLevel || selectedHotelLevel || '4星';
    
    console.log(`[${requestId}] 发送参数给后端: id=${requestTourId}, 类型=${requestTourType}, 成人=${requestAdultCount}, 儿童=${requestChildCount}, 酒店=${requestHotelLevel}, 房间数=${requestRoomCount}, 儿童年龄=${ages ? ages.join(',') : ''}`);
    
    // 直接使用计算接口
    const fetchPrice = async () => {
      try {
        const priceData = await calculateTourPrice(
          requestTourId,
          requestTourType,
          requestAdultCount,
          requestChildCount,
          requestHotelLevel,
          null, // agentId - 从用户状态获取
          requestRoomCount,
          null, // userId - 从用户状态获取
          ages // 儿童年龄数组
        );
        
        console.log(`[${requestId}] 价格计算结果:`, priceData);
        
        // 如果请求成功返回
        if (priceData && (priceData.code === 1 || priceData.code === 200) && priceData.data) {
          const totalPrice = priceData.data.totalPrice || 0;
          const originalPrice = priceData.data.originalPrice || totalPrice;
          
          setCalculatedPrice({
            ...priceData.data,
            totalPrice: totalPrice,
            originalPrice: originalPrice
          });
          
          console.log(`[${requestId}] 价格已更新: 总价=${totalPrice}, 原价=${originalPrice}`);
        } else {
          console.error(`[${requestId}] 价格计算API调用失败:`, priceData);
          setCalculatedPrice(null);
        }
      } catch (error) {
        console.error(`[${requestId}] 价格计算出错:`, error);
        setCalculatedPrice(null);
      } finally {
        // 清除加载状态
        setIsPriceLoading(false);
        // 重置API调用状态
        isCallingApiRef.current = false;
      }
    };
    
    // 执行API调用
    fetchPrice();
  };

  // 初始化日期选择状态
  useEffect(() => {
    if (tourData) {
      // 检查是否是需要选择日期的产品类型（如一日游）
      const isDayTour = tourType === 'day_tour' || type === 'day';
      setRequiresDateSelection(isDayTour);
      
      // 为日期选择类型的产品设置默认日期
      if (isDayTour && (!selectedDate || !(selectedDate instanceof Date))) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        setSelectedDate(tomorrow);
      }
    }
  }, [tourData, tourType, type, selectedDate]);

  useEffect(() => {
    // 记录组件挂载和卸载
    console.log("TourDetails组件已挂载");
    // 重置API调用计数器
    hotelPriceApiCallCountRef.current = 0;
    
    return () => {
      console.log("TourDetails组件已卸载");
      // 组件卸载时重置状态
      initialLoadRef.current = false;
      isCallingApiRef.current = false;
      
      // 清除可能存在的防抖定时器
      if (priceDebounceTimer) {
        clearTimeout(priceDebounceTimer);
      }
    };
  }, [priceDebounceTimer]);

  useEffect(() => {
    const fetchHotelPrices = async () => {
      // 如果已经加载过，不再重复加载
      if (initialLoadRef.current) {
        console.log("酒店价格已加载，跳过重复请求");
        return;
      }
      
      // 限制API调用次数，避免无限循环
      if (hotelPriceApiCallCountRef.current >= 1) {
        console.log(`已达到酒店价格API调用上限(${hotelPriceApiCallCountRef.current}次)，跳过请求`);
        return;
      }
      
      // 增加API调用计数
      hotelPriceApiCallCountRef.current++;
      console.log(`[初始化] 获取酒店价格列表 - 第${hotelPriceApiCallCountRef.current}次`);
      
      // 标记为已加载
      initialLoadRef.current = true;
      
      if (type === 'group' || tourType === 'group_tour') {
        console.log(`获取酒店价格列表...(第${hotelPriceApiCallCountRef.current}次)`);
        
        try {
          const result = await getHotelPrices().catch(err => {
            console.error('获取酒店价格列表失败:', err);
            return { code: 0, data: [] };
          });
          
          // 检查响应是否成功
          if (result && result.code === 1 && Array.isArray(result.data)) {
            // 处理酒店价格数据
            const validData = result.data.map(hotel => ({
              ...hotel,
              hotelLevel: hotel.hotelLevel ? String(hotel.hotelLevel) : '4星',
              priceDifference: typeof hotel.priceDifference === 'number' ? hotel.priceDifference : 0,
              id: hotel.id || Math.floor(Math.random() * 10000),
              description: hotel.description || `${hotel.hotelLevel || '4星'}酒店`
            }));
            
            setHotelPrices(validData);
            
            // 获取酒店列表后，延迟一点时间发送初始参数获取价格
            if (tourData) {
              // 使用setTimeout延迟调用，直接调用函数
              setTimeout(() => {
                if (typeof sendParamsToBackend === 'function') {
                  // 特殊标记这是初始加载的价格请求
                  console.log('[初始化] 初始化加载后获取价格');
                  sendParamsToBackend(adultCount, childCount, roomCount, selectedHotelLevel);
                }
              }, 500);
            }
          } else {
            setHotelPrices([]);
            
            // 即使未能获取到有效数据，也尝试获取价格
            if (tourData) {
              setTimeout(() => {
                if (typeof sendParamsToBackend === 'function') {
                  sendParamsToBackend(adultCount, childCount, roomCount, selectedHotelLevel);
                }
              }, 500);
            }
          }
        } catch (error) {
          console.error('获取酒店价格列表失败:', error);
          setHotelPrices([]);
          
          // 即使出错，也尝试获取价格
          if (tourData) {
            setTimeout(() => {
              if (typeof sendParamsToBackend === 'function') {
                sendParamsToBackend(adultCount, childCount, roomCount, selectedHotelLevel);
              }
            }, 500);
          }
        }
      } else if (tourData) {
        // 对于一日游，直接获取初始价格
        setTimeout(() => {
          if (typeof sendParamsToBackend === 'function') {
            sendParamsToBackend(adultCount, childCount, roomCount, selectedHotelLevel);
          }
        }, 500);
      }
    };
    
    // 当旅游数据加载完成时，获取酒店价格和初始价格
    if (tourData && id) {
      fetchHotelPrices();
    }
  }, [id, tourData, type, tourType]);
  
  // 监听日期选择变化，获取价格
  useEffect(() => {
    // 只有当旅游数据已加载且为一日游，且日期明确发生变化时才请求价格
    if (selectedDate && tourData && (tourType === 'day_tour' || type === 'day')) {
      console.log('日期已变更，需要更新价格');
      
      // 确保使用最新的状态值
      const currentAdultCount = adultCount;
      const currentChildCount = childCount;
      const currentRoomCount = roomCount;
      const currentHotelLevel = selectedHotelLevel;
      
      // 限制API调用频率，延迟稍微久一点，确保与其他状态更新不冲突
      setTimeout(() => {
        // 进行一次价格请求
        sendParamsToBackend(currentAdultCount, currentChildCount, currentRoomCount, currentHotelLevel);
      }, 200);
    }
  }, [selectedDate]); // 只监听日期变更

  // 跳转到预订页面
  const handleBooking = () => {
    // 如果用户未登录，先跳转到登录页面
    if (!isAuthenticated) {
      const redirectPath = `/tours/${id}`;
      navigate('/auth/login', { state: { from: redirectPath } });
      return;
    }
    
    const bookingData = {
      tourId: id,
      tourName: tourData?.title,
      tourDate: selectedDate,
      adultCount: adultCount,
      childCount: childCount,
      roomCount: roomCount,
      childrenAges: childrenAges, // 添加儿童年龄数组
      bookingOptions: {
        hotelLevel: selectedHotelLevel,
        pickupLocation: '',
      }
    };
    
    // 跳转到预订页面
    navigate(`/booking?tourId=${id}&type=${type || tourType}`, { state: bookingData });
  };

  return (
    <div className="tour-details-page">
      {renderContent()}
      <div id="date-picker-portal" />
    </div>
  );
};

export default TourDetails;