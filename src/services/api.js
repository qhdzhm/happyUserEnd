import axios from 'axios';
import { withErrorHandling, parseApiResponse } from '../utils/apiErrorHandler';

// API 基础URL，从环境变量或配置中获取
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

// 创建axios实例
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器
apiClient.interceptors.request.use(config => {
  // 从localStorage获取token
  const token = localStorage.getItem('token');
  const userType = localStorage.getItem('userType');
  
  // 记录详细的请求信息，帮助调试
  console.log(`API请求: ${config.url}，用户类型: ${userType || 'regular'}`);
  
  // 添加授权头（如果有token）
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
}, error => {
  console.error('请求配置错误:', error);
  return Promise.reject(error);
});

// 响应拦截器
apiClient.interceptors.response.use(response => {
  return response.data;
}, error => {
  console.error('API响应错误:', error);
  return Promise.reject(error);
});

/**
 * 计算代理商折扣价格
 * @param {Object} params - 参数对象
 * @param {number} params.originalPrice - 原价
 * @param {string} params.agentId - 代理商ID
 * @returns {Promise<Object>} - 含折扣信息的对象
 */
export const calculateDiscount = withErrorHandling(async (params) => {
  try {
    console.log('调用折扣计算API，参数:', params);
    
    // 检查是否提供了必要参数
    if (!params.originalPrice) {
      console.error('缺少原价参数');
      return { discountedPrice: params.originalPrice };
    }
    
    // 检查是否有代理商ID
    if (!params.agentId) {
      console.warn('未提供代理商ID，将使用原价');
      return { discountedPrice: params.originalPrice };
    }
    
    const response = await apiClient.post('/agent/calculate-discount', params);
    console.log('折扣计算API响应:', response);
    
    return parseApiResponse(response);
  } catch (error) {
    console.error('折扣计算失败:', error);
    // 出错时返回原价
    return { discountedPrice: params.originalPrice };
  }
}, '获取折扣价格失败');

/**
 * 计算代理商旅游产品折扣价格
 * @param {Object} params - 参数对象
 * @param {number} params.tourId - 旅游产品ID
 * @param {string} params.tourType - 旅游类型
 * @param {number} params.originalPrice - 原价
 * @param {string} params.agentId - 代理商ID
 * @returns {Promise<Object>} - 含折扣信息的对象
 */
export const calculateTourDiscount = withErrorHandling(async (params) => {
  try {
    console.log('调用旅游折扣计算API，参数:', params);
    
    // 参数验证
    if (!params.tourId || !params.tourType || !params.originalPrice) {
      console.error('缺少必要参数', params);
      return { 
        originalPrice: params.originalPrice, 
        discountedPrice: params.originalPrice,
        discountRate: 1,
        savings: 0
      };
    }
    
    // 检查是否有代理商ID
    if (!params.agentId) {
      console.warn('未提供代理商ID，将使用原价');
      return { 
        originalPrice: params.originalPrice, 
        discountedPrice: params.originalPrice,
        discountRate: 1,
        savings: 0
      };
    }
    
    const response = await apiClient.post('/agent/calculate-tour-discount', params);
    console.log('旅游折扣计算API响应:', response);
    
    const result = parseApiResponse(response);
    
    // 确保返回规范化的数据结构
    return {
      originalPrice: Number(params.originalPrice),
      discountedPrice: Number(result.discountedPrice || params.originalPrice),
      discountRate: Number(result.discountRate || 1),
      savings: Number(result.savings || 0)
    };
  } catch (error) {
    console.error('旅游折扣计算失败:', error);
    // 出错时返回原价
    return { 
      originalPrice: Number(params.originalPrice), 
      discountedPrice: Number(params.originalPrice),
      discountRate: 1,
      savings: 0
    };
  }
}, '获取旅游折扣价格失败');

/**
 * API服务接口
 */
export const apiService = {
  // 折扣计算相关
  calculateDiscount,
  calculateTourDiscount,
  
  // 通用请求方法
  get: (url, params = {}) => apiClient.get(url, { params }),
  post: (url, data = {}) => apiClient.post(url, data),
  put: (url, data = {}) => apiClient.put(url, data),
  delete: (url) => apiClient.delete(url),
  patch: (url, data = {}) => apiClient.patch(url, data)
};

// 导出默认对象，便于使用
export default apiService; 