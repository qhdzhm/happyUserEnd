// 获取一日游数据
const fetchDayTours = async () => {
  if (fetchingDayTours) {
    console.log('一日游数据请求正在进行中，跳过重复请求');
    return;
  }
  
  setFetchingDayTours(true);
  console.log('开始获取一日游数据...');
  
  try {
    const response = await getAllDayTours();
    console.log(response?.data?.records || response?.data || response || []);
    
    // 根据后端返回的数据格式正确提取数据
    const toursData = response?.data?.records || response?.data || response || [];
    
    // 处理并设置一日游数据
    setDayTours(toursData.map(tour => ({
      ...tour,
      id: tour.id || Math.random().toString(36).substr(2, 9),
      type: TOUR_TYPES.DAY_TOUR,
      image_url: tour.image_url || 'https://via.placeholder.com/300x200?text=塔斯马尼亚一日游'
    })));
  } catch (error) {
    console.error('获取一日游失败:', error);
    // 开发环境使用模拟数据
    if (process.env.NODE_ENV === 'development') {
      const mockData = Array(6).fill(0).map((_, i) => ({
        id: i + 1,
        name: `塔斯马尼亚一日游 ${i + 1}`,
        description: "探索塔斯马尼亚美丽的自然风光",
        price: 199 + i * 20,
        duration: 8,
        location: "霍巴特",
        image_url: `https://via.placeholder.com/300x200?text=Day+Tour+${i+1}`,
        rating: 4.5,
        reviews_count: 120 + i,
        type: TOUR_TYPES.DAY_TOUR
      }));
      setDayTours(mockData);
    }
  } finally {
    setFetchingDayTours(false);
  }
};

// 获取跟团游数据
const fetchGroupTours = async () => {
  if (fetchingGroupTours) {
    console.log('跟团游数据请求正在进行中，跳过重复请求');
    return;
  }
  
  setFetchingGroupTours(true);
  
  try {
    const response = await getAllGroupTours();
    
    // 根据后端返回的数据格式正确提取数据
    const toursData = response?.data?.records || response?.data || response || [];
    
    // 处理并设置跟团游数据
    setGroupTours(toursData.map(tour => ({
      ...tour,
      id: tour.id || Math.random().toString(36).substr(2, 9),
      type: TOUR_TYPES.GROUP_TOUR,
      image_url: tour.image_url || 'https://via.placeholder.com/300x200?text=塔斯马尼亚跟团游'
    })));
  } catch (error) {
    console.error('获取跟团游失败:', error);
    // 开发环境使用模拟数据
    if (process.env.NODE_ENV === 'development') {
      const mockData = Array(6).fill(0).map((_, i) => ({
        id: i + 1,
        name: `塔斯马尼亚精彩跟团游 ${i + 1}`,
        description: "深度体验塔斯马尼亚文化与自然",
        price: 699 + i * 50,
        duration: 3 + i,
        location: "塔斯马尼亚全岛",
        image_url: `https://via.placeholder.com/300x200?text=Group+Tour+${i+1}`,
        rating: 4.7,
        reviews_count: 85 + i,
        type: TOUR_TYPES.GROUP_TOUR
      }));
      setGroupTours(mockData);
    }
  } finally {
    setFetchingGroupTours(false);
  }
};

// 获取热门旅游数据
const fetchHotTours = async () => {
  if (fetchingHotTours) {
    console.log('热门旅游数据请求正在进行中，跳过重复请求');
    return;
  }
  
  setFetchingHotTours(true);
  
  try {
    const response = await getHotTours(6);
    
    // 根据后端返回的数据格式正确提取数据
    const toursData = response?.data?.records || response?.data || response || [];
    
    // 处理并设置热门旅游数据
    setHotTours(toursData.map(tour => ({
      ...tour,
      id: tour.id || Math.random().toString(36).substr(2, 9),
      image_url: tour.image_url || 'https://via.placeholder.com/300x200?text=热门旅游'
    })));
  } catch (error) {
    console.error('获取热门旅游失败:', error);
    // 开发环境使用模拟数据
    if (process.env.NODE_ENV === 'development') {
      const mockData = Array(6).fill(0).map((_, i) => ({
        id: i + 1,
        name: `热门旅游线路 ${i + 1}`,
        description: "最受欢迎的塔斯马尼亚旅游线路",
        price: 399 + i * 30,
        duration: 2 + i,
        location: "塔斯马尼亚",
        image_url: `https://via.placeholder.com/300x200?text=Hot+Tour+${i+1}`,
        rating: 4.8,
        reviews_count: 200 + i
      }));
      setHotTours(mockData);
    }
  } finally {
    setFetchingHotTours(false);
  }
};

// 获取推荐旅游数据
const fetchRecommendedTours = async () => {
  if (fetchingRecommendedTours) {
    console.log('推荐旅游数据请求正在进行中，跳过重复请求');
    return;
  }
  
  setFetchingRecommendedTours(true);
  
  try {
    const response = await getRecommendedTours(6);
    
    // 根据后端返回的数据格式正确提取数据
    const toursData = response?.data?.records || response?.data || response || [];
    
    // 处理并设置推荐旅游数据
    setRecommendedTours(toursData.map(tour => ({
      ...tour,
      id: tour.id || Math.random().toString(36).substr(2, 9),
      image_url: tour.image_url || 'https://via.placeholder.com/300x200?text=推荐旅游'
    })));
  } catch (error) {
    console.error('获取推荐旅游失败:', error);
    // 开发环境使用模拟数据
    if (process.env.NODE_ENV === 'development') {
      const mockData = Array(6).fill(0).map((_, i) => ({
        id: i + 1,
        name: `推荐旅游线路 ${i + 1}`,
        description: "精心挑选的塔斯马尼亚特色线路",
        price: 299 + i * 40,
        duration: 1 + i,
        location: "塔斯马尼亚东部",
        image_url: `https://via.placeholder.com/300x200?text=Recommended+${i+1}`,
        rating: 4.6,
        reviews_count: 150 + i
      }));
      setRecommendedTours(mockData);
    }
  } finally {
    setFetchingRecommendedTours(false);
  }
}; 