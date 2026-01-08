const TEXT_ELEMENT = 'TEXT_ELEMENT'

function createElement(type, props, ...children) {
    return {
        type,
        props: {
            ...props,
            children: children.map((child) => typeof child === 'object' ? child : createTextElement(child))
        },
    }
}

function createTextElement(text) {
    return {
        type: TEXT_ELEMENT,
        props: {
            nodeValue: text,
            children: []
        }
    }
}

function render(element, container) {
    const { type, props } = element;
    const dom = type === TEXT_ELEMENT ? document.createTextNode('') : document.createElement(tag);
    const isProperty = key => key !== "children";
    Object.keys(props).filter(isProperty).forEach(key => dom[key] = props[key]);
    props['children'].forEach((child) => render(child, dom));
    container.appendChild(dom);
}

export {
    createElement,
    render,
};

export default MiniReact;