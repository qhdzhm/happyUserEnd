import { request } from './request';
import axios from 'axios';
import { STORAGE_KEYS } from './constants';
import { toast } from 'react-toastify';

// API基础URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

// 默认不打折的折扣率
const DEFAULT_DISCOUNT_RATE = 1.0;
const AGENT_DEFAULT_DISCOUNT_RATE = 0.9;

// API 请求缓存
const apiCache = new Map();
// 正在进行中的请求
const pendingRequests = new Map();
// 缓存过期时间 (30分钟)
const CACHE_EXPIRATION = 30 * 60 * 1000;

// ==================== 折扣计算相关配置 ====================
// 全局折扣价格缓存
const discountPriceCache = new Map();
// 最大并发请求数
const MAX_CONCURRENT_DISCOUNT_REQUESTS = 3;
// 当前活跃请求数
let activeDiscountRequests = 0;
// 请求队列
const discountRequestQueue = [];
// 缓存有效期(10分钟)
const DISCOUNT_CACHE_EXPIRATION = 10 * 60 * 1000;

/**
 * 处理折扣请求队列，控制最大并发数量
 * @param {Function} requestFn - 实际执行请求的函数
 * @returns {Promise} 请求结果的Promise
 */
const enqueueDiscountRequest = (requestFn) => {
  return new Promise((resolve, reject) => {
    // 创建一个包装函数，在请求完成后处理队列
    const wrappedRequest = async () => {
      activeDiscountRequests++;
      try {
        const result = await requestFn();
        resolve(result);
      } catch (error) {
        reject(error);
      } finally {
        activeDiscountRequests--;
        // 处理队列中的下一个请求
        processDiscountQueue();
      }
    };

    // 如果当前请求数量小于最大值，直接执行；否则加入队列
    if (activeDiscountRequests < MAX_CONCURRENT_DISCOUNT_REQUESTS) {
      wrappedRequest();
    } else {
      discountRequestQueue.push(wrappedRequest);
    }
  });
};

/**
 * 处理队列中的下一个请求
 */
const processDiscountQueue = () => {
  if (discountRequestQueue.length > 0 && activeDiscountRequests < MAX_CONCURRENT_DISCOUNT_REQUESTS) {
    const nextRequest = discountRequestQueue.shift();
    nextRequest();
  }
};

/**
 * 获取缓存的折扣价格
 * @param {string} cacheKey - 缓存键
 * @returns {Object|null} - 缓存的折扣价格或null
 */
const getCachedDiscountPrice = (cacheKey) => {
  if (discountPriceCache.has(cacheKey)) {
    const cached = discountPriceCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < DISCOUNT_CACHE_EXPIRATION) {
      return cached.data;
    }
    // 缓存过期，删除
    discountPriceCache.delete(cacheKey);
  }
  return null;
};

/**
 * 缓存折扣价格
 * @param {string} cacheKey - 缓存键
 * @param {Object} data - 要缓存的数据
 */
const cacheDiscountPrice = (cacheKey, data) => {
  discountPriceCache.set(cacheKey, {
    data,
    timestamp: Date.now()
  });
};

/**
 * 清空价格缓存
 */
export const clearPriceCache = () => {
  discountPriceCache.clear();
  // 触发自定义事件，通知组件重新获取价格
  try {
    document.dispatchEvent(new CustomEvent('priceCacheCleared'));
  } catch (e) {
    console.error('触发价格缓存清理事件失败:', e);
  }
};

