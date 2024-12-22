import { useEffect, useState } from "react";

const useResponsivePanel = () => {
  // 下面的初始值是百分比
  // 初始值设置为这些合理的百分比可以防止页面首次渲染时出现任何视觉跳动
  const [panelProps, setPanelProps] = useState({
    defaultSize: 25,
    minSize: 15,
    maxSize: 30,
  });

  useEffect(() => {
    const handleResize = () => {
      const windowWidth = window.innerWidth;
      const minWidth = 220;
      const smallScreenMaxWidth = 300;
      const largeScreenMaxWidth = 400;

      // 将像素值转换为百分比
      const minSizePercent = (minWidth / windowWidth) * 100;

      if (windowWidth < 1024) {
        // 小屏幕
        const maxSizePercent = (smallScreenMaxWidth / windowWidth) * 100;
        setPanelProps({
          defaultSize: Math.min(25, maxSizePercent),
          minSize: minSizePercent,
          maxSize: maxSizePercent,
        });
      } else {
        // 大屏幕
        const maxSizePercent = (largeScreenMaxWidth / windowWidth) * 100;
        setPanelProps({
          defaultSize: Math.min(25, maxSizePercent),
          minSize: minSizePercent,
          maxSize: maxSizePercent,
        });
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return panelProps;
};

export { useResponsivePanel };
