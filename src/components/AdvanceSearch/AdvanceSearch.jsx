import React, { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import "../AdvanceSearch/search.css";
import { Container, Row, Col, Button, Dropdown } from "react-bootstrap";
import CustomDropdown from "../CustomDropdown/CustomDropdown";
import { useNavigate } from "react-router-dom";

const AdvanceSearch = () => {
  const navigate = useNavigate();
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [selectedTourType, setSelectedTourType] = useState("");
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [showGuestDropdown, setShowGuestDropdown] = useState(false);

  // 直接在组件中定义行程类型选项
  const tourTypeOptions = ["一日游", "跟团游"];

  const handleTourTypeSelect = (value) => {
    setSelectedTourType(value);
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

  const handleSearch = () => {
    const queryParams = new URLSearchParams();
    
    // 设置正确的tourTypes参数格式，与Tours.jsx组件期望的一致
    if (selectedTourType === "一日游") {
      queryParams.append('tourTypes', 'day_tour');
    } else if (selectedTourType === "跟团游") {
      queryParams.append('tourTypes', 'group_tour');
    } else {
      // 如果没有选择，默认为一日游
      queryParams.append('tourTypes', 'day_tour');
    }
    
    // 添加日期信息
    if (startDate) {
      queryParams.append('startDate', startDate.toISOString().split('T')[0]); // 只传递日期部分 YYYY-MM-DD
    }
    
    if (endDate) {
      queryParams.append('endDate', endDate.toISOString().split('T')[0]); // 只传递日期部分 YYYY-MM-DD
    }
    
    // 添加人数信息
    queryParams.append('adults', adults);
    queryParams.append('children', children);
    
    // 添加一个标记，表示这是从高级搜索进入的
    queryParams.append('fromAdvanceSearch', 'true');
    
    // 导航到旅游路线页面
    navigate(`/tours?${queryParams.toString()}`);
    
    // 打印日志以便调试
    console.log("高级搜索参数:", queryParams.toString());
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
                  >
                    -
                  </button>
                  <span className="guest-count">{adults}</span>
                  <button 
                    className="guest-btn" 
                    onClick={increaseAdults}
                  >
                    +
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
                  >
                    -
                  </button>
                  <span className="guest-count">{children}</span>
                  <button 
                    className="guest-btn" 
                    onClick={increaseChildren}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </Dropdown.Menu>
        </Dropdown>
      </>
    );
  };

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
                    label="行程类型"
                    onSelect={handleTourTypeSelect}
                    options={tourTypeOptions}
                  />
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
