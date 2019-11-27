const StubbornQueue = require('../stubbornQueue');

function createQueue(config) {
    config.maxTaskAge = config.maxTaskAge || 1000, // 1 sec
    config.maxRetries = config.maxRetries || 5,
    config.maxParallelTasks = config.maxParallelTasks || 2,
    config.refreshPeriod = config.refreshPeriod || 500,
    config.persistPeriod = config.persistPeriod || 9999999,
    config.retryWaitPeriod = config.retryWaitPeriod || 200,
    config.checkDoneWaitPeriod = config.checkDoneWaitPeriod || 200,
    config.checkFinishedTimeout = config.checkFinishedTimeout || 1000,
    config.logger = config.logger || (str => {})
    config.startTask = config.startTask || ((id, taskParams) => {})
    if(!config.checkFinishedAsync && !config.checkFinished)
        config.checkFinishedAsync = (id, taskParams) => {}
    return new StubbornQueue(config)
}

test("starts work", done => { throw new Error("Not Implemented") });
test("start work on 2 tasks", done => { throw new Error("Not Implemented") });
test("Start 2 of 4 tasks", done => { throw new Error("Not Implemented") });
test("Start tasks 1 by 1", done => { throw new Error("Not Implemented") });
