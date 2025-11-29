import { useEffect } from "react";

export const usePerformance = (componentName) => {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      const startTime = performance.now();
      return () => {
        const endTime = performance.now();
        if (endTime - startTime > 16) {
          // 16ms = 60fps
          console.warn(
            `${componentName} slow render: ${(endTime - startTime).toFixed(
              2
            )}ms`
          );
        }
      };
    }
  });
};
