import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Container, Row, Col, Form, InputGroup, Button, Dropdown, Spinner, Alert, Card } from "react-bootstrap";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useSelector } from 'react-redux';
import { FaSearch, FaFilter, FaSortAmountDown, FaThLarge, FaList, FaTimes, FaCalendarAlt, FaStar, FaMapMarkerAlt } from "react-icons/fa";
import Breadcrumbs from "../../components/Breadcrumbs/Breadcrumbs";
import Filters from "./Filters";
import LoginPrompt from "../../components/Common/LoginPrompt/LoginPrompt";
import { getAllDayTours, getAllGroupTours } from "../../utils/api";
import PriceDisplay from "../../components/PriceDisplay";
import Cards from "../../components/Cards/Cards";
import RedesignedCard from "../../components/Cards/RedesignedCard";
import "../../pages/Home/home-tours-redesign.css"; // 导入RedesignedCard组件的CSS样式
import "./Tours.css"; // 最后导入Tours自己的样式，保证优先级

const Tours = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector(state => state.auth);
  const queryParams = new URLSearchParams(location.search);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState("grid"); // grid 或 list
  const [sortBy, setSortBy] = useState("推荐"); // 默认排序方式
  
  // 添加加载状态和错误状态
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // 添加数据状态
  const [dayTours, setDayTours] = useState([]);
  const [groupTours, setGroupTours] = useState([]);
  
  // 使用ref来防止重复请求
  const isInitialMount = useRef(true);
  const previousSearchParams = useRef("");

  // 使用useMemo缓存所有查询参数，避免引起不必要的重渲染
  const selectedTourType = useMemo(() => {
    // 首先检查URL路径是否有明确指示
    const path = location.pathname.toLowerCase();
    
    // 如果URL路径明确指示了旅游类型，优先使用
    if (path.includes('day-tours')) {
      console.log('从URL路径检测到一日游类型');
      return '一日游';
    } else if (path.includes('group-tours')) {
      console.log('从URL路径检测到跟团游类型');
      return '跟团游';
    }
    
    // 如果URL路径没有指示，使用查询参数
    const tourType = queryParams.get('tourTypes');
    if (tourType === 'day_tour') return '一日游';
    if (tourType === 'group_tour') return '跟团游';
    if (tourType === 'all') return '全部';
    
    // 默认选择一日游
    return '一日游'; 
  }, [location.pathname, location.search]);
  const selectedLocation = useMemo(() => queryParams.get('location') ? queryParams.get('location').split(',') : [], [location.search]);
  const selectedDuration = useMemo(() => queryParams.get('duration') ? queryParams.get('duration').split(',') : [], [location.search]);
  const selectedPriceRange = useMemo(() => queryParams.get('priceRange') ? queryParams.get('priceRange').split(',') : [], [location.search]);
  const selectedRatings = useMemo(() => queryParams.get('ratings') ? queryParams.get('ratings').split(',').map(Number) : [], [location.search]);
  const selectedThemes = useMemo(() => queryParams.get('themes') ? queryParams.get('themes').split(',') : [], [location.search]);
  const selectedSuitableFor = useMemo(() => queryParams.get('suitableFor') ? queryParams.get('suitableFor').split(',') : [], [location.search]);
  const startDate = useMemo(() => queryParams.get('startDate') || '', [location.search]);
  const endDate = useMemo(() => queryParams.get('endDate') || '', [location.search]);

  // 整合所有查询参数为一个单一的对象
  const searchParams = useMemo(() => {
    // 处理tourTypes参数，映射到API需要的值
    let tourType = '';
    
    // 首先检查URL路径
    const path = location.pathname.toLowerCase();
    if (path.includes('day-tours')) {
      tourType = 'day_tour';
      console.log('从URL路径获取旅游类型: day_tour');
    } else if (path.includes('group-tours')) {
      tourType = 'group_tour';
      console.log('从URL路径获取旅游类型: group_tour');
    }
    // 如果URL路径没有包含类型信息，则从查询参数获取
    else if (selectedTourType === '一日游') {
      tourType = 'day_tour';
    } else if (selectedTourType === '跟团游') {
      tourType = 'group_tour';
    } else if (selectedTourType === '全部') {
      tourType = 'all';
    } else if (queryParams.get('tourTypes')) {
      // 从URL参数获取
      const urlTourType = queryParams.get('tourTypes');
      if (urlTourType === 'day_tour' || urlTourType === 'group_tour' || urlTourType === 'all') {
        tourType = urlTourType;
      }
    }
    
    // 获取关键字搜索参数
    const keywordParam = queryParams.get('keyword') || '';
    if (keywordParam && !searchTerm) {
      // 如果URL中有关键字参数但状态中没有，则更新搜索状态
      setSearchTerm(keywordParam);
    }
    
    return {
      keyword: searchTerm || keywordParam, // 使用状态中的关键字或URL中的关键字
      tourType: tourType,
      location: selectedLocation,
      themes: selectedThemes,
      ratings: selectedRatings,
      priceRange: selectedPriceRange,
      duration: selectedDuration,
      suitableFor: selectedSuitableFor,
      startDate,
      endDate
    };
  }, [searchTerm, selectedTourType, selectedLocation, selectedThemes, selectedRatings, selectedPriceRange, selectedDuration, selectedSuitableFor, startDate, endDate, queryParams, location.pathname]);
  
  // 使用useCallback包装fetchData函数，使用稳定版本的函数参数
  const fetchData = useCallback(async (params) => {
    // 准备查询参数
    const apiParams = {};
    
    // 添加日志
    console.log('筛选参数:', params);
    
    // 检查是否有旅游类型参数
    if (!params.tourType) {
      console.log('没有指定旅游类型，无法获取数据');
      setDayTours([]);
      setGroupTours([]);
      setLoading(false);
      return;
    }
    
    // 根据旅游类型获取数据
    try {
      if (params.tourType === 'all') {
        // 获取所有类型的数据
        console.log('获取所有类型的产品数据');
        
        // 同时请求一日游和跟团游数据
        const [dayToursResponse, groupToursResponse] = await Promise.all([
          getAllDayTours(apiParams),
          getAllGroupTours(apiParams)
        ]);
        
        // 处理一日游数据
        if (dayToursResponse && dayToursResponse.code === 1 && dayToursResponse.data) {
          const dayToursData = Array.isArray(dayToursResponse.data) 
            ? dayToursResponse.data 
            : (dayToursResponse.data.records || []);
          setDayTours(dayToursData);
          console.log('获取到一日游数据:', dayToursData.length, '条');
        } else {
          setDayTours([]);
        }
        
        // 处理跟团游数据
        if (groupToursResponse && groupToursResponse.code === 1 && groupToursResponse.data) {
          const groupToursData = Array.isArray(groupToursResponse.data) 
            ? groupToursResponse.data 
            : (groupToursResponse.data.records || []);
          setGroupTours(groupToursData);
          console.log('获取到跟团游数据:', groupToursData.length, '条');
        } else {
          setGroupTours([]);
        }
        
      } else if (params.tourType === 'day_tour') {
        // 只获取一日游数据
        setGroupTours([]); // 清空跟团游数据
        
        if (params.keyword) apiParams.keyword = params.keyword;
        // 添加其他筛选参数...
        
        const response = await getAllDayTours(apiParams);
        if (response && response.code === 1 && response.data) {
          const toursData = Array.isArray(response.data) 
            ? response.data 
            : (response.data.records || []);
          setDayTours(toursData);
          console.log('获取到一日游数据:', toursData.length, '条');
        } else {
          setDayTours([]);
        }
        
      } else if (params.tourType === 'group_tour') {
        // 只获取跟团游数据
        setDayTours([]); // 清空一日游数据
        
        if (params.keyword) apiParams.keyword = params.keyword;
        // 添加其他筛选参数...
        
        const response = await getAllGroupTours(apiParams);
        if (response && response.code === 1 && response.data) {
          const toursData = Array.isArray(response.data) 
            ? response.data 
            : (response.data.records || []);
          setGroupTours(toursData);
          console.log('获取到跟团游数据:', toursData.length, '条');
        } else {
          setGroupTours([]);
        }
      }
      
      setError(null);
    } catch (error) {
      console.error('获取产品数据失败:', error);
      setError('获取产品数据失败，请重试');
      setDayTours([]);
      setGroupTours([]);
    } finally {
      setLoading(false);
    }
  }, []);
  
  // 添加URL路径检测逻辑
  useEffect(() => {
    // 基于URL路径设置初始筛选状态
    const path = location.pathname.toLowerCase();
    
    // 检查URL路径，优先级高于查询参数
    if (path.includes('/day-tours')) {
      console.log('检测到URL路径为day-tours，设置筛选为一日游');
      // 将queryParams更新为一日游
      const newParams = new URLSearchParams(location.search);
      newParams.set('tourTypes', 'day_tour');
      navigate({ search: newParams.toString() }, { replace: true });
    } 
    else if (path.includes('/group-tours')) {
      console.log('检测到URL路径为group-tours，设置筛选为跟团游');
      // 将queryParams更新为跟团游
      const newParams = new URLSearchParams(location.search);
      newParams.set('tourTypes', 'group_tour');
      navigate({ search: newParams.toString() }, { replace: true });
    }
  }, [location.pathname]);  // 当URL路径变化时重新检查
  
  // 首次加载和参数变化时获取数据，使用防抖避免频繁请求
  useEffect(() => {
    // 对于首次渲染，检查是否有旅游类型，如果没有则默认选择一日游
    if (isInitialMount.current) {
      isInitialMount.current = false;
      
      // 如果URL中没有旅游类型参数，则添加默认的一日游类型
      if (!queryParams.get('tourTypes')) {
        const newParams = new URLSearchParams(queryParams.toString());
        newParams.set('tourTypes', 'day_tour');
        navigate({ search: newParams.toString() }, { replace: true });
        return; // 导航后会触发useEffect，所以这里直接返回
      }
      
      fetchData(searchParams);
      console.log("首次加载，获取数据");
      return;
    }
    
    // 记录日志
    console.log("参数发生变化，准备重新获取数据", searchParams);
    
    // 非首次渲染，使用最小的延迟时间
    const timer = setTimeout(() => {
      fetchData(searchParams);
    }, 50); // 将延迟时间降低到最小值，确保筛选条件变化后能够快速响应
    
    return () => clearTimeout(timer);
  }, [fetchData, searchParams, navigate, queryParams]);

  // 监听窗口大小变化
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 992) {
        setShowFilters(true);
      } else {
        setShowFilters(false);
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  
  // 定义排序函数
  const sortTours = useCallback((toursData) => {
    switch (sortBy) {
      case "价格从低到高":
        return [...toursData].sort((a, b) => parseFloat(a.price || 0) - parseFloat(b.price || 0));
      case "价格从高到低":
        return [...toursData].sort((a, b) => parseFloat(b.price || 0) - parseFloat(a.price || 0));
      case "评分":
        return [...toursData].sort((a, b) => parseFloat(b.rating || 0) - parseFloat(a.rating || 0));
      case "时长":
        // 对于混合的一日游和跟团游数据，需要根据不同的时长格式处理
        return [...toursData].sort((a, b) => {
          const getDuration = (item) => {
            if (item.duration_hours) return parseInt(item.duration_hours);
            if (item.duration_days) return parseInt(item.duration_days) * 24;
            if (typeof item.duration === 'string') {
              if (item.duration.includes('天')) {
                return parseInt(item.duration) * 24;
              } else {
                return parseInt(item.duration);
              }
            }
            return 0;
          };
          return getDuration(a) - getDuration(b);
        });
      case "推荐":
      default:
        // 推荐排序可能基于多种因素，这里简化为评分和热门度的结合
        return [...toursData].sort((a, b) => {
          const scoreA = (parseFloat(a.rating || 0) * 2) + (parseInt(a.popularity || 0) / 100);
          const scoreB = (parseFloat(b.rating || 0) * 2) + (parseInt(b.popularity || 0) / 100);
          return scoreB - scoreA;
        });
    }
  }, [sortBy]);
  
  // 筛选一日游数据
  const filteredDayTours = useMemo(() => {
    // 如果选择了跟团游，则不显示一日游数据
    if (selectedTourType === '跟团游') {
      return [];
    }

    let filtered = [...dayTours];

    // 如果选择了全部类型，直接返回所有一日游产品
    if (selectedTourType === '全部') {
      return sortTours(filtered);
    }
    
    // 根据产品ID筛选 - 如果有选择的产品ID，优先使用产品ID筛选
    const selectedTourIds = queryParams.get('tourIds');
    if (selectedTourIds) {
      const tourIdArray = selectedTourIds.split(',');
      filtered = filtered.filter(tour => 
        tourIdArray.includes(String(tour.id)) || 
        tourIdArray.includes(String(tour.tour_id))
      );
      console.log('根据产品ID筛选后的结果:', filtered.length);
      // 直接返回匹配的产品，不再进行其他筛选
      return sortTours(filtered);
    }

    // 根据搜索关键词筛选
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        item => (item.title || item.name || '').toLowerCase().includes(term) || 
                (item.description || item.intro || item.des || '').toLowerCase().includes(term)
      );
    }

    // 根据地点筛选 - 使用"或"关系
    if (selectedLocation.length > 0) {
      filtered = filtered.filter(item => {
        // 考虑各种可能的地点字段
        const itemLocation = (item.location || item.departure || item.region || '').toLowerCase();
        // 如果项目的地点包含任一选定地点，则保留该项目
        return selectedLocation.some(loc => 
          itemLocation.includes(loc.toLowerCase())
        );
      });
    }

    // 根据时长筛选 - 一日游时长格式为 "X小时"
    if (selectedDuration.length > 0) {
      filtered = filtered.filter(item => {
        // 处理一日游时长筛选
        const hours = parseInt(item.duration_hours || item.duration || 0);
        return selectedDuration.some(duration => {
          if (duration === "2-4小时" && hours >= 2 && hours <= 4) return true;
          if (duration === "4-6小时" && hours >= 4 && hours <= 6) return true;
          if (duration === "6-8小时" && hours >= 6 && hours <= 8) return true;
          if (duration === "8小时以上" && hours > 8) return true;
          return false;
        });
      });
    }

    // 根据适合人群筛选
    if (selectedSuitableFor.length > 0) {
      filtered = filtered.filter(item => {
        // 检查item.suitableFor是否存在（注意后端返回的是suitableFor而不是suitable_for）
        if (!item.suitableFor) return false;
        
        const suitableForArray = Array.isArray(item.suitableFor) 
          ? item.suitableFor
          : typeof item.suitableFor === 'string' ? item.suitableFor.split(',') : [];
        
        // 检查是否有任何选中的适合人群在当前项目的适合人群列表中
        return selectedSuitableFor.some(selectedGroup => 
          suitableForArray.some(itemGroup => 
            typeof itemGroup === 'string' && 
            itemGroup.toLowerCase() === selectedGroup.toLowerCase()
          )
        );
      });
    }

    // 根据主题筛选
    if (selectedThemes.length > 0) {
      filtered = filtered.filter(item => {
        // 检查item.themes是否为数组或字符串
        if (!item.themes) return false;
        
        const themesArray = Array.isArray(item.themes) 
          ? item.themes
          : item.themes.split(',');
        
        // 检查是否有任何选中的主题在当前项目的主题列表中
        return selectedThemes.some(selectedTheme => 
          themesArray.some(itemTheme => 
            itemTheme.toLowerCase().includes(selectedTheme.toLowerCase())
          )
        );
      });
    }

    // 根据评分筛选
    if (selectedRatings.length > 0) {
      filtered = filtered.filter(item => {
        const rating = parseFloat(item.rating || 0);
        // 评分筛选逻辑修改为判断是否≥选中的任一评分
        return selectedRatings.some(selectedRating => rating >= selectedRating);
      });
    }

    // 排序
    return sortTours(filtered);
  }, [dayTours, searchTerm, selectedTourType, selectedDuration, selectedSuitableFor, selectedThemes, selectedRatings, sortTours, queryParams]);
  
  // 筛选跟团游数据
  const filteredGroupTours = useMemo(() => {
    // 如果选择了一日游，则不显示跟团游数据
    if (selectedTourType === '一日游') {
      return [];
    }
    
    let filtered = [...groupTours];
    
    // 如果选择了全部类型，直接返回所有跟团游产品
    if (selectedTourType === '全部') {
      return sortTours(filtered);
    }
    
    // 根据产品ID筛选 - 如果有选择的产品ID，优先使用产品ID筛选
    const selectedTourIds = queryParams.get('tourIds');
    if (selectedTourIds) {
      const tourIdArray = selectedTourIds.split(',');
      filtered = filtered.filter(tour => 
        tourIdArray.includes(String(tour.id)) || 
        tourIdArray.includes(String(tour.tour_id))
      );
      console.log('根据产品ID筛选跟团游结果:', filtered.length);
      // 直接返回匹配的产品，不再进行其他筛选
      return sortTours(filtered);
    }

    // 根据搜索关键词筛选
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        item => (item.title || item.name || '').toLowerCase().includes(term) || 
                (item.description || item.intro || item.des || '').toLowerCase().includes(term)
      );
    }

    // 根据地点筛选 - 使用"或"关系
    if (selectedLocation.length > 0) {
      filtered = filtered.filter(item => {
        // 考虑各种可能的地点字段
        const itemLocation = (item.location || item.departure || item.region || '').toLowerCase();
        // 如果项目的地点包含任一选定地点，则保留该项目
        return selectedLocation.some(loc => 
          itemLocation.includes(loc.toLowerCase())
        );
      });
    }

    // 根据时长筛选 - 跟团游时长格式为 "X天X晚"
    if (selectedDuration.length > 0) {
      filtered = filtered.filter(item => {
        // 从 "X天X晚" 中提取天数
        const days = parseInt(item.duration_days || 
                             (item.duration && item.duration.split('天')[0]) || 0);
        return selectedDuration.some(duration => {
          if (duration === "2-3天" && days >= 2 && days <= 3) return true;
          if (duration === "4-5天" && days >= 4 && days <= 5) return true;
          if (duration === "6-7天" && days >= 6 && days <= 7) return true;
          if (duration === "7天以上" && days > 7) return true;
          return false;
        });
      });
    }

    // 根据价格范围筛选
    if (selectedPriceRange.length > 0) {
      filtered = filtered.filter(item => {
        const price = parseFloat(item.discount_price || item.price || 0);
        return selectedPriceRange.some(range => {
          if (range.includes('-')) {
            const [min, max] = range.split('-').map(Number);
            return price >= min && price <= max;
          } else if (range.includes('以上')) {
            const min = parseFloat(range.replace(/[^\d.]/g, ''));
            return price >= min;
          }
          return false;
        });
      });
    }

    // 根据评分筛选
    if (selectedRatings.length > 0) {
      filtered = filtered.filter(item => {
        const rating = parseFloat(item.rating || 0);
        // 评分筛选逻辑修改为判断是否≥选中的任一评分
        return selectedRatings.some(selectedRating => rating >= selectedRating);
      });
    }

    // 根据适合人群筛选
    if (selectedSuitableFor.length > 0) {
      filtered = filtered.filter(item => {
        // 检查item.suitableFor是否存在（注意后端返回的是suitableFor而不是suitable_for）
        if (!item.suitableFor) return false;
        
        const suitableForArray = Array.isArray(item.suitableFor) 
          ? item.suitableFor
          : typeof item.suitableFor === 'string' ? item.suitableFor.split(',') : [];
        
        // 检查是否有任何选中的适合人群在当前项目的适合人群列表中
        return selectedSuitableFor.some(selectedGroup => 
          suitableForArray.some(itemGroup => 
            typeof itemGroup === 'string' && 
            itemGroup.toLowerCase() === selectedGroup.toLowerCase()
          )
        );
      });
    }

    // 根据主题筛选
    if (selectedThemes.length > 0) {
      filtered = filtered.filter(item => {
        // 检查item.themes是否为数组或字符串
        if (!item.themes) return false;
        
        const themesArray = Array.isArray(item.themes) 
          ? item.themes
          : item.themes.split(',');
        
        // 检查是否有任何选中的主题在当前项目的主题列表中
        return selectedThemes.some(selectedTheme => 
          themesArray.some(itemTheme => 
            itemTheme.toLowerCase().includes(selectedTheme.toLowerCase())
          )
        );
      });
    }

    // 排序
    return sortTours(filtered);
  }, [groupTours, searchTerm, selectedTourType, selectedDuration, selectedPriceRange, selectedRatings, selectedSuitableFor, selectedThemes, sortTours, queryParams]);

  // 使用防抖处理搜索
  const handleSearchChange = (e) => {
    const keyword = e.target.value;
    setSearchTerm(keyword);
    
    // 更新URL参数
    const updatedParams = new URLSearchParams(location.search);
    if (keyword) {
      updatedParams.set('keyword', keyword);
    } else {
      updatedParams.delete('keyword');
    }
    
    // 使用replace: true避免创建新的历史记录
    navigate({ search: updatedParams.toString() }, { replace: true });
  };

  // 切换筛选面板
  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  // 排序选择
  const handleSortChange = (sortOption) => {
    setSortBy(sortOption);
  };

  // 导入useRef来存储Filters组件引用
  const filtersRef = useRef();
  
  // 清除所有筛选条件
  const clearAllFilters = () => {
    // 仅保留默认的旅游类型，清除其他所有筛选
    const tourType = selectedTourType; // 保存当前旅游类型
    
    // 保留原有的查询参数
    const params = new URLSearchParams();
    const startDate = queryParams.get('startDate');
    const endDate = queryParams.get('endDate');
    const adults = queryParams.get('adults');
    const children = queryParams.get('children');
    
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (adults) params.append('adults', adults);
    if (children) params.append('children', children);
    
    // 保留旅游类型参数
    if (tourType) {
      if (tourType === '一日游') {
        params.append('tourTypes', 'day_tour');
      } else if (tourType === '跟团游') {
        params.append('tourTypes', 'group_tour');
      } else {
        params.append('tourTypes', 'day_tour'); // 如果没有有效类型，默认设置为一日游
      }
    } else {
      // 如果没有选择旅游类型，默认设置为一日游
      params.append('tourTypes', 'day_tour');
    }
    
    // 更新URL
    navigate({ search: params.toString() });
    
    // 如果Filters组件有clearFilters方法，则调用它
    if (filtersRef.current && filtersRef.current.clearFilters) {
      filtersRef.current.clearFilters();
    }
  };

  // 格式化日期
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  return (
    <div className="tours-page">
      {/* 面包屑导航 */}
      <Breadcrumbs title="旅游路线" pagename="旅游路线" />
      
      {/* 页面介绍区域 */}
      <div className="tour-intro-section">
        <Container>
          <Row className="align-items-center">
            <Col md={8}>
              <div className="tour-intro-content">
                <h2>
                  {selectedTourType === '一日游' ? '探索塔斯马尼亚的一日游行程' : 
                   selectedTourType === '跟团游' ? '探索塔斯马尼亚的跟团游行程' : 
                   selectedTourType === '全部' ? '探索塔斯马尼亚的所有旅游产品' : 
                   '探索塔斯马尼亚的奇妙之旅'}
                </h2>
                <p>
                  {selectedTourType === '一日游' ? '选择适合您的行程，开启一段难忘的旅程。' : 
                   selectedTourType === '跟团游' ? '选择适合您的行程，开启一段难忘的旅程。' : 
                   selectedTourType === '全部' ? '从一日游到跟团游，找到最适合您的行程。' : 
                   '从壮丽的自然风光到丰富的文化体验，塔斯马尼亚为您提供难忘的旅行体验。'}
                </p>
              </div>
            </Col>
            <Col md={4}>
              <div className="search-box-container">
                <InputGroup className="tour-search-box">
                  <InputGroup.Text>
                    <FaSearch />
                  </InputGroup.Text>
                  <Form.Control
                    placeholder="搜索目的地、景点或活动..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                  />
                </InputGroup>
              </div>
            </Col>
          </Row>
        </Container>
      </div>

      {/* 主内容区域 */}
      <div className="tour-main-content">
        <Container>
          {/* 期间选择和结果计数 */}
          <div className="tour-header">
            <div className="d-flex justify-content-between align-items-center flex-wrap mb-4">
              <div className="d-flex align-items-center mb-3 mb-md-0">
                {startDate && endDate && (
                  <div className="selected-dates me-3">
                    <FaCalendarAlt className="me-2" />
                    <span>{formatDate(startDate)} - {formatDate(endDate)}</span>
                    <Button 
                      variant="link" 
                      className="clear-dates p-0 ms-2" 
                      onClick={() => navigate(location.pathname)}
                    >
                      <FaTimes />
                    </Button>
                  </div>
                )}
                <div className="results-count">
                  {loading ? (
                    <span>加载中...</span>
                  ) : (
                    <span>
                      显示 {filteredDayTours.length + filteredGroupTours.length} 个结果
                      {Object.keys(queryParams).length > 0 && (
                        <Button 
                          variant="link"
                          className="clear-all p-0 ms-2"
                          onClick={clearAllFilters}
                        >
                          清除所有筛选
                        </Button>
                      )}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="tour-controls d-flex align-items-center">
                {/* 排序下拉菜单 */}
                <Dropdown className="sort-dropdown me-3">
                  <Dropdown.Toggle variant="outline-secondary" id="dropdown-sort">
                    <FaSortAmountDown className="me-2" />
                    <span className="d-none d-md-inline">排序: </span>{sortBy}
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <Dropdown.Item active={sortBy === "推荐"} onClick={() => handleSortChange("推荐")}>推荐</Dropdown.Item>
                    <Dropdown.Item active={sortBy === "价格从低到高"} onClick={() => handleSortChange("价格从低到高")}>价格从低到高</Dropdown.Item>
                    <Dropdown.Item active={sortBy === "价格从高到低"} onClick={() => handleSortChange("价格从高到低")}>价格从高到低</Dropdown.Item>
                    <Dropdown.Item active={sortBy === "评分"} onClick={() => handleSortChange("评分")}>评分最高</Dropdown.Item>
                    <Dropdown.Item active={sortBy === "时长"} onClick={() => handleSortChange("时长")}>时长最短</Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
                
                {/* 视图切换按钮 */}
                <div className="view-switcher d-none d-md-flex">
                  <Button 
                    variant={viewMode === "grid" ? "primary" : "outline-secondary"} 
                    className="me-2" 
                    onClick={() => setViewMode("grid")}
                  >
                    <FaThLarge />
                  </Button>
                  <Button 
                    variant={viewMode === "list" ? "primary" : "outline-secondary"} 
                    onClick={() => setViewMode("list")}
                  >
                    <FaList />
                  </Button>
                </div>
                
                {/* 移动端筛选按钮 */}
                <div className="d-md-none">
                  <Button 
                    variant="outline-primary"
                    onClick={toggleFilters}
                  >
                    <FaFilter className="me-2" />
                    筛选
                  </Button>
                </div>
              </div>
            </div>
          </div>
          
          {/* 登录提示 */}
          {!isAuthenticated && (
            <LoginPrompt message="登录后可以查看更多旅游产品和享受会员价格。" />
          )}
          
          <Row>
            {/* 筛选侧边栏 */}
            <Col lg={3} className={`filters-sidebar ${showFilters ? 'show' : 'd-none d-lg-block'}`}>
              <div className="sidebar-header d-flex justify-content-between align-items-center d-lg-none mb-3">
                <h3 className="mb-0">筛选条件</h3>
                <Button variant="link" className="close-filters p-0" onClick={toggleFilters}>
                  <FaTimes />
                </Button>
              </div>
              
              <Filters 
                ref={filtersRef}
                selectedTourType={selectedTourType}
                selectedLocation={selectedLocation}
                selectedDuration={selectedDuration}
                selectedPriceRange={selectedPriceRange}
                selectedRatings={selectedRatings}
                selectedThemes={selectedThemes}
                selectedSuitableFor={selectedSuitableFor}
                startDate={startDate}
                endDate={endDate}
              />
            </Col>
            
            {/* 旅游列表 */}
            <Col lg={9}>
              {loading ? (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="primary" />
                  <p className="mt-3">正在加载旅游数据...</p>
                </div>
              ) : error ? (
                <Alert variant="danger">
                  <Alert.Heading>加载失败</Alert.Heading>
                  <p>{error}</p>
                </Alert>
              ) : (
                <>
                  {/* u4e00u65e5u6e38u5217u8868 */}
                  {filteredDayTours.length > 0 && selectedTourType !== '全部' && (
                    <div className="tour-section mb-5">
                      <h3 className="section-title">一日游</h3>
                      <Row className={viewMode === "list" ? "list-view" : ""}>
                        {filteredDayTours.map((tour) => (
                          <Col key={`day-${tour.id}`} lg={viewMode === "list" ? 12 : 4} md={viewMode === "list" ? 12 : 6} className="mb-4">
                            {viewMode === "list" ? (
                              // u5217u8868u89c6u56feu4f7fu7528u81eau5b9au4e49u5e03u5c40
                              <div className="list-view-card">
                                <div className="row g-0">
                                  <div className="col-md-4">
                                    <div className="list-tour-img-container h-100">
                                      <img 
                                        src={tour.image_url || tour.cover_image || "/images/placeholder.jpg"}
                                        className="list-tour-img h-100" 
                                        alt={tour.title || tour.name || "全部类型的旅游产品"} 
                                      />
                                      <div className="tour-duration-overlay">
                                        <FaCalendarAlt className="me-1" />
                                        {tour.duration_hours ? `${tour.duration_hours}小时` : tour.duration || "8小时"}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="col-md-8">
                                    <div className="d-flex flex-column h-100 p-3">
                                      <h5 className="tour-title">
                                        {tour.title || tour.name || "全部类型的旅游产品"}
                                      </h5>
                                      <div className="d-flex justify-content-between align-items-center mb-2">
                                        <div className="d-flex align-items-center">
                                          <FaMapMarkerAlt className="text-danger me-1" />
                                          <span className="text-muted small">{tour.location || "塔斯马尼亚"}</span>
                                        </div>
                                        <div className="d-flex align-items-center rating-stars">
                                          <FaStar className="text-warning me-1" />
                                          <span className="text-warning">{tour.rating || 4.5}</span>
                                        </div>
                                      </div>
                                      <p className="tour-description mb-3">
                                        {tour.description || tour.intro || tour.des || ""}
                                      </p>
                                      <div className="mt-auto">
                                        <div className="d-flex justify-content-between align-items-center mt-2">
                                          <div className="tour-price-container">
                                            <PriceDisplay 
                                              price={Number(tour.price)} 
                                              discountPrice={tour.discount_price ? Number(tour.discount_price) : null} 
                                              currency="$"
                                              size="sm"
                                            />
                                            <span className="text-muted small">/人</span>
                                          </div>
                                          <Link to={`/day-tours/${tour.id}`} className="btn btn-sm btn-outline-primary view-details-btn">
                                            u67e5u770bu8be6u60c5
                                          </Link>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              // u7f51u683cu89c6u56feu4f7fu7528RedesignedCardu7ec4u4ef6
                              <RedesignedCard tour={{
                                ...tour,
                                id: tour.id,
                                name: tour.title || tour.name,
                                description: tour.description || tour.intro || tour.des,
                                price: Number(tour.price),
                                discountPrice: tour.discount_price ? Number(tour.discount_price) : null,
                                location: tour.location,
                                rating: tour.rating,
                                type: 'day-tour',
                                duration: tour.duration_hours ? `${tour.duration_hours}小时` : tour.duration,
                                hours: tour.duration_hours,
                                image_url: tour.image_url || tour.cover_image,
                                suitable_for: tour.suitable_for || tour.suitableFor,
                                category: tour.themes && tour.themes.length > 0 ? tour.themes[0] : null
                              }} />
                            )}
                          </Col>
                        ))}
                      </Row>
                    </div>
                  )}
                  
                  {/* u8ddfu56e2u6e38u5217u8868 */}
                  {filteredGroupTours.length > 0 && selectedTourType !== '全部' && (
                    <div className="tour-section">
                      <h3 className="section-title">跟团游</h3>
                      <Row className={viewMode === "list" ? "list-view" : ""}>
                        {filteredGroupTours.map((tour) => (
                          <Col key={`group-${tour.id}`} lg={viewMode === "list" ? 12 : 4} md={viewMode === "list" ? 12 : 6} className="mb-4">
                            {viewMode === "list" ? (
                              // u5217u8868u89c6u56feu4f7fu7528u81eau5b9au4e49u5e03u5c40
                              <div className="list-view-card">
                                <div className="row g-0">
                                  <div className="col-md-4">
                                    <div className="list-tour-img-container h-100">
                                      <img 
                                        src={tour.image_url || tour.cover_image || "/images/placeholder.jpg"}
                                        className="list-tour-img h-100" 
                                        alt={tour.title || tour.name || "全部类型的旅游产品"} 
                                      />
                                      <div className="tour-duration-overlay">
                                        <FaCalendarAlt className="me-1" />
                                        {tour.duration_days && tour.duration_nights 
                                          ? `${tour.duration_days}天${tour.duration_nights}晚` 
                                          : tour.duration}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="col-md-8">
                                    <div className="d-flex flex-column h-100 p-3">
                                      <h5 className="tour-title">
                                        {tour.title || tour.name || "全部类型的旅游产品"}
                                      </h5>
                                      <div className="d-flex justify-content-between align-items-center mb-2">
                                        <div className="d-flex align-items-center">
                                          <FaMapMarkerAlt className="text-danger me-1" />
                                          <span className="text-muted small">{tour.departure || tour.location}</span>
                                        </div>
                                        <div className="d-flex align-items-center rating-stars">
                                          <FaStar className="text-warning me-1" />
                                          <span className="text-warning">{tour.rating || 4.5}</span>
                                        </div>
                                      </div>
                                      <p className="tour-description mb-3">
                                        {tour.description || tour.intro || tour.des || ""}
                                      </p>
                                      <div className="mt-auto">
                                        <div className="d-flex justify-content-between align-items-center mt-2">
                                          <div className="tour-price-container">
                                            <PriceDisplay 
                                              price={Number(tour.price)} 
                                              discountPrice={tour.discount_price ? Number(tour.discount_price) : null} 
                                              currency="$"
                                              size="sm"
                                            />
                                            <span className="text-muted small">/人</span>
                                          </div>
                                          <Link to={`/group-tours/${tour.id}`} className="btn btn-sm btn-outline-primary view-details-btn">
                                            u67e5u770bu8be6u60c5
                                          </Link>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              // u7f51u683cu89c6u56feu4f7fu7528RedesignedCardu7ec4u4ef6
                              <RedesignedCard tour={{
                                ...tour,
                                id: tour.id,
                                name: tour.title || tour.name,
                                description: tour.description || tour.intro || tour.des,
                                price: Number(tour.price),
                                discountPrice: tour.discount_price ? Number(tour.discount_price) : null,
                                location: tour.departure || tour.location,
                                rating: tour.rating,
                                type: 'group-tour',
                                duration: tour.duration_days && tour.duration_nights 
                                  ? `${tour.duration_days}天${tour.duration_nights}晚` 
                                  : tour.duration,
                                days: tour.duration_days,
                                nights: tour.duration_nights,
                                image_url: tour.image_url || tour.cover_image,
                                suitable_for: tour.suitable_for || tour.suitableFor,
                                departure_info: tour.departure_info,
                                category: tour.themes && tour.themes.length > 0 ? tour.themes[0] : null
                              }} />
                            )}
                          </Col>
                        ))}
                      </Row>
                    </div>
                  )}

                  {/* u5168u90e8u4ea7u54c1u5217u8868 - u6df7u5408u663eu793au6240u6709u4ea7u54c1 */}
                  {selectedTourType === '全部' && (filteredDayTours.length > 0 || filteredGroupTours.length > 0) && (
                    <div className="tour-section">
                      <h3 className="section-title">全部产品</h3>
                      <Row className={viewMode === "list" ? "list-view" : ""}>
                        {/* u6df7u5408u663eu793au4e00u65e5u6e38u4ea7u54c1 */}
                        {filteredDayTours.map((tour) => (
                          <Col key={`day-${tour.id}`} lg={viewMode === "list" ? 12 : 4} md={viewMode === "list" ? 12 : 6} className="mb-4">
                            {viewMode === "list" ? (
                              // u5217u8868u89c6u56feu4f7fu7528u81eau5b9au4e49u5e03u5c40
                              <div className="list-view-card">
                                <div className="row g-0">
                                  <div className="col-md-4">
                                    <div className="list-tour-img-container h-100">
                                      <img 
                                        src={tour.image_url || tour.cover_image || "/images/placeholder.jpg"}
                                        className="list-tour-img h-100" 
                                        alt={tour.title || tour.name || "u5168u90e8u7c7bu578bu7684u65c5u6e38u4ea7u54c1"} 
                                      />
                                      <div className="tour-duration-overlay">
                                        <FaCalendarAlt className="me-1" />
                                        {tour.duration_hours ? `${tour.duration_hours}u5c0fu65f6` : tour.duration || "8u5c0fu65f6"}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="col-md-8">
                                    <div className="d-flex flex-column h-100 p-3">
                                      <h5 className="tour-title">
                                        {tour.title || tour.name || "u5168u90e8u7c7bu578bu7684u65c5u6e38u4ea7u54c1"}
                                      </h5>
                                      <div className="d-flex justify-content-between align-items-center mb-2">
                                        <div className="d-flex align-items-center">
                                          <FaMapMarkerAlt className="text-danger me-1" />
                                          <span className="text-muted small">{tour.location || "u5854u65afu9a6cu5c3cu4e9a"}</span>
                                        </div>
                                        <div className="d-flex align-items-center rating-stars">
                                          <FaStar className="text-warning me-1" />
                                          <span className="text-warning">{tour.rating || 4.5}</span>
                                        </div>
                                      </div>
                                      <p className="tour-description mb-3">
                                        {tour.description || tour.intro || tour.des || ""}
                                      </p>
                                      <div className="mt-auto">
                                        <div className="d-flex justify-content-between align-items-center mt-2">
                                          <div className="tour-price-container">
                                            <PriceDisplay 
                                              price={Number(tour.price)} 
                                              discountPrice={tour.discount_price ? Number(tour.discount_price) : null} 
                                              currency="$"
                                              size="sm"
                                            />
                                            <span className="text-muted small">/u4eba</span>
                                          </div>
                                          <Link to={`/day-tours/${tour.id}`} className="btn btn-sm btn-outline-primary view-details-btn">
                                            u67e5u770bu8be6u60c5
                                          </Link>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              // u7f51u683cu89c6u56feu4f7fu7528RedesignedCardu7ec4u4ef6
                              <RedesignedCard tour={{
                                ...tour,
                                id: tour.id,
                                name: tour.title || tour.name,
                                description: tour.description || tour.intro || tour.des,
                                price: Number(tour.price),
                                discountPrice: tour.discount_price ? Number(tour.discount_price) : null,
                                location: tour.location,
                                rating: tour.rating,
                                type: 'day-tour',
                                duration: tour.duration_hours ? `${tour.duration_hours}u5c0fu65f6` : tour.duration,
                                hours: tour.duration_hours,
                                image_url: tour.image_url || tour.cover_image,
                                suitable_for: tour.suitable_for || tour.suitableFor,
                                category: tour.themes && tour.themes.length > 0 ? tour.themes[0] : null
                              }} />
                            )}
                          </Col>
                        ))}

                        {/* u6df7u5408u663eu793au8ddfu56e2u6e38u4ea7u54c1 */}
                        {filteredGroupTours.map((tour) => (
                          <Col key={`group-${tour.id}`} lg={viewMode === "list" ? 12 : 4} md={viewMode === "list" ? 12 : 6} className="mb-4">
                            {viewMode === "list" ? (
                              // u5217u8868u89c6u56feu4f7fu7528u81eau5b9au4e49u5e03u5c40
                              <div className="list-view-card">
                                <div className="row g-0">
                                  <div className="col-md-4">
                                    <div className="list-tour-img-container h-100">
                                      <img 
                                        src={tour.image_url || tour.cover_image || "/images/placeholder.jpg"}
                                        className="list-tour-img h-100" 
                                        alt={tour.title || tour.name || "u5168u90e8u7c7bu578bu7684u65c5u6e38u4ea7u54c1"} 
                                      />
                                      <div className="tour-duration-overlay">
                                        <FaCalendarAlt className="me-1" />
                                        {tour.duration_days && tour.duration_nights 
                                          ? `${tour.duration_days}天${tour.duration_nights}晚` 
                                          : tour.duration}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="col-md-8">
                                    <div className="d-flex flex-column h-100 p-3">
                                      <h5 className="tour-title">
                                        {tour.title || tour.name || "u5168u90e8u7c7bu578bu7684u65c5u6e38u4ea7u54c1"}
                                      </h5>
                                      <div className="d-flex justify-content-between align-items-center mb-2">
                                        <div className="d-flex align-items-center">
                                          <FaMapMarkerAlt className="text-danger me-1" />
                                          <span className="text-muted small">{tour.departure || tour.location}</span>
                                        </div>
                                        <div className="d-flex align-items-center rating-stars">
                                          <FaStar className="text-warning me-1" />
                                          <span className="text-warning">{tour.rating || 4.5}</span>
                                        </div>
                                      </div>
                                      <p className="tour-description mb-3">
                                        {tour.description || tour.intro || tour.des || ""}
                                      </p>
                                      <div className="mt-auto">
                                        <div className="d-flex justify-content-between align-items-center mt-2">
                                          <div className="tour-price-container">
                                            <PriceDisplay 
                                              price={Number(tour.price)} 
                                              discountPrice={tour.discount_price ? Number(tour.discount_price) : null} 
                                              currency="$"
                                              size="sm"
                                            />
                                            <span className="text-muted small">/u4eba</span>
                                          </div>
                                          <Link to={`/group-tours/${tour.id}`} className="btn btn-sm btn-outline-primary view-details-btn">
                                            u67e5u770bu8be6u60c5
                                          </Link>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              // u7f51u683cu89c6u56feu4f7fu7528RedesignedCardu7ec4u4ef6
                              <RedesignedCard tour={{
                                ...tour,
                                id: tour.id,
                                name: tour.title || tour.name,
                                description: tour.description || tour.intro || tour.des,
                                price: Number(tour.price),
                                discountPrice: tour.discount_price ? Number(tour.discount_price) : null,
                                location: tour.departure || tour.location,
                                rating: tour.rating,
                                type: 'group-tour',
                                duration: tour.duration_days && tour.duration_nights 
                                  ? `${tour.duration_days}天${tour.duration_nights}晚` 
                                  : tour.duration,
                                days: tour.duration_days,
                                nights: tour.duration_nights,
                                image_url: tour.image_url || tour.cover_image,
                                suitable_for: tour.suitable_for || tour.suitableFor,
                                departure_info: tour.departure_info,
                                category: tour.themes && tour.themes.length > 0 ? tour.themes[0] : null
                              }} />
                            )}
                          </Col>
                        ))}
                      </Row>
                    </div>
                  )}
                </>
              )}
            </Col>
          </Row>
        </Container>
      </div>
    </div>
  );
};

export default Tours;
