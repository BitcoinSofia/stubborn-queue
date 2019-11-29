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

test("Correct value is passed for startTask", done => { 
    var queue = createQueue()
    queue.start()
    queue.push({"key":"value"})
    setTimeout(() => {
        expect(queue.startsList.length).toBe(1)
        expect(queue.startsList[0].key).toBe("value")
        queue.stop()
        done()
    }, 300);
 });

test("Correct value is passed for CheckFinished", done => { 
    var queue = null
    queue = createQueue({
        checkFinished: ((i, t) => {
            queue.checksList.push(t)
            return true
        })
    })
    queue.start()
    queue.push({"key":"value"})
    setTimeout(() => {
        expect(queue.checksList.length).toBe(1)
        expect(queue.checksList[0].key).toBe("value")
        queue.stop()
        done()
    }, 300);
 });

test("Correct value is passed for CheckFinishedAsync", done => { 
    var queue = createQueue()
    queue.start()
    queue.push({"key":"value"})
    setTimeout(() => {
        expect(queue.checksList.length).toBe(1)
        expect(queue.checksList[0].key).toBe("value")
        queue.stop()
        done()
    }, 300);
 });

