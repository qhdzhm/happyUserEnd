import React, { useState, useEffect } from "react";
import "../Features/features.css";
import "../Features/feature-animations.css";
import "../Features/feature-title-fix.css";

// 导入新的SVG图标
import GuideIcon from "../../assets/images/feature/new/guide.svg"; 
import ItineraryIcon from "../../assets/images/feature/new/itinerary.svg"; 
import ComfortIcon from "../../assets/images/feature/new/comfort.svg"; 
import SupportIcon from "../../assets/images/feature/new/support.svg"; 

// 导入备用PNG图标（兼容性支持）
import GuideIconFallback from "../../assets/images/feature/location.png";
import ItineraryIconFallback from "../../assets/images/feature/beach-umbrella.png";
import ComfortIconFallback from "../../assets/images/feature/deal.png";
import SupportIconFallback from "../../assets/images/feature/medal.png";

import { Col, Container, Row } from "react-bootstrap";

const Features = () => {
  const [svgSupported, setSvgSupported] = useState(true);

  useEffect(() => {
    // 在客户端检测SVG支持
    const checkSvgSupport = () => {
      try {
        const SVG_NS = 'http://www.w3.org/2000/svg';
        return !!document.createElementNS && !!document.createElementNS(SVG_NS, 'svg').createSVGRect;
      } catch (e) {
        return false;
      }
    };
    
    setSvgSupported(checkSvgSupport());
  }, []);

  const featureList = [
    {
      id: 0,
      imageSvg: GuideIcon,
      imagePng: GuideIconFallback,
      title: "专业中文导游",
      des: "我们的导游深谙塔斯马尼亚的自然风光与人文历史，用流利的中文为您讲述每一处景点背后的故事。",
    },
    {
      id: 1,
      imageSvg: ItineraryIcon,
      imagePng: ItineraryIconFallback,
      title: "个性化行程定制",
      des: "从壮观的摇篮山到神秘的玛利亚岛，我们根据您的喜好打造专属塔州之旅，满足您对自然与探险的向往。",
    },
    {
      id: 2,
      imageSvg: ComfortIcon,
      imagePng: ComfortIconFallback,
      title: "舒适便捷出行",
      des: "配备高品质旅游车辆，提供酒店与机场间的无缝接送，让您在塔州的每一程都轻松舒适。",
    },
    {
      id: 3,
      imageSvg: SupportIcon,
      imagePng: SupportIconFallback,
      title: "全天候客户支持",
      des: "无论您身处塔州何地，我们的中文客服团队随时为您解答疑问，确保您的旅程顺畅无忧。",
    },
  ];

  return (
    <section className="features-section">
      <Container>
        <Row className="mb-4">
          <Col className="text-center">
            <h2 className="section-title">塔斯马尼亚尊享体验</h2>
            <p className="section-subtitle">与众不同的服务，专为热爱自然与探索的您定制</p>
          </Col>
        </Row>
        <Row className="g-4">
          {featureList.map((feature, inx) => (
            <Col lg={3} md={6} sm={6} xs={12} key={inx}>
              <div className="feature-item">
                <div className="feature-icon">
                  <img
                    src={svgSupported ? feature.imageSvg : feature.imagePng}
                    alt={feature.title}
                  />
                </div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-text">{feature.des}</p>
              </div>
            </Col>
          ))}
        </Row>
      </Container>
    </section>
  );
};

export default Features;
