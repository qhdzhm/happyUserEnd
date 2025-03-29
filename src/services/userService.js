import request from '../utils/request';

/**
 * 用户服务 - 处理与用户相关的API请求
 */

/**
 * 用户登录
 * @param {Object} data - 登录数据
 * @returns {Promise} - 请求Promise
 */
export const login = (data) => {
  return request.post('/api/auth/login', data);
};

/**
 * 用户注册
 * @param {Object} data - 注册数据
 * @returns {Promise} - 请求Promise
 */
export const register = (data) => {
  return request.post('/api/auth/register', data);
};

/**
 * 获取用户信息
 * @returns {Promise} - 请求Promise
 */
export const getUserInfo = () => {
  // 使用缓存，缓存时间为10分钟
  return request.get('/api/users/profile', {}, { 
    useCache: true, 
    cacheTime: 10 * 60 * 1000 
  });
};

/**
 * 更新用户信息
 * @param {Object} data - 用户数据
 * @returns {Promise} - 请求Promise
 */
export const updateUserInfo = (data) => {
  // 更新用户信息后清除缓存
  const response = request.put('/api/users/profile', data);
  request.clearCache('/api/users/profile');
  return response;
};

/**
 * 更新用户密码
 * @param {Object} data - 密码数据
 * @returns {Promise} - 请求Promise
 */
export const updatePassword = (data) => {
  return request.put('/api/users/password', data);
};

/**
 * 获取用户订单列表
 * @param {Object} params - 查询参数
 * @returns {Promise} - 请求Promise
 */
export const getUserOrders = (params = {}) => {
  // 使用缓存，缓存时间为5分钟
  return request.get('/api/users/orders', params, { 
    useCache: true, 
    cacheTime: 5 * 60 * 1000 
  });
};

/**
 * 获取用户订单详情
 * @param {string} orderId - 订单ID
 * @returns {Promise} - 请求Promise
 */
export const getUserOrderDetail = (orderId) => {
  // 使用缓存，缓存时间为5分钟
  return request.get(`/api/users/orders/${orderId}`, {}, { 
    useCache: true, 
    cacheTime: 5 * 60 * 1000 
  });
};

/**
 * 获取用户收藏列表
 * @returns {Promise} - 请求Promise
 */
export const getUserFavorites = () => {
  // 使用缓存，缓存时间为5分钟
  return request.get('/api/users/favorites', {}, { 
    useCache: true, 
    cacheTime: 5 * 60 * 1000 
  });
};

/**
 * 添加收藏
 * @param {string} tourId - 旅游产品ID
 * @returns {Promise} - 请求Promise
 */
export const addFavorite = (tourId) => {
  // 添加收藏后清除缓存
  const response = request.post('/api/users/favorites', { tourId });
  request.clearCache('/api/users/favorites');
  return response;
};

/**
 * 删除收藏
 * @param {string} tourId - 旅游产品ID
 * @returns {Promise} - 请求Promise
 */
export const removeFavorite = (tourId) => {
  // 删除收藏后清除缓存
  const response = request.delete(`/api/users/favorites/${tourId}`);
  request.clearCache('/api/users/favorites');
  return response;
};

export default {
  login,
  register,
  getUserInfo,
  updateUserInfo,
  updatePassword,
  getUserOrders,
  getUserOrderDetail,
  getUserFavorites,
  addFavorite,
  removeFavorite
}; 