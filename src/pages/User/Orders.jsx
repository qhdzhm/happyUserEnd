import React, { useState, useEffect } from 'react';
import { Container, Table, Badge, Button, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isAuthenticated } = useSelector(state => state.auth);
  
  useEffect(() => {
    if (isAuthenticated) {
      // 模拟加载订单数据
      setTimeout(() => {
        setOrders([
          {
            id: 'ORD-001',
            date: '2023-06-15',
            total: 899,
            status: 'completed',
            items: [
              { name: '霍巴特一日游', price: 899, quantity: 1 }
            ]
          },
          {
            id: 'ORD-002',
            date: '2023-07-20',
            total: 2499,
            status: 'confirmed',
            items: [
              { name: '塔斯马尼亚环岛三日游', price: 2499, quantity: 1 }
            ]
          }
        ]);
        setLoading(false);
      }, 1000);
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);
  
  // 获取状态徽章样式
  const getStatusBadge = (status) => {
    switch(status) {
      case 'completed':
        return <Badge bg="success">已完成</Badge>;
      case 'confirmed':
        return <Badge bg="primary">已确认</Badge>;
      case 'pending':
        return <Badge bg="warning">待付款</Badge>;
      case 'cancelled':
        return <Badge bg="danger">已取消</Badge>;
      default:
        return <Badge bg="secondary">{status}</Badge>;
    }
  };
  
  if (!isAuthenticated) {
    return (
      <Container className="py-5">
        <Alert variant="warning">
          请先登录查看订单
        </Alert>
      </Container>
    );
  }
  
  if (loading) {
    return (
      <Container className="py-5 text-center">
        <p>加载中...</p>
      </Container>
    );
  }
  
  if (error) {
    return (
      <Container className="py-5">
        <Alert variant="danger">
          加载订单失败: {error}
        </Alert>
      </Container>
    );
  }
  
  return (
    <Container className="py-5">
      <h2 className="mb-4">我的订单</h2>
      
      {orders.length === 0 ? (
        <Alert variant="info">
          您还没有任何订单，<Link to="/tours">去看看旅游项目</Link>
        </Alert>
      ) : (
        <Table responsive striped bordered hover>
          <thead>
            <tr>
              <th>订单号</th>
              <th>日期</th>
              <th>金额</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <tr key={order.id}>
                <td>{order.id}</td>
                <td>{order.date}</td>
                <td>¥{order.total.toFixed(2)}</td>
                <td>{getStatusBadge(order.status)}</td>
                <td>
                  <Button 
                    variant="outline-primary" 
                    size="sm" 
                    className="me-2"
                  >
                    查看详情
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </Container>
  );
};

export default Orders; 