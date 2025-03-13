import React, { useState, useEffect, useMemo } from "react";
import { Container, Row, Col, Form, InputGroup, Button, Badge, Dropdown } from "react-bootstrap";
import { useLocation, useNavigate } from "react-router-dom";
import { FaSearch, FaFilter, FaSortAmountDown, FaThLarge, FaList, FaTimes } from "react-icons/fa";
import PopularCard from "../../components/Cards/PopularCard";
import Breadcrumbs from "../../components/Breadcrumbs/Breadcrumbs";
import Filters from "./Filters";
import { tasmaniaAttractions, popularsData } from "../../utils/data";
import "./tour.css";

const Tours = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const [searchTerm, setSearchTerm] = useState("");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 992);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState("grid"); // grid 或 list
  const [sortBy, setSortBy] = useState("推荐"); // 默认排序方式

  // 从URL获取筛选参数
  const selectedTourType = queryParams.get('tourTypes') || '';
  const selectedLocation = queryParams.get('location') ? queryParams.get('location').split(',') : [];
  const selectedDuration = queryParams.get('duration') ? queryParams.get('duration').split(',') : [];
  const selectedPriceRange = queryParams.get('priceRange') ? queryParams.get('priceRange').split(',') : [];
  const selectedRatings = queryParams.get('ratings') ? queryParams.get('ratings').split(',').map(Number) : [];
  const selectedThemes = queryParams.get('themes') ? queryParams.get('themes').split(',') : [];
  const selectedSuitableFor = queryParams.get('suitableFor') ? queryParams.get('suitableFor').split(',') : [];

  // 监听窗口大小变化
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 992);
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

  // 筛选一日游数据
  const filteredDayTours = useMemo(() => {
    // 如果选择了跟团游，则不显示一日游数据
    if (selectedTourType === '跟团游') {
      return [];
    }

    let filtered = [...tasmaniaAttractions];

    // 如果选择了一日游，则只显示一日游数据
    if (selectedTourType === '一日游') {
      filtered = filtered.filter(item => 
        Array.isArray(item.tourType) 
          ? item.tourType.includes('一日游')
          : item.tourType === '一日游'
      );
    }

    // 根据地点筛选
    if (selectedLocation.length > 0) {
      filtered = filtered.filter(item => selectedLocation.includes(item.location));
    }

    // 根据时长筛选 - 一日游时长格式为 "X小时"
    if (selectedDuration.length > 0) {
      filtered = filtered.filter(item => {
        // 处理一日游时长筛选
        const hours = parseInt(item.duration);
        return selectedDuration.some(duration => {
          if (duration === "2-4小时" && hours >= 2 && hours <= 4) return true;
          if (duration === "4-6小时" && hours >= 4 && hours <= 6) return true;
          if (duration === "6-8小时" && hours >= 6 && hours <= 8) return true;
          if (duration === "8小时以上" && hours > 8) return true;
          return false;
        });
      });
    }

    // 根据价格范围筛选
    if (selectedPriceRange.length > 0) {
      filtered = filtered.filter(item => {
        const price = parseFloat(item.price);
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
        const rating = parseFloat(item.rating);
        return selectedRatings.some(r => rating >= r);
      });
    }

    // 根据主题筛选
    if (selectedThemes.length > 0) {
      filtered = filtered.filter(item => 
        item.themes.some(theme => selectedThemes.includes(theme))
      );
    }

    // 根据适合人群筛选
    if (selectedSuitableFor.length > 0) {
      filtered = filtered.filter(item => 
        item.suitableFor.some(suitable => selectedSuitableFor.includes(suitable))
      );
    }

    // 根据搜索词筛选
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(
        item => 
          item.name.toLowerCase().includes(term) || 
          item.description.toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [
    selectedTourType,
    selectedLocation,
    selectedDuration,
    selectedPriceRange,
    selectedRatings,
    selectedThemes,
    selectedSuitableFor,
    searchTerm
  ]);

  // 筛选跟团游数据
  const filteredGroupTours = useMemo(() => {
    // 如果选择了一日游，则不显示跟团游数据
    if (selectedTourType === '一日游') {
      return [];
    }

    let filtered = [...popularsData];

    // 如果选择了跟团游，则只显示跟团游数据
    if (selectedTourType === '跟团游') {
      filtered = filtered.filter(item => 
        Array.isArray(item.tourType) 
          ? item.tourType.includes('跟团游')
          : item.tourType === '跟团游'
      );
    }

    // 根据时长筛选 - 跟团游时长格式为 "X天X晚"
    if (selectedDuration.length > 0) {
      filtered = filtered.filter(item => {
        // 从 "X天X晚" 中提取天数
        const days = parseInt(item.duration.split('天')[0]);
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
        const price = parseFloat(item.afterDiscount || item.price);
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
        const rating = parseFloat(item.rating);
        return selectedRatings.some(r => rating >= r);
      });
    }

    // 根据主题筛选
    if (selectedThemes.length > 0) {
      filtered = filtered.filter(item => 
        item.themes.some(theme => selectedThemes.includes(theme))
      );
    }

    // 根据适合人群筛选
    if (selectedSuitableFor.length > 0) {
      filtered = filtered.filter(item => 
        item.suitableFor.some(suitable => selectedSuitableFor.includes(suitable))
      );
    }

    // 根据搜索词筛选
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(
        item => 
          item.title.toLowerCase().includes(term) || 
          (item.description && item.description.toLowerCase().includes(term))
      );
    }

    return filtered;
  }, [
    selectedTourType,
    selectedDuration,
    selectedPriceRange,
    selectedRatings,
    selectedThemes,
    selectedSuitableFor,
    searchTerm
  ]);

  // 合并筛选结果
  const allFilteredTours = useMemo(() => {
    const dayTours = filteredDayTours.map(item => ({
      ...item,
      title: item.name,
      afterDiscount: item.price,
      tourTypeBadge: Array.isArray(item.tourType) ? item.tourType[0] : item.tourType,
      img: item.image // 确保图片路径正确
    }));

    const groupTours = filteredGroupTours.map(item => ({
      ...item,
      tourTypeBadge: Array.isArray(item.tourType) ? item.tourType[0] : item.tourType,
      img: item.image // 确保图片路径正确
    }));

    let combined = [...dayTours, ...groupTours];
    
    // 根据排序方式排序
    switch(sortBy) {
      case "价格从低到高":
        combined.sort((a, b) => parseFloat(a.afterDiscount || a.price) - parseFloat(b.afterDiscount || b.price));
        break;
      case "价格从高到低":
        combined.sort((a, b) => parseFloat(b.afterDiscount || b.price) - parseFloat(a.afterDiscount || a.price));
        break;
      case "评分最高":
        combined.sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating));
        break;
      case "最新上线":
        // 假设有上线日期字段，这里仅作示例
        combined.sort((a, b) => new Date(b.createdAt || "2023-01-01") - new Date(a.createdAt || "2023-01-01"));
        break;
      default:
        // 推荐排序，可以根据需要实现自定义逻辑
        break;
    }
    
    return combined;
  }, [filteredDayTours, filteredGroupTours, sortBy]);

  // 处理搜索输入
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // 切换筛选面板显示（移动端）
  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  // 切换视图模式
  const toggleViewMode = (mode) => {
    setViewMode(mode);
  };

  // 处理排序方式变更
  const handleSortChange = (sortOption) => {
    setSortBy(sortOption);
  };

  // 清除所有筛选条件
  const clearAllFilters = () => {
    navigate('/tours');
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
                <h2>探索塔斯马尼亚的奇妙之旅</h2>
                <p>从壮丽的自然风光到丰富的文化体验，塔斯马尼亚为您提供难忘的旅行体验。选择适合您的行程，开启一段难忘的旅程。</p>
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
      
      <Container fluid className="filter-results-section py-5">
        <Container>
          {/* 已选筛选条件展示 */}
          {(selectedLocation.length > 0 || selectedDuration.length > 0 || selectedPriceRange.length > 0 || 
            selectedRatings.length > 0 || selectedThemes.length > 0 || selectedSuitableFor.length > 0 || 
            selectedTourType) && (
            <div className="selected-filters mb-4">
              <div className="d-flex flex-wrap align-items-center">
                <span className="me-2 selected-filters-label">已选条件:</span>
                
                {selectedTourType && (
                  <Badge bg="primary" className="selected-filter-badge me-2 mb-2">
                    {selectedTourType}
                    <span className="ms-2 filter-remove" onClick={() => {
                      const params = new URLSearchParams(location.search);
                      params.delete('tourTypes');
                      navigate(`/tours?${params.toString()}`);
                    }}><FaTimes /></span>
                  </Badge>
                )}
                
                {selectedLocation.map((loc, index) => (
                  <Badge key={index} bg="primary" className="selected-filter-badge me-2 mb-2">
                    {loc}
                    <span className="ms-2 filter-remove" onClick={() => {
                      const newLocations = selectedLocation.filter(item => item !== loc);
                      const params = new URLSearchParams(location.search);
                      if (newLocations.length > 0) {
                        params.set('location', newLocations.join(','));
                      } else {
                        params.delete('location');
                      }
                      navigate(`/tours?${params.toString()}`);
                    }}><FaTimes /></span>
                  </Badge>
                ))}
                
                {selectedDuration.map((duration, index) => (
                  <Badge key={index} bg="primary" className="selected-filter-badge me-2 mb-2">
                    {duration}
                    <span className="ms-2 filter-remove" onClick={() => {
                      const newDurations = selectedDuration.filter(item => item !== duration);
                      const params = new URLSearchParams(location.search);
                      if (newDurations.length > 0) {
                        params.set('duration', newDurations.join(','));
                      } else {
                        params.delete('duration');
                      }
                      navigate(`/tours?${params.toString()}`);
                    }}><FaTimes /></span>
                  </Badge>
                ))}
                
                {selectedPriceRange.map((range, index) => (
                  <Badge key={index} bg="primary" className="selected-filter-badge me-2 mb-2">
                    {range}
                    <span className="ms-2 filter-remove" onClick={() => {
                      const newRanges = selectedPriceRange.filter(item => item !== range);
                      const params = new URLSearchParams(location.search);
                      if (newRanges.length > 0) {
                        params.set('priceRange', newRanges.join(','));
                      } else {
                        params.delete('priceRange');
                      }
                      navigate(`/tours?${params.toString()}`);
                    }}><FaTimes /></span>
                  </Badge>
                ))}
                
                {selectedThemes.map((theme, index) => (
                  <Badge key={index} bg="primary" className="selected-filter-badge me-2 mb-2">
                    {theme}
                    <span className="ms-2 filter-remove" onClick={() => {
                      const newThemes = selectedThemes.filter(item => item !== theme);
                      const params = new URLSearchParams(location.search);
                      if (newThemes.length > 0) {
                        params.set('themes', newThemes.join(','));
                      } else {
                        params.delete('themes');
                      }
                      navigate(`/tours?${params.toString()}`);
                    }}><FaTimes /></span>
                  </Badge>
                ))}
                
                <Button 
                  variant="outline-secondary" 
                  size="sm" 
                  className="clear-filters-btn mb-2"
                  onClick={clearAllFilters}
                >
                  清除全部
                </Button>
              </div>
            </div>
          )}
          
          <Row>
            {/* 筛选面板 */}
            <Col lg={3} className="filter-column">
              {isMobile && (
                <button 
                  className="btn btn-primary w-100 mb-3 d-lg-none filter-toggle-btn" 
                  onClick={toggleFilters}
                >
                  <FaFilter className="me-2" />
                  {showFilters ? "隐藏筛选" : "显示筛选"}
                </button>
              )}
              
              {(showFilters || !isMobile) && (
                <div className="filters-wrapper">
                  <div className="filters-header">
                    <h5>筛选条件</h5>
                    <Button 
                      variant="link" 
                      className="reset-filters-link"
                      onClick={clearAllFilters}
                    >
                      重置
                    </Button>
                  </div>
                  <Filters onApplyFilters={() => {}} />
                </div>
              )}
            </Col>
            
            {/* 产品列表 */}
            <Col lg={9}>
              <div className="filter-results">
                <div className="results-header mb-4">
                  <div className="d-flex justify-content-between align-items-center flex-wrap">
                    <h5 className="results-count mb-0">找到 {allFilteredTours.length} 个结果</h5>
                    
                    <div className="d-flex align-items-center">
                      {/* 排序下拉菜单 */}
                      <Dropdown className="me-3">
                        <Dropdown.Toggle variant="outline-secondary" id="dropdown-sort">
                          <FaSortAmountDown className="me-2" />
                          {sortBy}
                        </Dropdown.Toggle>
                        
                        <Dropdown.Menu>
                          <Dropdown.Item onClick={() => handleSortChange("推荐")}>推荐</Dropdown.Item>
                          <Dropdown.Item onClick={() => handleSortChange("价格从低到高")}>价格从低到高</Dropdown.Item>
                          <Dropdown.Item onClick={() => handleSortChange("价格从高到低")}>价格从高到低</Dropdown.Item>
                          <Dropdown.Item onClick={() => handleSortChange("评分最高")}>评分最高</Dropdown.Item>
                          <Dropdown.Item onClick={() => handleSortChange("最新上线")}>最新上线</Dropdown.Item>
                        </Dropdown.Menu>
                      </Dropdown>
                      
                      {/* 视图切换按钮 */}
                      <div className="view-toggle">
                        <Button 
                          variant={viewMode === "grid" ? "primary" : "outline-secondary"} 
                          className="me-2"
                          onClick={() => toggleViewMode("grid")}
                        >
                          <FaThLarge />
                        </Button>
                        <Button 
                          variant={viewMode === "list" ? "primary" : "outline-secondary"}
                          onClick={() => toggleViewMode("list")}
                        >
                          <FaList />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
                
                {allFilteredTours.length > 0 ? (
                  <Row xs={1} md={viewMode === "grid" ? 2 : 1} lg={viewMode === "grid" ? 3 : 1} className="g-4">
                    {allFilteredTours.map((item, index) => (
                      <Col key={index}>
                        <PopularCard val={item} viewMode={viewMode} />
                      </Col>
                    ))}
                  </Row>
                ) : (
                  <div className="no-results text-center py-5">
                    <div className="no-results-icon mb-3">
                      <FaSearch size={48} color="#ccc" />
                    </div>
                    <h4>没有找到符合条件的结果</h4>
                    <p>请尝试调整筛选条件或使用不同的搜索词</p>
                    <Button 
                      variant="primary" 
                      onClick={clearAllFilters}
                    >
                      清除所有筛选条件
                    </Button>
                  </div>
                )}
              </div>
            </Col>
          </Row>
        </Container>
      </Container>
    </div>
  );
};

export default Tours;
