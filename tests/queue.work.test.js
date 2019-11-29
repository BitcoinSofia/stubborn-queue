const StubbornQueue = require('../stubbornQueue');

function createQueue(config = {}) {
    var queue = null;

    config.maxTaskAge = config.maxTaskAge || 1000, // 1 sec
        config.maxRetries = config.maxRetries || 5,
        config.maxParallelTasks = config.maxParallelTasks || 2,
        config.refreshPeriod = config.refreshPeriod || 100,
        config.persistPeriod = config.persistPeriod || 9999999,
        config.retryWaitPeriod = config.retryWaitPeriod || 150,
        config.checkDoneWaitPeriod = config.checkDoneWaitPeriod || 40,
        config.checkFinishedTimeout = config.checkFinishedTimeout || 100,
        config.logger = config.logger || (str => { })
    config.startTask = config.startTask || ((i, t) => { 
        queue.startsList.push(t)
    })
    if (!config.checkFinishedAsync && !config.checkFinished)
        config.checkFinishedAsync = ((i, t, c) => {
            queue.checksList.push(t)
            c(true)
        })
    queue = new StubbornQueue(config)
    queue.startsList = []
    queue.checksList = []
    return queue
}

test("starts work", done => {
    var queue = createQueue()
    queue.start()
    queue.push("1")
    setTimeout(() => {
        expect(queue.startsList.length).toBe(1)
        expect(queue.startsList[0]).toBe("1")
        queue.stop()
        done()
    }, 300);
});

test("start work on 2 tasks", done => {
    var queue = createQueue()
    queue.start()
    queue.push("1")
    queue.push("2")
    setTimeout(() => {
        expect(queue.startsList.length).toBe(2)
        queue.stop()
        done()
    }, 300);
});

test("Start 2 of 4 tasks", done => {
    var queue = createQueue()
    queue.start()
    queue.push("1")
    queue.push("2")
    queue.push("3")
    queue.push("4")
    setTimeout(() => {
        expect(queue.startsList.length).toBe(2)
        queue.stop()
        done()
    }, 200);
});

test("Start tasks 1 by 1", done => {
    var queue = createQueue({ maxParallelTasks: 1 })
    queue.start()
    queue.push("1")
    queue.push("2")
    queue.push("3")
    setTimeout(() => {
        expect(queue.startsList.length).toBe(1)
        setTimeout(() => {
            var items = queue.startsList.sort()
            expect(items.length).toBe(3)
            expect(items[0]).toBe('1')
            expect(items[1]).toBe('2')
            expect(items[2]).toBe('3')
            queue.stop()
            done()
        }, 500);
    }, 200);
});