/** @jsx MiniReact.createElement */
/** @jsxRuntime classic */
import MiniReact from "./src/mini-react.js"; 

function Counter() {
  const [state, setState] = MiniReact.useState(1);
  return (
    <button onClick={() => setState(c => c + 1)}>
      Count: {state}
    </button>
  );
}

MiniReact.render(<Counter />, document.getElementById("app"));