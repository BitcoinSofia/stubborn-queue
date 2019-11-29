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

// test("Retries on fail", done => { throw new Error("Not Implemented") });
// test("Retries on timeout", done => { throw new Error("Not Implemented") });
// test("Drops on max retries (if configured)", done => { throw new Error("Not Implemented") });
// test("Fails on max retries", done => { throw new Error("Not Implemented") });
// test("Drops on total timeout (if configured)", done => { throw new Error("Not Implemented") });
// test("Fails on total timeout", done => { throw new Error("Not Implemented") });
