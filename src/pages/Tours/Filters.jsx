import React, { useState, useEffect } from "react";
import { Accordion, Form, Button } from "react-bootstrap";
import { useLocation, useNavigate } from "react-router-dom";
import { 
  TourTypes, 
  location as locationData, 
  DayTourThemes, 
  GroupTourThemes, 
  DayTourDuration, 
  GroupTourDuration, 
  PriceRange, 
  SuitableFor 
} from "../../utils/data";

const Filters = ({ onApplyFilters }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);

  // 从URL获取筛选参数，但确保tourTypes只有一个值
  const [selectedTourType, setSelectedTourType] = useState(
    queryParams.get('tourTypes') ? queryParams.get('tourTypes').split(',')[0] : ''
  );
  const [selectedDuration, setSelectedDuration] = useState(
    queryParams.get('duration') ? queryParams.get('duration').split(',') : []
  );
  const [selectedPriceRange, setSelectedPriceRange] = useState(
    queryParams.get('priceRange') ? queryParams.get('priceRange').split(',') : []
  );
  const [selectedRatings, setSelectedRatings] = useState(
    queryParams.get('ratings') ? queryParams.get('ratings').split(',').map(Number) : []
  );
  const [selectedThemes, setSelectedThemes] = useState(
    queryParams.get('themes') ? queryParams.get('themes').split(',') : []
  );
  const [selectedSuitableFor, setSelectedSuitableFor] = useState(
    queryParams.get('suitableFor') ? queryParams.get('suitableFor').split(',') : []
  );
  const [selectedLocation, setSelectedLocation] = useState(
    queryParams.get('location') ? queryParams.get('location').split(',') : []
  );

  // 处理旅游类型选择 - 修改为单选
  const handleTourTypeChange = (tourType) => {
    // 如果点击当前已选中的类型，则取消选择
    if (selectedTourType === tourType) {
      setSelectedTourType('');
    } else {
      // 否则选择新的类型
      setSelectedTourType(tourType);
    }
    
    // 清除其他筛选条件，因为不同旅游类型有不同的筛选选项
    setSelectedThemes([]);
    setSelectedDuration([]);
  };

  // 处理地点选择
  const handleLocationChange = (e) => {
    const { value, checked } = e.target;
    if (checked) {
      setSelectedLocation([...selectedLocation, value]);
    } else {
      setSelectedLocation(selectedLocation.filter(loc => loc !== value));
    }
  };

  // 处理时长选择
  const handleDurationChange = (e) => {
    const { value, checked } = e.target;
    if (checked) {
      setSelectedDuration([...selectedDuration, value]);
    } else {
      setSelectedDuration(selectedDuration.filter(duration => duration !== value));
    }
  };

  // 处理价格范围选择
  const handlePriceRangeChange = (e) => {
    const { value, checked } = e.target;
    if (checked) {
      setSelectedPriceRange([...selectedPriceRange, value]);
    } else {
      setSelectedPriceRange(selectedPriceRange.filter(range => range !== value));
    }
  };

  // 处理评分选择
  const handleRatingChange = (e) => {
    const { value, checked } = e.target;
    const ratingValue = Number(value);
    if (checked) {
      setSelectedRatings([...selectedRatings, ratingValue]);
    } else {
      setSelectedRatings(selectedRatings.filter(rating => rating !== ratingValue));
    }
  };

  // 处理主题选择
  const handleThemeChange = (e) => {
    const { value, checked } = e.target;
    if (checked) {
      setSelectedThemes([...selectedThemes, value]);
    } else {
      setSelectedThemes(selectedThemes.filter(theme => theme !== value));
    }
  };

  // 处理适合人群选择
  const handleSuitableForChange = (e) => {
    const { value, checked } = e.target;
    if (checked) {
      setSelectedSuitableFor([...selectedSuitableFor, value]);
    } else {
      setSelectedSuitableFor(selectedSuitableFor.filter(suitable => suitable !== value));
    }
  };

  // 应用筛选 - 修改为使用单个旅游类型
  const applyFilters = () => {
    const params = new URLSearchParams();
    
    // 保留原有的查询参数
    const startDate = queryParams.get('startDate');
    const endDate = queryParams.get('endDate');
    const adults = queryParams.get('adults');
    const children = queryParams.get('children');
    
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (adults) params.append('adults', adults);
    if (children) params.append('children', children);
    
    // 添加筛选参数 - 修改旅游类型为单选
    if (selectedTourType) params.append('tourTypes', selectedTourType);
    if (selectedLocation.length > 0) params.append('location', selectedLocation.join(','));
    if (selectedDuration.length > 0) params.append('duration', selectedDuration.join(','));
    if (selectedPriceRange.length > 0) params.append('priceRange', selectedPriceRange.join(','));
    if (selectedRatings.length > 0) params.append('ratings', selectedRatings.join(','));
    if (selectedThemes.length > 0) params.append('themes', selectedThemes.join(','));
    if (selectedSuitableFor.length > 0) params.append('suitableFor', selectedSuitableFor.join(','));
    
    // 更新URL
    navigate({ search: params.toString() });
    
    // 调用父组件的回调函数
    if (onApplyFilters) {
      onApplyFilters();
    }
  };

  // 清除所有筛选 - 修改为清除单个旅游类型
  const clearFilters = () => {
    setSelectedTourType('');
    setSelectedLocation([]);
    setSelectedDuration([]);
    setSelectedPriceRange([]);
    setSelectedRatings([]);
    setSelectedThemes([]);
    setSelectedSuitableFor([]);
    
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
    
    // 更新URL
    navigate({ search: params.toString() });
    
    // 调用父组件的回调函数
    if (onApplyFilters) {
      onApplyFilters();
    }
  };

  // 当筛选条件变化时自动应用筛选
  useEffect(() => {
    applyFilters();
  }, [selectedTourType, selectedLocation, selectedDuration, selectedPriceRange, selectedRatings, selectedThemes, selectedSuitableFor]);

  // 根据选择的旅游类型获取对应的主题选项
  const getThemeOptions = () => {
    if (selectedTourType === '一日游') {
      return DayTourThemes;
    } else if (selectedTourType === '跟团游') {
      return GroupTourThemes;
    }
    return [];
  };

  // 根据选择的旅游类型获取对应的时长选项
  const getDurationOptions = () => {
    if (selectedTourType === '一日游') {
      return DayTourDuration;
    } else if (selectedTourType === '跟团游') {
      return GroupTourDuration;
    }
    return [];
  };

  return (
    <div className="filter_box">
      <h5 className="mb-4">筛选条件</h5>
      
      {/* 旅游类型选择 - 修改为单选样式 */}
      <div className="mb-4">
        <h6 className="mb-3">选择行程类型</h6>
        <div className="tour-type-selection">
          {TourTypes.map((type, index) => (
            <Button
              key={index}
              variant={selectedTourType === type ? "primary" : "outline-primary"}
              onClick={() => handleTourTypeChange(type)}
              className="mb-2 me-2"
            >
              {type}
            </Button>
          ))}
        </div>
      </div>
      
      {selectedTourType && (
        <Accordion defaultActiveKey={['0', '1', '2', '3', '4', '5']} alwaysOpen>
          {/* 地点筛选 - 只在一日游时显示 */}
          {selectedTourType === '一日游' && (
            <Accordion.Item eventKey="0">
              <Accordion.Header>地点</Accordion.Header>
              <Accordion.Body>
                <Form>
                  {locationData.map((loc, index) => (
                    <Form.Check
                      key={index}
                      type="checkbox"
                      id={`location-${index}`}
                      label={loc}
                      value={loc}
                      checked={selectedLocation.includes(loc)}
                      onChange={handleLocationChange}
                      className="mb-2"
                    />
                  ))}
                </Form>
              </Accordion.Body>
            </Accordion.Item>
          )}
          
          {/* 价格范围 */}
          <Accordion.Item eventKey="1">
            <Accordion.Header>价格范围</Accordion.Header>
            <Accordion.Body>
              <Form>
                {PriceRange.map((range, index) => (
                  <Form.Check
                    key={index}
                    type="checkbox"
                    id={`price-${index}`}
                    label={`¥${range}`}
                    value={range}
                    checked={selectedPriceRange.includes(range)}
                    onChange={handlePriceRangeChange}
                    className="mb-2"
                  />
                ))}
              </Form>
            </Accordion.Body>
          </Accordion.Item>
          
          {/* 时长筛选 - 根据旅游类型显示不同选项 */}
          <Accordion.Item eventKey="2">
            <Accordion.Header>时长</Accordion.Header>
            <Accordion.Body>
              <Form>
                {getDurationOptions().map((duration, index) => (
                  <Form.Check
                    key={index}
                    type="checkbox"
                    id={`duration-${index}`}
                    label={duration}
                    value={duration}
                    checked={selectedDuration.includes(duration)}
                    onChange={handleDurationChange}
                    className="mb-2"
                  />
                ))}
              </Form>
            </Accordion.Body>
          </Accordion.Item>
          
          {/* 旅行主题 - 根据旅游类型显示不同选项 */}
          <Accordion.Item eventKey="3">
            <Accordion.Header>旅行主题</Accordion.Header>
            <Accordion.Body>
              <Form>
                {getThemeOptions().map((theme, index) => (
                  <Form.Check
                    key={index}
                    type="checkbox"
                    id={`theme-${index}`}
                    label={theme}
                    value={theme}
                    checked={selectedThemes.includes(theme)}
                    onChange={handleThemeChange}
                    className="mb-2"
                  />
                ))}
              </Form>
            </Accordion.Body>
          </Accordion.Item>
          
          {/* 适合人群 */}
          <Accordion.Item eventKey="4">
            <Accordion.Header>适合人群</Accordion.Header>
            <Accordion.Body>
              <Form>
                {SuitableFor.map((suitable, index) => (
                  <Form.Check
                    key={index}
                    type="checkbox"
                    id={`suitable-${index}`}
                    label={suitable}
                    value={suitable}
                    checked={selectedSuitableFor.includes(suitable)}
                    onChange={handleSuitableForChange}
                    className="mb-2"
                  />
                ))}
              </Form>
            </Accordion.Body>
          </Accordion.Item>
          
          {/* 评分 */}
          <Accordion.Item eventKey="5">
            <Accordion.Header>评分</Accordion.Header>
            <Accordion.Body>
              <Form>
                <Form.Check
                  type="checkbox"
                  id="rating-5"
                  label="5星"
                  value="5"
                  checked={selectedRatings.includes(5)}
                  onChange={handleRatingChange}
                  className="mb-2"
                />
                <Form.Check
                  type="checkbox"
                  id="rating-4"
                  label="4星及以上"
                  value="4"
                  checked={selectedRatings.includes(4)}
                  onChange={handleRatingChange}
                  className="mb-2"
                />
                <Form.Check
                  type="checkbox"
                  id="rating-3"
                  label="3星及以上"
                  value="3"
                  checked={selectedRatings.includes(3)}
                  onChange={handleRatingChange}
                  className="mb-2"
                />
              </Form>
            </Accordion.Body>
          </Accordion.Item>
        </Accordion>
      )}
      
      <div className="d-flex justify-content-between mt-4">
        <Button variant="outline-secondary" size="sm" onClick={clearFilters}>
          清除所有筛选
        </Button>
      </div>
    </div>
  );
};

export default Filters;
