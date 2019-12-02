const StubbornQueue = require('../stubbornQueue');

function createQueue(config = {}) {
    var queue = null;

    config.maxTaskAge = config.maxTaskAge || 1000, // 1 sec
    config.maxRetries = config.maxRetries || 5,
    config.maxParallelTasks = config.maxParallelTasks || 2,
    config.refreshPeriod = config.refreshPeriod || 50,
    config.persistPeriod = config.persistPeriod || 9999999,
    config.retryWaitPeriod = config.retryWaitPeriod || 150,
    config.checkDoneWaitPeriod = config.checkDoneWaitPeriod || 200,
    config.checkFinishedTimeout = config.checkFinishedTimeout || 1000,
    config.logger = config.logger || (str => {})
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

test("CheckFinishedAsync has priority over CheckFinished", done => {
    var calledMethods = []
    var queue = createQueue({
        checkFinished: (i, t) => {
            calledMethods.push("checkFinished")
            return true
        },
        checkFinishedAsync: (i, t, c) => {
            calledMethods.push("checkFinishedAsync")
            c(true)
        }
    })
    queue.start()
    queue.push("1")
    setTimeout(() => {
        expect(calledMethods.length).toBe(1)
        expect(calledMethods[0]).toBe("checkFinishedAsync")
        queue.stop()
        done()
    }, 300);
});

test("CheckFinished delay", done => {
    var flag = true;
    var queue = true
    queue = createQueue({
        checkFinished: ((i, t) => {
            queue.checksList.push(t)
            if(flag) {
                flag = false
                return "ErroRr"
            }
            return true
        })
    })
    queue.start()
    queue.push("1")
    setTimeout(() => {
        expect(queue.startsList.length).toBe(1)
        expect(queue.startsList[0]).toBe("1")
        setTimeout(() => {
            expect(queue.checksList.length).toBe(2)
            expect(queue.startsList[1]).toBe("1")
            setTimeout(() => {
                expect(queue.checksList.length).toBe(2)
                queue.stop()
                done()
            }, 500);
        }, 260);
    }, 260);
});

test("CheckFinishedAsync delay", done => {
    var flag = true;
    var queue = true
    queue = createQueue({
        checkFinishedAsync: ((i, t, c) => {
            queue.checksList.push(t)
            if(flag) {
                flag = false
                c("ErroRr")
                return
            }
            c(true)
        })
    })
    queue.start()
    queue.push("1")
    setTimeout(() => {
        expect(queue.startsList.length).toBe(1)
        expect(queue.startsList[0]).toBe("1")
        setTimeout(() => {
            expect(queue.checksList.length).toBe(2)
            expect(queue.startsList[1]).toBe("1")
            setTimeout(() => {
                expect(queue.checksList.length).toBe(2)
                queue.stop()
                done()
            }, 500);
        }, 260);
    }, 260);
});

test("CheckFinishedAsync is indeed async - x10", done => {

});

test("CheckFinishedAsync Fail state", done => {

});

test("CheckFinished Fail state", done => {

});

test("CheckFinishedAsync unknown state", done => {

});

test("CheckFinished unknown state", done => {

});

test("CheckFinishedAsync timeout", done => {

});

test("CheckFinished timeout", done => {

});