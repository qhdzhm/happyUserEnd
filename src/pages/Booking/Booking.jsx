import React, { useState, useEffect, useRef, useCallback } from "react";
import Breadcrumbs from "../../components/Breadcrumbs/Breadcrumbs";
import { Col, Container, Form, Row, Card, ListGroup, Alert, Button, Badge, Tabs, Tab, Modal } from "react-bootstrap";
import DatePicker from "react-datepicker";
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { FaPlus, FaMinus, FaInfoCircle, FaCalendarAlt, FaCheck, FaRegCreditCard, FaShieldAlt, FaHotel, FaCar, FaUserFriends, FaUser, FaBuilding, FaLightbulb, FaTimes, FaBed, FaTicketAlt, FaMapMarkerAlt, FaClock, FaStar, FaUtensils, FaUsers, FaCalendarDay, FaRoute, FaArrowLeft, FaLock, FaHeadset, FaPhone, FaWeixin, FaExclamationTriangle, FaPaste, FaMagic } from 'react-icons/fa';
import "../Booking/booking.css";
import { calculateTourDiscount, getTourById } from "../../utils/api";
import { useSelector } from 'react-redux';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { createTourBooking, calculateTourPrice, getHotelPrices } from "../../services/bookingService";
import { Link } from 'react-router-dom';
import { extractBookingInfo } from '../../utils/textParser';

// 默认表单数据
const DEFAULT_FORM_DATA = {
  adult_count: 2,
  child_count: 0,
  luggage_count: 0,
  tour_start_date: null,
  tour_end_date: null,
  pickup_date: null,
  dropoff_date: null,
  pickup_location: '',
  dropoff_location: '',
  hotel_level: '4星',
  hotel_room_count: 1,
  hotelCheckInDate: null,  // 新增酒店入住日期
  hotelCheckOutDate: null, // 新增酒店退房日期
  roomTypes: ['双人间'],
  special_requests: '',
  arrival_flight: '',      // 抵达航班号
  departure_flight: '',    // 返程航班号
  arrival_departure_time: null,  // 抵达航班起飞时间
  arrival_landing_time: null,    // 抵达航班降落时间
  departure_departure_time: null,  // 返程航班起飞时间
  departure_landing_time: null,    // 返程航班降落时间
  passengers: [
    {
      full_name: '',
      is_child: false,
      phone: '',
      wechat_id: '',
      child_age: '',       // 儿童年龄
      is_primary: true
    },
    {
      full_name: '',
      is_child: false,
      phone: '',
      wechat_id: '',
      child_age: '',       // 儿童年龄
      is_primary: false
    }
  ],
  total_price: '0.00'
};

