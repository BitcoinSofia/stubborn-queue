var states = {
    done: "done",
    failed: "failed",
    started: "started",
    enqueued: "enqueued"
}

class Task {
    constructor(id, taskParams, taskType) {
        this.id = id
        this.taskParams = taskParams
        this.state = states.enqueued
        this.type = taskType
        this.created = new Date().getTime()
        this.retries = 0
        this.failures = 0
        this.lastError = ""
        this.lastRetry = null
        this.retryNow = false
        this.awaitingResult = false
    }
}

var defaultConfig = {
    name: "Queue",
    taskType: "Queue-Task",
    maxTaskAge: (365 * 24 * 60 * 60 * 1000), // 1 year
    maxRetries: 9999,
    maxParallelTasks: 8,
    refreshPeriod: 5000,
    persistPeriod: 5000,
    retryWaitPeriod: 100,
    checkDoneWaitPeriod: 100,
    checkFinishedTimeout: 10000,
    throwOnTaskTooOld: true,
    throwOnMaxRetryReached: true,
    startTask: function (id, taskParams) {},
    checkFinished: function (id, taskParams) { return "True, False or Error Message" },
    checkFinishedAsync: function (id, taskParams, callback) { callback("True, False or Error Message") },
    logger: function(str) { console.log(str) },
    errorHandler: function(error) {} 
}

defaultConfig.startTask = null
defaultConfig.checkFinished = null
defaultConfig.checkFinishedAsync = null
defaultConfig.errorHandler = null

class StubbornQueue {
    constructor(config = defaultConfig) {
        this.tasks = {} // { ID: item }
        this.running = false

        this.manageWorkerId = "<not started>"
        this.checkDoneWorkerId = "<not started>"
        this.retryWorkerId = "<not started>"
        this.persistingWorkerId = "<not started>"

        for (const key in defaultConfig)
            this[key] = config[key] !== undefined ? config[key] : defaultConfig[key]

        if (!this.startTask)
            _raiseError(queue, ReferenceError(this.name + ".startTask must be set"))
        if (!this.checkFinished && !this.checkFinishedAsync)
            _raiseError(queue, ReferenceError(this.name + ".checkFinished or " +
                this.name + ".checkFinishedAsync must be set"))

        _load(this)
    }

	getTasks() {
		var tasks = []
		for (const i in this.tasks)
            tasks.push(this.tasks[i])
		return tasks
    }
    
    start() {
        this.running = true
		_manage(this)
		this.manageWorkerId = setInterval(() => {
			_manage(this)
		}, this.refreshPeriod)
		this.checkDoneWorkerId = setInterval(() => {
			_checkDone(this)
		}, this.checkDoneWaitPeriod)
		this.retryWorkerId = setInterval(() => {
			_retry(this)
		}, this.retryWaitPeriod)
		this.persistingWorkerId = setInterval(() => {
			_persist(this)
		}, this.persistPeriod)
    }

	stop() {
		this.running = false
		clearInterval(this.manageWorkerId)
		clearInterval(this.checkDoneWorkerId)
		clearInterval(this.retryWorkerId)
		clearInterval(this.persistingWorkerId)
	}

    push(taskParams) {
        var id = new Date().getTime() + Math.random().toString().replace(".", "")
        var task = new Task(id, taskParams, this.taskType)
        this.tasks[id] = task
    }
}

function _manage(queue) {
    const now = new Date().getTime()

    var tasks = queue.getTasks();

    if (tasks.length === 0)
        return

    for (let i = 0; i < tasks.length; i++) {
        const task = tasks[i];

        if (task.state === states.done) {
            delete queue.tasks[task.id]
            continue
        }

        if (task.retries >= queue.maxRetries) {
            var message = "Max retries reached on Task #" + task.id + " : " + task.value
            delete queue.tasks[task.id]
            if (queue.throwOnMaxRetryReached)
                _raiseError(queue, new Error(message))
            else
                queue.logger(message)
            continue
        }

        if (task.created + queue.maxTaskAge < now) {
            var message = "Max age reached on Task #" + task.id + " : " + task.value
            delete queue.tasks[task.id]
            if (queue.throwOnTaskTooOld)
                _raiseError(queue, new Error(message))
            else
                queue.logger(message)
            continue
        }

        if (queue.maxParallelTasks <= tasks.filter(t=> t.retryNow || t.awaitingResult).length)
            continue

        if (task.state === states.enqueued) {
            task.retryNow = true
            continue
        }
        if (task.state === states.failed
            && task.lastRetry + queue.retryWaitPeriod < now) {
            task.retryNow = true
            continue
        }
        if (task.state === states.started
            && task.lastRetry + queue.checkFinishedTimeout < now
            && task.lastRetry + queue.retryWaitPeriod < now) {
            task.retryNow = true
            continue
        }
    }
}

function _setTaskOutcome(queue, task, outcome) {
    if (!task.id in queue.tasks)
        return // Task was removed
    task = queue.tasks[task.id]

    if(typeof(outcome) === "boolean") {
        if (outcome) {
            task.state = states.done
            task.awaitingResult = false
            task.retryNow = false
        }
        else { /* nothing */ }
    }
    else {
        outcome = outcome.toString()
        task.state = states.failed
        task.awaitingResult = false
        task.failures += 1
        task.lastError = outcome
    }
}

function _checkDone(queue) {
    var checkTask = (task) => {
        if (queue.checkFinishedAsync)
            queue.checkFinishedAsync(task.id, task.taskParams,
                (outcome) => _setTaskOutcome(queue, task, outcome))
        else
            _setTaskOutcome(queue, task,
                queue.checkFinished(task.id, task.taskParams))
    }

    var tasks = queue.getTasks().filter(t => t.awaitingResult)
    tasks.forEach(checkTask);
}

function _retry(queue) {
    var tasks = queue.getTasks().filter(t => t.retryNow)
    tasks.forEach(task => {
        queue.startTask(task.id, task.taskParams)
        task.lastRetry = new Date().getTime()
        task.retries++
        task.retryNow = false
        task.awaitingResult = true
    });
}

var fs = require("fs")

function _persist(queue) {
    var fileName = queue.name + " - " + queue.taskType + ".json"
    var state = JSON.stringify(queue.tasks)
    fs.write(fileName, state, (err) => { if(err) _raiseError(queue, err) })
}

function _load(queue) {
    var fileName = queue.name + " - " + queue.taskType + ".json"
    if(fs.existsSync(fileName))
        fs.read(fileName, (err, data)=> { 
            if(err) _raiseError(queue, err)
            var loadedTasks = JSON.parse(data)
            for (const i in loadedTasks) {
                if(!queue[i])
                    queue[i] = loadedTasks[i]
            }
        })
}

function _raiseError(queue, error) {
    if (queue.errorHandler)
        queue.errorHandler(error)
    else
        throw error
}

module.exports = StubbornQueue