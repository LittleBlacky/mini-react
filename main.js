function createElement(type, props, ...children) {
    return {
        type,
        props: {
            ...props,
            children
        },
    }
}

function render(element, container) {
    const { type, props } = element;
    const dom = document.createElement(tag);
    for (const key in props) {
        if (key === 'children') {
            props[key].forEach(child => render(dom, child));
        } else {
            dom[key] = props[key];
        }
    }
    container.appendChild(dom);
}

export {
    createElement,
    render,
};

export default MiniReact;