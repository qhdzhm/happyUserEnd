import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import store from "./store";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);

// 仅在开发模式下初始化stagewise工具栏
if (process.env.NODE_ENV === 'development') {
  import('@stagewise/toolbar-react').then(({ StagewiseToolbar }) => {
    // 创建工具栏配置
    const stagewiseConfig = {
      plugins: []
    };

    // 为工具栏创建一个单独的DOM元素
    const toolbarElement = document.createElement('div');
    toolbarElement.id = 'stagewise-toolbar-root';
    document.body.appendChild(toolbarElement);

    // 为工具栏创建单独的React根
    const toolbarRoot = ReactDOM.createRoot(toolbarElement);
    toolbarRoot.render(
      <StagewiseToolbar config={stagewiseConfig} />
    );
  }).catch((error) => {
    console.warn('Stagewise toolbar could not be loaded:', error);
  });
}


