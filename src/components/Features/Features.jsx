import React from "react";
import "../Features/features.css";

import feature1 from "../../assets/images/feature/beach-umbrella.png";
import feature2 from "../../assets/images/feature/deal.png";
import feature3 from "../../assets/images/feature/location.png";
import feature4 from "../../assets/images/feature/medal.png";
import { Card, Col, Container, Row } from "react-bootstrap";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";


const Features = () => {
  var settings = {
    dots: false,
    infinite: true,
    autoplay: false,
    autoplaySpeed: 1500,
    slidesToShow: 4,
    slidesToScroll: 1,
    centerPadding: "10px",
    centerMode: false,
    
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 4,
          slidesToScroll: 1,
          infinite: false,
          dots: true,
        },
      },
      {
        breakpoint: 991,
        settings: {
          slidesToShow: 3,
          slidesToScroll: 3,
          infinite: false,
          dots: true,
        },
      },
      {
        breakpoint: 600,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 2,
          autoplay: true,
          prevArrow: false,
          nextArrow: false,
        },
      },
      {
        breakpoint: 480,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
          prevArrow: false,
          nextArrow: false,
        },
      },
    ],
  };

  const featureList = [
    {
      id: 0,
      image: feature1,
      title: "探索无限可能",
      des: "拥有近50万个景点、酒店等资源，我们确保您能找到心仪的旅行体验。",
    },
    {
      id: 1,
      image: feature2,
      title: "享受优惠与惊喜",
      des: "高品质活动，优惠价格。此外，还可以获得积分以节省更多费用。",
    },
    {
      id: 2,
      image: feature3,
      title: "轻松探索之旅",
      des: "可以预订临时行程，跳过排队，并获得免费取消服务，让探索更加轻松。",
    },

    {
      id: 3,
      image: feature4,
      title: "值得信赖的旅行",
      des: "阅读评论并获得可靠的客户支持。我们将在每一步陪伴您。",
    },
  ];

  return (
    <>
    
      <section className="feature-section">
        <Container>
          <Row>
            <Col md="12">
              <Slider {...settings}>
                {featureList.map((feature, inx) => {
                  return (
                    <Card key={inx}>
                      <Card.Img
                        variant="top"
                        src={feature.image}
                        className="img-fluid"
                        alt={feature.title}
                      />
                      <Card.Title>{feature.title}</Card.Title>
                      <Card.Text>{feature.des}</Card.Text>
                    </Card>
                  );
                })}
              </Slider>
            </Col>
          </Row>
        </Container>
      </section>
    </>
  );
};

export default Features;
