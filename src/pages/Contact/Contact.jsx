import React,{useEffect} from "react";
import Breadcrumbs from "../../components/Breadcrumbs/Breadcrumbs";
import {
  Col,
  Container,
  Row,
  Card,
  ListGroup,
  Form,
  FloatingLabel,
  Button,
} from "react-bootstrap";
import image from "../../assets/images/new/contact-us.png";
import './Contact.css';

// 主题色
const themeColor = "#ff6b6b";
const themeColorLight = "#ffe8e8";

const Contact = () => {

  useEffect(()=>{
    document.title ="联系我们 | 快乐旅行"
    window.scroll(0, 0)
  },[])

  return (
    <>
      <Breadcrumbs title="联系我们" pagename="联系我们" />
      <section className="contact pt-5">
        <Container>
          <Row>
            <Col md="12">
              <h1 className="mb-2 h1 font-bold">
                让我们建立联系，了解彼此
              </h1>
              <p className="body-text mt-1">
                无论您有任何问题、建议或需要帮助，我们的团队都随时准备为您提供支持。请通过以下方式与我们联系，我们将尽快回复您。
              </p>
            </Col>
          </Row>
          <Row className="py-5">
            <Col lg="4" md="6" className="mb-4 mb-lg-0">
              <Card className="border-0 shadow rounded-3 mb-4">
                <Card.Body className="text-center">
                  <div className="d-flex justify-content-center align-item-search my-2">
                    <div style={{ backgroundColor: themeColorLight, color: themeColor }} className="rounded-circle shadow-sm p-3 mb-2">
                      <i className="bi bi-headset h3"></i>
                    </div>
                  </div>
                  <Card.Title className="fw-bold h5">电话咨询</Card.Title>
                  <p className="mb-3 body-text">
                    我们的客服团队随时为您提供专业的旅行咨询和预订服务，欢迎致电。
                  </p>
                  <div className="d-block justify-content-between">
                    <a type="button" className="btn btn-light me-2 btn-sm">
                      <i className="bi bi-phone me-1"></i>
                      400-123-4567
                    </a>
                    <a type="button" className="btn btn-light me-2 btn-sm">
                      <i className="bi bi-telephone me-1"></i>
                      021-87654321
                    </a>
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col lg="4" md="6" className="mb-4 mb-lg-0">
              <Card className="border-0 shadow rounded-3 mb-4">
                <Card.Body className="text-center">
                  <div className="d-flex justify-content-center align-item-search my-2">
                    <div style={{ backgroundColor: themeColorLight, color: themeColor }} className="rounded-circle shadow-sm p-3 mb-2">
                      <i className="bi bi-envelope h3"></i>
                    </div>
                  </div>
                  <Card.Title className="fw-bold h5">邮件咨询</Card.Title>
                  <p className="mb-3 body-text">
                    如果您有详细的咨询需求或建议，欢迎发送邮件，我们会在24小时内回复您。
                  </p>
                  <div className="d-block justify-content-between">
                    <a type="button" className="btn btn-light me-2 btn-sm">
                      <i className="bi bi-envelope me-2"></i>
                      service@happytravel.com
                    </a>
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col lg="4" md="12" className="mb-4 mb-lg-0">
              <Card className="border-0 shadow rounded-3 mb-4">
                <Card.Body className="text-center">
                  <div className="d-flex justify-content-center align-item-search my-2">
                    <div style={{ backgroundColor: themeColorLight, color: themeColor }} className="rounded-circle shadow-sm p-3 mb-2">
                      <i className="bi bi-globe h3"></i>
                    </div>
                  </div>
                  <Card.Title className="fw-bold h5">社交媒体</Card.Title>
                  <p className="mb-3 body-text">
                    关注我们的社交媒体账号，获取最新的旅游资讯、优惠活动和精彩内容。
                  </p>
                  <div className="d-block justify-content-center">
                    <ListGroup horizontal className="justify-content-center">
                      <ListGroup.Item className="border-0">
                        <i className="bi bi-wechat" style={{ color: themeColor }}></i>
                      </ListGroup.Item>
                      <ListGroup.Item className="border-0">
                        <i className="bi bi-instagram" style={{ color: themeColor }}></i>
                      </ListGroup.Item>
                      <ListGroup.Item className="border-0">
                        <i className="bi bi-weibo" style={{ color: themeColor }}></i>
                      </ListGroup.Item>
                      <ListGroup.Item className="border-0">
                        <i className="bi bi-youtube" style={{ color: themeColor }}></i>
                      </ListGroup.Item>
                    </ListGroup>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Row className="py-5 align-items-center">
            <Col xl="6" md="6" className="d-none d-md-block">
              <img src={image} alt="联系我们" className="img-fluid me-3" />
            </Col>
            <Col xl="6" md="6">
              <Card className="bg-light p-4 border-0 shadow-sm">
                <div className="form-box">
                  <h1 className="h3 font-bold mb-4">给我们留言</h1>
                  <Form>
                    <Row>
                      <Col md="6">
                        <FloatingLabel
                          controlId="name"
                          label="姓名"
                          className="mb-4"
                        >
                          <Form.Control type="text" placeholder="请输入您的姓名" />
                        </FloatingLabel>
                      </Col>
                      <Col md="6">
                        <FloatingLabel
                          controlId="email"
                          label="电子邮箱"
                          className="mb-4"
                        >
                          <Form.Control
                            type="email"
                            placeholder="name@example.com"
                          />
                        </FloatingLabel>
                      </Col>

                      <Col md="12">
                        <FloatingLabel
                          controlId="phone"
                          label="电话号码"
                          className="mb-4"
                        >
                          <Form.Control
                            type="text"
                            placeholder="请输入您的电话号码"
                          />
                        </FloatingLabel>
                      </Col>

                      <Col md="12">
                        <FloatingLabel controlId="message" label="留言内容">
                          <Form.Control
                            as="textarea"
                            placeholder="请输入您的留言内容"
                            style={{ height: "126px" }}
                          />
                        </FloatingLabel>
                      </Col>

                     
                    </Row>
                    <Button 
                      style={{ backgroundColor: themeColor, borderColor: themeColor }} 
                      className="mt-3" 
                      type="button"
                    >
                      发送留言
                    </Button>
                  </Form>
                </div>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>
    </>
  );
};

export default Contact;