// ==================== 用户认证相关 API ====================
export const login = async (credentials, loginPath = '/user/login') => {
  try {
    // 确定正确的API路径
    const apiPath = loginPath.includes('agent') ? 
      '/api/agent/login' : // 代理商登录使用固定的API路径
      '/api/user/login';   // 普通用户登录使用固定的API路径
    
    // 判断是否为代理商登录，预先设置用户类型
    const isAgentLogin = apiPath.includes('agent');
    if (isAgentLogin) {
      localStorage.setItem('userType', 'agent');
      console.log('预先设置用户类型为agent，确保请求头包含令牌');
    }
    
    console.log(`发起登录请求: URL=${apiPath}, 用户名=${credentials.username}, 用户类型=${isAgentLogin ? 'agent' : 'regular'}`);
    
    // 使用POST方法，参数放在请求体中
    const response = await request.post(apiPath, credentials);
    
    // 响应详情记录
    if (response) {
      console.log('登录响应状态:', response.code);
      console.log('登录响应消息:', response.msg || '无消息');
      
      if (response.data) {
        console.log('登录响应数据包含以下字段:', Object.keys(response.data).join(', '));
      } else {
        console.warn('登录响应中没有data字段');
      }
    } else {
      console.error('登录请求没有返回响应');
    }
    
    // 验证是否有有效响应
    if (!response || response.code !== 1) {
      const errorMsg = response?.msg || '登录失败，请检查用户名和密码';
      console.error(`登录失败: 错误代码=${response?.code}, 错误消息=${errorMsg}`);
      
      // 创建更具体的错误响应
      let enhancedErrorMsg = errorMsg;
      
      // 针对常见错误类型提供更具体的提示
      if (response && response.code === 0) {
        if (response.msg.includes('密码错误') || response.msg.includes('账号或密码错误')) {
          enhancedErrorMsg = isAgentLogin ? 
            '代理商账号或密码错误，请重新输入' : 
            '用户名或密码错误，请重新输入';
        } else if (response.msg.includes('不存在')) {
          enhancedErrorMsg = isAgentLogin ? 
            '代理商账号不存在，请检查输入' : 
            '用户名不存在，请检查输入或注册新账号';
        }
      }
      
      // 返回适当的响应对象，让前端能够显示错误
      return {
        code: 0,
        msg: enhancedErrorMsg,
        data: null
      };
    }
    
    // 如果登录成功，保存token和用户信息
    if (response && response.code === 1 && response.data) {
      if (response.data.token) {
        const token = response.data.token;
        // 确保两个位置都存储token
        localStorage.setItem('token', token);
        localStorage.setItem(STORAGE_KEYS.TOKEN, token);
        console.log(`登录成功: Token已保存 ${token.substring(0, 15)}...`);
      } else {
        console.warn('警告: 登录响应中没有找到token!');
      }
      
      // 保存用户类型
      const userType = isAgentLogin ? 'agent' : 'regular';
      localStorage.setItem('userType', userType);
      console.log(`用户类型已保存: ${userType}`);
      
      // 保存用户名
      if (response.data.username) {
        localStorage.setItem('username', response.data.username);
      } else if (credentials.username) {
        localStorage.setItem('username', credentials.username);
      }
      
      // 如果有折扣率，也保存
      if (response.data.discountRate !== undefined) {
        localStorage.setItem('discountRate', response.data.discountRate.toString());
        console.log(`折扣率已保存: ${response.data.discountRate}`);
      }
      
      // 如果是代理商登录，处理代理商ID
      if (isAgentLogin) {
        let agentId = null;
        
        // 从响应中获取代理商ID
        if (response.data.id) {
          agentId = response.data.id;
        } else if (response.data.agentId) {
          agentId = response.data.agentId;
        }
        
        // 如果响应中没有ID，尝试从token解析
        if (!agentId && response.data.token) {
          try {
            const parts = response.data.token.split('.');
            if (parts.length === 3) {
              const payload = JSON.parse(atob(parts[1]));
              if (payload.agentId) {
                agentId = parseInt(payload.agentId);
              } else if (payload.id) {
                agentId = parseInt(payload.id);
              }
            }
          } catch (e) {
            console.warn('解析token获取agentId失败:', e);
          }
        }
        
        // 保存代理商ID
        if (agentId) {
          localStorage.setItem('agentId', agentId.toString());
          console.log(`代理商ID已保存: ${agentId}`);
        } else {
          console.warn('警告: 无法从响应中获取代理商ID');
        }
      }
      
      // 清除价格缓存，确保使用最新折扣
      document.dispatchEvent(new CustomEvent('priceCacheCleared'));
    }
    
    return response;
  } catch (error) {
    // 错误信息详细记录
    console.error('登录过程中出错:', error);
    console.error('错误详情:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    // 创建用户友好的错误消息
    let userFriendlyMessage = error.message || '登录失败';
    
    // 密码错误相关的特殊处理
    if (userFriendlyMessage.includes('密码错误') || userFriendlyMessage.includes('账号或密码错误')) {
      userFriendlyMessage = '账号或密码错误，请检查后重试';
    } else if (userFriendlyMessage.includes('用户名或密码错误')) {
      userFriendlyMessage = '用户名或密码错误，请检查后重试';
    } else if (userFriendlyMessage.includes('用户不存在') || userFriendlyMessage.includes('账号不存在')) {
      userFriendlyMessage = '用户账号不存在，请检查输入或注册新账号';
    }
    
    // 网络相关错误特殊处理
    else if (error.name === 'NetworkError' || error.message.includes('Network') || error.message.includes('网络')) {
      userFriendlyMessage = '网络连接失败，请检查您的网络连接';
    }
    
    // 创建标准错误响应格式
    return {
      code: 0,
      msg: userFriendlyMessage,
      data: null
    };
  }
};

export const register = (userData) => {
  return request.post('/auth/register', userData);
};

export const logout = () => {
  // 记录退出前状态
  console.log('退出登录前状态检查:', {
    token: localStorage.getItem('token') ? '存在' : '不存在',
    storageToken: localStorage.getItem(STORAGE_KEYS.TOKEN) ? '存在' : '不存在',
    userType: localStorage.getItem('userType'),
    username: localStorage.getItem('username'),
    agentId: localStorage.getItem('agentId'),
    discountRate: localStorage.getItem('discountRate')
  });

  // 清除所有登录相关的本地存储数据
  localStorage.removeItem('token');
  localStorage.removeItem(STORAGE_KEYS.TOKEN);
  localStorage.removeItem('userType');
  localStorage.removeItem('username');
  localStorage.removeItem('user');
  localStorage.removeItem('userId');
  localStorage.removeItem('agentId');
  localStorage.removeItem('discountRate');
  
  // 清空价格缓存
  clearPriceCache();
  
  // 验证清理是否成功
  console.log('退出登录后状态检查:', {
    token: localStorage.getItem('token') ? '存在' : '不存在',
    storageToken: localStorage.getItem(STORAGE_KEYS.TOKEN) ? '存在' : '不存在',
    userType: localStorage.getItem('userType'),
    username: localStorage.getItem('username'),
    agentId: localStorage.getItem('agentId'),
    discountRate: localStorage.getItem('discountRate')
  });
  
  console.log('用户已退出登录，所有本地存储数据已清除');
};

export const getUserProfile = async () => {
  try {
    // 根据用户类型获取不同的个人信息
    const userType = localStorage.getItem('userType') || 'regular';
    const endpoint = userType === 'agent' ? '/agent/profile' : '/user/profile';
    
    const response = await request.get(endpoint);
    
    // 成功获取后保存到localStorage
    if (response && response.data) {
      const userData = response.data;
      localStorage.setItem('user', JSON.stringify(userData));
      if (userData.username) {
        localStorage.setItem('username', userData.username);
      }
    }
    
    return response;
  } catch (error) {
    // 如果API调用失败，尝试从localStorage恢复基本用户信息
    const storedUser = localStorage.getItem('user');
    const userType = localStorage.getItem('userType') || 'regular';
    
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        
        // 确保恢复的用户数据格式正确
        const userData = {
          code: 1,
          msg: null,
          data: parsedUser.data || parsedUser,
          role: parsedUser.role || userType || 'regular'
        };
        
        return {
          code: 1,
          data: userData,
          role: userData.role
        };
      } catch (e) {
        // 解析失败，忽略错误
      }
    }
    
    // 如果没有本地存储的数据，返回基本用户对象而不是抛出错误
    return {
      code: 1,
      data: {
        id: parseInt(localStorage.getItem('userId') || '1001'),
        username: localStorage.getItem('username') || 'user1',
        role: localStorage.getItem('userType') || 'regular'
      },
      role: localStorage.getItem('userType') || 'regular'
    };
  }
};

export const updateUserProfile = (userData) => {
  // 根据用户类型更新不同的个人信息
  const userType = localStorage.getItem('userType') || 'regular';
  const endpoint = userType === 'agent' ? '/agent/profile' : '/user/profile';
  
  return request.put(endpoint, userData);
};

export const changePassword = (passwordData) => {
  // 根据用户类型调用不同的密码修改接口
  const userType = localStorage.getItem('userType') || 'regular';
  const endpoint = userType === 'agent' ? '/agent/password' : '/users/password';
  return request.put(endpoint, passwordData);
};

// ==================== 一日游相关 API ====================
export const getAllDayTours = (params) => {
  console.log('[API] 获取一日游列表，参数:', params);
  return request.get('/user/day-tours', { 
    params, 
    useCache: false 
  });
};

/**
 * 获取一日游详情
 * @param {number} id - 一日游ID
 * @returns {Promise<Object>} - 一日游详情响应
 */
