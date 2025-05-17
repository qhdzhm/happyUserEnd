import React from 'react';
import { Badge } from 'react-bootstrap';
import { FaHotel, FaBed, FaTicketAlt } from 'react-icons/fa';
import './PriceDisplay.css';

/**
 * 价格显示组件
 * @param {Number} originalPrice - 非代理价格/原始价格
 * @param {Number} discountedPrice - 当前价格或折扣价格
 * @param {Boolean} showBadge - 是否显示折扣标签 (默认: false)
 * @param {String} currency - 货币符号 (默认: "$")
 * @param {String} size - 尺寸 "small", "medium", "large" (默认: "medium")
 * @param {Number} hotelPriceDifference - 每晚酒店价格差异 (可选)
 * @param {Number} hotelNights - 酒店晚数 (可选)
 * @param {String} baseHotelLevel - 基准酒店等级 (可选，默认: "4星")
 * @param {Number} dailySingleRoomSupplement - 每晚单房差 (可选)
 * @param {Number} roomCount - 房间数量 (可选)
 * @param {Number} extraRoomFee - 额外房间费用 (可选)
 * @param {Boolean} isAgent - 是否为代理商 (默认: false)
 * @returns {JSX.Element}
 */
const PriceDisplay = ({ 
  originalPrice, 
  discountedPrice, 
  showBadge = false, 
  currency = "$", 
  size = "medium",
  hotelPriceDifference,
  hotelNights,
  baseHotelLevel = "4星",
  dailySingleRoomSupplement,
  roomCount = 1,
  extraRoomFee = 0,
  isAgent = false
}) => {
  // 确保有价格可显示
  if (!originalPrice && !discountedPrice) return null;
  
  // 确定是否显示折扣价（原价和现价不同时显示）
  // 对于代理商，我们总是显示两个价格，即使它们相同
  const shouldShowDiscount = isAgent ? !!originalPrice : (originalPrice && discountedPrice && originalPrice !== discountedPrice);
  
  // 计算折扣率
  const discountRate = shouldShowDiscount && originalPrice && discountedPrice ? 
    Math.round((1 - discountedPrice / originalPrice) * 100) : 0;
  
  // 确定尺寸类
  const sizeClass = size === "small" ? "price-display-sm" : 
                    size === "large" ? "price-display-lg" : 
                    "price-display-md";
  
  // 现价 - 优先显示折扣价，否则显示原价
  const displayPrice = discountedPrice || originalPrice;
  
  return (
    <div className={`price-display ${sizeClass}`}>
      {/* 显示原价 - 对代理商总是显示，对普通用户仅在有折扣时显示 */}
      {shouldShowDiscount && (
        <div className="original-price text-muted">
          <s>{currency}{originalPrice.toFixed(2)}</s>
        </div>
      )}
      
      {/* 显示现价 */}
      <div className="current-price">
        <span className="price-value">
          {currency}{displayPrice.toFixed(2)}
        </span>
        
        {/* 显示折扣标签 - 仅在有折扣且价格不同时显示 */}
        {showBadge && discountRate > 0 && (
          <Badge bg="danger" className="ms-2 discount-badge">
            {discountRate}% OFF
          </Badge>
        )}
      </div>
      
      
      
      
      {/* 显示额外房间费用 */}
      {extraRoomFee !== undefined && extraRoomFee > 0 && (
        <div className="hotel-diff-info mt-1 small text-success">
          <FaHotel className="me-1" /> 
          房间差价: {currency}{extraRoomFee.toFixed(2)}
        </div>
      )}
    </div>
  );
};

export default PriceDisplay;