const Booking = () => {
  const { isAuthenticated, user, userType } = useSelector(state => state.auth);
  
  // 判断是否为代理商
  const isAgent = userType === 'agent' || localStorage.getItem('userType') === 'agent';
  
  // 获取代理商相关信息
  const agentId = user?.agentId || localStorage.getItem('agentId');
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const [searchParams] = useSearchParams();
  
  const tourId = searchParams.get("tourId");
  const tourName = searchParams.get("tourName");
  const tourType = searchParams.get("type") || "day";
  
  // 使用ref跟踪组件状态，避免循环渲染
  const tourDataFetched = useRef(false);
  const priceLoaded = useRef(false);
  const formInitialized = useRef(false);
  
  const [loading, setLoading] = useState(false);
  const [tourDetails, setTourDetails] = useState({
    id: tourId,
    title: '',
    duration: 0, // 初始化为0而非null/undefined
    hotelNights: 0, // 初始化为0而非null/undefined
    highlights: []
  });
  const [priceDetails, setPriceDetails] = useState({
    originalPrice: 0,
    discountedPrice: 0,
    discountRate: isAgent ? 0.9 : 1
  });
  
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  // 防抖状态
  const [priceDebounceTimer, setPriceDebounceTimer] = useState(null);
  // 价格计算状态
  const [isPriceLoading, setIsPriceLoading] = useState(false);
  // 文本解析状态
  const [parseText, setParseText] = useState('');
  // 添加弹窗状态
  const [showParseModal, setShowParseModal] = useState(false);
  
  // 从URL参数获取产品信息
  const price = queryParams.get('price');
  const arrivalDate = queryParams.get('arrivalDate');
  const departureDate = queryParams.get('departureDate');
  const hotelLevelParam = queryParams.get('hotelLevel') || '4-star';
  
  // 转换酒店等级格式（从英文转为中文显示）
  const mapHotelLevelToChinese = (level) => {
    // 将前端URL中英文格式的酒店级别转换为后端需要的中文格式
    if (!level) return '4星';
    
    if (level.includes('3') || level.toLowerCase().includes('three')) {
      return '3星';
    } else if (level.includes('4.5') || level.toLowerCase().includes('four-half')) {
      return '4.5星';
    } else if (level.includes('5') || level.toLowerCase().includes('five')) {
      return '5星';
    } else {
      // 默认4星
      return '4星';
    }
  };
  
  // 表单状态
  const [formData, setFormData] = useState({
    // 对应数据库字段
    tour_id: tourId || "",
    tour_type: tourType || "",
    tour_start_date: null, // 初始化为null，由updateFormWithTourDefaults设置
    tour_end_date: null, // 初始化为null，由updateFormWithTourDefaults设置
    arrival_flight: "", // 确保初始化为空字符串
    departure_flight: "", // 确保初始化为空字符串
    arrival_departure_time: null,  // 抵达航班起飞时间
    arrival_landing_time: null,    // 抵达航班降落时间
    departure_departure_time: null,  // 返程航班起飞时间
    departure_landing_time: null,    // 返程航班降落时间
    pickup_date: new Date(), // 默认今天
    pickup_location: "",
    dropoff_date: new Date(), // 默认今天
    dropoff_location: "",

    service_type: "跟团",
    adult_count: 1,
    child_count: 0,
    luggage_count: 0,
    hotel_level: mapHotelLevelToChinese(hotelLevelParam),
    room_type: "双人间",
    hotel_room_count: 1,
    hotelCheckInDate: null, // 新增酒店入住日期
    hotelCheckOutDate: null, // 新增酒店退房日期
    room_details: {},
    special_requests: "",
    total_price: 0,
    passengers: [
      {
        full_name: "",
        is_child: false,
        phone: "",
        wechat_id: "",
        child_age: "", // 添加儿童年龄字段
      },
    ],
    payment_status: "unpaid",
    status: "pending",
  });
  
  // 客人信息数组
  const [passengers, setPassengers] = useState([
    {
      name: "",
      phone: "",
      wechat: "", // 可以为null
      isMainContact: true // 标记是否主要联系人
    }
  ]);
  
  const [validated, setValidated] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const [hotelPrices, setHotelPrices] = useState([]);
  
  // 初始化表单数据
  useEffect(() => {
    // 防止重复初始化
    if (formInitialized.current) return;
    formInitialized.current = true;
    
    // 1. 处理从详情页传递过来的参数
    if (location.state) {
      console.log('从详情页接收到的数据:', location.state);
      const { adultCount, childCount, roomCount, tourDate, bookingOptions } = location.state;
      
      console.log('房间数信息:', {
        接收到的房间数: roomCount,
        当前设置的房间数: formData.hotel_room_count
      });
      
      // 设置初始表单数据
      const initialFormData = {
        ...DEFAULT_FORM_DATA,
        adult_count: adultCount || 2,
        child_count: childCount || 0,
        hotel_room_count: roomCount || 1, // 确保正确读取房间数
        // 不再设置tour_start_date和tour_end_date，由updateFormWithTourDefaults设置
        // 可能的酒店等级或其他选项
        ...(bookingOptions?.hotelLevel && { hotel_level: bookingOptions.hotelLevel }),
        ...(bookingOptions?.pickupLocation && { pickup_location: bookingOptions.pickupLocation }),
      };
      
      console.log('设置初始表单数据:', {
        adultCount: adultCount || 2,
        childCount: childCount || 0,
        roomCount: roomCount || 1 // 记录日志
      });
      
      // 更新表单数据
      setFormData(initialFormData);
      
      // 创建必要数量的乘客
      const totalPassengers = (adultCount || 2) + (childCount || 0);
      const initialPassengers = [];
      
      // 添加成人乘客
      for (let i = 0; i < (adultCount || 2); i++) {
        initialPassengers.push({
          full_name: '',
          is_child: false,
          phone: '',
          wechat_id: '',
          is_primary: i === 0 // 第一个成人为主联系人
        });
      }
      
      // 添加儿童乘客
      for (let i = 0; i < (childCount || 0); i++) {
        initialPassengers.push({
          full_name: '',
          is_child: true,
          phone: '',
          wechat_id: ''
        });
      }
      
      // 更新乘客列表
      setFormData(prev => ({
        ...prev,
        passengers: initialPassengers
      }));
      
      // 不再使用setTimeout，避免重复设置状态
      
    } else {
      // 没有传递参数时使用URL参数
      const params = new URLSearchParams(location.search);
      const adultCount = parseInt(params.get('adultCount') || '2', 10);
      const childCount = parseInt(params.get('childCount') || '0', 10);
      const roomCount = parseInt(params.get('roomCount') || '1', 10);
      
      // 创建必要数量的乘客
      const initialPassengers = [];
      
      // 添加成人乘客
      for (let i = 0; i < adultCount; i++) {
        initialPassengers.push({
          full_name: '',
          is_child: false,
          phone: '',
          wechat_id: '',
          is_primary: i === 0 // 第一个成人为主联系人
        });
      }
      
      // 添加儿童乘客
      for (let i = 0; i < childCount; i++) {
        initialPassengers.push({
          full_name: '',
          is_child: true,
          phone: '',
          wechat_id: ''
        });
      }
      
      // 更新表单数据
      setFormData({
        ...DEFAULT_FORM_DATA,
        adult_count: adultCount,
        child_count: childCount,
        hotel_room_count: roomCount,
        passengers: initialPassengers
      });
    }
    
    // 加载酒店价格列表
      fetchHotelPrices();
    
    // 获取产品详细信息
    if (!tourDataFetched.current) {
      tourDataFetched.current = true;
      fetchTourData();
    }
  // 只执行一次，避免循环调用
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // 确保在获取到产品后更新价格
  useEffect(() => {
    if (tourDetails && Object.keys(tourDetails).length > 0) {
      // 初始化表单中的酒店相关数据（对于跟团游）
      if ((tourType || '').toLowerCase().includes('group')) {
        const defaultHotelLevel = '4星'; // 默认4星酒店
        
        // 如果从URL参数或详情页获取到了酒店等级，使用该值
        const hotelLevelFromParams = new URLSearchParams(location.search).get('hotelLevel');
        const hotelLevelFromState = location.state?.bookingOptions?.hotelLevel;
        
        // 根据优先级设置酒店等级
        const hotelLevel = hotelLevelFromState || hotelLevelFromParams || defaultHotelLevel;
        
        // 获取房间数
        const roomCountFromState = location.state?.roomCount;
        const roomCountFromParams = parseInt(new URLSearchParams(location.search).get('roomCount') || '1', 10);
        const roomCount = roomCountFromState || roomCountFromParams || 1;
        
        // 计算酒店晚数 - 确保为数值类型
        const duration = parseInt(tourDetails.duration) || 0;
        const hotelNights = parseInt(tourDetails.hotelNights) || (duration > 0 ? duration - 1 : 0);
        
        console.log('设置酒店相关数据:', {
          酒店等级: hotelLevel,
          房间数: roomCount,
          酒店晚数: hotelNights,
          行程天数: duration
        });
        
        // 以下代码仅执行一次，确保不会循环更新
        // 使用函数形式更新state，避免依赖于先前的state
        if (tourDetails.duration !== duration || tourDetails.hotelNights !== hotelNights) {
          setTourDetails(prev => ({
            ...prev,
            duration: duration,
            hotelNights: hotelNights
          }));
        }
        
        setFormData(prev => ({
          ...prev,
          hotel_level: hotelLevel,
          hotel_room_count: roomCount,
          roomTypes: Array(roomCount).fill('标准双人间')
        }));
      }
      
      // 获取价格 - 仅在首次加载时获取，避免循环调用
      if (!isPriceLoading && !priceLoaded.current) {
        console.log('首次加载价格数据');
        priceLoaded.current = true;
        schedulePriceUpdate();
      }
    }
  // 确保依赖数组不包含可能频繁变化的对象
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 监听表单字段变化，更新价格信息（使用防抖）
  useEffect(() => {
    // 当表单有完整数据且已经初始化过时才更新价格
    if (tourId && formData.adult_count > 0 && priceLoaded.current) {
      console.log("表单数据变更，准备更新价格:", {
        adultCount: formData.adult_count,
        childCount: formData.child_count,
        roomCount: formData.hotel_room_count,
        hotelLevel: formData.hotel_level
      });
      
      // 使用防抖机制，避免频繁API请求
      schedulePriceUpdate();
    }
    
    // 不添加fetchTourPrice到依赖数组，避免循环调用
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.adult_count, formData.child_count, formData.hotel_level, formData.room_type, formData.hotel_room_count, tourId]);
  
  // 创建一个统一的价格更新调度函数
  const schedulePriceUpdate = () => {
    // 取消之前的定时器
    if (priceDebounceTimer) {
      clearTimeout(priceDebounceTimer);
    }
    
    // 防抖延迟1秒
    const timer = setTimeout(() => {
      // 避免重复调用
      if (!isPriceLoading) {
        console.log('执行防抖后的价格更新');
        fetchTourPrice();
      }
    }, 1000);
    
    // 保存定时器ID
    setPriceDebounceTimer(timer);
  };
  
  // 处理根据主联系人信息自动填充第一位乘客信息
  useEffect(() => {
    if (formData.passengers.length > 0) {
      const updatedPassengers = [...formData.passengers];
      updatedPassengers[0] = {
        ...updatedPassengers[0],
        name: formData.contact_person || '',
        // 可以添加其他需要自动填充的字段
      };
      setFormData(prev => ({
        ...prev,
        passengers: updatedPassengers
      }));
    }
  }, [formData.contact_person]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    console.log('表单字段变更:', { name, value, event: e });
    
    setFormData({
      ...formData,
      [name]: value
    });
    
    // 如果修改的是酒店等级，显示提示但不直接调用fetchTourPrice
    // 让useEffect的防抖机制处理价格更新
    if (name === 'hotel_level') {
      toast.success(`正在更新${value}酒店的价格...`);
    }
  };
  
  // 处理接送时间不同选项变更
  const handlePickupTimeChange = (e) => {
    const { checked } = e.target;
    
    // 更新整个表单数据，包括复选框状态和同步接送时间
    setFormData(prev => ({
      ...prev,
      pickupTimeDifferent: checked,
      // 如果取消勾选，将接送时间重新与行程时间同步
      pickup_date: !checked ? prev.tour_start_date : prev.pickup_date,
      dropoff_date: !checked ? prev.tour_end_date : prev.dropoff_date
    }));
  };
  
  // 处理日期变化
  const handleDateChange = (fieldName, date) => {
    // 处理日期更改
    setFormData(prev => {
      let updated = { ...prev, [fieldName]: date };
      // 如果更改的是行程开始日期，自动推算结束日期和相关字段
      if (fieldName === 'tour_start_date' && date && tourDetails.duration) {
        const duration = parseInt(tourDetails.duration) || 1;
        const end = new Date(date);
        end.setDate(date.getDate() + duration - 1);
        updated.tour_end_date = end;
        updated.hotelCheckInDate = date;
        updated.hotelCheckOutDate = end;
        updated.pickup_date = date;
        updated.dropoff_date = end;
      }
      // 如果更改的是行程结束日期，自动更新酒店退房和送回日期
      if (fieldName === 'tour_end_date' && date) {
        updated.hotelCheckOutDate = date;
        updated.dropoff_date = date;
      }
      return updated;
    });
    
    // 如果更改的是行程开始日期，自动更新酒店入住和退房日期
    if (fieldName === 'tour_start_date' && date) {
      const { checkInDate, checkOutDate } = getDefaultHotelDates();
      
      setFormData(prev => ({
        ...prev,
        hotelCheckInDate: checkInDate,
        hotelCheckOutDate: checkOutDate
      }));
    }
    
    // 如果更改的是行程结束日期，自动更新酒店退房日期
    if (fieldName === 'tour_end_date' && date) {
      setFormData(prev => ({
        ...prev,
        hotelCheckOutDate: date
      }));
    }
  };
  
  // 处理人数变化自动更新乘客列表
  const handleAdultCountChange = (e) => {
    const newAdultCount = parseInt(e.target.value) || 1;
    if (newAdultCount < 1) return;
    
    // 更新表单数据中的adult_count
    setFormData(prev => ({
      ...prev,
      adult_count: newAdultCount
    }));
    
    updatePassengersBasedOnCount(newAdultCount, formData.child_count);
  };
  
  // 处理儿童数量变化
  const handleChildCountChange = (e) => {
    const newChildCount = parseInt(e.target.value) || 0;
    if (newChildCount < 0) return;
    
    // 保存当前儿童信息，以便保留年龄数据
    const currentChildPassengers = formData.passengers
      .filter(p => p.is_child)
      .map(p => ({...p}));
    
    // 更新表单数据
    setFormData(prev => ({
      ...prev,
      child_count: newChildCount
    }));
    
    // 更新乘客列表
    updatePassengersBasedOnCount(formData.adult_count, newChildCount, currentChildPassengers);
    
    // 收集儿童年龄数据
    const childrenAges = currentChildPassengers
      .slice(0, newChildCount)
      .map(p => parseInt(p.child_age) || 0);
    
    // 使用儿童年龄数据调用价格计算
    if (newChildCount > 0) {
      // 如果有儿童，则传递年龄数据
      updateTotalPriceWithChildAges(childrenAges);
    } else {
      // 如果没有儿童，则使用普通价格计算
      updateTotalPrice(formData.adult_count, newChildCount);
    }
  };
  
  // 更新乘客数量
  const updatePassengersBasedOnCount = (adultCount, childCount, currentChildPassengers = []) => {
    const totalCount = adultCount + childCount;
    
    // 当前乘客列表
    const currentPassengers = [...formData.passengers];
    
    // 调试信息
    console.log('更新乘客信息:', {
      目前乘客总数: currentPassengers.length,
      目标成人数: adultCount,
      目标儿童数: childCount,
      目标总数: totalCount,
      当前儿童信息: currentChildPassengers
    });
    
    // 创建新的乘客数组
    const newPassengers = [];
    
    // 先添加成人
    for (let i = 0; i < adultCount; i++) {
      if (i < currentPassengers.length && !currentPassengers[i].is_child) {
        // 保留已有的成人数据
        newPassengers.push(currentPassengers[i]);
      } else {
        // 添加新成人，第一个为主联系人
        newPassengers.push({
          full_name: '',
          is_child: false,
          phone: '',
          wechat_id: '',
          is_primary: i === 0
        });
      }
    }
    
    // 再添加儿童
    for (let i = 0; i < childCount; i++) {
      if (i < currentChildPassengers.length) {
        // 使用保存的儿童数据，保留年龄信息
        newPassengers.push(currentChildPassengers[i]);
      } else {
        // 添加新儿童
        newPassengers.push({
          full_name: '',
          is_child: true,
          phone: '',
          wechat_id: '',
          child_age: '', // 空的年龄字段
          is_primary: false
        });
      }
    }
    
    console.log('更新后的乘客列表:', newPassengers);
    
    // 更新表单数据
    setFormData(prev => ({
      ...prev,
      passengers: newPassengers
    }));
  };
  
  // 更新总价格 - 只使用API计算
  const updateTotalPrice = async (adultCount = formData.adult_count, childCount = formData.child_count) => {
    if (!tourId) {
      // 如果没有tourId，设置价格为0
      setFormData(prev => ({
        ...prev,
        total_price: '0.00'
      }));
      return '0.00';
    }
    
    // 使用防抖机制调用API计算价格
    schedulePriceUpdate();
    return formData.total_price || '0.00';
  };
  
  // 新增计算价格函数，使用服务器API
  const fetchTourPrice = async () => {
    if (!tourId) return '0.00';
    
    // 如果当前正在加载价格，不重复请求
    if (isPriceLoading) {
      console.log('价格计算正在进行中，跳过重复请求');
      return formData.total_price || '0.00';
    }
    
    try {
      // 设置价格加载状态
      setIsPriceLoading(true);
      
      // 确定旅游类型
      const isGroupTour = (tourType || '').toLowerCase().includes('group');
      const tourTypeParam = isGroupTour ? 'group_tour' : 'day_tour';
      const numericAdultCount = parseInt(formData.adult_count, 10) || 1;
      const numericChildCount = parseInt(formData.child_count, 10) || 0;
      const hotelLevel = formData.hotel_level || '4星';
      const numericRoomCount = parseInt(formData.hotel_room_count, 10) || 1;
      
      // 确保tourId是整数
      const numericTourId = parseInt(tourId, 10);
      
      if (isNaN(numericTourId)) {
        console.error(`无效的tourId: ${tourId}, 无法转换为整数`);
        toast.error("无效的行程ID");
        setIsPriceLoading(false);
        return '0.00';
      }
      
      console.log(`计算价格: tourId=${numericTourId}, tourType=${tourTypeParam}, adultCount=${numericAdultCount}, childCount=${numericChildCount}, hotelLevel=${hotelLevel}, roomCount=${numericRoomCount}`);
      
      // 记录tourDetails状态，检查酒店晚数信息
      console.log('当前tourDetails信息:', {
        id: tourDetails?.id,
        title: tourDetails?.title,
        duration: tourDetails?.duration,
        hotelNights: tourDetails?.hotelNights,
        计算的酒店晚数: getHotelNights()
      });
      
      // 如果是代理商，获取代理商ID
      const numericAgentId = isAgent && agentId ? parseInt(agentId, 10) : null;
      
      // 调用服务端API计算价格
      const response = await calculateTourPrice(
        numericTourId,
        tourTypeParam,
        numericAdultCount,
        numericChildCount,
        hotelLevel,
        numericAgentId,
        numericRoomCount
      );
      
      if (response && response.code === 1 && response.data) {
        const priceData = response.data;
        
        // 使用辅助函数获取酒店晚数
        const hotelNights = getHotelNights();
        
        console.log('服务器返回的价格数据:', priceData);
        
        // 记录收到的房间数并确保与表单一致
        if (priceData.roomCount && priceData.roomCount !== numericRoomCount) {
          console.warn(`房间数不一致: 表单=${numericRoomCount}, 服务器返回=${priceData.roomCount}`);
          // 优先使用表单的房间数
          priceData.roomCount = numericRoomCount;
        }
        
        // 更新价格信息，包含后端返回的所有字段
        const newPriceDetails = {
          ...priceData,
          // 保留以下重要字段，确保与后端返回保持一致
          adultCount: priceData.adultCount || numericAdultCount,
          childCount: priceData.childCount || numericChildCount,
          adultTotalPrice: priceData.adultTotalPrice || 0,
          childrenTotalPrice: priceData.childrenTotalPrice || 0,
          childPrices: priceData.childPrices || [],
          childrenAges: priceData.childrenAges || [],
          originalPrice: priceData.originalPrice || 0,
          discountedPrice: priceData.discountedPrice || priceData.totalPrice || 0,
          totalPrice: priceData.totalPrice || 0,
          basePrice: priceData.basePrice || 0,
          childUnitPrice: priceData.childUnitPrice || 0,
          discountRate: priceData.discountRate || 1,
          hotelNights: hotelNights,
          roomCount: priceData.roomCount || numericRoomCount,
          // 其他价格相关字段
          hotelPriceDifference: priceData.hotelPriceDifference || 0,
          dailySingleRoomSupplement: priceData.dailySingleRoomSupplement || 0,
          hotelRoomPrice: priceData.hotelRoomPrice || 0,
          baseHotelLevel: priceData.baseHotelLevel || '4星',
          extraRoomFee: priceData.extraRoomFee || 0,
          theoreticalRoomCount: priceData.theoreticalRoomCount || Math.ceil(numericAdultCount/2),
          extraRooms: priceData.extraRooms || (numericRoomCount - Math.ceil(numericAdultCount/2)),
          nonAgentPrice: priceData.nonAgentPrice || 0,
          needsSingleRoomSupplement: priceData.needsSingleRoomSupplement || false
        };
        
        // 只有当价格确实发生变化时才更新状态
        const currentTotalPrice = parseFloat(formData.total_price || '0');
        const newTotalPrice = priceData.totalPrice || 0;
        
        if (Math.abs(currentTotalPrice - newTotalPrice) > 0.01) {
          // 一次性批量更新状态，减少重渲染次数
          setPriceDetails(newPriceDetails);
        
        // 更新表单价格
        setFormData(prev => ({
          ...prev,
          total_price: priceData.totalPrice ? priceData.totalPrice.toFixed(2) : '0.00'
        }));
        }
        
        console.log(`成人: ${numericAdultCount}人，儿童: ${numericChildCount}人，房间: ${numericRoomCount}间，酒店差价计算: ${priceData.hotelPriceDifference || 0}/晚 × ${hotelNights}晚 × ${numericRoomCount}间 = ${(priceData.hotelPriceDifference || 0) * hotelNights * numericRoomCount}`);
        
        setIsPriceLoading(false);
        return priceData.totalPrice ? priceData.totalPrice.toFixed(2) : '0.00';
      }
      
      // 返回默认值
      console.warn('API没有返回有效的价格数据');
      setIsPriceLoading(false);
      return '0.00';
    } catch (error) {
      console.error('获取价格信息失败:', error);
      toast.error("价格计算失败，请稍后再试");
      
      // 清空价格信息
      setPriceDetails({
        originalPrice: 0,
        discountedPrice: 0,
        totalPrice: 0,
        hotelPriceDifference: 0,
        dailySingleRoomSupplement: 0,
        hotelRoomPrice: 0,
        baseHotelLevel: '4星',
        agentDiscount: 0,
        hotelNights: 0,
        roomCount: 0,
        adultCount: 1,
        childCount: 0,
        // 添加新字段的默认值
        extraRoomFee: 0,
        theoreticalRoomCount: 1,
        extraRooms: 0,
        basePrice: 0,
        childUnitPrice: 0,
        nonAgentPrice: 0,
        discountRate: 1,
        needsSingleRoomSupplement: false
      });
      
      setFormData(prev => ({
        ...prev,
        total_price: '0.00'
      }));
      
      setIsPriceLoading(false);
      return '0.00';
    }
  };
  
  // 获取旅游产品数据
  const fetchTourData = async () => {
    // 避免重复获取
    if (loading) return;
    
      setLoading(true);
    setError(null);
    
    try {
      console.log(`获取旅游产品信息: tourId=${tourId}, tourType=${tourType}`);
      
      // 首先检查location.state中是否包含tourData
      if (location.state && location.state.tourData) {
        console.log('使用从详情页传递的产品数据:', location.state.tourData);
        
        // 使用预先传递的产品数据
        const passedTourData = location.state.tourData;
        // 确保duration和hotelNights是数值类型
        const duration = parseInt(passedTourData.duration) || 0;
        const hotelNights = parseInt(passedTourData.hotelNights) || (duration > 0 ? duration - 1 : 0);
        
        // 只更新一次tourDetails，避免循环更新
        setTourDetails({
          ...passedTourData,
          id: tourId,
          title: passedTourData.title || '',
          imageUrl: passedTourData.imageUrl || '',
          duration: duration,
          hotelNights: hotelNights,
          highlights: passedTourData.highlights || []
        });
        
        console.log('设置行程详情:', {
          duration: duration,
          hotelNights: hotelNights
        });
        
        // 将旅游产品的默认值更新到表单数据中
        updateFormWithTourDefaults({
          ...passedTourData,
          id: tourId,
          duration: duration
        });
        
        // 如果是代理商，计算折扣价格
        if (isAgent) {
          try {
            await calculateAgentPrice({
              ...passedTourData,
              id: tourId,
              price: location.state.bookingOptions?.totalPrice || 0
            });
          } catch (err) {
            console.error('折扣价格计算失败，使用原价:', err);
          }
        }
        
        // 标记价格已加载，以便可以进行用户交互触发的价格更新
        priceLoaded.current = true;
        
        // 使用宏任务延迟而不是直接嵌套API调用，避免递归状态更新
        if (!tourDataFetched.current) {
          setTimeout(() => {
            fetchTourDetails(tourId, tourType).catch(err => {
              console.error('获取行程详情出错:', err);
            });
          }, 100);
        }
        
        setLoading(false);
        return;
      }
      
      if (!tourId) {
        setError('未指定产品ID，无法加载产品信息');
        setLoading(false);
        return;
      }
      
      // 规范化旅游类型
      const normalizedType = (tourType || '').toLowerCase();
      const isGroupTour = normalizedType.includes('group');
      const apiTourType = isGroupTour ? 'group' : 'day';
      
      console.log(`使用API类型: ${apiTourType}, 原始类型: ${tourType}`);
      
      // 使用正确的API服务获取旅游产品数据
      const response = await getTourById(tourId, apiTourType);
      
      if (response && response.code === 1 && response.data) {
        const tourData = response.data;
        console.log('成功获取产品信息:', tourData);
        
        // 确保数据类型正确
        const duration = parseInt(tourData.duration) || 0;
        const hotelNights = parseInt(tourData.hotelNights) || (duration > 0 ? duration - 1 : 0);
        
        // 将数据保存到状态
        setTourDetails({
          ...tourData,
          duration: duration,
          hotelNights: hotelNights
        });
        
        // 将旅游产品的默认值更新到表单数据中
        updateFormWithTourDefaults(tourData);
        
        // 如果是代理商，计算折扣价格
        if (isAgent) {
          try {
            await calculateAgentPrice(tourData);
          } catch (err) {
            console.error('折扣价格计算失败，使用原价:', err);
          }
        }
        
        // 标记价格已加载
        priceLoaded.current = true;
        
        // 使用宏任务延迟
        setTimeout(() => {
          // 尝试获取更多详细信息（亮点、包含项等）
          fetchTourDetails(tourId, apiTourType).catch(err => {
            console.error('获取行程详情出错:', err);
          });
        }, 100);
        
        // 延迟获取价格
        setTimeout(() => {
          // 获取到基本数据后尝试更新价格（如果必要）
          if (!isPriceLoading) {
            fetchTourPrice().catch(err => {
              console.error('价格获取失败:', err);
            });
          }
        }, 200);
      } else {
        console.error('API返回错误或无数据', response);
        setError(response?.message || '无法加载产品信息，请重试。');
      }
    } catch (error) {
      console.error('获取产品信息失败:', error);
      setError('获取产品信息出错，请刷新页面重试。');
    } finally {
      setLoading(false);
    }
  };

  // 根据旅游产品更新表单默认值
  const updateFormWithTourDefaults = (tourData) => {
    if (!tourData) return;
    
    // 从URL参数获取信息
    const params = new URLSearchParams(location.search);
    const dateParam = params.get('date');
    const arrivalDateParam = params.get('arrivalDate');
    const departureDateParam = params.get('departureDate');
    const roomCountParam = parseInt(params.get('roomCount') || '1', 10);
    
    // 从location.state获取详情页传递的信息
    const { tourDate, adultCount, childCount, roomCount, bookingOptions } = location.state || {};
    
    console.log('日期参数调试信息:', {
      tourDate: tourDate,
      arrivalDateParam: arrivalDateParam,
      dateParam: dateParam,
      departureDateParam: departureDateParam
    });
    
    // 修改日期参数处理逻辑，优先使用arrivalDate
    // ====关键修改: 强制优先使用URL中的arrivalDate和departureDate====
    let startDateFromParams = null;
    let endDateFromParams = null;
    
    // 对于跟团游，优先使用arrivalDate和departureDate
    if ((tourType || '').toLowerCase().includes('group')) {
      console.log('跟团游模式: 优先使用 arrivalDate 和 departureDate');
      startDateFromParams = arrivalDateParam ? new Date(arrivalDateParam) : (tourDate ? new Date(tourDate) : null);
      endDateFromParams = departureDateParam ? new Date(departureDateParam) : null;
    } else {
      // 日游模式
      console.log('日游模式: 优先使用 date 参数');
      startDateFromParams = dateParam ? new Date(dateParam) : 
                          (tourDate ? new Date(tourDate) : null);
      endDateFromParams = startDateFromParams ? new Date(startDateFromParams) : null;
    }
    
    // 如果通过上述逻辑仍未获取到有效的开始日期，尝试其他参数作为备选
    if (!startDateFromParams) {
      console.log('未找到有效的开始日期参数，尝试备选参数');
      startDateFromParams = arrivalDateParam ? new Date(arrivalDateParam) : 
                          dateParam ? new Date(dateParam) : null;
    }
    
    // 日志输出处理后的日期
    console.log('处理后的日期参数:', {
      startDateFromParams: startDateFromParams ? startDateFromParams.toISOString().split('T')[0] : null,
      endDateFromParams: endDateFromParams ? endDateFromParams.toISOString().split('T')[0] : null,
    });
    
    const adultCountValue = adultCount || parseInt(params.get('adultCount') || '2', 10);
    const childCountValue = childCount || parseInt(params.get('childCount') || '0', 10);
    const roomCountValue = roomCount || roomCountParam || 1;
    
    console.log('更新表单默认值:', {
      startDate: startDateFromParams,
      endDate: endDateFromParams,
      adultCount: adultCountValue,
      childCount: childCountValue,
      roomCount: roomCountValue,
      hotelLevel: bookingOptions?.hotelLevel || '4星'
    });
    
    // 日期处理，设置行程默认日期
    const today = new Date();
    const defaultTourDate = startDateFromParams || today;
    
    // 确保日期在今天之后
    if (defaultTourDate < today) {
      defaultTourDate.setDate(today.getDate());
    }
    
    // 计算行程结束日期（日游使用同一天，跟团游使用行程天数）
    let endDate = endDateFromParams ? new Date(endDateFromParams) : new Date(defaultTourDate);
    
    // 如果是跟团游且没有结束日期，根据行程天数计算结束日期
    if (!endDateFromParams && tourData.duration > 1) {
      endDate.setDate(defaultTourDate.getDate() + parseInt(tourData.duration) - 1);
    }
    
    // 创建房型数组
    const roomTypesArray = Array(roomCountValue).fill('标准双人间');
    
    // 更新表单中的所有相关字段
    setFormData(prev => ({
      ...prev,
      tour_start_date: defaultTourDate,
      tour_end_date: endDate,
      pickup_date: defaultTourDate,
      dropoff_date: endDate,
      adult_count: adultCountValue,
      child_count: childCountValue,
      hotel_room_count: roomCountValue,
      roomTypes: roomTypesArray,
      hotel_level: bookingOptions?.hotelLevel || prev.hotel_level
    }));
    
    // 重新创建乘客列表以匹配adultCount和childCount
    const totalPassengers = adultCountValue + childCountValue;
    const updatedPassengers = [];
    
    // 添加成人乘客
    for (let i = 0; i < adultCountValue; i++) {
      updatedPassengers.push({
        full_name: '',
        is_child: false,
        phone: '',
        wechat_id: '',
        is_primary: i === 0
      });
    }
    
    // 添加儿童乘客
    for (let i = 0; i < childCountValue; i++) {
      updatedPassengers.push({
        full_name: '',
        is_child: true,
        phone: '',
        wechat_id: ''
      });
    }
    
    // 单独更新乘客列表，避免覆盖之前的设置
    setFormData(prev => ({
      ...prev,
      passengers: updatedPassengers
    }));
    
    console.log('表单已完全更新:', {
      开始日期: defaultTourDate,
      结束日期: endDate,
      成人数量: adultCountValue,
      儿童数量: childCountValue,
      房间数量: roomCountValue,
      乘客数量: updatedPassengers.length
    });
  };
  
  // 获取旅游详情数据
  const fetchTourDetails = async (id, type) => {
    if (!id) return;
    
    try {
      // 规范化类型
      const normalizedType = (type || '').toLowerCase();
      const isGroupTour = normalizedType === 'group' || 
                          normalizedType === 'group_tour' || 
                          normalizedType.includes('group');
      
      // 设置请求URL前缀 - 确保使用正确的API路径
      const apiEndpoint = isGroupTour ? 'group-tours' : 'day-tours';
      console.log(`使用API端点: /api/user/${apiEndpoint}/${id}/..., 旅游类型: ${type}, 经规范化后: ${isGroupTour ? 'group' : 'day'}`);
      
      // 获取亮点数据
      const highlightsPromise = fetch(`/api/user/${apiEndpoint}/${id}/highlights`)
        .then(res => res.json())
        .then(data => {
          if (data && data.code === 1 && data.data) {
            // 更新行程详情中的亮点数据
            setTourDetails(prev => ({
              ...prev,
              highlights: Array.isArray(data.data) ? data.data : [data.data]
            }));
          }
        })
        .catch(err => console.error('获取亮点失败:', err));
      
      // 获取包含项数据
      const inclusionsPromise = fetch(`/api/user/${apiEndpoint}/${id}/inclusions`)
        .then(res => res.json())
        .then(data => {
          if (data && data.code === 1 && data.data) {
            // 更新行程详情中的包含项数据
            setTourDetails(prev => ({
              ...prev,
              inclusions: Array.isArray(data.data) ? data.data : [data.data]
            }));
          }
        })
        .catch(err => console.error('获取包含项失败:', err));
      
      // 获取不包含项数据
      const exclusionsPromise = fetch(`/api/user/${apiEndpoint}/${id}/exclusions`)
        .then(res => res.json())
        .then(data => {
          if (data && data.code === 1 && data.data) {
            // 更新行程详情中的不包含项数据
            setTourDetails(prev => ({
              ...prev,
              exclusions: Array.isArray(data.data) ? data.data : [data.data]
            }));
          }
        })
        .catch(err => console.error('获取不包含项失败:', err));
      
      // 如果是跟团游，获取行程安排
      let itineraryPromise = Promise.resolve();
      if (isGroupTour) {
        itineraryPromise = fetch(`/api/user/${apiEndpoint}/${id}/itinerary`)
          .then(res => res.json())
          .then(data => {
            if (data && data.code === 1 && data.data) {
              // 更新行程详情中的行程安排数据
              setTourDetails(prev => ({
                ...prev,
                itinerary: Array.isArray(data.data) ? data.data : [data.data],
                days: prev.days || data.data.length || prev.duration || 1,
                nights: prev.nights || (data.data.length > 0 ? data.data.length - 1 : 0)
              }));
            }
          })
          .catch(err => console.error('获取行程安排失败:', err));
      }
      
      // 等待所有请求完成
      const promises = [highlightsPromise, inclusionsPromise, exclusionsPromise];
      if (isGroupTour) {
        promises.push(itineraryPromise);
      }
      
      await Promise.all(promises);
      
    } catch (error) {
      console.error('获取行程详细信息失败:', error);
    }
  };
  
  // 表单验证函数
  const validateForm = () => {
    const errors = {};
    
    // 确定旅游类型
    const isGroupTour = (tourType || '').toLowerCase().includes('group');
    
    // 验证旅行日期
    if (!formData.tour_start_date) errors.tour_start_date = "请选择行程开始日期";
    if (!formData.tour_end_date) errors.tour_end_date = "请选择行程结束日期";
    
    // 航班信息非必填
    // if (isGroupTour) {
    //   if (!formData.arrival_flight) errors.arrival_flight = "请填写抵达航班号";
    //   if (!formData.departure_flight) errors.departure_flight = "请填写返程航班号";
    // }
    
    // 验证接送信息
    if (!formData.pickup_location) errors.pickup_location = "请填写接车地点";
    if (!formData.pickup_date) errors.pickup_date = "请选择接车日期";
    
    
    
    if (!formData.dropoff_date) errors.dropoff_date = "请选择送回日期";
    
    // 验证酒店信息(仅限跟团游)
    if (isGroupTour) {
      if (!formData.hotel_level) errors.hotel_level = "请选择酒店星级";
      if (!formData.hotel_room_count || formData.hotel_room_count < 1) errors.hotel_room_count = "请填写有效的房间数量";
      
      // 验证每个房间的房型
      if (formData.roomTypes && formData.roomTypes.length > 0) {
        formData.roomTypes.forEach((roomType, index) => {
          if (!roomType) {
            errors[`roomTypes.${index}`] = "请选择房型";
          }
        });
      } else {
        errors.roomTypes = "请至少选择一个房型";
      }
    }
    
    // 验证乘客信息
    if (!formData.passengers || formData.passengers.length === 0) {
      errors.passengers = "至少需要添加一位乘客";
    } else {
      // 只验证主联系人信息
      const primaryContact = formData.passengers[0];
      if (!primaryContact.full_name) {
        errors[`passengers.0.full_name`] = "请填写主联系人姓名";
      }
      if (!primaryContact.phone) {
        errors[`passengers.0.phone`] = "请填写主联系人联系电话";
      }
      if (!primaryContact.wechat_id) {
        errors[`passengers.0.wechat_id`] = "请填写主联系人微信号";
      }
      
      // 验证所有儿童乘客的年龄
      formData.passengers.forEach((passenger, index) => {
        if (passenger.is_child && !passenger.child_age) {
          errors[`passengers.${index}.child_age`] = "请填写儿童年龄";
        }
      });
    }
    
    // 酒店信息验证（只对跟团游进行验证）
    if (isGroupTour) {
      if (!formData.hotel_level) errors.hotel_level = '请选择酒店星级';
      if (!formData.hotel_room_count || formData.hotel_room_count < 1) errors.hotel_room_count = '请选择有效的房间数量';
      
      // 酒店日期验证
      if (!formData.hotelCheckInDate) errors.hotelCheckInDate = '请选择酒店入住日期';
      if (!formData.hotelCheckOutDate) errors.hotelCheckOutDate = '请选择酒店退房日期';
      
      // 日期逻辑检查
      if (formData.hotelCheckInDate && formData.hotelCheckOutDate && 
          formData.hotelCheckInDate > formData.hotelCheckOutDate) {
        errors.hotelCheckOutDate = '退房日期必须晚于入住日期';
      }
    }
    
    return errors;
  };
  
  // 计算总价格 - 直接使用后端API返回的价格
  const calculateTotalPrice = () => {
    // 直接返回priceDetails中的总价格，不做任何前端计算
    return priceDetails.totalPrice?.toFixed(2) || '0.00';
  };
  
  // 计算代理商折扣价格
  const calculateAgentPrice = async (tourData) => {
    try {
      const agentId = localStorage.getItem('agentId');
      if (!agentId) return;
      
      console.log('计算代理商折扣价格');
      
      // 规范化旅游类型
      const apiTourType = tourType === 'group' || tourType.includes('group') ? 'group' : 'day';
      console.log(`使用API旅游类型: ${apiTourType}, 原始类型: ${tourType}`);
      
      const discountResult = await calculateTourDiscount({
        tourId: tourData.id,
        tourType: apiTourType,
        originalPrice: Number(tourData.price || 0),
        agentId: Number(agentId)
      });
      
      console.log('折扣计算结果:', discountResult);
      
      // 更新价格信息
      setPriceDetails(prev => ({
        ...prev,
        originalPrice: Number(tourData.price || 0),
        discountedPrice: discountResult.discountedPrice || Number(tourData.price || 0),
        discountRate: discountResult.discountRate || 1,
        savedAmount: discountResult.savedAmount || 0
      }));
    } catch (error) {
      console.error('计算折扣价格失败:', error);
      // 折扣计算失败时使用原价
    }
  };
  
  // 添加获取酒店价格的函数
  const fetchHotelPrices = async () => {
    try {
      const response = await getHotelPrices();
      if (response && response.code === 1 && Array.isArray(response.data)) {
        console.log('成功获取酒店价格列表:', response.data);
        setHotelPrices(response.data);
      } else {
        // API返回错误或无数据，设置为空数组
        console.warn('API未返回有效数据，使用空数组', response);
        setHotelPrices([]);
      }
    } catch (error) {
      console.error('获取酒店价格差异失败:', error);
      // 发生错误时，设置为空数组
      setHotelPrices([]);
    }
  };
  
  // 添加一个新的useEffect，监听航班日期变化，自动更新接送日期
  useEffect(() => {
    // 如果抵达航班日期存在，更新接车日期
    if (formData.arrival_departure_time) {
      setFormData(prev => ({
        ...prev,
        pickup_date: new Date(formData.arrival_departure_time),
        pickup_location: '霍巴特机场 (Hobart Airport)'
      }));
    }
    
    // 如果返程航班日期存在，更新送回日期
    if (formData.departure_departure_time) {
      setFormData(prev => ({
        ...prev,
        dropoff_date: new Date(formData.departure_departure_time),
        dropoff_location: '霍巴特机场 (Hobart Airport)'
      }));
    }
  }, [formData.arrival_departure_time, formData.departure_departure_time]);
  
  // 渲染接送字段
  const renderPickupAndDropoffFields = () => {
    return (
      <>
        <Row>
          <Form.Group as={Col} md={6}>
            <Form.Label>接车日期</Form.Label>
            <div className="position-relative">
              <DatePicker
                selected={formData.pickup_date}
                onChange={date => enhancedHandleDateChange('pickup_date', date)}
                dateFormat="yyyy-MM-dd"
                className="form-control"
                placeholderText="选择接车日期"
                isInvalid={!!validationErrors.pickup_date}
                isClearable={false}
                showMonthDropdown
                showYearDropdown
                dropdownMode="select"
              />
              <div className="position-absolute top-0 end-0 pe-3 pt-2">
                <FaCalendarAlt />
              </div>
            </div>
            
            <Form.Control.Feedback type="invalid">
              {validationErrors.pickup_date}
            </Form.Control.Feedback>
          </Form.Group>
          <Form.Group as={Col} md={6}>
            <Form.Label>接车地点</Form.Label>
            <Form.Control
              type="text"
              name="pickup_location"
              value={formData.pickup_location}
              onChange={handleChange}
              placeholder="酒店名称/地址"
              isInvalid={!!validationErrors.pickup_location}
            />
            
            <Form.Control.Feedback type="invalid">
              {validationErrors.pickup_location}
            </Form.Control.Feedback>
          </Form.Group>
        </Row>
        
          
        {(
          <div className="mt-3">
            <h6 className="mb-3">送客信息</h6>
            <Row>
              <Form.Group as={Col} md={6}>
                <Form.Label>送回日期</Form.Label>
                <div className="position-relative">
                  <DatePicker
                    selected={formData.dropoff_date}
                    onChange={date => enhancedHandleDateChange('dropoff_date', date)}
                    dateFormat="yyyy-MM-dd"
                    className="form-control"
                    placeholderText="选择送回日期"
                    isInvalid={!!validationErrors.dropoff_date}
                    isClearable={false}
                    showMonthDropdown
                    showYearDropdown
                    dropdownMode="select"
                  />
                  <div className="position-absolute top-0 end-0 pe-3 pt-2">
                    <FaCalendarAlt />
                  </div>
                </div>
                
                <Form.Control.Feedback type="invalid">
                  {validationErrors.dropoff_date}
                </Form.Control.Feedback>
              </Form.Group>
              <Form.Group as={Col} md={6}>
                <Form.Label>送回地点</Form.Label>
                <Form.Control
                  type="text"
                  name="dropoff_location"
                  value={formData.dropoff_location}
                  onChange={handleChange}
                  placeholder="酒店名称/地址"
                  isInvalid={!!validationErrors.dropoff_location}
                />
                
                <Form.Control.Feedback type="invalid">
                  {validationErrors.dropoff_location}
                </Form.Control.Feedback>
              </Form.Group>
            </Row>
          </div>
        )}
      </>
    );
  };
  
  // 渲染多个房间的房型选择
  const renderRoomTypes = () => {
    const rooms = [];
    const roomCount = parseInt(formData.hotel_room_count || 1);
    
    // 确保formData中有roomTypes数组
    if (!formData.roomTypes || formData.roomTypes.length !== roomCount) {
      // 初始化或调整roomTypes数组大小
      const newRoomTypes = Array(roomCount).fill(null).map((_, index) => 
        (formData.roomTypes && formData.roomTypes[index]) || '双人间'
      );
      
      // 更新formData
      setFormData(prev => ({
        ...prev,
        roomTypes: newRoomTypes
      }));
    }
    
    // 为每个房间生成房型选择
    for (let i = 0; i < roomCount; i++) {
      rooms.push(
        <Row key={`room-${i}`}>
          <Form.Group as={Col} md={12} className="mb-3">
            <Form.Label>房间 {i + 1} 房型</Form.Label>
            <Form.Select
              name={`roomTypes[${i}]`}
              value={(formData.roomTypes && formData.roomTypes[i]) || '双人间'}
              onChange={(e) => handleRoomTypeChange(i, e.target.value)}
              isInvalid={!!validationErrors[`roomTypes.${i}`]}
            >
              <option value="双人间">双人间</option>
              <option value="三人间">三人间</option>
              <option value="单人间">单人间</option>
            </Form.Select>
            <Form.Control.Feedback type="invalid">
              {validationErrors[`roomTypes.${i}`]}
            </Form.Control.Feedback>
          </Form.Group>
        </Row>
      );
    }
    
    return rooms;
  };
  
  // 处理房型变化
  const handleRoomTypeChange = (index, value) => {
    const newRoomTypes = [...(formData.roomTypes || [])];
    newRoomTypes[index] = value;
    
    setFormData(prev => ({
      ...prev,
      roomTypes: newRoomTypes
    }));
  };
  
  // 处理房间数量变化
  const handleRoomCountChange = (e) => {
    const newCount = parseInt(e.target.value) || 1;
    
    console.log('手动更改房间数:', {
      从: formData.hotel_room_count,
      到: newCount
    });
    
    // 调整roomTypes数组大小
    let newRoomTypes = [...(formData.roomTypes || [])];
    
    if (newCount > newRoomTypes.length) {
      // 添加新房间，默认双人间
      newRoomTypes = [...newRoomTypes, ...Array(newCount - newRoomTypes.length).fill('双人间')];
    } else if (newCount < newRoomTypes.length) {
      // 减少房间
      newRoomTypes = newRoomTypes.slice(0, newCount);
    }
    
    setFormData(prev => ({
      ...prev,
      hotel_room_count: newCount,
      roomTypes: newRoomTypes
    }));
    
    // 不直接调用updateTotalPrice，让useEffect的防抖机制处理价格更新
  };
  
  // 添加渲染酒店选项的函数
  const renderHotelOptions = () => {
    // 获取行程天数和酒店晚数 - 确保为数值
    const tourDuration = parseInt(tourDetails?.duration) || 0;
    const hotelNights = getHotelNights(); // 使用统一的函数获取酒店晚数
    
    return (
      <>
        <Row>
          <Form.Group as={Col} md={6} className="mb-3">
            <Form.Label>酒店星级</Form.Label>
            <Form.Select 
              name="hotel_level"
              value={formData.hotel_level || '4星'}
              onChange={handleChange}
              isInvalid={!!validationErrors.hotel_level}
            >
              {hotelPrices && hotelPrices.length > 0 ? (
                hotelPrices.map(hotel => (
                  <option key={hotel.id} value={hotel.hotelLevel}>
                    {hotel.hotelLevel}
                  </option>
                ))
              ) : (
                <option value="4星">4星 - 标准酒店</option>
              )}
            </Form.Select>
            <Form.Control.Feedback type="invalid">
              {validationErrors.hotel_level}
            </Form.Control.Feedback>
          </Form.Group>
          
          <Form.Group as={Col} md={6} className="mb-3">
            <Form.Label>房间数量</Form.Label>
            <Form.Control
              type="number"
              name="hotel_room_count"
              value={formData.hotel_room_count || 1}
              onChange={handleRoomCountChange}
              min="1"
              isInvalid={!!validationErrors.hotel_room_count}
            />
            <Form.Control.Feedback type="invalid">
              {validationErrors.hotel_room_count}
            </Form.Control.Feedback>
            <Form.Text className="text-muted">
              建议房间数: {Math.ceil(formData.adult_count/2)}间
            </Form.Text>
          </Form.Group>
        </Row>
        
        {/* 添加酒店入住和退房日期 */}
        <Row>
          <Form.Group as={Col} md={6} className="mb-3">
            <Form.Label>酒店入住日期</Form.Label>
            <div className="position-relative">
              <DatePicker
                selected={formData.hotelCheckInDate}
                onChange={date => enhancedHandleDateChange('hotelCheckInDate', date)}
                dateFormat="yyyy-MM-dd"
                className="form-control"
                placeholderText="选择酒店入住日期"
                minDate={formData.tour_start_date}
                maxDate={formData.hotelCheckOutDate}
                isInvalid={!!validationErrors.hotelCheckInDate}
                isClearable={false}
                showMonthDropdown
                showYearDropdown
                dropdownMode="select"
              />
              <div className="position-absolute top-0 end-0 pe-3 pt-2">
                <FaCalendarAlt />
              </div>
            </div>
            <Form.Control.Feedback type="invalid">
              {validationErrors.hotelCheckInDate}
            </Form.Control.Feedback>
          </Form.Group>
          
          <Form.Group as={Col} md={6} className="mb-3">
            <Form.Label>酒店退房日期</Form.Label>
            <div className="position-relative">
              <DatePicker
                selected={formData.hotelCheckOutDate}
                onChange={date => enhancedHandleDateChange('hotelCheckOutDate', date)}
                dateFormat="yyyy-MM-dd"
                className="form-control"
                placeholderText="选择酒店退房日期"
                minDate={formData.hotelCheckInDate || formData.tour_start_date}
                maxDate={formData.tour_end_date}
                isInvalid={!!validationErrors.hotelCheckOutDate}
                isClearable={false}
                showMonthDropdown
                showYearDropdown
                dropdownMode="select"
              />
              <div className="position-absolute top-0 end-0 pe-3 pt-2">
                <FaCalendarAlt />
              </div>
            </div>
            <Form.Control.Feedback type="invalid">
              {validationErrors.hotelCheckOutDate}
            </Form.Control.Feedback>
          </Form.Group>
        </Row>
        
        {/* 渲染多个房间的房型选择 */}
        {renderRoomTypes()}
        
        <Row>
          <Form.Group as={Col} md={12} className="mb-3">
            <Form.Label>特殊房间要求</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              name="room_details"
              value={formData.room_details || ''}
              onChange={handleChange}
              placeholder="特殊要求（如需要婴儿床等）"
            />
          </Form.Group>
        </Row>
      </>
    );
  };
  
  // 修改客人信息部分的渲染逻辑
  const renderPassengers = () => {
    // 确定旅游类型
    const isGroupTour = (tourType || '').toLowerCase().includes('group');
    
    return (
      <>
        {/* 已选择人数提示 */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h6 className="mb-0">人数与房间</h6>
          </div>
          <div className="d-flex flex-wrap">
            <Form.Group className="d-flex align-items-center me-3 mb-2">
              <Form.Label className="me-2 mb-0">成人:</Form.Label>
              <Form.Control
                type="number"
                min="1"
                style={{ width: '80px' }}
                value={formData.adult_count}
                onChange={handleAdultCountChange}
              />
            </Form.Group>
            <Form.Group className="d-flex align-items-center me-3 mb-2">
              <Form.Label className="me-2 mb-0">儿童:</Form.Label>
              <Form.Control
                type="number"
                min="0"
                style={{ width: '80px' }}
                value={formData.child_count}
                onChange={handleChildCountChange}
              />
            </Form.Group>
          </div>
        </div>
        
        {/* 新增儿童年龄输入区域 */}
        {formData.child_count > 0 && (
          <div className="children-ages mt-3 mb-3">
            <h6 className="mb-2">儿童年龄 <small className="text-muted">(请填写每位儿童的年龄)</small></h6>
            <Row>
              {Array.from({ length: formData.child_count }).map((_, index) => {
                // 找到对应的儿童乘客
                const childPassengers = formData.passengers.filter(p => p.is_child);
                const childPassenger = childPassengers[index];
                return (
                  <Col md={3} key={index} className="mb-2">
                    <Form.Group>
                      <Form.Label className="small">儿童 {index + 1}</Form.Label>
                      <Form.Control
                        type="number"
                        min="0"
                        max="17"
                        value={childPassenger?.child_age || ''}
                        onChange={(e) => handleChildAgeChangeInBooking(index, e.target.value)}
                        onBlur={() => updatePriceOnAgeBlur()}
                        placeholder="年龄"
                        required
                      />
                    </Form.Group>
                  </Col>
                );
              })}
            </Row>
            <div className="text-muted small mt-2">
              <FaInfoCircle className="me-1" /> 儿童年龄将影响价格计算（输入完成后自动计算）
            </div>
          </div>
        )}
        
        {/* 提示信息 */}
        <Alert variant="info" className="mb-3">
          <FaInfoCircle className="me-2" />
          已选择: {formData.adult_count}位成人 + {formData.child_count}位儿童
          {isGroupTour ? `, ${formData.hotel_room_count}间房` : ''}
          <div className="mt-1 small">
            <span className="text-danger">*</span> 只需填写主联系人信息，其他乘客信息选填
          </div>
        </Alert>
        
        {formData.passengers.map((passenger, index) => (
          <Card key={index} className="passenger-card mb-3">
            <Card.Header className="bg-light d-flex justify-content-between align-items-center">
              <div>
                <span className="me-2">
                  {passenger.is_child ? '儿童' : '成人'} #{passenger.is_child ? (index - formData.adult_count + 1) : (index + 1)}
                </span>
                {index === 0 && 
                  <Badge bg="primary">主联系人</Badge>
                }
              </div>
            </Card.Header>
            <Card.Body>
              <Row>
                <Form.Group as={Col} md="6" className="mb-3">
                  <Form.Label>
                    姓名
                    {index === 0 && <span className="text-danger">*</span>}
                  </Form.Label>
                  <Form.Control
                    required={index === 0}
                    type="text"
                    placeholder={index === 0 ? "姓名（必填）" : "姓名（选填）"}
                    value={passenger.full_name || ''}
                    onChange={(e) => handlePassengerChange(index, 'full_name', e.target.value)}
                    isInvalid={index === 0 && submitted && !passenger.full_name}
                  />
                  {index === 0 && submitted && !passenger.full_name && (
                    <Form.Control.Feedback type="invalid">
                      请填写主联系人姓名
                    </Form.Control.Feedback>
                  )}
                </Form.Group>
                
                {/* 儿童年龄字段 */}
                {passenger.is_child && (
                  <Form.Group as={Col} md="6" className="mb-3">
                    <Form.Label>儿童年龄 <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      required
                      type="number"
                      min="0"
                      max="17"
                      placeholder="请输入儿童年龄（必填）"
                      value={passenger.child_age || ''}
                      onChange={(e) => handlePassengerChange(index, 'child_age', e.target.value)}
                      onBlur={(e) => handlePassengerChange(index, 'child_age', e.target.value, true)}
                      isInvalid={submitted && passenger.is_child && (!passenger.child_age && passenger.child_age !== 0)}
                    />
                    {submitted && passenger.is_child && (!passenger.child_age && passenger.child_age !== 0) && (
                      <Form.Control.Feedback type="invalid">
                        请填写儿童年龄
                      </Form.Control.Feedback>
                    )}
                    <Form.Text className="text-muted">
                      儿童年龄可能会影响价格计算
                    </Form.Text>
                  </Form.Group>
                )}
                <Form.Group as={Col} md="6" className="mb-3">
                  <Form.Label>联系电话{index === 0 && <span className="text-danger">*</span>}</Form.Label>
                  <Form.Control
                    required={index === 0}
                    type="text"
                    placeholder={index === 0 ? "联系电话（必填）" : "联系电话（选填）"}
                    value={passenger.phone || ''}
                    onChange={(e) => handlePassengerChange(index, 'phone', e.target.value)}
                    isInvalid={index === 0 && !passenger.phone && !!validationErrors[`passengers.${index}.phone`]}
                  />
                  {index === 0 && (
                    <Form.Control.Feedback type="invalid">
                      {validationErrors[`passengers.${index}.phone`]}
                    </Form.Control.Feedback>
                  )}
                </Form.Group>
              </Row>
              <Row>
                <Form.Group as={Col} md="6" className="mb-3">
                  <Form.Label>微信号{index === 0 && <span className="text-danger">*</span>}</Form.Label>
                  <Form.Control
                    required={index === 0}
                    type="text"
                    placeholder={index === 0 ? "微信号（必填）" : "微信号（选填）"}
                    value={passenger.wechat_id || ''}
                    onChange={(e) => handlePassengerChange(index, 'wechat_id', e.target.value)}
                    isInvalid={index === 0 && !passenger.wechat_id && !!validationErrors[`passengers.${index}.wechat_id`]}
                  />
                  {index === 0 && (
                    <Form.Control.Feedback type="invalid">
                      {validationErrors[`passengers.${index}.wechat_id`]}
                    </Form.Control.Feedback>
                  )}
                </Form.Group>
                <Form.Group as={Col} md="6" className="mb-3">
                  <Form.Check
                    type="checkbox"
                    label={passenger.is_child ? "此乘客是儿童" : "此乘客是成人"}
                    checked={passenger.is_child}
                    disabled={true} // 设置为禁用，由成人/儿童数量控制
                  />
                </Form.Group>
              </Row>
            </Card.Body>
          </Card>
        ))}
      </>
    );
  };
  
  // 渲染产品信息部分
  const renderTourInfo = () => {
    // 如果还没有加载产品信息，显示加载状态
    if (loading) {
    return (
        <Card className="mb-4">
          <Card.Body>
            <div className="text-center">
              <p>正在加载产品信息...</p>
            </div>
          </Card.Body>
        </Card>
      );
    }
    
  };

  // 处理按钮点击事件，防止表单提交
  const handleButtonClick = (e, callback) => {
    e.preventDefault();
    if (typeof callback === 'function') {
      callback();
    }
  };
  
  // 添加乘客
  const addPassenger = () => {
    // 计算新乘客是否为儿童
    const isChild = formData.passengers.filter(p => !p.is_child).length >= formData.adult_count;
    
    setFormData(prev => ({
      ...prev,
      passengers: [
        ...prev.passengers,
        {
          full_name: '',
          is_child: isChild,
          phone: '',
          wechat_id: '',
        }
      ]
    }));
  };
  
  // 移除乘客
  const removePassenger = (index) => {
    // 不允许删除所有乘客
    if (formData.passengers.length <= 1) {
      toast.warning("至少需要一位乘客");
      return;
    }
    
    const newPassengers = [...formData.passengers];
    
    // 判断被删除的乘客是成人还是儿童
    const isChild = newPassengers[index].is_child;
    
    // 从数组中移除乘客
    newPassengers.splice(index, 1);
    
    // 更新成人或儿童计数
    let newAdultCount = formData.adult_count;
    let newChildCount = formData.child_count;
    
    if (isChild) {
      newChildCount = Math.max(0, formData.child_count - 1);
    } else {
      newAdultCount = Math.max(1, formData.adult_count - 1);
    }
    
    // 重新标记乘客类型（成人/儿童）
    // 首先将前newAdultCount个乘客标记为成人
    for (let i = 0; i < newPassengers.length; i++) {
      newPassengers[i].is_child = i >= newAdultCount;
    }
    
    setFormData(prev => ({
      ...prev,
      passengers: newPassengers,
      adult_count: newAdultCount,
      child_count: newChildCount
    }));
    
    // 更新价格
    updateTotalPrice(newAdultCount, newChildCount);
    
    // 显示提示消息
    toast.success(`已删除${isChild ? '儿童' : '成人'}乘客`);
  };
  
  // 增加一个防抖函数
  const debounce = (func, delay) => {
    let timer;
    return function(...args) {
      clearTimeout(timer);
      timer = setTimeout(() => {
        func.apply(this, args);
      }, delay);
    };
  };
  
  // 创建一个防抖版本的价格更新函数
  const debouncedUpdatePriceWithChildAges = useCallback(
    debounce((childrenAges) => {
      updateTotalPriceWithChildAges(childrenAges);
    }, 500),
    []
  );

  // 用于收集所有儿童年龄变更的函数
  const updatePriceOnAgeBlur = () => {
    // 收集所有儿童的年龄
    const childrenAges = formData.passengers
      .filter(p => p.is_child)
      .map(p => parseInt(p.child_age) || 0);
    
    console.log('失焦事件触发价格更新，儿童年龄:', childrenAges);
    
    // 确保有儿童年龄和有效的tourId才发送请求
    if (childrenAges.length > 0 && tourId) {
      // 显示Toast提示用户正在计算价格，使用toast()而不是toast.info()
      toast("正在更新价格...", { 
        duration: 2000,
        icon: '🔄'
      });
      
      // 添加详细日志
      console.log('开始计算价格，参数:', {
        tourId,
        tourType,
        adultCount: formData.adult_count,
        childCount: formData.child_count,
        hotelLevel: formData.hotel_level,
        childrenAges
      });
      
      // 立即调用价格更新函数，确保请求发送
      updateTotalPriceWithChildAges(childrenAges)
        .then(() => {
          console.log('价格计算成功完成');
          toast.success("价格已更新", { duration: 2000 });
        })
        .catch(error => {
          console.error('价格计算失败:', error);
          toast.error("价格计算失败: " + (error.message || '未知错误'));
        });
    } else {
      console.log('不发送价格请求，无效条件:', {
        '没有儿童年龄': childrenAges.length === 0,
        '无效tourId': !tourId
      });
    }
  };

  // 修改乘客信息处理函数
  const handlePassengerChange = (index, field, value, isBlurEvent = false) => {
    const updatedPassengers = [...formData.passengers];
    updatedPassengers[index] = { ...updatedPassengers[index], [field]: value };
    
    setFormData(prev => ({
      ...prev,
      passengers: updatedPassengers
    }));
    
    // 如果是儿童年龄字段且是失焦事件，才触发价格更新
    if (field === 'child_age' && updatedPassengers[index].is_child && isBlurEvent) {
      updatePriceOnAgeBlur();
    }
  };
  
  // 添加带有儿童年龄的价格计算功能
  const updateTotalPriceWithChildAges = async (childrenAges = []) => {
    if (!tourId) return;
    
    setLoading(true);
    
    try {
      // 解析参数
      const numericTourId = parseInt(tourId, 10);
      // 修正：不再从formData读取tour_type，而是从当前组件的tourType变量确定
      const tourTypeParam = (tourType || '').toLowerCase().includes('group') ? 'group_tour' : 'day_tour';
      const numericAdultCount = parseInt(formData.adult_count, 10) || 1;
      const numericChildCount = parseInt(formData.child_count, 10) || 0;
      const hotelLevel = formData.hotel_level || '4星';
      const numericRoomCount = parseInt(formData.hotel_room_count, 10) || 1;
      
      console.log(`计算价格（含儿童年龄）: tourId=${numericTourId}, tourType=${tourTypeParam}, adultCount=${numericAdultCount}, childCount=${numericChildCount}, hotelLevel=${hotelLevel}, roomCount=${numericRoomCount}, childrenAges=${childrenAges.join(',')}`);
      
      // 调用后端API计算价格，childrenAges是一个数组，将被自动转换为逗号分隔的字符串
      const priceData = await calculateTourPrice(
        numericTourId,
        tourTypeParam,
        numericAdultCount,
        numericChildCount,
        hotelLevel,
        agentId ? parseInt(agentId, 10) : null,
        numericRoomCount,
        null,
        childrenAges
      );
      
      if (priceData && (priceData.code === 1 || priceData.code === 200) && priceData.data) {
        const data = priceData.data;
        console.log('价格计算结果（含儿童年龄）:', data);
        
        // 使用所有后端返回的价格数据
        setPriceDetails({
          ...data,
          // 确保必需字段存在
          totalPrice: data.totalPrice || 0,
          adultTotalPrice: data.adultTotalPrice || 0,
          childrenTotalPrice: data.childrenTotalPrice || 0,
          childPrices: data.childPrices || [],
          childrenAges: data.childrenAges || childrenAges,
          originalPrice: data.originalPrice || 0,
          discountedPrice: data.discountedPrice || data.totalPrice || 0,
          basePrice: data.basePrice || 0,
          childUnitPrice: data.childUnitPrice || 0,
          discountRate: data.discountRate || priceDetails.discountRate || 1,
          adultCount: data.adultCount || numericAdultCount,
          childCount: data.childCount || numericChildCount,
          roomCount: data.roomCount || numericRoomCount,
          extraRoomFee: data.extraRoomFee || 0,
          hotelPriceDifference: data.hotelPriceDifference || 0,
          dailySingleRoomSupplement: data.dailySingleRoomSupplement || 0,
          needsSingleRoomSupplement: data.needsSingleRoomSupplement || false,
          hotelNights: getHotelNights()
        });
        
        // 更新表单的总价
        setFormData(prev => ({
          ...prev,
          total_price: data.totalPrice || 0
        }));
      }
    } catch (error) {
      console.error('计算价格（带儿童年龄）出错:', error);
      toast.error('价格计算失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };
  
  // 处理表单提交
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 在提交前确保价格是最新的
    if (formData.child_count > 0) {
      // 收集所有儿童年龄
      const childrenAges = formData.passengers
        .filter(p => p.is_child)
        .map(p => parseInt(p.child_age) || 0);
      
      // 更新价格（同步执行，等待价格更新完成）
      try {
        await updateTotalPriceWithChildAges(childrenAges);
      } catch (error) {
        console.error('提交前更新价格失败:', error);
      }
    }
    
    // 验证表单
    const errors = validateForm();
    setValidationErrors(errors);
    
    // 如果有错误，阻止提交
    if (Object.keys(errors).length > 0) {
      setValidated(true);
      // 滚动到第一个错误字段
      const firstErrorField = document.querySelector('.is-invalid');
      if (firstErrorField) {
        firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    
    // 开始提交
    setLoading(true);
    setSubmitError(null);
    
    try {
      // 构建订单数据，使用新API格式
      const bookingData = {
        tourId: parseInt(tourId),
        tourType: (tourType || '').toLowerCase().includes('group') ? 'group_tour' : 'day_tour',
        userId: parseInt(user?.id || localStorage.getItem('userId')),
        agentId: agentId ? parseInt(agentId) : null,
        flightNumber: formData.arrival_flight || null,
        returnFlightNumber: formData.departure_flight || null,
        arrivalDepartureTime: formData.arrival_departure_time ? formatDateTime(formData.arrival_departure_time) : null,
        arrivalLandingTime: formData.arrival_landing_time ? formatDateTime(formData.arrival_landing_time) : null,
        departureDepartureTime: formData.departure_departure_time ? formatDateTime(formData.departure_departure_time) : null,
        departureLandingTime: formData.departure_landing_time ? formatDateTime(formData.departure_landing_time) : null,
        tourStartDate: formData.tour_start_date ? formatDate(formData.tour_start_date) : null,
        tourEndDate: formData.tour_end_date ? formatDate(formData.tour_end_date) : null,
        pickupDate: formData.pickup_date ? formatDate(formData.pickup_date) : null,
        dropoffDate: formData.dropoff_date ? formatDate(formData.dropoff_date) : null,
        pickupLocation: formData.pickup_location || null,
        dropoffLocation: formData.dropoff_location || null,
        serviceType: (tourType || '').toLowerCase().includes('group') ? '跟团游' : '日游',
        groupSize: parseInt(formData.adult_count) + parseInt(formData.child_count),
        adultCount: parseInt(formData.adult_count), // 添加成人数量字段
        childCount: parseInt(formData.child_count), // 添加儿童数量字段
        luggageCount: parseInt(formData.luggage_count || 0),
        passengerContact: formData.passengers[0]?.phone || null,
        contactPerson: formData.passengers[0]?.full_name || '',
        contactPhone: formData.passengers[0]?.phone || '',
        hotelLevel: formData.hotel_level || null,
        roomType: formData.roomTypes?.[0] || '双人间',
        hotelRoomCount: parseInt(formData.hotel_room_count || 1),
        roomDetails: Array.isArray(formData.roomTypes) ? formData.roomTypes.join(',') : '',
        specialRequests: formData.special_requests || null,
        itineraryDetails: null,
        // 添加酒店入住和退房日期
        hotelCheckInDate: formData.hotelCheckInDate ? formatDate(formData.hotelCheckInDate) : null,
        hotelCheckOutDate: formData.hotelCheckOutDate ? formatDate(formData.hotelCheckOutDate) : null,
        passengers: formData.passengers.map(passenger => ({
          fullName: passenger.full_name,
          isChild: passenger.is_child,
          phone: passenger.phone,
          wechatId: passenger.wechat_id,
          childAge: passenger.is_child ? passenger.child_age : null  // 添加儿童年龄字段
        }))
      };
      
      // 调用API创建预订
      console.log('创建旅游订单:', bookingData);
      const response = await createTourBooking(bookingData);
      
      if (response && response.code === 1 && response.data) {
        // 预订成功，跳转到确认页面
        toast.success('订单创建成功！');
        
        // 获取订单号
        const orderNumber = response.data.orderNumber || response.data.order_number;
        
        // 跳转到成功页面并传递订单信息
        navigate(`/booking/success`, {
          state: { 
            bookingData: response.data,
            orderNumber: orderNumber,
            tourInfo: {
              title: tourDetails?.title || tourName,
              type: tourType,
              duration: tourDetails?.duration,
              startDate: formatDate(formData.tour_start_date),
              endDate: formatDate(formData.tour_end_date),
              adultCount: formData.adult_count,
              childCount: formData.child_count
            }
          }
        });
      } else {
        // 处理API错误
        const errorMessage = response?.message || '创建订单失败，请重试';
        const errorDetails = response?.data?.error || response?.error || '';
        
        // 设置详细错误信息
        setSubmitError(`${errorMessage}${errorDetails ? `：${errorDetails}` : ''}`);
        
        // 显示错误提示
        toast.error(errorMessage);
        
        // 滚动到错误消息
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (error) {
      console.error('提交预订时出错:', error);
      
      // 提取错误信息
      const errorMessage = error.response?.data?.message || error.message || '创建订单失败，请重试';
      const errorDetails = error.response?.data?.error || '';
      
      // 设置详细错误信息
      setSubmitError(`${errorMessage}${errorDetails ? `：${errorDetails}` : ''}`);
      
      // 显示错误提示
      toast.error(errorMessage);
      
      // 滚动到错误消息
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  };
  
  // 日期格式化函数
  const formatDate = (date) => {
    if (!date) return null;
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  // 日期时间格式化函数
  const formatDateTime = (date) => {
    if (!date) return null;
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  // 添加一个计算酒店晚数的辅助函数
  const getHotelNights = () => {
    // 确保返回有效的数值，防止NaN
    if (tourDetails?.hotelNights && !isNaN(parseInt(tourDetails.hotelNights))) {
      return parseInt(tourDetails.hotelNights);
    }
    
    if (tourDetails?.duration && !isNaN(parseInt(tourDetails.duration))) {
      return parseInt(tourDetails.duration) - 1;
    }
    
    // 默认返回值为0，避免NaN
    return 0;
  };

  // 添加一个新的useEffect，在行程开始日期改变时更新酒店日期
  useEffect(() => {
    // 如果没有设置酒店入住和退房日期，自动根据行程日期计算
    if (formData.tour_start_date && (!formData.hotelCheckInDate || !formData.hotelCheckOutDate)) {
      const { checkInDate, checkOutDate } = getDefaultHotelDates();
      if (checkInDate && checkOutDate) {
        setFormData(prev => ({
          ...prev,
          hotelCheckInDate: checkInDate,
          hotelCheckOutDate: checkOutDate
        }));
      }
    }
  }, [formData.tour_start_date]);

  // 添加新的useEffect，确保乘客数量始终与成人和儿童数量一致
  useEffect(() => {
    // 检查乘客数量是否与成人和儿童数量一致
    const totalExpectedPassengers = formData.adult_count + formData.child_count;
    const currentPassengers = formData.passengers?.length || 0;
    
    console.log('检查乘客数量:', {
      预期乘客数量: totalExpectedPassengers,
      当前乘客数量: currentPassengers,
      成人数量: formData.adult_count,
      儿童数量: formData.child_count
    });
    
    // 如果数量不一致，则调整乘客数组
    if (totalExpectedPassengers !== currentPassengers) {
      console.log('乘客数量不一致，开始调整');
      updatePassengersBasedOnCount(formData.adult_count, formData.child_count);
    }
  }, [formData.adult_count, formData.child_count]);

  // 添加一个计算默认酒店入住日期的函数
  const getDefaultHotelDates = () => {
    if (formData.tour_start_date) {
      // 默认入住日期为行程开始日期
      let checkInDate = new Date(formData.tour_start_date);
      
      // 默认退房日期为行程开始日期加上酒店晚数
      let checkOutDate = new Date(formData.tour_start_date);
      checkOutDate.setDate(checkOutDate.getDate() + getHotelNights());
      
      return { checkInDate, checkOutDate };
    }
    return { checkInDate: null, checkOutDate: null };
  };

  useEffect(() => {
    // 如果是从详情页跳转过来的，填充URL参数
    if (location.state) {
      const { tourDate, adultCount, childCount, roomCount, bookingOptions } = location.state || {};
      console.log('Booking页面从详情页接收到的数据:', location.state);
      
      // 如果包含儿童年龄信息，自动填充
      if (location.state.childrenAges && Array.isArray(location.state.childrenAges)) {
        const childrenAges = location.state.childrenAges;
        
        // 更新表单数据中的乘客信息，设置儿童年龄
        setFormData(prev => {
          const updatedPassengers = [...prev.passengers];
          
          // 查找已有的儿童乘客并设置年龄
          let childIndex = 0;
          for (let i = 0; i < updatedPassengers.length; i++) {
            if (updatedPassengers[i].is_child) {
              if (childIndex < childrenAges.length) {
                updatedPassengers[i].child_age = childrenAges[childIndex];
                childIndex++;
              }
            }
          }
          
          return {
            ...prev,
            passengers: updatedPassengers
          };
        });
      }
    }
  }, [location.state]);

  // 添加处理儿童年龄变化的函数
  const handleChildAgeChangeInBooking = (childIndex, age) => {
    // 查找所有儿童乘客
    const childPassengers = formData.passengers.filter(p => p.is_child);
    // 获取对应的儿童乘客在passengers数组中的实际索引
    const passengerIndex = formData.passengers.indexOf(childPassengers[childIndex]);
    
    if (passengerIndex !== -1) {
      // 更新乘客信息
      const updatedPassengers = [...formData.passengers];
      updatedPassengers[passengerIndex] = { 
        ...updatedPassengers[passengerIndex],
        child_age: age
      };
      
      // 更新state
      setFormData(prev => ({
        ...prev,
        passengers: updatedPassengers
      }));
    }
  };

  // 处理文本解析并填充表单
  const handleParseBookingText = () => {
    if (!parseText.trim()) {
      toast.error('请先粘贴预订文本信息');
      return;
    }
    
    try {
      // 使用文本解析工具提取预订信息
      const extractedInfo = extractBookingInfo(parseText);
      console.log('提取的预订信息:', extractedInfo);
      
      if (Object.keys(extractedInfo).length === 0) {
        toast.error('无法从文本中提取有效信息，请检查格式');
        return;
      }
      
      // 更新表单数据
      const updatedFormData = { ...formData };
      
      // 更新基本信息
      if (extractedInfo.tourStartDate) {
        // 确保日期格式正确，显式处理转换和调试
        try {
          const parsedDate = new Date(extractedInfo.tourStartDate);
          console.log('解析开始日期:', extractedInfo.tourStartDate, '转换结果:', parsedDate);
          if (!isNaN(parsedDate.getTime())) {
            updatedFormData.tour_start_date = parsedDate;
          } else {
            console.error('开始日期解析失败:', extractedInfo.tourStartDate);
          }
        } catch (err) {
          console.error('开始日期转换出错:', err);
        }
      }
      
      // === 自动推算结束时间 ===
      if (extractedInfo.tourStartDate && !extractedInfo.tourEndDate && tourDetails.duration) {
        try {
          const start = new Date(extractedInfo.tourStartDate);
          if (!isNaN(start.getTime())) {
            const duration = parseInt(tourDetails.duration) || 1;
            const end = new Date(start);
            end.setDate(start.getDate() + duration - 1);
            
            console.log('计算结束日期:', '开始日期=', start, '行程天数=', duration, '结束日期=', end);
            
            updatedFormData.tour_end_date = end;
            // 同步酒店入住/退房和接送时间
            updatedFormData.hotelCheckInDate = new Date(start);
            updatedFormData.hotelCheckOutDate = new Date(end);
            updatedFormData.pickup_date = new Date(start);
            updatedFormData.dropoff_date = new Date(end);
          }
        } catch (err) {
          console.error('计算结束日期出错:', err);
        }
      } else if (extractedInfo.tourEndDate) {
        try {
          const parsedEndDate = new Date(extractedInfo.tourEndDate);
          console.log('解析结束日期:', extractedInfo.tourEndDate, '转换结果:', parsedEndDate);
          if (!isNaN(parsedEndDate.getTime())) {
            updatedFormData.tour_end_date = parsedEndDate;
          }
        } catch (err) {
          console.error('结束日期转换出错:', err);
        }
      }
      // === END ===
      
      if (extractedInfo.flightNumber) {
        updatedFormData.arrival_flight = extractedInfo.flightNumber;
      }
      
      if (extractedInfo.returnFlightNumber) {
        updatedFormData.departure_flight = extractedInfo.returnFlightNumber;
        console.log('设置回程航班:', extractedInfo.returnFlightNumber);
      }
      
      if (extractedInfo.pickupLocation) {
        updatedFormData.pickup_location = extractedInfo.pickupLocation;
      }
      
      if (extractedInfo.dropoffLocation) {
        updatedFormData.dropoff_location = extractedInfo.dropoffLocation;
      }
      
      if (extractedInfo.roomType) {
        updatedFormData.room_type = extractedInfo.roomType;
        
        // 更新所有房间的房型
        if (Array.isArray(updatedFormData.roomTypes)) {
          updatedFormData.roomTypes = updatedFormData.roomTypes.map(() => extractedInfo.roomType);
        }
      }
      
      if (extractedInfo.hotelLevel) {
        updatedFormData.hotel_level = extractedInfo.hotelLevel;
      }
      
      // 特殊处理备注信息
      if (extractedInfo.specialRequests) {
        console.log('提取到特殊要求:', extractedInfo.specialRequests);
        updatedFormData.special_requests = extractedInfo.specialRequests;
      }
      
      if (extractedInfo.departureTime) {
        // 提取时间信息，如果有的话
        const timeMatch = extractedInfo.departureTime.match(/(\d+):(\d+)/);
        if (timeMatch) {
          const hours = parseInt(timeMatch[1], 10);
          const minutes = parseInt(timeMatch[2], 10);
          
          // 如果有出发日期，设置时间
          if (updatedFormData.tour_start_date) {
            const dateWithTime = new Date(updatedFormData.tour_start_date);
            dateWithTime.setHours(hours, minutes, 0);
            updatedFormData.pickup_time = dateWithTime;
          }
        }
      }
      
      // 更新人数信息
      if (extractedInfo.adultCount > 0) {
        updatedFormData.adult_count = extractedInfo.adultCount;
      }
      
      if (extractedInfo.childCount > 0) {
        updatedFormData.child_count = extractedInfo.childCount;
      }
      
      if (extractedInfo.luggageCount > 0) {
        updatedFormData.luggage_count = extractedInfo.luggageCount;
      }
      
      // 智能计算房间数量
      if (extractedInfo.adultCount > 0) {
        // 默认每2位成人分配1个房间，向上取整
        const estimatedRooms = Math.ceil(extractedInfo.adultCount / 2);
        updatedFormData.hotel_room_count = estimatedRooms;
      }
      
      // 更新乘客信息
      if (extractedInfo.passengers && extractedInfo.passengers.length > 0) {
        const passengersData = [];
        
        // 处理成人乘客
        const adultPassengers = extractedInfo.passengers.filter(p => !p.isChild);
        const childPassengers = extractedInfo.passengers.filter(p => p.isChild);
        
        // 添加成人
        adultPassengers.forEach((passenger, index) => {
          passengersData.push({
            full_name: passenger.fullName || '',
            is_child: false,
            phone: passenger.phone || '',
            wechat_id: '',
            passport_number: passenger.passportNumber || '',
            is_primary: index === 0 // 第一个成人为主联系人
          });
        });
        
        // 添加儿童
        childPassengers.forEach(passenger => {
          passengersData.push({
            full_name: passenger.fullName || '',
            is_child: true,
            child_age: passenger.childAge || '',
            phone: passenger.phone || '',
            wechat_id: '',
            passport_number: passenger.passportNumber || '',
            is_primary: false
          });
        });
        
        // 如果解析出的乘客少于总人数，添加剩余的占位乘客
        const totalExtractedPassengers = passengersData.length;
        const totalRequiredPassengers = (extractedInfo.adultCount || updatedFormData.adult_count) + 
                                       (extractedInfo.childCount || updatedFormData.child_count);
        
        if (totalExtractedPassengers < totalRequiredPassengers) {
          // 计算需要添加的成人和儿童数量
          const adultsToAdd = (extractedInfo.adultCount || updatedFormData.adult_count) - 
                              passengersData.filter(p => !p.is_child).length;
          
          const childrenToAdd = (extractedInfo.childCount || updatedFormData.child_count) - 
                               passengersData.filter(p => p.is_child).length;
          
          // 添加缺少的成人
          for (let i = 0; i < adultsToAdd; i++) {
            passengersData.push({
              full_name: '',
              is_child: false,
              phone: '',
              wechat_id: '',
              passport_number: '',
              is_primary: passengersData.length === 0 // 如果是第一个乘客则为主联系人
            });
          }
          
          // 添加缺少的儿童
          for (let i = 0; i < childrenToAdd; i++) {
            passengersData.push({
              full_name: '',
              is_child: true,
              child_age: '',
              phone: '',
              wechat_id: '',
              passport_number: '',
              is_primary: false
            });
          }
        }
        
        updatedFormData.passengers = passengersData;
      }
      
      // 输出最终的表单数据，用于诊断
      console.log('更新后的表单数据:', {
        开始日期: updatedFormData.tour_start_date,
        结束日期: updatedFormData.tour_end_date,
        特殊要求: updatedFormData.special_requests,
        酒店入住日期: updatedFormData.hotelCheckInDate,
        酒店退房日期: updatedFormData.hotelCheckOutDate,
        接车日期: updatedFormData.pickup_date,
        送回日期: updatedFormData.dropoff_date
      });
      
      // 更新表单状态
      setFormData(updatedFormData);
      
      // 更新价格
      updatePriceOnAgeBlur();
      
      // 关闭弹窗
      setShowParseModal(false);
      
      // 显示提取的信息摘要
      const summary = [];
      if (extractedInfo.tourName) summary.push(`服务: ${extractedInfo.tourName}`);
      if (extractedInfo.tourStartDate) summary.push(`日期: ${extractedInfo.tourStartDate}`);
      if (extractedInfo.flightNumber) summary.push(`航班: ${extractedInfo.flightNumber}`);
      if (extractedInfo.returnFlightNumber) summary.push(`回程: ${extractedInfo.returnFlightNumber}`);
      if (extractedInfo.adultCount) summary.push(`成人: ${extractedInfo.adultCount}人`);
      if (extractedInfo.childCount) summary.push(`儿童: ${extractedInfo.childCount}人`);
      if (extractedInfo.specialRequests) summary.push(`备注: 已添加`);
      
      toast.success(`预订信息已成功提取并填充！${summary.join('，')}`);
        
    } catch (error) {
      console.error('解析预订文本失败:', error);
      toast.error('解析文本失败，请检查格式或手动填写');
    }
  };

  // 在这里定义一个函数，为handleDateChange添加错误处理和日志记录
  const enhancedHandleDateChange = (fieldName, date) => {
    console.log(`日期变更: ${fieldName} = ${date ? date.toISOString() : 'null'}`);
    
    // 确保date是有效日期对象
    if (date && isNaN(date.getTime())) {
      console.error(`日期格式无效: ${fieldName}`, date);
      return;
    }
    
    // 直接使用setFormData更新日期，避免使用handleDateChange导致的问题
    setFormData(prev => {
      let updated = { ...prev, [fieldName]: date };
      // 如果更改的是行程开始日期，自动推算结束日期和相关字段
      if (fieldName === 'tour_start_date' && date && tourDetails.duration) {
        const duration = parseInt(tourDetails.duration) || 1;
        const end = new Date(date);
        end.setDate(date.getDate() + duration - 1);
        updated.tour_end_date = end;
        updated.hotelCheckInDate = new Date(date);
        updated.hotelCheckOutDate = new Date(end);
        updated.pickup_date = new Date(date);
        updated.dropoff_date = new Date(end);
      }
      // 如果更改的是行程结束日期，自动更新酒店退房和送回日期
      if (fieldName === 'tour_end_date' && date) {
        updated.hotelCheckOutDate = new Date(date);
        updated.dropoff_date = new Date(date);
      }
      console.log('更新后的表单数据:', {
        字段名: fieldName,
        新日期: date,
        表单日期: updated[fieldName]
      });
      return updated;
    });
  };

};

export default Booking;