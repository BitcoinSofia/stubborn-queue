const StubbornQueue = require('../stubbornQueue');
const fs = require("fs")

function createQueue(config = {}) {
    var queue = null;

    config.maxTaskAge = config.maxTaskAge || 100000, // 100 sec
    config.maxRetries = config.maxRetries || 500,
    config.maxParallelTasks = config.maxParallelTasks || 1,
    config.refreshPeriod = config.refreshPeriod || 50000, // 50 sec
    config.persistPeriod = config.persistPeriod || 50,
    config.retryWaitPeriod = config.retryWaitPeriod || 15000, // 15 sec
    config.checkDoneWaitPeriod = config.checkDoneWaitPeriod || 10000, // 10 sec
    config.checkFinishedTimeout = config.checkFinishedTimeout || 10000 // 10 sec,
    config.logger = config.logger || (str => { })
    config.startTask = config.startTask || ((i, t) => { 
        queue.startsList.push(t)
    })
    if (!config.checkFinishedAsync && !config.checkFinished)
        config.checkFinishedAsync = ((i, t, c) => {
            queue.checksList.push(t)
            c(false)
        })
    queue = new StubbornQueue(config)
    queue.startsList = []
    queue.checksList = []
    return queue
}

var expectedParams = [
    {taskData: 42},
    "{taskData: 42}",
    {taskData: "42"}
].sort()

test("persisting works", done => {
    var queue = createQueue({
        name:"SaveTestQueue",
        taskType:"SavedTask",
        loadFromFile : false,
        persistToFile : true
    });

    for (let i = 0; i < expectedParams.length; i++)
        queue.push(expectedParams[i])

    queue.start()

    setTimeout(() => {
        fs.open("./SaveTestQueue - SavedTask.json", "r", (err, fd) => {
            var text = fs.readFileSync(fd)
            var data = JSON.parse(text)
            var taskParams = Object.keys(data).map(i=>data[i].taskParams).sort()
            expect(taskParams.length).toBe(expectedParams.length)
            for (let i = 0; i < taskParams.length; i++) {
                expect(JSON.stringify(taskParams[i]))
                    .toBe(JSON.stringify(expectedParams[i]))
            }
            queue.stop()
            done()
        })
    }, 100);
});

test("loading works", done => { 
    
    var queue = createQueue({
        name:"SaveTestQueue",
        taskType:"SavedTask",
        loadFromFile : true,
        persistToFile : false
    });

    queue.start()

    setTimeout(() => {
        fs.open("./SaveTestQueue - SavedTask.json", "r", (err, fd) => {
            var taskParams = Object.keys(queue.tasks).map(i=>queue.tasks[i].taskParams).sort()
            expect(taskParams.length).toBe(expectedParams.length)
            for (let i = 0; i < taskParams.length; i++) {
                expect(JSON.stringify(taskParams[i]))
                    .toBe(JSON.stringify(expectedParams[i]))
            }
            queue.stop()
            done()
        })
    }, 100);
});
