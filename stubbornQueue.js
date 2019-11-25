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
        this.lastRetry = null
    }
}

var defaultConfig = {
    name: "Queue",
    taskType: "Queue-Task",
    maxTaskAge: (365 * 24 * 60 * 60 * 1000), // 1 year
    maxRetries: 9999,

    processInParallel: true,
    throwOnTaskTooOld: true,
    throwOnMaxRetryReached: true,

    refreshPeriod: 5000,
    persistPeriod: 5000,
    retryWaitPeriod: 100,
    checkDoneWaitPeriod: 100,
    checkFinishedTimeout: 10000,

    startTask: function (id, taskParams) {},
    checkFinished: function (id, taskParams) { return false },
    checkFinishedAsync: function (id, taskParams, callback) { callback(false) },
    logger: function(str) { console.log(str) }
}

defaultConfig.startTask = null
defaultConfig.checkTaskFinished = null
defaultConfig.checkTaskFinishedAsync = null


class StubbornQueue {
    constructor(config = defaultConfig) {
        this.tasks = {} // { ID: item }
        this.running = false
        this.tasksToRetry = []
        this.tasksAwaitingResult = []


        this.manageWorkerId = "<not started>"
        this.checkDoneWorkerId = "<not started>"
        this.retryWorkerId = "<not started>"
        this.persistingWorkerId = "<not started>"

        for (const key in defaultConfig)
            this[key] = config[key] !== undefined ? config[key] : defaultConfig[key]

        if (!this.startTask)
            throw ReferenceError(this.poolName + ".startTask must be set")
        if (!this.checkTaskFinished && !this.checkTaskFinishedAsync)
            throw ReferenceError(this.poolName + ".checkTaskFinished or " +
                this.poolName + ".checkTaskFinishedAsync must be set")
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
    if (queue.tasks.length === 0)
        return

    if (queue.processInParallel !== true
        && queue.tasksAwaitingResult.length >= 1)
        return
    
    const now = new Date().getTime()

    var toStart = []

    for (let i = 0; i < queue.tasks.length; i++) {
        const task = queue.tasks[i];

        if (task.state === states.done) {
            delete queue.tasks[i]
            continue
        }

        if (task.retries >= queue.maxRetries) {
            var message = "Max retries reached on Task #" + task.id + " : " + task.value
            if (queue.throwOnMaxRetryReached) 
                throw new Error(message)
            else {
                queue.logger(message)
                delete queue.tasks[i]
                continue
            }
        }

        if (task.created + queue.maxTaskAge < now) {
            var message = "Max age reached on Task #" + task.id + " : " + task.value
            if (queue.throwOnTaskTooOld)
                throw new Error(message)
            else {
                queue.logger(message)
                delete queue.tasks[i]
                continue
            }
        }

        if (!queue.processInParallel && toStart.length > 0)
            break

        if (task.state === states.enqueued) {
            toStart.push(task)
            continue
        }
        if (task.state === states.failed
            && task.lastRetry + queue.retryWaitPeriod < now) {
            toStart.push(task)
            continue
        }
        if (task.state === states.started
            && task.lastRetry + queue.checkFinishedTimeout < now
            && task.lastRetry + queue.retryWaitPeriod < now) {
            toStart.push(task)
            continue
        }
    }

    for (let i = 0; i < toStart.length; i++)
        queue.tasksToRetry.push(toStart[i])
}

function _checkDone(queue) {
    // TODO : implement
}

function _retry(queue) {
    // TODO : implement
}

function _persist(queue) {
    // TODO : implement
}

module.exports = StubbornQueue