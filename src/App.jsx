import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// 在现有的组件中添加这个功能
function ScrollToTop() {
  const { pathname } = useLocation();
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  
  return null;
}

// 在应用的主要部分添加这个组件
function App() {
  // 现有的代码...
  
  return (
    <>
      <ScrollToTop />
      {/* 现有的应用结构 */}
    </>
  );
}

export default App; 