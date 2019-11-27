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

test("Correct value is passed for startTask", done => { throw new Error("Not Implemented") });
test("Correct value is passed for CheckFinished", done => { throw new Error("Not Implemented") });
test("Correct value is passed for CheckFinishedAsync", done => { throw new Error("Not Implemented") });
test("IDs are unique AND don't change", done => { throw new Error("Not Implemented") });
