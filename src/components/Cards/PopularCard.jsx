import React from "react";
import { Link } from "react-router-dom";
import { Card } from "react-bootstrap";
import { FaStar, FaMapMarkerAlt, FaClock, FaUsers, FaRegCalendarAlt } from "react-icons/fa";
import "../../pages/Home/home.css";

const PopularCard = ({ val, viewMode = "grid" }) => {
  // 处理评分显示
  const renderRating = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<FaStar key={i} className="text-warning" />);
    }

    if (hasHalfStar) {
      stars.push(<FaStar key="half" className="text-warning half-star" />);
    }

    return stars;
  };

  // 格式化价格显示
  const formatPrice = (price) => {
    return parseFloat(price).toLocaleString("en-US", {
      style: "currency",
      currency: "AUD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  // 确保图片路径正确
  const getImageSrc = () => {
    // 如果已经有完整的图片路径，直接使用
    if (val.img && (val.img.startsWith('http') || val.img.startsWith('/'))) {
      return val.img;
    }
    
    // 如果有image属性，优先使用
    if (val.image) {
      return val.image;
    }
    
    // 如果都没有，使用默认图片
    return "https://via.placeholder.com/300x200?text=No+Image";
  };

  // 列表视图渲染
  if (viewMode === "list") {
    return (
      <div className="list-view-card">
        <div className="list-view-image">
          <img src={getImageSrc()} alt={val.title} />
          {val.tourTypeBadge && (
            <span className="tour-type-badge position-absolute" 
              style={{ 
                backgroundColor: val.tourTypeBadge === "一日游" ? "#28a745" : "#007bff",
                color: "white"
              }}
            >
              {val.tourTypeBadge}
            </span>
          )}
        </div>
        <div className="list-view-content d-flex flex-column">
          <h3 className="list-view-title">{val.title}</h3>
          
          <div className="list-view-details">
            <div className="list-view-detail">
              <FaMapMarkerAlt />
              <span>{val.location}</span>
            </div>
            <div className="list-view-detail">
              <FaClock />
              <span>{val.duration}</span>
            </div>
            <div className="list-view-detail">
              <FaRegCalendarAlt />
              <span>{val.availability || "全年开放"}</span>
            </div>
            <div className="list-view-detail">
              <FaUsers />
              <span>{val.groupSize || "小团出行"}</span>
            </div>
            <div className="list-view-detail">
              <div className="d-flex align-items-center">
                {renderRating(val.rating)}
                <span className="ms-1">({val.rating})</span>
              </div>
            </div>
          </div>
          
          <p className="list-view-description">{val.description}</p>
          
          <div className="list-view-footer mt-auto">
            <div className="list-view-price">
              {val.discount && (
                <span className="text-decoration-line-through text-muted me-2" style={{ fontSize: "0.9rem" }}>
                  {formatPrice(val.price)}
                </span>
              )}
              <span>{formatPrice(val.afterDiscount || val.price)}</span>
            </div>
            <Link to={`/tour-details/${val.id}`} className="btn btn-primary list-view-btn">
              查看详情
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 网格视图渲染（原有样式）
  return (
    <Card className="featured-tour-card h-100">
      <div className="featured-image">
        <img src={getImageSrc()} alt={val.title} />
        <div className="tour-days">
          <FaClock className="me-1" />
          {val.duration}
        </div>
        {val.tourTypeBadge && (
          <span className="tour-type-badge" 
            style={{ 
              backgroundColor: val.tourTypeBadge === "一日游" ? "#28a745" : "#007bff",
              color: "white"
            }}
          >
            {val.tourTypeBadge}
          </span>
        )}
      </div>
      <Card.Body className="d-flex flex-column">
        <Card.Title className="mb-2">{val.title}</Card.Title>
        <div className="tour-rating mb-2">
          {renderRating(val.rating)}
          <span className="ms-1">({val.rating})</span>
        </div>
        <div className="tour-locations">
          <FaMapMarkerAlt className="me-1" />
          <span>{val.location}</span>
        </div>
        <div className="d-flex justify-content-between align-items-center mt-auto pt-3">
          <div className="tour-price">
            {val.discount && (
              <span className="text-decoration-line-through text-muted" style={{ fontSize: "0.9rem" }}>
                {formatPrice(val.price)}
              </span>
            )}
            <span className="fw-bold" style={{ color: "var(--primaryClr)", fontSize: "1.1rem" }}>
              {formatPrice(val.afterDiscount || val.price)}
            </span>
          </div>
          <Link to={`/tour-details/${val.id}`} className="btn btn-sm btn-primary">
            查看详情
          </Link>
        </div>
      </Card.Body>
    </Card>
  );
};

export default PopularCard;