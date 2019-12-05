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

test("Retries on fail", done => {
    var flag = true;
    var queue = true
    queue = createQueue({
        checkFinishedAsync: ((i, t, c) => {
            queue.checksList.push(t)
            if(flag) {
                c("ErroRr")
                flag = false
                return
            }
            c(true)
        })
    })
    
    queue.start()
    queue.push("1")
    setTimeout(() => {
        expect(queue.startsList.length).toBe(2)
        expect(queue.checksList.length).toBe(2)
        expect(queue.startsList[0]).toBe("1")
        expect(queue.startsList[1]).toBe("1")
        queue.stop()
        done()
    }, 500);
});

test("Retries on timeout", done => {
    var queue = createQueue({
        checkDoneWaitPeriod: 1000
    })
    
    queue.start()
    queue.push("1")
    setTimeout(() => {
        expect(queue.startsList.length).toBe(3)
        expect(queue.startsList[0]).toBe("1")
        expect(queue.startsList[1]).toBe("1")
        expect(queue.startsList[2]).toBe("1")
        queue.stop()
        done()
    }, 500);
});

test("Drops on max retries (if configured)", done => {
    var queue = createQueue({
        checkFinishedAsync: (i,t,c)=>{ /* Callback not called */ },
        maxRetries: 3,
        throwOnTaskTooOld: true,
        throwOnMaxRetryReached: false,
    })
    
    queue.start()
    queue.push("1")
    setTimeout(() => {
        expect(queue.startsList.length).toBe(3)
        expect(queue.startsList[0]).toBe("1")
        expect(queue.startsList[1]).toBe("1")
        expect(queue.startsList[2]).toBe("1")
        queue.stop()
        done()
    }, 900);
});

test("Fails on max retries", done => {
    var queue = null
    var errors = []
    queue = createQueue({
        checkFinishedAsync: (i,t,c)=>{ /* Callback not called */ },
        maxRetries: 3,
        throwOnTaskTooOld: true,
        throwOnMaxRetryReached: true,
        errorHandler: (e)=>{ 
            errors.push(e)
            console.log("error logged - " + e)
        }
    })
    
    queue.start()
    queue.push("1")
    setTimeout(() => {
        expect(queue.startsList.length).toBe(3)
        expect(queue.startsList[0]).toBe("1")
        expect(queue.startsList[1]).toBe("1")
        expect(queue.startsList[2]).toBe("1")
        expect(errors.length).toBe(1)
        expect(errors[0].message).toEqual(
            expect.stringMatching("Max retries reached on Task #[0-9]*"))
        queue.stop()
        done()
    }, 900);
});

test("Drops on total timeout (if configured)", done => {
    var queue = createQueue({
        checkFinishedAsync: (i,t,c)=>{ /* Callback not called */ },
        maxTaskAge: 200,
        retryWaitPeriod: 150,
        checkDoneWaitPeriod: 50,
        checkFinishedTimeout: 50,
        throwOnTaskTooOld: false,
        throwOnMaxRetryReached: true,
    })
    
    queue.start()
    queue.push("1")
    setTimeout(() => {
        expect(queue.startsList.length).toBe(1)
        expect(queue.startsList[0]).toBe("1")
        queue.stop()
        done()
    }, 900);
});

test("Fails on total timeout", done => {
    var queue = null
    var errors = []
    queue = createQueue({
        checkFinishedAsync: (i,t,c)=>{ /* Callback not called */ },
        maxTaskAge: 200,
        throwOnTaskTooOld: true,
        throwOnMaxRetryReached: true,
        errorHandler: (e)=>{ 
            errors.push(e)
            console.log("error logged - " + e)
        }
    })
    
    queue.start()
    queue.push("1")
    setTimeout(() => {
        expect(queue.startsList.length).toBe(1)
        expect(queue.startsList[0]).toBe("1")
        expect(errors.length).toBe(1)
        expect(errors[0].message).toEqual(
            expect.stringMatching("Max age reached on Task #[0-9]*"))
        queue.stop()
        done()
    }, 900);
});

