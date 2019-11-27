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

test("persisting works", done => { throw new Error("Not Implemented") });
test("loading works", done => { throw new Error("Not Implemented") });