export const getDayTourById = async (id) => {
  try {
    console.log(`getDayTourById调用: ID=${id}`);
    
    // 调用后端API获取一日游详情
    const response = await fetch(`/api/user/day-tours/${id}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('一日游详情API响应:', data);
    
    // 转换数据以符合前端显示需求
    if (data && data.data) {
      // 设置旅游类型
      data.data.tour_type = 'day_tour';
      
      // 规范化ID字段 - 后端可能返回dayTourId或id
      if (data.data.dayTourId && !data.data.id) {
        data.data.id = data.data.dayTourId;
      } else if (data.data.id && !data.data.dayTourId) {
        data.data.dayTourId = data.data.id;
      }
      
      // 处理图片 - 确保imageUrl和coverImage都能被正确使用
      if (data.data.coverImage && !data.data.imageUrl) {
        data.data.imageUrl = data.data.coverImage;
      } else if (data.data.imageUrl && !data.data.coverImage) {
        data.data.coverImage = data.data.imageUrl;
      }
      
      // 处理价格和折扣价格
      if (data.data.discountedPrice) {
        // 已有折扣价格，不处理
      } else if (data.data.price) {
        // 没有折扣价格，暂时设置与原价相同
        data.data.discountedPrice = data.data.price;
      }
      
      // 处理highlights数据结构 - 后端直接返回List<String>
      if (data.data.highlights && Array.isArray(data.data.highlights)) {
        // 确保数据格式一致性
        data.data.highlights = data.data.highlights.map(h => 
          typeof h === 'object' ? (h.description || '') : h
        );
        console.log('使用API返回的highlights数据:', data.data.highlights.length);
      }
      
      // 处理inclusions数据结构 - 后端直接返回List<String>
      if (data.data.inclusions && Array.isArray(data.data.inclusions)) {
        data.data.inclusions = data.data.inclusions.map(i => 
          typeof i === 'object' ? (i.description || '') : i
        );
        console.log('使用API返回的inclusions数据:', data.data.inclusions.length);
      }
      
      // 处理exclusions数据结构 - 后端直接返回List<String>
      if (data.data.exclusions && Array.isArray(data.data.exclusions)) {
        data.data.exclusions = data.data.exclusions.map(e => 
          typeof e === 'object' ? (e.description || '') : e
        );
        console.log('使用API返回的exclusions数据:', data.data.exclusions.length);
      }
      
      // 处理itinerary数据结构 - 后端返回List<Map<String, Object>>
      if (data.data.itinerary && Array.isArray(data.data.itinerary)) {
        data.data.itinerary = data.data.itinerary.map(item => ({
          time_slot: item.time_slot || item.timeSlot || "",
          activity: item.activity || item.title || "",
          location: item.location || "",
          description: item.description || "",
          day_number: item.day_number || item.dayNumber || 1,
          type: 'time_slot'
        }));
        console.log('使用API返回的itinerary数据:', data.data.itinerary.length);
      }
      
      // 处理images数据结构 - 后端返回List<Map<String, Object>>
      if (data.data.images && Array.isArray(data.data.images)) {
        data.data.images = data.data.images.map(img => ({
          image_url: img.image_url || img.url || img.imageUrl || data.data.imageUrl || "",
          thumbnail_url: img.thumbnail_url || img.thumbnailUrl || img.url || img.imageUrl || data.data.imageUrl || "",
          description: img.description || data.data.name || "",
          is_primary: img.is_primary || img.isPrimary || false
        }));
        console.log('使用API返回的images数据:', data.data.images.length);
      } else if (data.data.imageUrl || data.data.coverImage) {
        // 如果没有images数组但有imageUrl/coverImage，使用它创建图片对象
        const imageUrl = data.data.imageUrl || data.data.coverImage;
        data.data.images = [{
          image_url: imageUrl,
          thumbnail_url: imageUrl,
          description: data.data.name || "",
          is_primary: true
        }];
        console.log('从imageUrl创建的images数据');
      }
      
      // 处理faqs数据结构 - 后端返回List<Map<String, Object>>
      if (data.data.faqs && Array.isArray(data.data.faqs)) {
        // 确保每个FAQ对象都有question和answer属性
        data.data.faqs = data.data.faqs.map(faq => ({
          question: faq.question || "",
          answer: faq.answer || ""
        }));
        console.log('使用API返回的faqs数据:', data.data.faqs.length);
      }
      
      // 处理tips数据结构 - 后端直接返回List<String>
      if (data.data.tips && Array.isArray(data.data.tips)) {
        // 确保数据格式一致性
        data.data.tips = data.data.tips.map(tip => 
          typeof tip === 'object' ? (tip.description || '') : tip
        );
        console.log('使用API返回的tips数据:', data.data.tips.length);
      }
      
      // 处理主题
      if (data.data.themes && Array.isArray(data.data.themes)) {
        console.log('使用API返回的themes数据:', data.data.themes);
      } else if (data.data.category) {
        // 从category转换为themes数组
        data.data.themes = [data.data.category];
        console.log('从category创建的themes数据:', data.data.themes);
      }
      
      // 处理duration格式
      if (!data.data.duration && data.data.departureTime && data.data.returnTime) {
        try {
          // 尝试从出发和返回时间计算持续时间
          const departureHours = parseInt(data.data.departureTime.split(':')[0]);
          const returnHours = parseInt(data.data.returnTime.split(':')[0]);
          const durationHours = returnHours - departureHours;
          if (durationHours > 0) {
            data.data.duration = `${durationHours}小时`;
          } else {
            data.data.duration = "全天";
          }
        } catch (e) {
          data.data.duration = "全天";
        }
      }
    }
    
    return data;
  } catch (error) {
    console.error('获取一日游详情失败:', error);
    
    // 创建友好的错误响应，而不是直接抛出错误
    return {
      code: 0,
      msg: `获取一日游详情失败: ${error.message}`,
      data: {
        id: id,
        name: `一日游 ${id}`,
        description: '暂时无法获取一日游详情，请稍后再试',
        price: 0,
        tour_type: 'day_tour',
        // 基本占位数据
        highlights: ['暂无亮点信息'],
        inclusions: ['暂无包含项信息'],
        exclusions: ['暂无不包含项信息'],
        faqs: [{ question: '暂无常见问题', answer: '请稍后再试' }],
        tips: ['暂无旅行提示'],
        images: [{
          image_url: "/images/tour/default.jpg",
          thumbnail_url: "/images/tour/default.jpg",
          description: "默认图片",
          is_primary: true
        }]
      }
    };
  }
};

export const getDayTourSchedules = (tourId, params = {}) => {
  return request.get(`/user/day-tours/${tourId}/schedules`, { params });
};

export const getDayTourThemes = () => {
  console.log('[API] 获取一日游主题');
  return request.get('/user/day-tours/themes', {
    useCache: true, // 启用缓存
    cacheTime: 3600000 // 1小时缓存
  });
};

export const getDayTours = (params = {}) => {
  return getAllDayTours(params);
};

// ==================== 跟团游相关 API ====================
export const getAllGroupTours = (params) => {
  console.log('[API] 获取跟团游列表，参数:', params);
  return request.get('/user/group-tours', { 
    params, 
    useCache: false 
  });
};

/**
 * 获取跟团游详情
 * @param {number} id - 跟团游ID
 * @returns {Promise<Object>} - 跟团游详情响应
 */
export const getGroupTourById = async (id) => {
  try {
    console.log(`getGroupTourById调用: ID=${id}`);
    
    // 调用后端API获取跟团游详情
    const response = await fetch(`/api/user/group-tours/${id}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('跟团游详情API响应:', data);
    
    // 转换数据以符合前端显示需求
    if (data && data.data) {
      // 设置旅游类型
      data.data.tour_type = 'group_tour';
      
      // 处理highlights数据结构 - 后端直接返回List<String>
      if (data.data.highlights && Array.isArray(data.data.highlights)) {
        // 确保数据格式一致性
        data.data.highlights = data.data.highlights.map(h => 
          typeof h === 'object' ? (h.description || '') : h
        );
      } else if (!data.data.highlights && data.data.groupTourId) {
        // 从后端获取亮点
        try {
          const highlightsResponse = await fetch(`/api/user/group-tours/${data.data.groupTourId || id}/highlights`);
          if (highlightsResponse.ok) {
            const highlightsData = await highlightsResponse.json();
            if (highlightsData && highlightsData.data && Array.isArray(highlightsData.data)) {
              data.data.highlights = highlightsData.data.map(h => 
                typeof h === 'object' ? (h.description || '') : h
              );
            }
          }
        } catch (error) {
          console.error('获取亮点失败:', error);
          // 失败时使用默认数据
          data.data.highlights = [
            "全程中文导游服务",
            "精选舒适酒店住宿",
            "品尝当地特色美食",
            "观赏塔斯马尼亚自然风光",
            "探索历史遗迹与文化"
          ];
        }
      }
      
      // 处理inclusions数据结构 - 后端直接返回List<String>
      if (data.data.inclusions && Array.isArray(data.data.inclusions)) {
        data.data.inclusions = data.data.inclusions.map(i => 
          typeof i === 'object' ? (i.description || '') : i
        );
      } else if (!data.data.inclusions && data.data.groupTourId) {
        // 如果没有包含项但有ID，尝试获取包含项
        try {
          const inclusionsResponse = await fetch(`/api/user/group-tours/${data.data.groupTourId}/inclusions`);
          if (inclusionsResponse.ok) {
            const inclusionsData = await inclusionsResponse.json();
            if (inclusionsData && inclusionsData.data && Array.isArray(inclusionsData.data)) {
              data.data.inclusions = inclusionsData.data.map(i => 
                typeof i === 'object' ? (i.description || '') : i
              );
            }
          }
        } catch (error) {
          console.error('获取包含项失败:', error);
        }
      }
      
      // 处理exclusions数据结构 - 后端直接返回List<String>
      if (data.data.exclusions && Array.isArray(data.data.exclusions)) {
        data.data.exclusions = data.data.exclusions.map(e => 
          typeof e === 'object' ? (e.description || '') : e
        );
      } else if (!data.data.exclusions && data.data.groupTourId) {
        // 如果没有不包含项但有ID，尝试获取不包含项
        try {
          const exclusionsResponse = await fetch(`/api/user/group-tours/${data.data.groupTourId}/exclusions`);
          if (exclusionsResponse.ok) {
            const exclusionsData = await exclusionsResponse.json();
            if (exclusionsData && exclusionsData.data && Array.isArray(exclusionsData.data)) {
              data.data.exclusions = exclusionsData.data.map(e => 
                typeof e === 'object' ? (e.description || '') : e
              );
            }
          }
        } catch (error) {
          console.error('获取不包含项失败:', error);
        }
      }
      
      // 处理itinerary数据结构 - 后端返回List<Map<String, Object>>
      if (data.data.itinerary && Array.isArray(data.data.itinerary)) {
        data.data.itinerary = data.data.itinerary.map((day, index) => ({
          day_number: day.day_number || (index + 1),
          title: day.title || '',
          description: day.description || day.des || '',
          meals: day.meals || '',
          accommodation: day.accommodation || '',
          activities: Array.isArray(day.activities) ? day.activities : [],
          type: 'daily'
        }));
      } else if (!data.data.itinerary && data.data.groupTourId) {
        // 如果没有行程但有ID，尝试获取行程
        try {
          const itineraryResponse = await fetch(`/api/user/group-tours/${data.data.groupTourId}/itinerary`);
          if (itineraryResponse.ok) {
            const itineraryData = await itineraryResponse.json();
            if (itineraryData && itineraryData.data && Array.isArray(itineraryData.data)) {
              data.data.itinerary = itineraryData.data.map((day, index) => ({
                day_number: day.day_number || (index + 1),
                title: day.title || '',
                description: day.description || day.des || '',
                meals: day.meals || '',
                accommodation: day.accommodation || '',
                activities: Array.isArray(day.activities) ? day.activities : [],
                type: 'daily'
              }));
            }
          }
        } catch (error) {
          console.error('获取行程失败:', error);
        }
      }
      
      // 处理images数据结构 - 后端返回List<Map<String, Object>>
      if (data.data.images && Array.isArray(data.data.images)) {
        data.data.images = data.data.images.map(img => ({
          image_url: img.image_url || img.url || data.data.imageUrl || "",
          thumbnail_url: img.thumbnail_url || img.url || data.data.imageUrl || "",
          description: img.description || data.data.name || "",
          is_primary: img.is_primary || false
        }));
      } else if (data.data.imageUrl) {
        // 如果没有images数组但有imageUrl，使用它创建图片对象
        data.data.images = [{
          image_url: data.data.imageUrl,
          thumbnail_url: data.data.imageUrl,
          description: data.data.name || "",
          is_primary: true
        }];
      } else if (!data.data.images && data.data.groupTourId) {
        // 如果没有图片但有ID，尝试获取图片
        try {
          const imagesResponse = await fetch(`/api/user/group-tours/${data.data.groupTourId}/images`);
          if (imagesResponse.ok) {
            const imagesData = await imagesResponse.json();
            if (imagesData && imagesData.data && Array.isArray(imagesData.data)) {
              data.data.images = imagesData.data.map(img => ({
                image_url: img.image_url || img.url || data.data.imageUrl || "",
                thumbnail_url: img.thumbnail_url || img.url || data.data.imageUrl || "",
                description: img.description || data.data.name || "",
                is_primary: img.is_primary || false
              }));
            }
          }
        } catch (error) {
          console.error('获取图片失败:', error);
        }
      }
      
      // 处理faqs数据结构 - 后端返回List<Map<String, Object>>
      if (data.data.faqs && Array.isArray(data.data.faqs)) {
        // 确保每个FAQ对象都有question和answer属性
        data.data.faqs = data.data.faqs.map(faq => ({
          question: faq.question || "",
          answer: faq.answer || ""
        }));
      } else if (!data.data.faqs && data.data.groupTourId) {
        // 如果没有常见问题但有ID，尝试获取常见问题
        try {
          const faqsResponse = await fetch(`/api/user/group-tours/${data.data.groupTourId}/faqs`);
          if (faqsResponse.ok) {
            const faqsData = await faqsResponse.json();
            if (faqsData && faqsData.data && Array.isArray(faqsData.data)) {
              data.data.faqs = faqsData.data.map(faq => ({
                question: faq.question || "",
                answer: faq.answer || ""
              }));
            }
          }
        } catch (error) {
          console.error('获取常见问题失败:', error);
        }
      }
      
      // 处理tips数据结构 - 后端直接返回List<String>
      if (data.data.tips && Array.isArray(data.data.tips)) {
        // 确保数据格式一致性
        data.data.tips = data.data.tips.map(tip => 
          typeof tip === 'object' ? (tip.description || '') : tip
        );
      } else if (!data.data.tips && data.data.groupTourId) {
        // 如果没有旅行提示但有ID，尝试获取旅行提示
        try {
          const tipsResponse = await fetch(`/api/user/group-tours/${data.data.groupTourId}/tips`);
          if (tipsResponse.ok) {
            const tipsData = await tipsResponse.json();
            if (tipsData && tipsData.data && Array.isArray(tipsData.data)) {
              data.data.tips = tipsData.data.map(tip => 
                typeof tip === 'object' ? (tip.description || '') : tip
              );
            }
          }
        } catch (error) {
          console.error('获取旅行提示失败:', error);
        }
      }
      
      // 处理themes数据 - 后端可能只返回themeIds
      if (data.data.themes && Array.isArray(data.data.themes)) {
        // 直接使用后端返回的主题列表
        console.log('使用后端返回的主题信息:', data.data.themes);
      } else if (data.data.themeIds && Array.isArray(data.data.themeIds)) {
        // 如果只有themeIds，尝试获取主题详情
        try {
          // 先获取所有主题
          const themesResponse = await fetch(`/api/user/group-tours/themes`);
          if (themesResponse.ok) {
            const themesData = await themesResponse.json();
            if (themesData && themesData.data && Array.isArray(themesData.data)) {
              // 创建ID到主题的映射
              const themeMap = {};
              themesData.data.forEach(theme => {
                if (theme.id) {
                  themeMap[theme.id] = theme.name || '';
                }
              });
              
              // 使用themeIds查找对应的主题名称
              data.data.themes = data.data.themeIds
                .filter(id => id && themeMap[id]) // 过滤无效ID
                .map(id => themeMap[id]) // 映射为主题名称
                .filter((theme, index, self) => self.indexOf(theme) === index); // 去重
            }
          }
        } catch (error) {
          console.error('获取主题详情失败:', error);
        }
      }
      
      // 处理suitableFor数据 - 后端可能只返回suitableIds
      if (data.data.suitableFor && Array.isArray(data.data.suitableFor)) {
        // 直接使用后端返回的适合人群列表
        console.log('使用后端返回的适合人群信息:', data.data.suitableFor);
      } else if (data.data.suitableIds && Array.isArray(data.data.suitableIds)) {
        // 如果只有suitableIds，尝试获取适合人群详情
        try {
          // 获取所有适合人群选项
          const suitableResponse = await fetch(`/api/user/tours/suitable-for-options`);
          if (suitableResponse.ok) {
            const suitableData = await suitableResponse.json();
            if (suitableData && suitableData.data && Array.isArray(suitableData.data)) {
              // 创建ID到适合人群的映射
              const suitableMap = {};
              suitableData.data.forEach(suitable => {
                if (suitable.id) {
                  suitableMap[suitable.id] = suitable.name || '';
                }
              });
              
              // 使用suitableIds查找对应的适合人群名称
              data.data.suitableFor = data.data.suitableIds
                .filter(id => id && suitableMap[id]) // 过滤无效ID
                .map(id => suitableMap[id]) // 映射为适合人群名称
                .filter((suitable, index, self) => self.indexOf(suitable) === index); // 去重
            }
          }
        } catch (error) {
          console.error('获取适合人群详情失败:', error);
        }
      }
    }
    
    return data;
  } catch (error) {
    console.error('获取跟团游详情失败:', error);
    throw error;
  }
};

export const getGroupTourItinerary = (tourId) => {
  console.log('[API] 获取跟团游行程，ID:', tourId);
  return request.get(`/user/group-tours/${tourId}/itinerary`);
};

export const getGroupTourAvailableDates = (tourId, params = {}) => {
  return request.get(`/user/group-tours/${tourId}/available-dates`, { params });
};

export const getGroupTourThemes = () => {
  console.log('[API] 获取跟团游主题');
  return request.get('/user/group-tours/themes', {
    useCache: true, // 启用缓存
    cacheTime: 3600000 // 1小时缓存
  });
};

export const getGroupTourHighlights = (tourId) => {
  return request.get(`/user/group-tours/${tourId}/highlights`);
};

export const getGroupTourInclusions = (tourId) => {
  return request.get(`/user/group-tours/${tourId}/inclusions`);
};

export const getGroupTourExclusions = (tourId) => {
  return request.get(`/user/group-tours/${tourId}/exclusions`);
};

export const getGroupTourFaqs = (tourId) => {
  return request.get(`/user/group-tours/${tourId}/faqs`);
};

export const getGroupTourTips = (tourId) => {
  return request.get(`/user/group-tours/${tourId}/tips`);
};

export const getGroupTourImages = (tourId) => {
  return request.get(`/user/group-tours/${tourId}/images`);
};

export const getGroupTours = (params = {}) => {
  return getAllGroupTours(params);
};

// ==================== 通用旅游相关 API ====================
export const getAllTours = (params = {}) => {
  return request.get('/user/tours', { 
    params,
    useCache: true,
    cacheTime: 60000 // 1分钟缓存
  });
};

/**
 * 获取旅游详情
 * @param {number} id - 旅游ID
 * @param {string} type - 旅游类型 ('day'或'group')
 * @returns {Promise<Object>} - 旅游详情响应
 */
export const getTourById = async (id, type = 'day') => {
  try {
    console.log(`getTourById调用: ID=${id}, 类型=${type}`);
    
    // 规范化类型字符串，确保能正确匹配
    const normalizedType = (type || '').toLowerCase();
    const isGroupTour = normalizedType === 'group' || 
                        normalizedType === 'group_tour' || 
                        normalizedType.includes('group');
    
    // 根据规范化的类型确定API路径
    const apiPath = isGroupTour 
      ? `/user/group-tours/${id}`
      : `/user/day-tours/${id}`;
    
    console.log(`使用API路径: ${apiPath}`);
    
    // 直接使用request调用正确的API路径
    const response = await request.get(apiPath, {
      useCache: true,
      cacheTime: 60000 // 1分钟缓存
    });
    
    console.log(`API响应结果: 状态=${response?.code}, 数据长度=${response?.data ? '有数据' : '无数据'}`);
    
    return response;
  } catch (error) {
    console.error('获取旅游详情失败:', error);
    throw error;
  }
};

export const getHotTours = (limit = 6) => {
  return request.get(`/user/tours/hot`, { 
    params: { limit },
    useCache: true,
    cacheTime: 300000 // 5分钟缓存
  });
};

export const getRecommendedTours = (limit = 6) => {
  return request.get(`/user/tours/recommended`, { 
    params: { limit },
    useCache: true,
    cacheTime: 300000 // 5分钟缓存
  });
};

export const getSuitableForOptions = () => {
  console.log('[API] 获取适合人群选项');
  return request.get('/user/tours/suitable-for-options', {
    useCache: true,
    cacheTime: 3600000 // 1小时缓存
  }).then(response => {
    console.log('[API] 适合人群选项响应数据:', JSON.stringify(response));
    return response;
  });
};

// ==================== 预订相关 API ====================
export const createBooking = (bookingData) => {
  return request.post('/bookings', bookingData);
};

export const getUserBookings = () => {
  return request.get('/bookings/user');
};

export const getBookingById = (id) => {
  return request.get(`/bookings/${id}`);
};

export const cancelBooking = (id) => {
  return request.put(`/bookings/${id}/cancel`);
};

export const checkAvailability = (params) => {
  return request.get('/bookings/check-availability', { params });
};

// ==================== 支付相关 API ====================
export const createPayment = (paymentData) => {
  return request.post('/payments', paymentData);
};

export const getPaymentById = (id) => {
  return request.get(`/payments/${id}`);
};

export const getPaymentsByBookingId = (bookingId) => {
  return request.get(`/payments/booking/${bookingId}`);
};

// ==================== 评论相关 API ====================
export const createReview = (reviewData) => {
  return request.post('/reviews', reviewData);
};

export const getTourReviews = (tourType, tourId) => {
  return request.get(`/reviews/${tourType}/${tourId}`);
};

export const getUserReviews = () => {
  return request.get('/reviews/user');
};

// ==================== 地区相关 API ====================
export const getAllRegions = () => {
  return request.get('/regions');
};

export const getRegionById = (id) => {
  return request.get(`/regions/${id}`);
};

export const getRegionTours = (id, params = {}) => {
  return request.get(`/regions/${id}/tours`, { params });
};

// ==================== 导游相关 API ====================
export const getGuideById = (id) => {
  return request.get(`/guides/${id}`);
};

export const getGuidesByTourId = (tourType, tourId) => {
  return request.get(`/guides/${tourType}/${tourId}`);
};

// ==================== 员工管理相关 API (仅管理员) ====================
export const getAllEmployees = (params = {}) => {
  return request.get('/admin/employees', { params });
};

export const getEmployeeById = (id) => {
  return request.get(`/admin/employees/${id}`);
};

export const createEmployee = (employeeData) => {
  return request.post('/admin/employees', employeeData);
};

export const updateEmployee = (id, employeeData) => {
  return request.put(`/admin/employees/${id}`, employeeData);
};

export const deleteEmployee = (id) => {
  return request.delete(`/admin/employees/${id}`);
};

// ==================== 车辆管理相关 API (仅管理员) ====================
export const getAllVehicles = (params = {}) => {
  return request.get('/admin/vehicles', { params });
};

export const getVehicleById = (id) => {
  return request.get(`/admin/vehicles/${id}`);
};

export const createVehicle = (vehicleData) => {
  return request.post('/admin/vehicles', vehicleData);
};

export const updateVehicle = (id, vehicleData) => {
  return request.put(`/admin/vehicles/${id}`, vehicleData);
};

export const deleteVehicle = (id) => {
  return request.delete(`/admin/vehicles/${id}`);
};

export const getVehicleDrivers = (vehicleId) => {
  return request.get(`/admin/vehicles/${vehicleId}/drivers`);
};

export const assignDriverToVehicle = (vehicleId, driverId, isPrimary = false) => {
  return request.post(`/admin/vehicles/${vehicleId}/drivers`, { 
    employee_id: driverId, 
    is_primary: isPrimary ? 1 : 0 
  });
};

export const removeDriverFromVehicle = (vehicleId, driverId) => {
  return request.delete(`/admin/vehicles/${vehicleId}/drivers/${driverId}`);
};

// ==================== 统计和报表 API (仅管理员) ====================
export const getBookingStats = (params = {}) => {
  return request.get('/admin/stats/bookings', { params });
};

export const getRevenueStats = (params = {}) => {
  return request.get('/admin/stats/revenue', { params });
};

export const getTourPopularityStats = (params = {}) => {
  return request.get('/admin/stats/tour-popularity', { params });
};

export const getUserStats = (params = {}) => {
  return request.get('/admin/stats/users', { params });
};

// ==================== 筛选选项相关 API ====================
// 获取所有地区
export const getTourLocations = () => {
  return request.get('/user/tours/locations', {
    useCache: true,
    cacheTime: 3600000 // 1小时缓存
  });
};

// 获取价格区间
export const getPriceRanges = () => {
  return request.get('/user/tours/price-ranges', {
    useCache: true,
    cacheTime: 3600000 // 1小时缓存
  });
};

/**
 * 获取当前登录用户信息
 * @returns {Object|null} 用户信息对象或null
 */
export const getUserInfo = () => {
  try {
    // 检查本地存储的信息
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN) || localStorage.getItem('token');
    const discountRate = localStorage.getItem('discountRate');
    const storedAgentId = localStorage.getItem('agentId');
    
    console.log('getUserInfo检查 - token:', token ? '存在' : '不存在', 
                ', discountRate:', discountRate, 
                ', agentId:', storedAgentId);
    
    // 获取用户基本信息
    const id = parseInt(localStorage.getItem('userId') || localStorage.getItem('agentId') || '0');
    const username = localStorage.getItem('username') || '';
    const userType = localStorage.getItem('userType') || 'regular';
    let agentId = parseInt(localStorage.getItem('agentId') || '0');
    
    // 如果agentId不存在，但用户类型为agent，尝试从JWT解析
    if (!agentId && userType === 'agent') {
      if (token) {
        try {
          const parts = token.split('.');
          if (parts.length === 3) {
            const payload = JSON.parse(atob(parts[1]));
            if (payload.agentId) {
              agentId = parseInt(payload.agentId);
              localStorage.setItem('agentId', agentId.toString());
            } else if (payload.id && userType === 'agent') {
              agentId = parseInt(payload.id);
              localStorage.setItem('agentId', agentId.toString());
            }
          }
        } catch (e) {
          // JWT解析失败，忽略错误
        }
      }
    }
    
    return {
      id: id || (userType === 'agent' ? agentId : 0),
      username,
      userType,
      agentId: userType === 'agent' ? (agentId || id) : 0,
      isAuthenticated: !!token
    };
  } catch (error) {
    return {
      id: 0,
      username: '',
      userType: 'regular',
      agentId: 0,
      isAuthenticated: false
    };
  }
};

