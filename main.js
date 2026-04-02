import MiniReact from "./mini-react";

const element = (
  <div id="foo">
    <h1>Hello Mini-React</h1>
    <p>从图纸到实物的跨越！</p>
  </div>
);

const container = document.getElementById("app");
MiniReact.render(element, container);
