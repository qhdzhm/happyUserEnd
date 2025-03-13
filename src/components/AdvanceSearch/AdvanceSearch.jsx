import React, { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import "../AdvanceSearch/search.css";
import { Container, Row, Col, Button, Form, Dropdown } from "react-bootstrap";
// import
import CustomDropdown from "../CustomDropdown/CustomDropdown";
import { location, TourTypes } from "../../utils/data";
import { useNavigate } from "react-router-dom";

const AdvanceSearch = () => {
  const navigate = useNavigate();
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedTourType, setSelectedTourType] = useState("");
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [showGuestDropdown, setShowGuestDropdown] = useState(false);

  const handleLocationSelect = (value) => {
    setSelectedLocation(value);
  };

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
    
    if (selectedLocation) {
      queryParams.append('location', selectedLocation);
    }
    
    if (selectedTourType) {
      queryParams.append('tourType', selectedTourType);
    }
    
    if (startDate) {
      queryParams.append('startDate', startDate.toISOString());
    }
    
    if (endDate) {
      queryParams.append('endDate', endDate.toISOString());
    }
    
    queryParams.append('adults', adults);
    queryParams.append('children', children);
    
    navigate(`/search?${queryParams.toString()}`);
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
                    type="button" 
                    className="guest-btn" 
                    onClick={decreaseAdults}
                    disabled={adults <= 1}
                  >
                    -
                  </button>
                  <span className="guest-count">{adults}</span>
                  <button 
                    type="button" 
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
                    type="button" 
                    className="guest-btn" 
                    onClick={decreaseChildren}
                    disabled={children <= 0}
                  >
                    -
                  </button>
                  <span className="guest-count">{children}</span>
                  <button 
                    type="button" 
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
                  {/*  使用位置下拉菜单 */}
                  <CustomDropdown
                    label="目的地"
                    onSelect={handleLocationSelect}
                    options={location}
                  />
                </div>
                
                <div className="item-search">
                  {/*  添加行程类型下拉菜单 */}
                  <CustomDropdown
                    label="行程类型"
                    onSelect={handleTourTypeSelect}
                    options={TourTypes}
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
