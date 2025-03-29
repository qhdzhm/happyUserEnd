import axios from 'axios';
import { getCache, setCache, removeCache } from './cache';
import { STORAGE_KEYS, PUBLIC_APIS } from './constants';

// 是否启用开发模式下的模拟数据
const USE_MOCK_DATA = false; // 禁用模拟数据，总是使用真实API

// 处理中的请求缓存，防止重复请求
const pendingRequests = new Map();
const completedRequests = new Map();
const responseCache = new Map(); // 响应数据缓存
const REQUEST_THROTTLE_MS = 300; // 相同请求的最小间隔时间（毫秒）
const CACHE_EXPIRATION = 5 * 60 * 1000; // 缓存过期时间：5分钟

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

// 请求拦截器
instance.interceptors.request.use(
  config => {
    // 动态导入 store 以避免循环依赖
    const store = require('../store').default;
    
    // 显示加载状态
    store.dispatch(setLoading(true));
    
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
      // 使用pendingRequests中的Promise
      return pendingRequests.get(requestId);
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
    
    // 检查URL是否在公共API列表中
    const isPublicApi = PUBLIC_APIS.some(api => config.url.includes(api));
    
    // 判断请求是否与代理商相关
    const isAgentAPI = config.url.includes('/agent/');
    
    // 检查请求配置是否显式标记为公共API
    const isExplicitPublic = config.isPublic === true;
    
    // 检查请求是否明确表示不需要认证
    const requireNoAuth = config.requireAuth === false;
    
    // 如果请求配置显式标记为公共API，或者URL在公共API列表中，视为公共API
    const shouldTreatAsPublic = isExplicitPublic || isPublicApi || requireNoAuth;
    
    // 添加请求记录到状态管理
    config._requestStartTime = Date.now();
    
    // 如果明确指定不需要认证，或者是公共API并且不是代理商API，则不添加token
    if (token && !requireNoAuth && (!shouldTreatAsPublic || (isAgentAPI && userType === 'agent'))) {
      // 添加token到请求头
      config.headers.Authorization = `Bearer ${token}`;
    }
    
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
    
    // 从处理中请求集合中移除请求
    if (response.config.metadata && response.config.metadata.requestId) {
      const requestId = response.config.metadata.requestId;
      
      // 解析挂起的promise
      if (response.config.metadata.resolve) {
        response.config.metadata.resolve(response.data);
      }
      
      // 移除挂起的请求
      pendingRequests.delete(requestId);
      
      // 记录请求完成时间
      completedRequests.set(requestId, Date.now());
      
      // 缓存响应数据
      if (response.config.useCache) {
        responseCache.set(requestId, response.data);
        
        // 根据配置设置缓存过期时间
        const cacheTime = response.config.cacheTime || CACHE_EXPIRATION;
        setTimeout(() => {
          responseCache.delete(requestId);
        }, cacheTime);
      }
      
      // 设置自动清理完成请求记录的定时器（以防止内存泄漏）
      setTimeout(() => {
        completedRequests.delete(requestId);
      }, REQUEST_THROTTLE_MS * 2);
    }
    
    // 直接返回响应数据
    return response.data;
  },
  error => {
    // 动态导入 store 以避免循环依赖
    const store = require('../store').default;
    
    // 隐藏加载状态
    store.dispatch(setLoading(false));
    
    // 从处理中请求集合中移除请求
    if (error.config && error.config.metadata && error.config.metadata.requestId) {
      const requestId = error.config.metadata.requestId;
      
      // 拒绝挂起的promise
      if (error.config.metadata.reject) {
        const response = error.response ? error.response.data : { message: error.message || 'Unknown error' };
        error.config.metadata.reject(response);
      }
      
      // 移除挂起的请求
      pendingRequests.delete(requestId);
      
      // 记录请求完成时间（即使是错误）
      completedRequests.set(requestId, Date.now());
      
      // 设置自动清理完成请求记录的定时器
      setTimeout(() => {
        completedRequests.delete(requestId);
      }, REQUEST_THROTTLE_MS * 2);
    }
    
    // 如果是"请求已在处理中"的自定义错误，则静默处理
    if (error.message === '请求已在处理中') {
      console.log('忽略重复请求');
      return Promise.reject(error);
    }

    // 特殊处理HTTP方法不支持的错误
    if (error.response && error.response.status === 405) {
      console.error(`请求方法 ${error.config.method.toUpperCase()} 不支持 (接口: ${error.config.url})`);
      
      // 对登录请求尝试不同的HTTP方法
      if (error.config.url.includes('login')) {
        console.warn('登录请求方法不支持，请尝试使用不同的HTTP方法或端点');
      }
      
      // 显示错误通知
      store.dispatch(showNotification({
        type: 'warning',
        message: `API不支持${error.config.method.toUpperCase()}方法，请尝试不同的接口或方法`
      }));
      
      return Promise.reject({
        message: `接口 ${error.config.url} 不支持 ${error.config.method.toUpperCase()} 方法`,
        code: 405,
        httpError: true
      });
    }
    
    const { response } = error;
    
    if (response) {
      // 处理401未授权错误
      if (response.status === 401) {
        // 检查是否是特殊处理的URL，如旅游详情页面
        const isTourDetailUrl = error.config && error.config.url && /\/user\/tours\/\d+/.test(error.config.url);
        
        // 公共API或旅游详情页面不需要登录，不清除token
        const isPublicApi = PUBLIC_APIS.some(api => 
          error.config && error.config.url && error.config.url.includes(api)
        );
        
        // 检查请求是否明确表示不需要认证
        const requireNoAuth = error.config && error.config.requireAuth === false;
        
        if (!isPublicApi && !isTourDetailUrl && !requireNoAuth) {
          // 清除token
          localStorage.removeItem('token');
          
          // 显示错误通知
          store.dispatch(showNotification({
            type: 'danger',
            message: '登录已过期，请重新登录'
          }));
        } else {
          console.log(`公共API 401 错误，但不清除token: ${error.config?.url}`);
          
          // 对于旅游详情页面返回默认数据
          if (isTourDetailUrl) {
            console.log('旅游详情页面401错误，将返回默认数据');
            try {
              const tourId = error.config.url.match(/\/user\/tours\/(\d+)/)[1];
              return Promise.resolve({
                code: 1,
                data: {
                  id: tourId,
                  name: `旅游路线 ${tourId}`,
                  description: '暂无详细信息，请稍后再试',
                  price: 100,
                  location: '塔斯马尼亚',
                  rating: 4.5
                }
              });
            } catch (e) {
              console.error('解析旅游ID失败:', e);
              return Promise.resolve({
                code: 1,
                data: {
                  id: 0,
                  name: '未知旅游路线',
                  description: '暂无详细信息，请稍后再试',
                  price: 100,
                  location: '塔斯马尼亚',
                  rating: 4.5
                }
              });
            }
          }
        }
      } else if (response.status === 403) {
        // 显示错误通知
        store.dispatch(showNotification({
          type: 'danger',
          message: '您没有权限执行此操作'
        }));
      } else if (response.status === 404) {
        // 检查是否是旅游详情页面
        const isTourDetailUrl = error.config && error.config.url && /\/user\/tours\/\d+/.test(error.config.url);
        
        if (isTourDetailUrl) {
          console.log('旅游详情页面404错误，将返回默认数据');
          try {
            const tourId = error.config.url.match(/\/user\/tours\/(\d+)/)[1];
            return Promise.resolve({
              code: 1,
              data: {
                id: tourId,
                name: `旅游路线 ${tourId}`,
                description: '此旅游路线不存在或已下架',
                price: 0,
                location: '塔斯马尼亚',
                rating: 0
              }
            });
          } catch (e) {
            console.error('解析旅游ID失败:', e);
            return Promise.resolve({
              code: 1,
              data: {
                id: 0,
                name: '未知旅游路线',
                description: '暂无详细信息，请稍后再试',
                price: 0,
                location: '塔斯马尼亚',
                rating: 0
              }
            });
          }
        } else {
          // 显示错误通知
          store.dispatch(showNotification({
            type: 'danger',
            message: '请求的资源不存在'
          }));
        }
      } else if (response.status >= 500) {
        // 显示错误通知
        store.dispatch(showNotification({
          type: 'danger',
          message: '服务器错误，请稍后再试'
        }));
      } else {
        // 显示错误通知
        store.dispatch(showNotification({
          type: 'danger',
          message: response.data?.message || '请求失败'
        }));
      }
      
      // 返回格式化的错误，避免未知Promise拒绝
      return Promise.reject({ 
        code: response.status,
        message: response.data?.message || '请求失败',
        data: response.data
      });
    } else {
      // 网络错误
      const errorMessage = error.message || '网络错误，请检查您的网络连接';
      store.dispatch(showNotification({
        type: 'danger',
        message: errorMessage
      }));
      
      // 返回格式化的错误，避免未知Promise拒绝
      return Promise.reject({ 
        code: 0,
        message: errorMessage,
        data: null
      });
    }
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
  get: (url, options = {}) => {
    const { params = {}, useCache = false, cacheTime, requireAuth = false } = options;
    
    // 如果使用缓存，先尝试从缓存获取
    if (useCache) {
      const cacheKey = generateCacheKey(url, params);
      const cachedData = getCache(cacheKey);
      
      if (cachedData) {
        // 如果有缓存，直接返回缓存数据
        return Promise.resolve(cachedData);
      }
      
      // 如果没有缓存，发起请求并缓存结果
      return instance.get(url, { params, requireAuth }).then(response => {
        setCache(cacheKey, response, cacheTime);
        return response;
      });
    }
    
    // 不使用缓存，直接发起请求
    return instance.get(url, { params, requireAuth });
  },
  
  post: (url, data, options = {}) => {
    const { requireAuth = false } = options;
    return instance.post(url, data, { requireAuth });
  },
  
  put: (url, data, options = {}) => {
    const { requireAuth = false } = options;
    // 更新操作后清除相关缓存
    removeCache(url);
    return instance.put(url, data, { requireAuth });
  },
  
  delete: (url, options = {}) => {
    const { requireAuth = false } = options;
    // 删除操作后清除相关缓存
    removeCache(url);
    return instance.delete(url, { requireAuth });
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