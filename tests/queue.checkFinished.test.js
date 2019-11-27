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

test("CheckFinishedAsync has priority over CheckFinished", done => { throw new Error("Not Implemented") });
test("CheckFinished delay", done => { throw new Error("Not Implemented") });
test("CheckFinishedAsync delay", done => { throw new Error("Not Implemented") });
test("CheckFinishedAsync is indeed async - x10", done => { throw new Error("Not Implemented") });
test("CheckFinishedAsync Fail state", done => { throw new Error("Not Implemented") });
test("CheckFinished Fail state", done => { throw new Error("Not Implemented") });
test("CheckFinishedAsync unknown state", done => { throw new Error("Not Implemented") });
test("CheckFinished unknown state", done => { throw new Error("Not Implemented") });
test("CheckFinishedAsync timeout", done => { throw new Error("Not Implemented") });
test("CheckFinished timeout", done => { throw new Error("Not Implemented") });
