/** @jsx MiniReact.createElement */
/** @jsxRuntime classic */
import MiniReact from "./src/mini-react.js"; 

const element = (
  <div id="container">
    <h1>你好, Mini-React!</h1>
  </div>
);

const container = document.getElementById("app");
console.log(container)
MiniReact.render(element, container);