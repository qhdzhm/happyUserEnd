import { createSlice, createAsyncThunk, createAction } from '@reduxjs/toolkit';
import { login, register, getUserProfile, updateUserProfile, getAgentDiscountRate } from '../../utils/api';
import { STORAGE_KEYS } from '../../utils/constants';

// 异步action：登录
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (credentials, { rejectWithValue }) => {
    try {
      // 检查是否为代理商登录
      const isAgentLogin = credentials.userType === 'agent';
      
      // 准备登录数据
      const loginData = {
        username: credentials.username,
        password: credentials.password
      };
      
      // 确定登录路径
      const loginPath = isAgentLogin ? '/api/agent/login' : '/api/user/login';
      
      // 执行登录请求
      const response = await login(loginData, loginPath);
      
      // 检查是否获得有效响应
      if (!response || response.code !== 1) {
        throw new Error(response?.msg || '登录失败，请检查用户名和密码');
      }
      
      // 检查是否有token
      if (!response.data || !response.data.token) {
        // 如果没有token但有其他成功指标
        const isSuccess = response && (
          response.code === 1 || 
          response.status === 'success' || 
          (response.data && response.data.id)
        );
        
        if (isSuccess) {
          // 创建伪token并保存到localStorage
          const pseudoToken = `dev_token_${Date.now()}`;
          localStorage.setItem(STORAGE_KEYS.TOKEN, pseudoToken);
          localStorage.setItem('userType', credentials.userType);
          localStorage.setItem('username', credentials.username);
          
          // 返回成功对象
          return {
            isAuthenticated: true,
            token: pseudoToken,
            user: {
              id: response.data?.id || 1001,
              username: credentials.username,
              name: response.data?.name || credentials.username,
              email: response.data?.email || `${credentials.username}@example.com`,
              userType: credentials.userType,
              role: isAgentLogin ? 'agent' : 'user'
            }
          };
        }
        
        throw new Error('登录失败: 无效的凭据');
      }
      
      // 成功获取token，处理不同格式的响应
      const token = response.data.token;
      
      // 保存token到localStorage
      localStorage.setItem(STORAGE_KEYS.TOKEN, token);
      
      // 保存用户类型
      const userType = isAgentLogin ? 'agent' : 'regular';
      localStorage.setItem('userType', userType);
      localStorage.setItem('username', credentials.username);
      
      // 保存折扣率(如果存在)
      if (response.data.discountRate !== undefined) {
        localStorage.setItem('discountRate', response.data.discountRate.toString());
      }
      
      // 如果是代理商，从响应或token中提取代理商ID
      let agentId = null;
      if (response.data.id) {
        agentId = response.data.id;
      } else if (response.data.agentId) {
        agentId = response.data.agentId;
      } else {
        // 尝试从JWT中解析
        try {
          // 简单解析JWT的payload部分（不验证签名）
          const payload = token.split('.')[1];
          const decoded = JSON.parse(atob(payload));
          if (decoded.agentId) {
            agentId = decoded.agentId;
          } else if (decoded.id) {
            agentId = decoded.id;
          }
        } catch (e) {
          // JWT解析失败，忽略错误
        }
      }
      
      if (agentId) {
        localStorage.setItem('agentId', agentId.toString());
      }
      
      // 构建用户数据对象
      const userData = {
        token,
        id: response.data.id,
        username: credentials.username,
        name: response.data.name || response.data.companyName || credentials.username,
        email: response.data.email || `${credentials.username}@example.com`,
        userType,
        role: isAgentLogin ? 'agent' : 'user',
        agentId: response.data.agentId || null,
        discountRate: response.data.discountRate
      };
      
      return {
        isAuthenticated: true,
        ...userData
      };
    } catch (error) {
      return rejectWithValue(error.message || '登录失败，请检查您的凭据');
    }
  }
);

// 异步action：注册
export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await register(userData);
      localStorage.setItem(STORAGE_KEYS.TOKEN, response.token);
      return {
        ...response.user,
        role: 'regular' // 注册的用户默认为普通用户
      };
    } catch (error) {
      return rejectWithValue(error.message || '注册失败');
    }
  }
);

