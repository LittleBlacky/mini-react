export default {
  esbuild: {
    jsxFactory: "MiniReact.createElement", // 将 <div> 转换为 MiniReact.createElement('div')
    jsxFragment: "MiniReact.Fragment",
  },
};