/**
 * 获取代理商折扣率
 * @param {string} agentId - 代理商ID
 * @returns {Promise<Object>} - 代理商折扣信息
 */
export const getAgentDiscountRate = async (agentId) => {
  try {
    // 增强的token获取逻辑
    let token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    if (!token) {
      token = localStorage.getItem('token');
      if (token) {
        localStorage.setItem(STORAGE_KEYS.TOKEN, token);
      }
    }

    // 检查token是否有效 (简单检查: 长度>20的才视为有效token)
    const isValidToken = token && token.length > 20;
    
    if (!isValidToken) {
      console.warn('HeaderDiscount - 无效的token，无法获取折扣率');
      return { discountRate: DEFAULT_DISCOUNT_RATE, error: 'no_token' };
    } 
    
    // 构造明确的请求头
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-User-Type': 'agent'
    };
    
    // 规范化agentId处理
    let effectiveAgentId = agentId;
    if (!effectiveAgentId) {
      effectiveAgentId = localStorage.getItem('agentId');
    }
    
    // 检查代理商ID是否有效
    if (!effectiveAgentId) {
      console.warn('HeaderDiscount - 无法获取代理商ID，无法获取折扣率');
      return { discountRate: DEFAULT_DISCOUNT_RATE, error: 'no_agent_id' };
    }
    
    // 构造API路径
    let url;
    if (effectiveAgentId) {
      url = `/agent/${effectiveAgentId}/discount-rate`;
    } else {
      url = '/agent/discount-rate';
    }
    
    // 发送请求时明确传递所有必要的参数  
    const response = await request.get(url, { 
      requireAuth: true,     // 明确标记需要认证
      headers: headers,      // 明确传递请求头
      params: {             // 添加查询参数以提高请求的唯一性
        agentId: effectiveAgentId,
        t: Date.now()        // 添加时间戳避免缓存
      }
    });
    
    if (response && response.data) {
      // 处理不同格式的响应
      let discountRate;
      
      // 检查response.data是否为对象且包含discountRate属性
      if (typeof response.data === 'object' && 'discountRate' in response.data) {
        discountRate = parseFloat(response.data.discountRate);
      }
      // 检查是否为discount_rate格式
      else if (typeof response.data === 'object' && 'discount_rate' in response.data) {
        discountRate = parseFloat(response.data.discount_rate);
      } 
      // 检查是否为直接数值
      else if (typeof response.data === 'number') {
        discountRate = response.data;
      } 
      // 尝试解析字符串
      else if (typeof response.data === 'string') {
        discountRate = parseFloat(response.data);
      }
      
      // 验证折扣率有效性
      if (isNaN(discountRate) || discountRate <= 0 || discountRate > 1) {
        discountRate = AGENT_DEFAULT_DISCOUNT_RATE;
      }
      
      // 保存到localStorage
      localStorage.setItem('discountRate', discountRate.toString());
      
      // 计算节省百分比
      const savedPercent = ((1 - discountRate) * 100).toFixed(1);
      
      return {
        discountRate: discountRate,
        savedPercent: parseFloat(savedPercent),
        agentId: effectiveAgentId
      };
    } else {
      return { 
        discountRate: AGENT_DEFAULT_DISCOUNT_RATE, 
        savedPercent: ((1 - AGENT_DEFAULT_DISCOUNT_RATE) * 100).toFixed(1),
        agentId: effectiveAgentId,
        isDefault: true
      };
    }
  } catch (error) {
    // 返回默认折扣率，确保应用程序不会中断
    return { 
      discountRate: AGENT_DEFAULT_DISCOUNT_RATE, 
      savedPercent: ((1 - AGENT_DEFAULT_DISCOUNT_RATE) * 100).toFixed(1),
      error: error.message || 'unknown_error',
      isDefault: true
    };
  }
};

