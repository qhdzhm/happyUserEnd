import React from 'react';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import { useSelector } from 'react-redux';

const Profile = () => {
  const { user, isAuthenticated } = useSelector(state => state.auth);
  
  if (!isAuthenticated) {
    return (
      <Container className="py-5">
        <Alert variant="warning">
          请先登录查看个人资料
        </Alert>
      </Container>
    );
  }
  
  return (
    <Container className="py-5">
      <h2 className="mb-4">个人资料</h2>
      <Row>
        <Col md={4}>
          <Card className="mb-4">
            <Card.Body>
              <div className="text-center mb-3">
                <img 
                  src="/images/avatar-placeholder.jpg" 
                  alt="用户头像" 
                  className="rounded-circle img-thumbnail"
                  style={{ width: '150px', height: '150px' }}
                />
              </div>
              <h4 className="text-center">{user?.name || '用户'}</h4>
              <p className="text-center text-muted">{user?.email || ''}</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={8}>
          <Card>
            <Card.Body>
              <h4 className="mb-4">个人信息</h4>
              <Form>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>姓名</Form.Label>
                      <Form.Control 
                        type="text" 
                        placeholder="请输入姓名"
                        defaultValue={user?.name || ''}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>电子邮箱</Form.Label>
                      <Form.Control 
                        type="email" 
                        placeholder="请输入电子邮箱"
                        defaultValue={user?.email || ''}
                        readOnly
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>手机号码</Form.Label>
                      <Form.Control 
                        type="tel" 
                        placeholder="请输入手机号码"
                        defaultValue={user?.phone || ''}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>用户类型</Form.Label>
                      <Form.Control 
                        type="text" 
                        value={user?.role === 'agent' ? '代理商' : '普通用户'}
                        readOnly
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Button variant="primary" type="submit">
                  保存修改
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Profile; 