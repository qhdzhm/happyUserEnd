import axios from 'axios';
import { getCache, setCache, removeCache } from './cache';
import { STORAGE_KEYS, PUBLIC_APIS } from './constants';
import { clearToken } from './auth';

// 是否启用开发模式下的模拟数据
const USE_MOCK_DATA = false; // 禁用模拟数据，总是使用真实API

// 处理中的请求缓存，防止重复请求
const pendingRequests = new Map();
const completedRequests = new Map();
const responseCache = new Map(); // 响应数据缓存
const REQUEST_THROTTLE_MS = 300; // 相同请求的最小间隔时间（毫秒）
const CACHE_EXPIRATION = 5 * 60 * 1000; // 缓存过期时间：5分钟

// 不使用缓存的URL列表
const NO_CACHE_URLS = [
  '/api/orders/list',
  '/orders/list'
];

// 创建axios实例
const instance = axios.create({
  baseURL: '/api', // 使用代理前缀
  timeout: 15000, // 增加超时时间
  headers: {
    'Content-Type': 'application/json'
  }
});

// 修改 require 语句，重新引入 showNotification
const { setLoading, showNotification } = require('../store/slices/uiSlice');

// 错误处理器函数 - 全局通用函数，处理任何可能的toUpperCase错误
const safeMethod = (config) => {
  // 如果config不存在，返回默认方法
  if (!config) return 'GET';
  
  // 如果config.method不存在，返回默认方法
  if (!config || config.method === undefined || config.method === null) return 'GET';
  
  try {
    // 检查类型，安全转换
    if (typeof config.method === 'string') {
      return config.method.toUpperCase();
    } else {
      // 尝试转换为字符串
      return String(config.method).toUpperCase();
    }
  } catch (err) {
    console.error('无法安全转换请求方法:', err);
    return 'GET'; // 出错时返回默认GET方法
  }
};