/**
 * 计算单个价格折扣
 * @param {Object} params 
 * @param {number} params.originalPrice - 原价
 * @param {string} params.agentId - 代理商ID
 * @returns {Promise<Object>} - 折扣价格对象
 */
export const calculateDiscount = async (params) => {
  try {
    console.log('计算折扣，参数:', params);
    
    // 参数验证
    if (!params.originalPrice) {
      return { 
        originalPrice: 0, 
        discountedPrice: 0,
        discountRate: 1,
        savedAmount: 0
      };
    }
    
    // 检查是否为代理商
    const agentId = params.agentId || localStorage.getItem('agentId');
    if (!agentId) {
      console.log('非代理商，不计算折扣');
      return { 
        originalPrice: params.originalPrice,
        discountedPrice: params.originalPrice,
        discountRate: 1,
        savedAmount: 0
      };
    }
    
    // 使用GET请求获取折扣价格
    try {
      const response = await request.get('/api/agent/calculate-discount', {
        params: {
          originalPrice: Number(params.originalPrice),
          agentId: Number(agentId)
        }
      });
      
      console.log('折扣计算响应:', response);
      
      return {
        originalPrice: Number(params.originalPrice),
        discountedPrice: Number(response.discountedPrice || params.originalPrice),
        discountRate: Number(response.discountRate || 1),
        savedAmount: Number(response.savedAmount || 0)
      };
    } catch (apiError) {
      console.error('API调用失败，使用默认折扣率计算:', apiError);
      
      // 使用默认折扣率计算
      const defaultRate = localStorage.getItem('discountRate') || 0.9;
      const discountedPrice = Math.round(params.originalPrice * defaultRate);
      
      return {
        originalPrice: Number(params.originalPrice),
        discountedPrice: discountedPrice,
        discountRate: Number(defaultRate),
        savedAmount: params.originalPrice - discountedPrice
      };
    }
  } catch (error) {
    console.error('折扣计算失败:', error);
    return { 
      originalPrice: params.originalPrice, 
      discountedPrice: params.originalPrice,
      discountRate: 1,
      savedAmount: 0
    };
  }
};

