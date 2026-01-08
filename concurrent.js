let nextUnitOfWork = null;

function performUnitOfWork(nextUnitOfWork) {
    // TODO
}

function workLoop(deadline) {
    let shouldYield = false;
    while (nextUnitOfWork && !shouldYield) {
        nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
        shouldYield = deadline.timeRemaining() < 1
    }
    requestIdleCallback(workLoop);
}

requestIdleCallback(workLoop);