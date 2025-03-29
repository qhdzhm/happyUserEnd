import React from 'react';
import { Container, Row, Col, Card, Form, Button, ListGroup, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';

const Checkout = () => {
  // 获取认证状态
  const { isAuthenticated } = useSelector(state => state.auth);
  
  // 模拟订单数据
  const orderItems = [
    {
      id: 1,
      name: '霍巴特一日游',
      price: 899,
      quantity: 2,
      date: '2023-10-15'
    },
    {
      id: 2,
      name: '塔斯马尼亚环岛三日游',
      price: 2499,
      quantity: 1,
      date: '2023-11-20'
    }
  ];
  
  // 计算总价
  const orderTotal = orderItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  
  // 如果用户未登录，显示提示信息
  if (!isAuthenticated) {
    return (
      <Container className="py-5">
        <Alert variant="warning">
          请先<Link to="/login">登录</Link>进行结算
        </Alert>
      </Container>
    );
  }
  
  // 如果购物车为空，显示提示信息
  if (orderItems.length === 0) {
    return (
      <Container className="py-5">
        <Alert variant="info">
          您的购物车是空的，<Link to="/tours">去看看旅游项目</Link>
        </Alert>
      </Container>
    );
  }
  
  return (
    <Container className="py-5">
      <h2 className="mb-4">结算</h2>
      <Row>
        <Col lg={8}>
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">联系信息</h5>
            </Card.Header>
            <Card.Body>
              <Form>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>姓名</Form.Label>
                      <Form.Control type="text" placeholder="请输入姓名" />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>电子邮箱</Form.Label>
                      <Form.Control type="email" placeholder="请输入电子邮箱" />
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>电话</Form.Label>
                      <Form.Control type="tel" placeholder="请输入电话号码" />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>紧急联系人电话</Form.Label>
                      <Form.Control type="tel" placeholder="请输入紧急联系人电话" />
                    </Form.Group>
                  </Col>
                </Row>
              </Form>
            </Card.Body>
          </Card>
          
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">旅客信息</h5>
            </Card.Header>
            <Card.Body>
              <Form>
                {orderItems.map((item, index) => (
                  <div key={item.id} className="mb-4">
                    <h6>{item.name} - 旅客 {index + 1}</h6>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>姓名</Form.Label>
                          <Form.Control type="text" placeholder="请输入旅客姓名" />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>证件类型</Form.Label>
                          <Form.Select>
                            <option>护照</option>
                            <option>身份证</option>
                            <option>驾照</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                    </Row>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>证件号码</Form.Label>
                          <Form.Control type="text" placeholder="请输入证件号码" />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>年龄</Form.Label>
                          <Form.Control type="number" placeholder="请输入年龄" />
                        </Form.Group>
                      </Col>
                    </Row>
                  </div>
                ))}
              </Form>
            </Card.Body>
          </Card>
          
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">支付方式</h5>
            </Card.Header>
            <Card.Body>
              <Form>
                <Form.Group className="mb-3">
                  <Form.Check 
                    type="radio" 
                    label="支付宝" 
                    name="paymentMethod" 
                    id="alipay"
                    defaultChecked
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Check 
                    type="radio" 
                    label="微信支付" 
                    name="paymentMethod" 
                    id="wechat" 
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Check 
                    type="radio" 
                    label="信用卡" 
                    name="paymentMethod" 
                    id="creditCard" 
                  />
                </Form.Group>
              </Form>
            </Card.Body>
          </Card>
        </Col>
        
        <Col lg={4}>
          <Card className="position-sticky" style={{ top: '2rem' }}>
            <Card.Header>
              <h5 className="mb-0">订单汇总</h5>
            </Card.Header>
            <Card.Body>
              <ListGroup variant="flush">
                {orderItems.map(item => (
                  <ListGroup.Item key={item.id} className="px-0">
                    <div className="d-flex justify-content-between">
                      <div>
                        <h6 className="mb-0">{item.name}</h6>
                        <small className="text-muted">
                          {item.date} x {item.quantity}
                        </small>
                      </div>
                      <span>¥{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  </ListGroup.Item>
                ))}
                <ListGroup.Item className="px-0">
                  <div className="d-flex justify-content-between">
                    <span>小计</span>
                    <span>¥{orderTotal.toFixed(2)}</span>
                  </div>
                </ListGroup.Item>
                <ListGroup.Item className="px-0">
                  <div className="d-flex justify-content-between">
                    <span>服务费</span>
                    <span>¥0.00</span>
                  </div>
                </ListGroup.Item>
                <ListGroup.Item className="px-0">
                  <div className="d-flex justify-content-between">
                    <span>折扣</span>
                    <span>-¥0.00</span>
                  </div>
                </ListGroup.Item>
                <ListGroup.Item className="px-0">
                  <div className="d-flex justify-content-between fw-bold">
                    <span>总计</span>
                    <span>¥{orderTotal.toFixed(2)}</span>
                  </div>
                </ListGroup.Item>
              </ListGroup>
              
              <div className="mt-4">
                <Button variant="primary" size="lg" className="w-100">
                  确认支付
                </Button>
                <div className="text-center mt-2">
                  <Link to="/cart" className="btn btn-link">
                    返回购物车
                  </Link>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Checkout; 