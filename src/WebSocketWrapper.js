const EventEmitter = require('events')
const WebSocket = require("ws")

class WebSocketWrapper extends EventEmitter {
	constructor(url) {
		super(...arguments)
		this._url = url
		this._socket = new WebSocket(url)
		this._uid = 0
		this._opened = false
		this.attachHandlers()
	}

	attachHandlers() {
		this._socket.onopen = event => {
			this._opened = true
			this._emit("open", event)
		}

		this._socket.onmessage = event => {
			const data = JSON.parse(event.data)
			this._emit(data.method, data.body)
		}

		this._socket.onerror = event =>
			this._emit("error", event)

		this._socket.onclose = event => {
			this._opened = false
			this._emit("close", event)
		}
	}

	reopen() {
		this.close(...arguments)
		this._socket = new WebSocket(this._url)
		this.attachHandlers()
	}

	close() {
		this._socket.close(...arguments)
		this._opened = false
	}

	async request(event, data) {
		const promise = new Promise((resolve, reject) => {
			function onResolve(value) {
				this.off("error", onReject)
				resolve(value)
			}

			function onReject(reason) {
				this.off(event, onResolve)
				reject(reason)
			}

			this.once(event, onResolve)
			this.once("error", onReject)
		})

		this.emit(event, data)
		return promise
	}

	emit(event, data) {
		this.send({
			method: String(event),
			params: data,
			uid: String(++this._uid)
		})
	}

	send(payload) {
		this._socket.send(JSON.stringify(payload))
	}

	_emit(event, data) {
		super.emit(event, data)
	}
}

module.exports = { WebSocketWrapper }