// 异步action：获取用户信息
export const fetchUserProfile = createAsyncThunk(
  'auth/fetchUserProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await getUserProfile();
      return {
        ...response,
        role: response.user_type || 'regular' // 确保角色信息
      };
    } catch (error) {
      return rejectWithValue(error.message || '获取用户信息失败');
    }
  }
);

// 异步action：更新用户信息
export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await updateUserProfile(userData);
      return response;
    } catch (error) {
      return rejectWithValue(error.message || '更新用户信息失败');
    }
  }
);

// 退出登录
export const logoutUser = createAction('auth/logout', () => {
  // 清除localStorage中的信息
  localStorage.removeItem(STORAGE_KEYS.TOKEN);
  localStorage.removeItem('user');
  localStorage.removeItem('userType');
  localStorage.removeItem('username');
  
  return {
    payload: null
  };
});

// 初始状态
const initialState = {
  user: JSON.parse(localStorage.getItem('user')) || null,
  isAuthenticated: !!localStorage.getItem(STORAGE_KEYS.TOKEN),
  loading: false,
  error: null
};

// 创建slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // 设置认证状态
    setAuth: (state, action) => {
      state.user = action.payload.user;
      state.isAuthenticated = action.payload.isAuthenticated;
      state.error = null;
    },
    // 登出
    logout: (state) => {
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
      localStorage.removeItem('user');
      localStorage.removeItem('userType');
      localStorage.removeItem('username');
      state.user = null;
      state.isAuthenticated = false;
      state.error = null;
    },
    // 清除错误
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // 登录
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        
        // 将用户信息保存到localStorage
        localStorage.setItem('user', JSON.stringify(action.payload));
        if (action.payload.username) {
          localStorage.setItem('username', action.payload.username);
        }
        
        // 保存用户类型
        if (action.payload.role || action.payload.userType) {
          const userRole = action.payload.role || action.payload.userType;
          localStorage.setItem('userType', userRole);
          
          // 如果是代理商，保存折扣率
          if (userRole === 'agent') {
            // 从不同可能的属性中获取折扣率
            let discountRate = null;
            
            // 直接检查响应对象中的折扣率字段
            if (action.payload.discountRate !== undefined && action.payload.discountRate !== null) {
              discountRate = action.payload.discountRate;
              console.log('从action.payload.discountRate中提取到代理商折扣率:', discountRate);
            } 
            // 检查嵌套对象中的折扣率
            else if (action.payload.user && action.payload.user.discountRate !== undefined) {
              discountRate = action.payload.user.discountRate;
              console.log('从action.payload.user.discountRate中提取到代理商折扣率:', discountRate);
            }
            
            // 如果找到折扣率，保存到localStorage
            if (discountRate !== null && discountRate !== undefined) {
              console.log('保存代理商折扣率到localStorage:', discountRate);
              localStorage.setItem('discountRate', discountRate.toString());
            } else {
              console.log('未找到代理商折扣率，将使用默认值，完整对象:', JSON.stringify(action.payload));
            }
            
            // 保存代理商ID
            if (action.payload.agentId) {
              localStorage.setItem('agentId', action.payload.agentId.toString());
            }
          }
        }
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // 注册
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        
        // 将用户信息保存到localStorage
        localStorage.setItem('user', JSON.stringify(action.payload));
        if (action.payload.username) {
          localStorage.setItem('username', action.payload.username);
        }
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // 获取用户信息
      .addCase(fetchUserProfile.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        
        // 将用户信息保存到localStorage
        localStorage.setItem('user', JSON.stringify(action.payload));
        if (action.payload.username) {
          localStorage.setItem('username', action.payload.username);
        }
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // 更新用户信息
      .addCase(updateProfile.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        
        // 将更新后的用户信息保存到localStorage
        localStorage.setItem('user', JSON.stringify(action.payload));
        if (action.payload.username) {
          localStorage.setItem('username', action.payload.username);
        }
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

// 导出actions
export const { logout, clearError, setAuth } = authSlice.actions;

// 导出reducer
export default authSlice.reducer; 