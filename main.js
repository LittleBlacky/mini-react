import MiniReact from "./src/mini-react.js";

const element = MiniReact.createElement(
    "div",
    { id: "foo" },
    "Hello" // 故意传一个字符串
);

console.log(element);