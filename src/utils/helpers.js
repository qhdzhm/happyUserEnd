/**
 * 格式化日期
 * @param {Date|string} date - 日期对象或日期字符串
 * @param {string} format - 格式化模式，默认为 'YYYY-MM-DD'
 * @returns {string} 格式化后的日期字符串
 */
export const formatDate = (date, format = 'YYYY-MM-DD') => {
  const d = new Date(date);
  
  if (isNaN(d.getTime())) {
    return '';
  }
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  
  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
};

/**
 * 格式化价格
 * @param {number} price - 价格
 * @param {string} currency - 货币符号，默认为 '$'
 * @returns {string} 格式化后的价格字符串
 */
export const formatPrice = (price, currency = '¥') => {
  if (price === null || price === undefined) return `${currency}0`;
  
  // 确保price是数字
  const numPrice = Number(price);
  if (isNaN(numPrice)) return `${currency}0`;
  
  // 使用toLocaleString格式化价格，添加千位分隔符
  return `${currency}${numPrice.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

/**
 * 截断文本
 * @param {string} text - 原始文本
 * @param {number} maxLength - 最大长度
 * @returns {string} 截断后的文本
 */
export const truncateText = (text, maxLength) => {
  if (!text || text.length <= maxLength) {
    return text;
  }
  
  return text.slice(0, maxLength) + '...';
};

/**
 * 生成随机ID
 * @param {number} length - ID长度，默认为 8
 * @returns {string} 随机ID
 */
export const generateId = (length = 8) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
};

/**
 * 深拷贝对象
 * @param {Object} obj - 要拷贝的对象
 * @returns {Object} 拷贝后的对象
 */
export const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (obj instanceof Date) {
    return new Date(obj.getTime());
  }
  
  if (obj instanceof Array) {
    return obj.map(item => deepClone(item));
  }
  
  if (obj instanceof Object) {
    const copy = {};
    Object.keys(obj).forEach(key => {
      copy[key] = deepClone(obj[key]);
    });
    return copy;
  }
  
  return obj;
};

/**
 * 防抖函数
 * @param {Function} func - 要执行的函数
 * @param {number} wait - 等待时间，单位为毫秒
 * @returns {Function} 防抖后的函数
 */
export const debounce = (func, wait) => {
  let timeout;
  
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * 节流函数
 * @param {Function} func - 要执行的函数
 * @param {number} limit - 限制时间，单位为毫秒
 * @returns {Function} 节流后的函数
 */
export const throttle = (func, limit) => {
  let inThrottle;
  
  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
};

/**
 * 获取查询参数
 * @param {string} name - 参数名
 * @param {string} url - URL，默认为当前URL
 * @returns {string|null} 参数值
 */
export const getQueryParam = (name, url = window.location.href) => {
  name = name.replace(/[[\]]/g, '\\$&');
  const regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)');
  const results = regex.exec(url);
  
  if (!results) return null;
  if (!results[2]) return '';
  
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
};

/**
 * 滚动到页面顶部
 * @param {number} duration - 动画持续时间，单位为毫秒
 */
export const scrollToTop = (duration = 500) => {
  const scrollStep = -window.scrollY / (duration / 15);
  
  const scrollInterval = setInterval(() => {
    if (window.scrollY !== 0) {
      window.scrollBy(0, scrollStep);
    } else {
      clearInterval(scrollInterval);
    }
  }, 15);
};

/**
 * 验证邮箱
 * @param {string} email - 邮箱地址
 * @returns {boolean} 是否有效
 */
export const validateEmail = (email) => {
  const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
};

/**
 * 验证手机号
 * @param {string} phone - 手机号
 * @returns {boolean} 是否有效
 */
export const validatePhone = (phone) => {
  const re = /^1[3-9]\d{9}$/;
  return re.test(String(phone));
};

/**
 * 计算折扣价格（已弃用 - 请使用后端API计算折扣价格）
 * @deprecated 此方法已弃用，请使用后端API计算折扣价格
 * @param {number} originalPrice - 原价
 * @param {number|string} discountRate - 折扣率，可以是小数(0.8)或百分比(80)格式
 * @returns {number} 折扣后的价格，保留两位小数
 */
export const calculateDiscountPrice = (originalPrice, discountRate) => {
  console.warn('calculateDiscountPrice函数已弃用，请使用后端API计算折扣价格');
  
  if (!originalPrice || originalPrice <= 0) return 0;
  
  // 确保输入参数为数字
  const price = Number(originalPrice);
  let rate = Number(discountRate);
  
  // 验证参数是否有效
  if (isNaN(price) || isNaN(rate) || rate <= 0) {
    console.warn('计算折扣价格的参数无效', { originalPrice, discountRate });
    return price;
  }
  
  // 如果折扣率大于1，假设它是百分比格式(例如80)，转换为小数(0.8)
  if (rate > 1) {
    rate = rate / 100;
  }
  
  // 计算折扣价
  const discountedPrice = price * rate;
  
  // 保留两位小数
  return Math.round(discountedPrice * 100) / 100;
}; 