import React from "react";
import "./PriceDisplay.css";

/**
 * 价格显示组件
 * 负责根据原价和折扣价进行展示
 * @param {Object} props - 组件属性
 * @param {number|string} props.originalPrice - 原价
 * @param {number|string} props.discountedPrice - 折扣价（可选）
 * @returns {JSX.Element} - 价格显示组件
 */
const PriceDisplay = ({
  originalPrice,
  discountedPrice
}) => {
  // 安全地获取原价（确保是数字）
  const safeOriginalPrice = () => {
    if (originalPrice === null || originalPrice === undefined) return 0;
    return typeof originalPrice === 'number' ? originalPrice : parseFloat(originalPrice || 0);
  };
  
  // 安全地获取折扣价（确保是数字）
  const safeDiscountedPrice = () => {
    if (discountedPrice === null || discountedPrice === undefined) return safeOriginalPrice();
    return typeof discountedPrice === 'number' ? discountedPrice : parseFloat(discountedPrice || 0);
  };
  
  // 判断折扣价是否有效
  const hasValidDiscount = () => {
    // 如果没有折扣价，则无折扣
    if (discountedPrice === null || discountedPrice === undefined) {
      return false;
    }
    
    const original = safeOriginalPrice();
    const discounted = safeDiscountedPrice();
    
    // 只有折扣价小于原价并且两者都大于0时才视为有效折扣
    return discounted < original && discounted > 0 && original > 0;
  };
  
  // 显示价格
  const displayOriginalPrice = safeOriginalPrice().toFixed(2);
  const displayDiscountedPrice = safeDiscountedPrice().toFixed(2);
  
  // 简化的价格展示
  return (
    <div className="price-display">
      {hasValidDiscount() ? (
        <>
          <span className="discounted-price">${displayDiscountedPrice}</span>
          <span className="original-price">${displayOriginalPrice}</span>
        </>
      ) : (
        <span className="regular-price">${displayOriginalPrice}</span>
      )}
    </div>
  );
};

export default PriceDisplay;