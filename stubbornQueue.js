var states = {
    done: "done",
    started: "started",
    enqueued: "enqueued"
}

class Task {
    constructor(id, taskParams) {
        this.id = id
        this.taskParams = taskParams
        this.state = states.enqueued
        this.created = new Date().getTime()
        this.retries = 0
        this.lastRetry = null
    }
}

var defaultConfig = {
    name: "Queue",
    taskType: "Queue-Task",
    maxTaskAge: (30 * 24 * 60 * 60 * 1000), // 30 days
    maxRetries: 9999,
    
    refreshPeriod: 5000,
    persistPeriod: 5000,
    retryWaitPeriod: 100,
    checkDoneWaitPeriod: 100,

    startTask: function (taskParams) {},
    checkTaskFinished: function (taskParams) { return false },
    checkTaskFinishedAsync: function (taskParams, callback) { callback(false) },
}

defaultConfig.startTask = null
defaultConfig.checkTaskFinished = null
defaultConfig.checkTaskFinishedAsync = null


class StubbornQueue {
    constructor(config = defaultConfig) {
        this.queue = [] // { ID: item }
        this.running = false

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
        var task = new Task(id, taskParams)
        this.queue.push(task)
    }
}

function _manage(stubbornQueue) {
    // TODO : implement
}

function _checkDone(stubbornQueue) {
    // TODO : implement
}

function _retry(stubbornQueue) {
    // TODO : implement
}

function _persist(stubbornQueue) {
    // TODO : implement
}

module.exports = StubbornQueue