/** 1. 元素创建部分 (Virtual DOM) **/
function createElement(type, props, ...children) {
  return {
    type,
    props: {
      ...props,
      children: children.map((child) =>
        typeof child === "object" ? child : createTextElement(child),
      ),
    },
  };
}

function createTextElement(text) {
  return {
    type: "TEXT_ELEMENT",
    props: {
      nodeValue: text,
      children: [],
    },
  };
}

/** 2. DOM 节点创建辅助函数 **/
function createDom(fiber) {
  const dom =
    fiber.type === "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(fiber.type);
  // 利用 updateDom 初始化所有属性和事件
  // 传入一个空对象 {} 作为 prevProps，这样 updateDom 会认为所有属性都是新的
  updateDom(dom, {}, fiber.props);
  return dom;
}

/** 3. Commit 阶段：一口气挂载到页面 **/
function commitRoot() {
  // 💡 重点：施工前，先把清单上该拆的全部拆掉
  deletions.forEach(commitWork);

  commitWork(wipRoot.child);
  currentRoot = wipRoot; // 别忘了更新“成品房”备忘录
  wipRoot = null;
}

function commitWork(fiber) {
  if (!fiber) return;

  // 1. 找大房东 (Parent DOM)
  let domParentFiber = fiber.parent;
  while (!domParentFiber.dom) {
    domParentFiber = domParentFiber.parent;
  }
  const domParent = domParentFiber.dom;

  // 2. 根据标记执行操作
  if (fiber.effectTag === "PLACEMENT" && fiber.dom != null) {
    domParent.appendChild(fiber.dom);
  } else if (fiber.effectTag === "DELETION") {
    commitDeletion(fiber, domParent);
    return; //删除后，它的子孙就不需要再处理了
  } else if (fiber.effectTag === "UPDATE" && fiber.dom !== null) {
    // 这里的关键是传入：节点本身、旧属性、新属性
    updateDom(fiber.dom, fiber.alternate.props, fiber.props);
  }

  // 3. 继续施工
  commitWork(fiber.child);
  commitWork(fiber.sibling);
}

function commitDeletion(fiber, domParent) {
  while (!fiber.dom) {
    fiber = fiber.child;
  }
  domParent.removeChild(fiber.dom);
}

const isEvent = (key) => key.startsWith("on");
const isProperty = (key) => key !== "children" && !isEvent(key);
// 判断属性是否新属性或发生了变化
const isNew = (prev, next) => (key) => prev[key] !== next[key];
// 判断属性是否在新的props中消失了
const isGone = (prev, next) => (key) => key in prev && !(key in next);
function updateDom(dom, prevProps, nextProps) {
  // 1. 移除旧的或已更改的事件监听器
  Object.keys(prevProps)
    .filter(isEvent)
    .filter((key) => !(key in nextProps) || isNew(prevProps, nextProps)(key))
    .forEach((name) => {
      const eventType = name.toLowerCase().substring(2);
      dom.removeEventListener(eventType, prevProps[name]);
    });

  // 2. 移除旧属性
  Object.keys(prevProps)
    .filter(isProperty)
    .filter(isGone(prevProps, nextProps))
    .forEach((name) => {
      dom[name] = "";
    });

  // 3. 设置新属性或更新属性
  Object.keys(nextProps)
    .filter(isProperty)
    .filter(isNew(prevProps, nextProps))
    .forEach((name) => {
      dom[name] = nextProps[name];
    });

  // 4. 添加新的事件监听器
  Object.keys(nextProps)
    .filter(isEvent)
    .filter(isNew(prevProps, nextProps))
    .forEach((name) => {
      const eventType = name.toLowerCase().substring(2);
      dom.addEventListener(eventType, nextProps[name]);
    });
}

/** 4. Render 阶段：Fiber 调度与处理 **/
let nextUnitOfWork = null;
let wipRoot = null;
let currentRoot = null; // 这是一个全局变量，存着上一次盖好的“成品房”
let deletions = null; // 全局删除清单
function render(element, container) {
  wipRoot = {
    dom: container,
    props: {
      children: [element],
    },
    alternate: currentRoot,
  };
  deletions = [];
  nextUnitOfWork = wipRoot;
}

function workLoop(deadline) {
  let shouldYield = false;
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    shouldYield = deadline.timeRemaining() < 1;
  }

  if (!nextUnitOfWork && wipRoot) {
    commitRoot();
  }

  requestIdleCallback(workLoop);
}

requestIdleCallback(workLoop);

function reconcileChildren(wipFiber, elements) {
  let index = 0;
  let oldFiber = wipFiber.alternate && wipFiber.alternate.child;
  let prevSibling = null;

  // --- 1. 登记：把所有旧砖按 Key 存入仓库 ---
  const oldFiberMap = new Map();
  let tempOld = oldFiber;
  while (tempOld) {
    // 如果没有 key，就用 index 当 key (兜底方案)
    const key = tempOld.props.key || tempOld.index;
    oldFiberMap.set(key, tempOld);
    tempOld = tempOld.sibling;
  }

  // --- 2. 对账：遍历新设计图 ---
  while (index < elements.length) {
    const element = elements[index];
    let newFiber = null;
    const key = element.props.key || index;
    const matchedOldFiber = oldFiberMap.get(key);
    const canReuse = matchedOldFiber && element.type === matchedOldFiber.type;
    if (canReuse) {
      newFiber = {
        type: matchedOldFiber.type,
        props: element.props,
        dom: matchedOldFiber.dom,
        parent: wipFiber,
        alternate: matchedOldFiber,
        effectTag: "UPDATE",
      };
      oldFiberMap.delete(key);
    } else {
      if (element) {
        newFiber = {
          type: element.type,
          props: element.props,
          dom: null,
          parent: wipFiber,
          alternate: null,
          effectTag: "PLACEMENT",
        };
      }
    }
    if (index === 0) {
      wipFiber.child = newFiber;
    } else if (element) {
      prevSibling.sibling = newFiber;
    }
    prevSibling = newFiber;
    index++;
  }
  oldFiberMap.forEach((fiber) => {
    fiber.effectTag = "DELETION";
    deletions.push(fiber);
  });
}

function updateHostComponent(fiber) {
  if (!fiber.dom) {
    fiber.dom = createDom(fiber);
  }
  reconcileChildren(fiber, fiber.props.children);
}

function updateFunctionComponent(fiber) {
  // 💡 执行函数，传入 props，拿到他想画的“草图”
  // 注意：函数组件目前只支持返回一个根节点
  const children = [fiber.type(fiber.props)];

  // 拿到草图后，交给对账中心
  reconcileChildren(fiber, children);
}

function performUnitOfWork(fiber) {
  // 💡 第一步：判断他是“标准砖块”还是“设计师”
  const isFunctionComponent = fiber.type instanceof Function;

  if (isFunctionComponent) {
    // 模式 A：请设计师出方案
    updateFunctionComponent(fiber);
  } else {
    // 模式 B：搬运标准砖块（你之前的逻辑）
    updateHostComponent(fiber);
  }

  // --- 寻找下一个任务单元的逻辑（维持原样） ---
  if (fiber.child) return fiber.child;
  let nextFiber = fiber;
  while (nextFiber) {
    if (nextFiber.sibling) return nextFiber.sibling;
    nextFiber = nextFiber.parent;
  }
}

const MiniReact = {createElement, render};
export default MiniReact;
