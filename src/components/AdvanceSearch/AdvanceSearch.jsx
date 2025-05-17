import React, { useState, useEffect, useRef } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import "../AdvanceSearch/search.css";
import { Container, Row, Col, Button, Dropdown, Form, InputGroup, Spinner } from "react-bootstrap";
import CustomDropdown from "../CustomDropdown/CustomDropdown";
import { useNavigate } from "react-router-dom";
import { FaSearch, FaChevronDown, FaMapMarkerAlt, FaCalendarAlt, FaUsers } from "react-icons/fa";
import { getAllDayTours, getAllGroupTours } from "../../utils/api";

const AdvanceSearch = ({ inBanner = false }) => {
  const navigate = useNavigate();
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [selectedTourType, setSelectedTourType] = useState("");
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [showGuestDropdown, setShowGuestDropdown] = useState(false);
  const [keyword, setKeyword] = useState(""); // 关键字搜索
  const [showSuggestions, setShowSuggestions] = useState(false); // 控制建议下拉框显示
  const [suggestions, setSuggestions] = useState([]); // 存储产品建议
  const [filteredSuggestions, setFilteredSuggestions] = useState([]); // 存储过滤后的产品建议
  const [loadingSuggestions, setLoadingSuggestions] = useState(false); // 加载状态
  const [selectedTour, setSelectedTour] = useState(null); // 选中的产品
  const [allTours, setAllTours] = useState([]); // 存储所有产品用于本地过滤
  const suggestionsRef = useRef(null); // 用于点击外部关闭建议框
  const inputRef = useRef(null); // 输入框引用

  // 直接在组件中定义行程类型选项
  const tourTypeOptions = ["一日游", "跟团游"];

  // 用于处理点击外部关闭建议框
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 当选择旅游类型时立即加载该类型的所有产品
  useEffect(() => {
    if (selectedTourType) {
      fetchTourSuggestions();
      // 当用户选择了类型后，直接显示建议下拉菜单
      setShowSuggestions(true);
    }
  }, [selectedTourType]);

  // 当关键字或所有产品列表变化时进行本地过滤
  useEffect(() => {
    filterSuggestions();
  }, [keyword, allTours]);

  // 使用模糊匹配进行本地过滤
  const filterSuggestions = () => {
    if (!allTours.length) {
      setFilteredSuggestions([]);
      return;
    }

    // 如果没有关键字，显示所有产品
    if (!keyword.trim()) {
      setFilteredSuggestions(allTours);
      return;
    }

    // 使用模糊匹配查找相关产品
    const searchTerm = keyword.toLowerCase().trim();
    
    const filtered = allTours.filter(tour => {
      const tourName = (tour.name || '').toLowerCase();
      
      // 完全匹配
      if (tourName.includes(searchTerm)) {
        return true;
      }
      
      // 拆分关键词进行部分匹配
      const keywords = searchTerm.split(/\s+/);
      return keywords.some(word => tourName.includes(word));
    });
    
    setFilteredSuggestions(filtered);
  };

  // 获取旅游产品建议
  const fetchTourSuggestions = async () => {
    if (!selectedTourType) return;
    
    setLoadingSuggestions(true);
    
    try {
      let params = {};
      // 根据选中的旅游类型确定API参数
      if (selectedTourType === "一日游") {
        params.tourTypes = "day_tour";
      } else if (selectedTourType === "跟团游") {
        params.tourTypes = "group_tour";
      }
      
      let response;
      
      // 使用适当的API获取建议
      if (params.tourTypes === "day_tour") {
        response = await getAllDayTours(params);
      } else {
        response = await getAllGroupTours(params);
      }
      
      if (response && response.code === 1 && response.data) {
        // 从响应中提取产品列表
        const tours = Array.isArray(response.data) 
          ? response.data 
          : (response.data.records || []);
        
        // 确保我们能获取到产品数据
        console.log(`获取到${tours.length}个${selectedTourType}产品`);
          
        const formattedTours = tours.map(tour => ({
          id: tour.id,
          name: tour.title || tour.name || `${selectedTourType} ${tour.id}`,
          type: params.tourTypes === "day_tour" ? "day-tours" : "group-tours",
          image: tour.coverImage || tour.image || tour.image_url || '/images/placeholder.jpg'
        }));
        
        // 存储所有产品用于本地过滤
        setAllTours(formattedTours);
        setFilteredSuggestions(formattedTours);
      } else {
        setAllTours([]);
        setFilteredSuggestions([]);
        console.error("获取产品列表失败:", response);
      }
    } catch (error) {
      console.error("获取旅游建议失败:", error);
      setAllTours([]);
      setFilteredSuggestions([]);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleTourTypeSelect = (value) => {
    setSelectedTourType(value);
    // 清空之前的建议
    setAllTours([]);
    setFilteredSuggestions([]);
    setKeyword("");
    setSelectedTour(null);
  };

  // 处理关键字输入
  const handleKeywordChange = (e) => {
    const value = e.target.value;
    setKeyword(value);
    setShowSuggestions(true);
    
    // 如果之前选择了特定产品，但用户改变了输入，清除选择
    if (selectedTour && value !== selectedTour.name) {
      setSelectedTour(null);
    }
  };

  // 选择产品
  const handleSelectTour = (tour) => {
    setSelectedTour(tour);
    setKeyword(tour.name);
    setShowSuggestions(false);
  };

  // 切换显示建议下拉菜单
  const toggleSuggestions = () => {
    if (selectedTourType) {
      if (!showSuggestions) {
        setShowSuggestions(true);
      } else {
        setShowSuggestions(false);
      }
    }
  };

  // 搜索提交
  const handleSearch = () => {
    // 如果选择了特定产品，直接导航到产品详情页
    if (selectedTour) {
      navigate(`/${selectedTour.type}/${selectedTour.id}`);
      return;
    }
    
    // 否则，构建查询参数并导航到搜索结果页
    const queryParams = new URLSearchParams();
    
    // 设置正确的tourTypes参数格式
    if (selectedTourType === "一日游") {
      queryParams.append('tourTypes', 'day_tour');
    } else if (selectedTourType === "跟团游") {
      queryParams.append('tourTypes', 'group_tour');
    } else {
      // 如果没有选择，默认为一日游
      queryParams.append('tourTypes', 'day_tour');
    }
    
    // 添加关键字搜索参数
    if (keyword.trim()) {
      queryParams.append('keyword', keyword.trim());
    }
    
    // 添加日期信息
    if (startDate) {
      queryParams.append('startDate', startDate.toISOString().split('T')[0]);
    }
    
    if (endDate) {
      queryParams.append('endDate', endDate.toISOString().split('T')[0]);
    }
    
    // 添加人数信息
    queryParams.append('adults', adults);
    queryParams.append('children', children);
    
    // 添加标记
    queryParams.append('fromAdvanceSearch', 'true');
    
    // 导航到旅游路线页面
    navigate(`/tours?${queryParams.toString()}`);
    
    // 打印日志
    console.log("高级搜索参数:", queryParams.toString());
  };

  const increaseAdults = () => {
    setAdults(prev => prev + 1);
  };

  const decreaseAdults = () => {
    if (adults > 1) {
      setAdults(prev => prev - 1);
    }
  };

  const increaseChildren = () => {
    setChildren(prev => prev + 1);
  };

  const decreaseChildren = () => {
    if (children > 0) {
      setChildren(prev => prev - 1);
    }
  };

  const toggleGuestDropdown = () => {
    setShowGuestDropdown(!showGuestDropdown);
  };

  // 自定义旅客选择器组件
  const GuestSelector = () => {
    return (
      <>
        <label className="item-search-label">旅客</label>
        <Dropdown className="dropdown-custom" show={showGuestDropdown} onToggle={toggleGuestDropdown}>
          <Dropdown.Toggle id="dropdown-custom-components">
            <span>{adults} 成人, {children} 儿童</span>
          </Dropdown.Toggle>

          <Dropdown.Menu>
            <div className="guest-selector-content">
              <div className="guest-type">
                <span>成人</span>
                <div className="guest-controls">
                  <button 
                    className="guest-btn" 
                    onClick={decreaseAdults}
                    disabled={adults <= 1}
                    type="button"
                  >
                    <span>-</span>
                  </button>
                  <span className="guest-count">{adults}</span>
                  <button 
                    className="guest-btn" 
                    onClick={increaseAdults}
                    type="button"
                  >
                    <span>+</span>
                  </button>
                </div>
              </div>
              <div className="guest-type">
                <span>儿童</span>
                <div className="guest-controls">
                  <button 
                    className="guest-btn" 
                    onClick={decreaseChildren}
                    disabled={children <= 0}
                    type="button"
                  >
                    <span>-</span>
                  </button>
                  <span className="guest-count">{children}</span>
                  <button 
                    className="guest-btn" 
                    onClick={increaseChildren}
                    type="button"
                  >
                    <span>+</span>
                  </button>
                </div>
              </div>
            </div>
          </Dropdown.Menu>
        </Dropdown>
      </>
    );
  };

  // 重置所有筛选项
  const handleReset = () => {
    setSelectedTourType("");
    setKeyword("");
    setStartDate(null);
    setEndDate(null);
    setAdults(1);
    setChildren(0);
    setSelectedTour(null);
    setShowSuggestions(false);
    setAllTours([]);
    setFilteredSuggestions([]);
  };

  // 如果是在banner中渲染，则使用不同的样式和结构
  if (inBanner) {
    return (
      <div className={`box-search-banner`}>
        <div className="box-search-row">
          <div className="search-item">
            <label>产品类型</label>
            <div className="search-item-content">
              <CustomDropdown
                onSelect={handleTourTypeSelect}
                options={tourTypeOptions}
                darkMode={true}
                icon={<FaMapMarkerAlt />}
              />
            </div>
          </div>
          
          {/* 关键字搜索框 */}
          <div className="search-item">
            <label>关键字或选择产品</label>
            <div className="search-item-content search-keyword-content" ref={suggestionsRef}>
              <div className="keyword-input-container">
                <div className="keyword-input-wrapper">
                  <FaSearch className="search-icon" />
                  <input
                    type="text"
                    className="keyword-input"
                    placeholder={selectedTourType ? `输入关键字或选择${selectedTourType}产品` : "请先选择产品类型"}
                    value={keyword}
                    onChange={handleKeywordChange}
                    onFocus={() => selectedTourType && setShowSuggestions(true)}
                    ref={inputRef}
                    disabled={!selectedTourType}
                  />
                  <button 
                    className={`dropdown-toggle-btn ${showSuggestions ? 'active' : ''}`}
                    onClick={toggleSuggestions}
                    disabled={!selectedTourType}
                  >
                    <FaChevronDown />
                  </button>
                </div>
                
                {/* 产品建议下拉框 */}
                {showSuggestions && selectedTourType && (
                  <div className="tour-suggestions-dropdown">
                    {loadingSuggestions ? (
                      <div className="suggestions-loading">
                        <Spinner animation="border" size="sm" />
                        <span>加载产品中...</span>
                      </div>
                    ) : filteredSuggestions.length > 0 ? (
                      <>
                        <div className="suggestions-header">
                          选择{selectedTourType}产品 ({filteredSuggestions.length}/{allTours.length})
                        </div>
                        <div className="suggestions-list">
                          {filteredSuggestions.map(tour => (
                            <div 
                              key={tour.id} 
                              className={`tour-suggestion-item ${selectedTour && selectedTour.id === tour.id ? 'active' : ''}`}
                              onClick={() => handleSelectTour(tour)}
                            >
                              <div className="tour-suggestion-img">
                                <img src={tour.image} alt={tour.name} />
                              </div>
                              <div className="tour-suggestion-name" title={tour.name}>
                                {tour.name}
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className="no-suggestions">
                        <span>未找到{selectedTourType}产品</span>
                        {keyword && (
                          <div className="no-matches-hint">
                            尝试使用其他关键词
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="search-item">
            <label>出发日期</label>
            <div className="search-item-content">
              <div className="input-with-icon">
                <FaCalendarAlt className="search-icon" />
                <DatePicker
                  selected={startDate}
                  onChange={(date) => setStartDate(date)}
                  selectsStart
                  startDate={startDate}
                  endDate={endDate}
                  placeholderText="选择日期"
                  dateFormat="yyyy-MM-dd"
                  className="banner-datepicker"
                />
              </div>
            </div>
          </div>
          
          <div className="search-item">
            <label>结束日期</label>
            <div className="search-item-content">
              <div className="input-with-icon">
                <FaCalendarAlt className="search-icon" />
                <DatePicker
                  selected={endDate}
                  onChange={(date) => setEndDate(date)}
                  selectsEnd
                  startDate={startDate}
                  endDate={endDate}
                  minDate={startDate}
                  placeholderText="选择日期"
                  dateFormat="yyyy-MM-dd"
                  className="banner-datepicker"
                />
              </div>
            </div>
          </div>
          
          <div className="search-item">
            <label>旅客</label>
            <div className="search-item-content">
              <Dropdown className="dropdown-custom guest-dropdown" show={showGuestDropdown} onToggle={toggleGuestDropdown}>
                <Dropdown.Toggle id="dropdown-custom-components" className="banner-dropdown">
                  <FaUsers className="dropdown-prefix-icon" />
                  <span>{adults} 成人, {children} 儿童</span>
                </Dropdown.Toggle>

                <Dropdown.Menu>
                  <div className="guest-selector-content">
                    <div className="guest-type">
                      <span>成人</span>
                      <div className="guest-controls">
                        <button 
                          className="guest-btn" 
                          onClick={decreaseAdults}
                          disabled={adults <= 1}
                          type="button"
                        >
                          <span>-</span>
                        </button>
                        <span className="guest-count">{adults}</span>
                        <button 
                          className="guest-btn" 
                          onClick={increaseAdults}
                          type="button"
                        >
                          <span>+</span>
                        </button>
                      </div>
                    </div>
                    <div className="guest-type">
                      <span>儿童</span>
                      <div className="guest-controls">
                        <button 
                          className="guest-btn" 
                          onClick={decreaseChildren}
                          disabled={children <= 0}
                          type="button"
                        >
                          <span>-</span>
                        </button>
                        <span className="guest-count">{children}</span>
                        <button 
                          className="guest-btn" 
                          onClick={increaseChildren}
                          type="button"
                        >
                          <span>+</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </Dropdown.Menu>
              </Dropdown>
            </div>
          </div>
          
          <div className="button-group">
            <button className="search-submit-btn" onClick={handleSearch}>
              <FaSearch /> 搜索
            </button>
            <button className="reset-btn" onClick={handleReset}>
              重置
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 原始版本的搜索组件（不在banner中）
  return (
    <>
      <section className="box-search-advance">
        <Container>
          <Row>
            <Col md={12} xs={12}>
              <div className="box-search shadow-sm">
                <div className="item-search">
                  {/*  添加行程类型下拉菜单 */}
                  <CustomDropdown
                    label="产品类型"
                    onSelect={handleTourTypeSelect}
                    options={tourTypeOptions}
                  />
                </div>
                
                {/* 改进的关键字搜索框 */}
                <div className="item-search">
                  <label className="item-search-label">关键字或选择产品</label>
                  <div className="keyword-search-container" ref={suggestionsRef}>
                    <div className="keyword-regular-input-container">
                      <i className="bi bi-search keyword-icon"></i>
                      <div className="keyword-input-wrapper">
                        <input
                          type="text"
                          className="keyword-input-regular"
                          placeholder={selectedTourType ? `输入关键字或选择${selectedTourType}产品` : "请先选择产品类型"}
                          value={keyword}
                          onChange={handleKeywordChange}
                          onFocus={() => selectedTourType && setShowSuggestions(true)}
                          ref={inputRef}
                          disabled={!selectedTourType}
                        />
                        <button 
                          className={`dropdown-toggle-btn regular ${showSuggestions ? 'active' : ''}`}
                          onClick={toggleSuggestions}
                          disabled={!selectedTourType}
                        >
                          <FaChevronDown />
                        </button>
                      </div>
                      
                      {/* 产品建议下拉框 - 常规搜索样式 */}
                      {showSuggestions && selectedTourType && (
                        <div className="tour-suggestions-dropdown-regular">
                          {loadingSuggestions ? (
                            <div className="suggestions-loading">
                              <Spinner animation="border" size="sm" />
                              <span>加载产品中...</span>
                            </div>
                          ) : filteredSuggestions.length > 0 ? (
                            <>
                              <div className="suggestions-header">
                                选择{selectedTourType}产品 ({filteredSuggestions.length}/{allTours.length})
                              </div>
                              <div className="suggestions-list">
                                {filteredSuggestions.map(tour => (
                                  <div 
                                    key={tour.id} 
                                    className={`tour-suggestion-item ${selectedTour && selectedTour.id === tour.id ? 'active' : ''}`}
                                    onClick={() => handleSelectTour(tour)}
                                  >
                                    <div className="tour-suggestion-img">
                                      <img src={tour.image} alt={tour.name} />
                                    </div>
                                    <div className="tour-suggestion-name" title={tour.name}>
                                      {tour.name}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </>
                          ) : (
                            <div className="no-suggestions">
                              <span>未找到{selectedTourType}产品</span>
                              {keyword && (
                                <div className="no-matches-hint">
                                  尝试使用其他关键词
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="item-search item-search-2">
                  <label className="item-search-label">到达时间</label>
                  <DatePicker
                    selected={startDate}
                    onChange={(date) => setStartDate(date)}
                    selectsStart
                    startDate={startDate}
                    endDate={endDate}
                    placeholderText="选择日期"
                    dateFormat="yyyy-MM-dd"
                  />
                </div>
                
                <div className="item-search item-search-2">
                  <label className="item-search-label">离开时间</label>
                  <DatePicker
                    selected={endDate}
                    onChange={(date) => setEndDate(date)}
                    selectsEnd
                    startDate={startDate}
                    endDate={endDate}
                    minDate={startDate}
                    placeholderText="选择日期"
                    dateFormat="yyyy-MM-dd"
                  />
                </div>
                
                <div className="item-search">
                  {/* 使用自定义旅客选择器 */}
                  <GuestSelector />
                </div>
                
                <div className="item-search bd-none">
                  <Button 
                    className="primaryBtn flex-even d-flex justify-content-center"
                    onClick={handleSearch}
                  >
                    <i className="bi bi-search me-2"></i> 搜索 
                  </Button>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>
    </>
  );
};

export default AdvanceSearch;
