import request from '../utils/request';

/**
 * 预订服务 - 处理与预订相关的API请求
 */

/**
 * 创建预订
 * @param {Object} data - 预订数据
 * @returns {Promise} - 请求Promise
 */
export const createBooking = (data) => {
  return request.post('/api/bookings', data);
};

/**
 * 获取预订详情
 * @param {string} id - 预订ID
 * @returns {Promise} - 请求Promise
 */
export const getBookingById = (id) => {
  // 使用缓存，缓存时间为5分钟
  return request.get(`/api/bookings/${id}`, {}, { 
    useCache: true, 
    cacheTime: 5 * 60 * 1000 
  });
};

/**
 * 取消预订
 * @param {string} id - 预订ID
 * @returns {Promise} - 请求Promise
 */
export const cancelBooking = (id) => {
  // 取消预订后清除缓存
  const response = request.put(`/api/bookings/${id}/cancel`, {});
  request.clearCache(`/api/bookings/${id}`);
  request.clearCache('/api/users/orders');
  return response;
};

/**
 * 支付预订
 * @param {string} id - 预订ID
 * @param {Object} paymentData - 支付数据
 * @returns {Promise} - 请求Promise
 */
export const payBooking = (id, paymentData) => {
  // 支付预订后清除缓存
  const response = request.post(`/api/bookings/${id}/pay`, paymentData);
  request.clearCache(`/api/bookings/${id}`);
  request.clearCache('/api/users/orders');
  return response;
};

/**
 * 获取可用日期
 * @param {string} tourId - 旅游产品ID
 * @param {Object} params - 查询参数
 * @returns {Promise} - 请求Promise
 */
export const getAvailableDates = (tourId, params = {}) => {
  // 使用缓存，缓存时间为30分钟
  return request.get(`/api/tours/${tourId}/available-dates`, params, { 
    useCache: true, 
    cacheTime: 30 * 60 * 1000 
  });
};

/**
 * 检查日期可用性
 * @param {string} tourId - 旅游产品ID
 * @param {Object} params - 查询参数
 * @returns {Promise} - 请求Promise
 */
export const checkDateAvailability = (tourId, params) => {
  // 不使用缓存，确保获取最新数据
  return request.get(`/api/tours/${tourId}/check-availability`, params);
};

/**
 * 获取价格计算
 * @param {string} tourId - 旅游产品ID
 * @param {Object} params - 查询参数
 * @returns {Promise} - 请求Promise
 */
export const calculatePrice = (tourId, params) => {
  // 不使用缓存，确保获取最新数据
  return request.get(`/api/tours/${tourId}/calculate-price`, params);
};

export default {
  createBooking,
  getBookingById,
  cancelBooking,
  payBooking,
  getAvailableDates,
  checkDateAvailability,
  calculatePrice
}; 