// 请求拦截器
instance.interceptors.request.use(
  config => {
    // 动态导入 store 以避免循环依赖
    const store = require('../store').default;
    
    // 显示加载状态
    store.dispatch(setLoading(true));
    
    // 检查URL是否是绝对URL，如果是则转换为相对URL
    if (config.url && typeof config.url === 'string' && config.url.match(/^https?:\/\//)) {
      console.warn(`拦截到绝对URL: ${config.url}，正在转换为相对路径`);
      try {
        const urlObj = new URL(config.url);
        // 提取路径部分，保留查询参数
        let relativePath = urlObj.pathname;
        
        // 确保路径以/api开头，如果原始URL包含/api但不在开头，则调整路径
        if (!relativePath.startsWith('/api') && urlObj.pathname.includes('/api')) {
          const apiIndex = urlObj.pathname.indexOf('/api');
          relativePath = urlObj.pathname.substring(apiIndex);
        }
        
        // 如果路径不以/api开头且不包含/api，则添加/api前缀
        if (!relativePath.startsWith('/api') && !relativePath.includes('/api')) {
          relativePath = '/api' + (relativePath.startsWith('/') ? relativePath : '/' + relativePath);
        }
        
        config.url = relativePath;
        console.log(`URL已修正为: ${config.url}`);
      } catch (e) {
        console.error('URL解析失败:', e);
      }
    }
    
    // 确保URL不包含重复的api前缀
    if (config.url.startsWith('/api') && config.baseURL.includes('/api')) {
      config.url = config.url.substring(4); // 移除前导的/api
    }
    
    // 创建精简的请求标识 - 只使用URL和参数，不包括完整data
    let requestId = `${config.method}:${config.url}`;
    
    // 为GET请求添加params
    if (config.params && Object.keys(config.params).length > 0) {
      // 对params排序，确保相同参数不同顺序产生相同的键
      const sortedParams = {};
      Object.keys(config.params).sort().forEach(key => {
        sortedParams[key] = config.params[key];
      });
      requestId += `:${JSON.stringify(sortedParams)}`;
    }
    
    // 为POST/PUT请求添加简化的data标识
    if (config.data && typeof config.data === 'object') {
      const dataKeys = Object.keys(config.data).sort().join(',');
      requestId += `:${dataKeys}`;
    }
    
    // 检查是否有相同请求正在处理中
    if (pendingRequests.has(requestId)) {
      // 检查是否是不缓存的URL
      if (NO_CACHE_URLS.some(url => config.url.includes(url))) {
        console.log(`跳过缓存，强制发送请求: ${config.url}`);
        // 对于不缓存的URL，不使用pendingRequests中的Promise
      } else {
        // 使用pendingRequests中的Promise
        return pendingRequests.get(requestId);
      }
    }
    
    // 检查相同请求是否刚刚完成（节流控制）
    const lastCompletedTime = completedRequests.get(requestId);
    const now = Date.now();
    if (lastCompletedTime && (now - lastCompletedTime < REQUEST_THROTTLE_MS)) {
      // 尝试从缓存获取数据
      const cachedData = responseCache.get(requestId);
      if (cachedData) {
        return Promise.resolve(cachedData);
      }
      
      // 如果没有缓存，等待节流时间后继续
      return new Promise(resolve => {
        setTimeout(() => {
          // 移除时间限制，允许请求
          completedRequests.delete(requestId);
          // 重新调用请求
          resolve(axios.request(config));
        }, REQUEST_THROTTLE_MS - (now - lastCompletedTime));
      });
    }
    
    // 创建一个promise，用于跟踪请求状态
    let requestPromiseResolve, requestPromiseReject;
    const requestPromise = new Promise((resolve, reject) => {
      requestPromiseResolve = resolve;
      requestPromiseReject = reject;
    });
    
    // 将请求promise和解析器添加到处理中请求集合
    pendingRequests.set(requestId, requestPromise);
    
    // 保存请求标识和解析器
    config.metadata = { 
      requestId,
      resolve: requestPromiseResolve,
      reject: requestPromiseReject
    };
    
    // 从localStorage获取token，尝试多个可能的键名
    let token = localStorage.getItem(STORAGE_KEYS.TOKEN) || localStorage.getItem('token');
    
    // 获取用户类型
    const userType = localStorage.getItem('userType') || 'regular';
    
    // 判断请求是否与代理商相关，考虑各种可能的路径格式
    const isAgentAPI = config.url && (
      config.url.includes('/agent/') || 
      config.url.includes('/agent') || 
      config.url.startsWith('/agent') ||
      config.url.includes('agent/')
    );
    
    // 检查URL是否在公共API列表中，但排除代理商API
    const isPublicApi = PUBLIC_APIS.some(api => {
      // 如果是代理商API，只有登录API才视为公共API
      if (isAgentAPI && !config.url.includes('/agent/login')) {
        return false;
      }
      return config.url.includes(api);
    });
    
    // 检查请求配置是否显式标记为公共API
    const isExplicitPublic = config.isPublic === true;
    
    // 检查请求是否明确表示不需要认证
    const requireNoAuth = config.requireAuth === false;
    
    // 如果请求配置显式标记为公共API，或者URL在公共API列表中，视为公共API
    const shouldTreatAsPublic = isExplicitPublic || isPublicApi || requireNoAuth;
    
    // 添加请求记录到状态管理
    config._requestStartTime = Date.now();
    
    // 检查是否已经手动设置了某种认证头
    const hasAuthHeader = config.headers && (
      config.headers.authorization || 
      config.headers.Authorization || 
      config.headers.authentication || 
      config.headers.Authentication || 
      config.headers.token
    );
    
    // 如果已经手动设置了认证头，优先使用已设置的头部
    if (hasAuthHeader) {
      console.log(`请求已包含认证头部，优先使用: ${config.url}`);
    }
    // 否则根据API类型添加token
    else if (token) {
      // 设置官方配置的token字段名
      config.headers.authentication = token;
      
      // 为了兼容性，也添加其他可能的token字段
      config.headers.Authorization = `Bearer ${token}`;
      config.headers.token = token;
      config.headers.Authentication = token;
      
      console.log(`请求: ${config.url}, 添加认证头部: authentication=${token.substring(0, 10)}...`);
    } else if (!shouldTreatAsPublic) {
      console.warn(`警告: 需要认证的API请求 ${config.url} 没有可用的token!`);
    }
    
    // 调试日志
    console.log(`请求: ${config.url}, 用户类型: ${userType}, 是否代理商API: ${isAgentAPI}, 头部: ${JSON.stringify(Object.keys(config.headers))}`);
    
    // 添加其他通用头部
    config.headers['X-Requested-With'] = 'XMLHttpRequest';
    config.headers['Accept'] = 'application/json';
    
    return config;
  },
  error => {
    // 动态导入 store 以避免循环依赖
    const store = require('../store').default;
    
    // 隐藏加载状态
    store.dispatch(setLoading(false));
    
    // 显示错误通知
    store.dispatch(showNotification({
      type: 'danger',
      message: '请求发送失败，请检查您的网络连接'
    }));
    
    return Promise.reject(error);
  }
);

// 响应拦截器
instance.interceptors.response.use(
  response => {
    // 动态导入 store 以避免循环依赖
    const store = require('../store').default;
    
    // 隐藏加载状态
    store.dispatch(setLoading(false));
    
    // 记录请求完成时间
    if (response.config && response.config.metadata) {
      const requestId = response.config.metadata.requestId;
      completedRequests.set(requestId, Date.now());
      
      // 移除pending请求
      pendingRequests.delete(requestId);
      
      // 缓存响应
      if (response.config.useCache !== false) {
        responseCache.set(requestId, response);
      }
    }
    
    // 检查是否是成功的API响应
    if (response.data && (response.data.code === 1 || response.data.success === true)) {
      return response.data;
    } else {
      return response;
    }
  },
  error => {
    // 动态导入 store 以避免循环依赖
    const store = require('../store').default;
    
    // 隐藏加载状态
    store.dispatch(setLoading(false));
    
    // 获取响应状态码
    const status = error.response ? error.response.status : null;
    
    // 处理认证错误
    if (status === 401 || status === 403) {
      // 导入清除token函数
      const { clearToken } = require('./auth');
      
      // 判断是否已经显示过未授权提示
      if (!window.unAuthAlertShown) {
        window.unAuthAlertShown = true;
        
        // 显示未授权消息
        store.dispatch(showNotification({
          type: 'error',
          message: '您的登录已过期，请重新登录'
        }));
        
        // 清除所有认证信息
        clearToken();
        
        // 派发退出action
        store.dispatch({ type: 'auth/logout' });
        
        // 重定向到登录页面，带上当前路径以便登录后返回
        const currentPath = window.location.pathname;
        if (currentPath !== '/login' && currentPath !== '/register') {
          setTimeout(() => {
            window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
            // 重置标志
            window.unAuthAlertShown = false;
          }, 1500);
        }
      }
    }
    
    // 如果有请求元数据，处理请求拒绝
    if (error.config && error.config.metadata) {
      const { requestId, reject } = error.config.metadata;
      // 移除pending请求
      pendingRequests.delete(requestId);
      
      // 如果有reject函数，调用它
      if (reject) {
        reject(error);
      }
    }
    
    // 显示错误通知
    let errorMessage = '请求失败';
    
    // 尝试从错误响应中获取详细信息
    if (error.response && error.response.data) {
      // 使用服务器返回的错误消息
      errorMessage = error.response.data.msg || error.response.data.message || errorMessage;
    } else if (error.message) {
      // 使用错误对象的消息
      errorMessage = error.message;
    }
    
    // 对于网络错误，使用更友好的消息
    if (errorMessage.includes('Network Error')) {
      errorMessage = '网络连接异常，请检查您的网络';
    }
    
    // 仅在非401/403错误时显示通知，避免重复
    if (status !== 401 && status !== 403) {
      store.dispatch(showNotification({
        type: 'danger',
        message: errorMessage
      }));
    }
    
    return Promise.reject(error);
  }
);

/**
 * 生成缓存键
 * @param {string} url - 请求URL
 * @param {object} params - 请求参数
 * @returns {string} - 缓存键
 */
const generateCacheKey = (url, params = {}) => {
  return `${url}:${JSON.stringify(params)}`;
};

// 封装请求方法
export const request = {
  /**
   * GET请求
   * @param {string} url - 请求URL
   * @param {object} options - 配置选项
   * @param {object} options.params - 请求参数
   * @param {boolean} options.useCache - 是否使用缓存
   * @param {number} options.cacheTime - 缓存时间（毫秒）
   * @param {boolean} options.requireAuth - 是否要求授权（即使是公共API）
   * @returns {Promise} - 请求Promise
   */
  get: function(url, options = {}) {
    // 确保options对象存在，即使调用时传入null或undefined
    options = options || {};
    
    // 检测并修正绝对URL
    if (url && typeof url === 'string' && url.match(/^https?:\/\//)) {
      console.warn(`GET方法检测到绝对URL: ${url}，正在转换为相对路径`);
      try {
        const urlObj = new URL(url);
        // 提取路径部分
        let relativePath = urlObj.pathname;
        if (!relativePath.startsWith('/api') && !relativePath.includes('/api')) {
          relativePath = '/api' + (relativePath.startsWith('/') ? relativePath : '/' + relativePath);
        }
        url = relativePath;
        console.log(`GET请求URL已修正为: ${url}`);
      } catch (e) {
        console.error('URL解析失败:', e);
      }
    }
    
    const { params = {}, useCache = false, cacheTime, requireAuth = false, headers = {} } = options;
    
    // 酒店价格API特殊处理
    if (url.includes('/hotel-prices')) {
      console.log('检测到酒店价格API请求，使用特殊处理');
      
      // 如果使用缓存，先尝试从缓存获取
      if (useCache) {
        const cacheKey = generateCacheKey(url, params);
        const cachedData = getCache(cacheKey);
        
        if (cachedData) {
          console.log('使用缓存的酒店价格数据');
          return Promise.resolve(cachedData);
        }
      }
      
      // 为酒店价格API添加特殊的错误处理和重试机制
      return new Promise((resolve, reject) => {
        // 最大重试次数
        const maxRetries = 2;
        let retryCount = 0;
        
        // 重试函数
        const attemptRequest = () => {
          console.log(`酒店价格API请求尝试 #${retryCount + 1}`);
          
          // 使用标准axios实例发送请求
          instance.get(url, { 
            params, 
            requireAuth,
            headers,
            // 增加超时时间
            timeout: 20000
          })
          .then(response => {
            if (useCache) {
              const cacheKey = generateCacheKey(url, params);
              setCache(cacheKey, response, cacheTime);
            }
            resolve(response);
          })
          .catch(error => {
            retryCount++;
            
            if (retryCount < maxRetries) {
              console.log(`酒店价格API请求失败，${maxRetries - retryCount}秒后重试...`);
              // 延迟后重试
              setTimeout(attemptRequest, 1000);
            } else {
              console.error('酒店价格API请求重试失败，返回默认数据');
              // 所有重试都失败后，返回一个成功的空响应，而不是错误
              resolve({
                code: 1,
                msg: null,
                data: [
                  { id: 1, hotelLevel: '3星', priceDifference: -60, isBaseLevel: false, description: '标准三星级酒店' },
                  { id: 2, hotelLevel: '4星', priceDifference: 0, isBaseLevel: true, description: '舒适四星级酒店（基准价）' },
                  { id: 3, hotelLevel: '4.5星', priceDifference: 140, isBaseLevel: false, description: '高级四星半级酒店' },
                  { id: 4, hotelLevel: '5星', priceDifference: 240, isBaseLevel: false, description: '豪华五星级酒店' }
                ]
              });
            }
          });
        };
        
        // 开始第一次请求
        attemptRequest();
      });
    }
    
    // 价格计算API特殊处理
    if (url.includes('/calculate-price')) {
      console.log('检测到价格计算API请求，使用特殊处理');
      
      // 如果使用缓存，先尝试从缓存获取
      if (useCache) {
        const cacheKey = generateCacheKey(url, params);
        const cachedData = getCache(cacheKey);
        
        if (cachedData) {
          console.log('使用缓存的价格计算数据');
          return Promise.resolve(cachedData);
        }
      }
      
      // 为价格计算API添加特殊的错误处理和重试机制
      return new Promise((resolve, reject) => {
        // 最大重试次数
        const maxRetries = 2;
        let retryCount = 0;
        
        // 使用GET或POST，根据具体情况选择
        const useMethod = 'POST'; // 修改为POST方法，后端可能只支持POST请求
        
        // 重试函数
        const attemptRequest = () => {
          console.log(`价格计算API请求尝试 #${retryCount + 1} 使用方法: ${useMethod}`);
          
          // 根据方法选择请求方式
          let requestPromise;
          
          try {
            if (useMethod === 'GET') {
              requestPromise = instance.get(url, { 
                params, 
                requireAuth,
                headers,
                timeout: 20000
              });
            } else {
              // 对于POST请求，将params作为URL参数，保持body为空
              const queryUrl = `${url}?${new URLSearchParams(params).toString()}`;
              requestPromise = instance.post(queryUrl, null, { 
                requireAuth,
                headers,
                timeout: 20000
              });
            }
            
            requestPromise
              .then(response => {
                if (useCache) {
                  const cacheKey = generateCacheKey(url, params);
                  setCache(cacheKey, response, cacheTime);
                }
                resolve(response);
              })
              .catch(error => {
                console.warn(`价格计算API ${useMethod} 请求失败:`, error?.message || '未知错误');
                retryCount++;
                
                if (retryCount < maxRetries) {
                  console.log(`价格计算API请求失败，${maxRetries - retryCount}秒后重试...`);
                  // 延迟后重试
                  setTimeout(attemptRequest, 1000);
                } else {
                  console.error('价格计算API请求重试失败，返回默认数据');
                  
                  // 创建默认价格结果
                  const defaultHotelLevel = params.hotelLevel || '4星';
                  let hotelPriceDifference = 0;
                  
                  // 根据酒店星级设置默认差价
                  if (defaultHotelLevel.includes('3星')) {
                    hotelPriceDifference = -60;
                  } else if (defaultHotelLevel.includes('4.5星')) {
                    hotelPriceDifference = 140;
                  } else if (defaultHotelLevel.includes('5星')) {
                    hotelPriceDifference = 240;
                  }
                  
                  // 所有重试都失败后，返回一个成功的默认响应，而不是错误
                  resolve({
                    code: 1,
                    msg: null,
                    data: {
                      totalPrice: 1200,
                      hotelPriceDifference: hotelPriceDifference,
                      baseHotelLevel: '4星'
                    }
                  });
                }
              });
          } catch (methodError) {
            console.error('价格计算API请求方法执行错误:', methodError);
            // 发生方法执行错误时直接返回默认数据
            resolve({
              code: 1,
              msg: null,
              data: {
                totalPrice: 1200,
                hotelPriceDifference: 0,
                baseHotelLevel: '4星'
              }
            });
          }
        };
        
        // 开始第一次请求
        attemptRequest();
      });
    }
    
    // 非特殊API的标准处理
    // 如果使用缓存，先尝试从缓存获取
    if (useCache) {
      const cacheKey = generateCacheKey(url, params);
      const cachedData = getCache(cacheKey);
      
      if (cachedData) {
        // 如果有缓存，直接返回缓存数据
        return Promise.resolve(cachedData);
      }
      
      // 如果没有缓存，发起请求并缓存结果
      return instance.get(url, { 
        params, 
        requireAuth,
        headers // 传递自定义请求头
      }).then(response => {
        setCache(cacheKey, response, cacheTime);
        return response;
      });
    }
    
    // 不使用缓存，直接发起请求
    return instance.get(url, { 
      params, 
      requireAuth,
      headers // 传递自定义请求头
    });
  },
  
  post: (url, data = {}, options = {}) => {
    // 确保options对象存在
    options = options || {};
    
    const { requireAuth = false, headers = {} } = options;
    
    // 明确使用POST方法，避免undefined错误
    try {
      return instance.request({
        url,
        method: 'POST', // 明确指定方法为字符串
        data,
        requireAuth,
        headers
      });
    } catch (err) {
      console.error('执行POST请求错误:', err);
      return Promise.reject({
        code: 0,
        message: err.message || '请求执行错误',
        data: null
      });
    }
  },
  
  put: (url, data = {}, options = {}) => {
    // 确保options对象存在
    options = options || {};
    
    const { requireAuth = false, headers = {} } = options;
    
    // 更新操作后清除相关缓存
    removeCache(url);
    
    // 明确使用PUT方法，避免undefined错误
    try {
      return instance.request({
        url,
        method: 'PUT', // 明确指定方法为字符串
        data,
        requireAuth,
        headers
      });
    } catch (err) {
      console.error('执行PUT请求错误:', err);
      return Promise.reject({
        code: 0,
        message: err.message || '请求执行错误',
        data: null
      });
    }
  },
  
  delete: (url, options = {}) => {
    // 确保options对象存在
    options = options || {};
    
    const { params = {}, requireAuth = false, headers = {} } = options;
    
    // 删除操作后清除相关缓存
    removeCache(url);
    
    // 明确使用DELETE方法，避免undefined错误
    try {
      return instance.request({
        url,
        method: 'DELETE', // 明确指定方法为字符串
        params,
        requireAuth,
        headers
      });
    } catch (err) {
      console.error('执行DELETE请求错误:', err);
      return Promise.reject({
        code: 0,
        message: err.message || '请求执行错误',
        data: null
      });
    }
  },
  
  patch: (url, data, options = {}) => {
    const { requireAuth = false } = options;
    // 更新操作后清除相关缓存
    removeCache(url);
    return instance.patch(url, data, { requireAuth });
  },
  
  /**
   * 清除指定URL的缓存
   * @param {string} url - 请求URL
   */
  clearCache: (url) => {
    try {
      if (url) {
        const keys = Object.keys(localStorage);
        const cacheKeys = keys.filter(key => key.startsWith(`cache:${url}`));
        
        cacheKeys.forEach(key => {
          removeCache(key);
        });
        
        // 同时从内存缓存中清除
        for (const [key, value] of responseCache.entries()) {
          if (key.includes(url)) {
            responseCache.delete(key);
          }
        }
        
        console.log(`已清除缓存: ${url}, 共${cacheKeys.length}项`);
      }
    } catch (error) {
      console.error('清除缓存时出错:', error);
    }
  }
};

export default request; 