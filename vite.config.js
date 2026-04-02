// vite.config.js
import {defineConfig} from "vite";

export default defineConfig({
  esbuild: {
    // 💡 重点：显式指定为 'classic' 模式
    jsx: "classic",
    // 告诉 esbuild，遇到 JSX 标签请调用 MiniReact.createElement
    jsxFactory: "MiniReact.createElement",
    // 处理 Fragment (如果后续要实现的话)
    jsxFragment: "MiniReact.Fragment",
  },
});
