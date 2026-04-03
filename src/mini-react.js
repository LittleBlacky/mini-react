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
    // 💡 确保这里能取到值，如果 props.key 没有，就用它真实的 index
    const key =
      (tempOld.props && tempOld.props.key) != null
        ? tempOld.props.key
        : tempOld.index;
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
        index: index,
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
          index: index,
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

let wipFiber = null;
let hookIndex = null;

function updateFunctionComponent(fiber) {
  wipFiber = fiber;
  hookIndex = 0; // 每次执行函数前，指针归零
  wipFiber.hooks = []; // 初始化当前 Fiber 的 hooks 仓库

  // 执行函数，此时内部调用的 useState 就会按顺序访问 wipFiber.hooks
  const children = [fiber.type(fiber.props)];
  reconcileChildren(fiber, children);
}

function useState(initial) {
  // 1. 找前世：看看旧 Fiber 的相同位置有没有存过 hook
  const oldHook =
    wipFiber.alternate &&
    wipFiber.alternate.hooks &&
    wipFiber.alternate.hooks[hookIndex];
  // 2. 初始化或复用状态
  const hook = {
    state: oldHook ? oldHook.state : initial,
    queue: oldHook ? oldHook.queue : [], // 存放 setState 传进来的动作
  };
  // 3. 执行更新队列（处理之前的 setState）
  const actions = hook.queue;
  actions.forEach((action) => {
    // 如果 action 是函数则执行，否则直接覆盖
    hook.state = typeof action === "function" ? action(hook.state) : action;
  });
  // 💡 重要：执行完后清空当前 hook 的队列，防止下次重复计算
  hook.queue = [];

  const setState = (action) => {
    // 💡 重点：把更新动作存入当前 hook 的队列中
    hook.queue.push(action);

    // 💡 重点：把 wipRoot 指向当前的根节点，重新启动调度！
    wipRoot = {
      dom: currentRoot.dom,
      props: currentRoot.props,
      alternate: currentRoot,
    };
    nextUnitOfWork = wipRoot;
    deletions = [];
  };

  // 4. 将本次 hook 存入当前 Fiber 的仓库，并移动指针
  wipFiber.hooks.push(hook);
  hookIndex++;

  return [hook.state, setState];
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

const MiniReact = {createElement, render, useState};
export default MiniReact;
