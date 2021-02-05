const { WebSocketWrapper } = require("./WebSocketWrapper")
const { later } = require("./utils")

class DonatePayWS extends WebSocketWrapper {
	async connect(user, timestamp, token) {
		return this.request("connect", {
			user: String(user),
			info: "",
			timestamp: String(timestamp),
			token: String(token)
		})
	}

	async subscribe(channel, user) {
		return this.request("subscribe", {
			channel: channel + "#" + user
		})
	}

	async ping() {
		return this.request("ping")
	}

	reconnectOnDrop() {
		const id = setInterval(async () => {
			const isTimeout = await Promise.race([
				this.ping(),
				later(5 * 1000, true),
			])

			if (isTimeout) {
				clearInterval(id)
				this.reopen(1012, "Server stoped pinging")
			}
		}, 30 * 1000)

		this.once("error", () => clearInterval(id))
		this.once("close", ({ wasClean }) => {
			clearInterval(id)
			if (!wasClean)
				setTimeout(() => this.reopen(), 60 * 1000)
		})
	}
}

module.exports =  { DonatePayWS }