/**
 * 计算旅游折扣价格
 * @param {Object} params - 参数对象
 * @returns {Promise<Object>} - 折扣计算结果
 */
export const calculateTourDiscount = async (params) => {
  try {
    // 参数验证
    if (!params.tourId || !params.originalPrice) {
      return { 
        originalPrice: params.originalPrice || 0, 
        discountedPrice: params.originalPrice || 0,
        discountRate: 1,
        savedAmount: 0
      };
    }
    
    // 获取token
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN) || localStorage.getItem('token');
    
    // 检查是否为代理商 - 从参数或localStorage获取agentId
    const agentId = params.agentId || localStorage.getItem('agentId');
    const userType = localStorage.getItem('userType');
    
    // 检查token是否有效 (简单检查: 长度>20的才视为有效token)
    const isValidToken = token && token.length > 20;
    
    // 如果不是代理商或没有有效token，不进行折扣计算，直接返回原价
    if (!agentId || userType !== 'agent' || !isValidToken) {
      return { 
        originalPrice: params.originalPrice,
        discountedPrice: params.originalPrice,
        discountRate: 1,
        savedAmount: 0
      };
    }
    
    // 创建缓存键
    const cacheKey = `${params.tourId}_${params.tourType || 'unknown'}_${params.originalPrice}_${agentId}`;
    
    // 尝试从缓存获取折扣价格
    const cachedDiscount = getCachedDiscountPrice(cacheKey);
    if (cachedDiscount) {
      return cachedDiscount;
    }
    
    // 从API请求折扣价格
    try {
      // 构造请求参数
      const requestParams = {
        tourId: Number(params.tourId),
        tourType: params.tourType || 'day-tour',
        originalPrice: Number(params.originalPrice),
        agentId: Number(agentId)
      };
      
      const response = await request.get('/api/agent/calculate-tour-discount', { params: requestParams });
      
      // 如果API返回了有效的折扣价格
      if (response && response.data) {
        let discountedPrice, discountRate;
        
        // 处理不同格式的响应
        if (typeof response.data === 'object') {
          // 尝试获取discountedPrice字段
          if ('discountedPrice' in response.data) {
            discountedPrice = Number(response.data.discountedPrice);
          }
          // 尝试获取discounted_price字段
          else if ('discounted_price' in response.data) {
            discountedPrice = Number(response.data.discounted_price);
          }
          
          // 尝试获取discountRate字段
          if ('discountRate' in response.data) {
            discountRate = Number(response.data.discountRate);
          }
          // 尝试获取discount_rate字段
          else if ('discount_rate' in response.data) {
            discountRate = Number(response.data.discount_rate);
          }
        }
        
        // 如果没有获取到有效的折扣价格，使用折扣率和原价计算
        if (!discountedPrice && discountRate) {
          discountedPrice = Math.round(params.originalPrice * discountRate);
        }
        // 如果没有获取到有效的折扣率，但有折扣价格，计算折扣率
        else if (discountedPrice && !discountRate) {
          discountRate = discountedPrice / params.originalPrice;
        }
        // 如果都没有获取到，使用默认折扣率
        else if (!discountedPrice && !discountRate) {
          discountRate = parseFloat(localStorage.getItem('discountRate') || AGENT_DEFAULT_DISCOUNT_RATE);
          discountedPrice = Math.round(params.originalPrice * discountRate);
        }
        
        const savedAmount = params.originalPrice - discountedPrice;
        
        const result = {
          originalPrice: Number(params.originalPrice),
          discountedPrice: discountedPrice,
          discountRate: discountRate,
          savedAmount: savedAmount
        };
        
        // 缓存结果
        cacheDiscountPrice(cacheKey, result);
        return result;
      }
    } catch (apiError) {
      // API调用失败，使用本地计算
    }
    
    // 如果API调用失败，使用本地计算
    // 从localStorage获取折扣率，如果没有则使用默认值
    const discountRate = parseFloat(localStorage.getItem('discountRate') || AGENT_DEFAULT_DISCOUNT_RATE);
    const discountedPrice = Math.round(params.originalPrice * discountRate);
    const savedAmount = params.originalPrice - discountedPrice;
    
    const result = {
      originalPrice: Number(params.originalPrice),
      discountedPrice: discountedPrice,
      discountRate: discountRate,
      savedAmount: savedAmount
    };
    
    // 缓存结果
    cacheDiscountPrice(cacheKey, result);
    return result;
  } catch (error) {
    // 出错时返回原价
    return { 
      originalPrice: params.originalPrice, 
      discountedPrice: params.originalPrice,
      discountRate: 1,
      savedAmount: 0
    };
  }
};

