# Mini React

一个从零开始实现的迷你React库，用于学习React核心原理和底层机制。

## 项目简介

本项目实现了React的核心功能，包括：

- 虚拟DOM (Virtual DOM)
- Fiber架构
- Reconciliation协调算法
- 函数组件和Hook支持 (useState)
- 事件处理
- 批量更新

通过这个项目，可以深入理解React的工作原理和核心概念。

## 核心特性

### 1. 虚拟DOM

- `createElement`: 创建虚拟DOM元素
- `createTextElement`: 创建文本节点

### 2. Fiber架构

- 使用Fiber节点构建工作单元
- 支持可中断的任务调度
- 实现了`performUnitOfWork`函数来处理单个工作单元

### 3. 协调算法 (Reconciliation)

- 实现了完整的diff算法
- 支持元素的新增、更新和删除
- 使用key进行高效的列表对比

### 4. 渲染流程

- Render阶段: 构建Fiber树并标记副作用
- Commit阶段: 批量应用变更到真实DOM

### 5. Hook支持

- 实现了基础的`useState` Hook
- 正确维护Hook的状态和更新队列

## 文件结构

## 功能模块

### 元素创建

- `createElement`: 创建虚拟DOM元素
- `createTextElement`: 创建文本节点

### DOM操作

- `createDom`: 创建真实DOM节点
- `updateDom`: 更新DOM属性和事件

### 渲染流程

- `render`: 启动渲染过程
- `workLoop`: 主工作循环，使用requestIdleCallback实现可中断渲染
- `commitRoot`: 提交变更到DOM

### Fiber处理

- `performUnitOfWork`: 处理单个工作单元
- `reconcileChildren`: 协调子节点
- `updateFunctionComponent`: 更新函数组件
- `updateHostComponent`: 更新宿主组件

### 状态管理

- `useState`: 实现状态钩子函数

## 运行项目

1. 安装依赖：

```bash
pnpm install
```

2. 启动开发服务器：

```bash
pnpm dev
```

3. 在浏览器中打开 `http://localhost:5173`

## 示例代码

项目中的示例展示了一个简单的计数器组件：

```jsx
/** @jsx MiniReact.createElement */
/** @jsxRuntime classic */
import MiniReact from "./src/mini-react.js";

function Counter() {
  const [state, setState] = MiniReact.useState(1);
  return <button onClick={() => setState((c) => c + 1)}>Count: {state}</button>;
}

MiniReact.render(<Counter />, document.getElementById("app"));
```

## 学习要点

1. **Fiber架构**: 理解如何将渲染任务分解为更小的单元
2. **时间切片**: 学习如何使用requestIdleCallback实现可中断渲染
3. **协调算法**: 掌握React如何比较虚拟DOM树的变化
4. **Hook实现**: 理解useState等Hook的内部实现机制
5. **副作用处理**: 学习如何在Commit阶段批量处理DOM更新

## 技术细节

- 使用`requestIdleCallback`实现异步可中断渲染
- 实现了完整的Fiber树构建和更新流程
- 支持事件处理和属性更新
- 实现了组件生命周期的基本概念

## 项目目标

- 深入理解React的核心工作原理
- 学习现代前端框架的设计思路
- 掌握虚拟DOM和diff算法的实现
- 理解React的调度机制和性能优化策略

## 注意事项

这是一个用于学习目的的简化版本，不适用于生产环境。实际的React包含更多优化和功能，如并发模式、错误边界、Context API等。

## 参考资料

本项目参考了React官方文档以及相关的技术文章，旨在帮助开发者更好地理解React的内部实现。