/**
 * 批量计算多个旅游产品的折扣价格
 * @param {Array} items - 包含多个{tourId, tourType, originalPrice, agentId}对象的数组
 * @returns {Promise<Array>} - 包含多个折扣信息对象的数组
 */
export const calculateBatchTourDiscounts = async (items) => {
  if (!items || !Array.isArray(items) || items.length === 0) {
    return [];
  }
  
  // 检查代理商ID
  const agentId = items[0]?.agentId;
  if (!agentId) {
    return items.map(item => ({
      originalPrice: Number(item.originalPrice),
      discountedPrice: Number(item.originalPrice),
      discountRate: 1,
      savedAmount: 0,
      tourId: item.tourId,
      tourType: item.tourType
    }));
  }
  
  // 检查缓存，过滤出未缓存的项目
  const results = [];
  const uncachedItems = [];
  
  for (const item of items) {
    const cacheKey = `${item.tourId}_${item.tourType || 'unknown'}_${item.originalPrice}_${agentId}`;
    const cachedResult = getCachedDiscountPrice(cacheKey);
    
    if (cachedResult) {
      results.push({
        ...cachedResult,
        index: item.index // 保留原始索引
      });
    } else {
      uncachedItems.push({
        ...item,
        cacheKey
      });
    }
  }
  
  // 如果所有项目都已缓存，直接返回结果
  if (uncachedItems.length === 0) {
    return results;
  }
  
  // 使用请求队列控制并发
  try {
    const batchResponse = await enqueueDiscountRequest(async () => {
      try {
        // 准备批量请求数据
        const batchItems = uncachedItems.map(item => ({
          tourId: Number(item.tourId),
          tourType: String(item.tourType || 'day').toLowerCase().includes('group') ? 'group' : 'day',
          originalPrice: Number(item.originalPrice),
          agentId: Number(agentId)
        }));
        
        // 发送批量请求
        return await request.post('/api/agent/calculate-batch-discounts', { items: batchItems });
      } catch (error) {
        // 如果批量API不可用，则使用默认折扣率
        const defaultRate = localStorage.getItem('discountRate') || 0.9;
        return uncachedItems.map(item => ({
          tourId: item.tourId,
          originalPrice: item.originalPrice,
          discountedPrice: Math.round(item.originalPrice * defaultRate),
          discountRate: defaultRate,
          savedAmount: item.originalPrice - Math.round(item.originalPrice * defaultRate),
          tourType: item.tourType
        }));
      }
    });
    
    // 处理批量响应
    if (batchResponse && Array.isArray(batchResponse.data)) {
      // 如果API返回数组结果
      for (let i = 0; i < batchResponse.data.length; i++) {
        const item = uncachedItems[i];
        const responseItem = batchResponse.data[i];
        
        const result = {
          originalPrice: Number(item.originalPrice),
          discountedPrice: Number(responseItem.discountedPrice || item.originalPrice),
          discountRate: Number(responseItem.discountRate || 1),
          savedAmount: Number(responseItem.savedAmount || 0),
          tourId: item.tourId,
          tourType: item.tourType,
          index: item.index
        };
        
        // 缓存结果
        cacheDiscountPrice(item.cacheKey, result);
        
        // 添加到结果中
        results.push(result);
      }
    } else {
      // 如果API不返回预期格式，使用默认折扣率
      const defaultRate = localStorage.getItem('discountRate') || 0.9;
      
      for (const item of uncachedItems) {
        const discountedPrice = Math.round(item.originalPrice * defaultRate);
        
        const result = {
          originalPrice: Number(item.originalPrice),
          discountedPrice: discountedPrice,
          discountRate: Number(defaultRate),
          savedAmount: item.originalPrice - discountedPrice,
          tourId: item.tourId,
          tourType: item.tourType,
          index: item.index
        };
        
        // 缓存结果
        cacheDiscountPrice(item.cacheKey, result);
        
        // 添加到结果中
        results.push(result);
      }
    }
    
    // 按原始索引排序结果
    return results.sort((a, b) => (a.index || 0) - (b.index || 0));
  } catch (error) {
    // 出错时对未缓存的项目使用原价
    for (const item of uncachedItems) {
      results.push({
        originalPrice: Number(item.originalPrice),
        discountedPrice: Number(item.originalPrice),
        discountRate: 1,
        savedAmount: 0,
        tourId: item.tourId,
        tourType: item.tourType,
        index: item.index
      });
    }
    
    // 按原始索引排序结果
    return results.sort((a, b) => (a.index || 0) - (b.index || 0));
  }
};

// 创建API服务对象
const apiServices = {
  login,
  getAgentDiscountRate,
  calculateTourDiscount,
  calculateDiscount,
  // 其他API函数...
};

// ==================== 搜索相关 API ====================
/**
 * 搜索旅游产品
 * @param {Object} searchParams - 搜索参数
 * @returns {Promise<Object>} - 搜索结果
 */
export const searchTours = (searchParams) => {
  console.log('搜索旅游产品，参数:', searchParams);
  return request.get('/user/tours/search', { 
    params: searchParams,
    useCache: false
  });
};

export default apiServices; 
