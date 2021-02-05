const got = require("got")
const { DonatePayWS } = require("./DonatePayWS")
const { Debug } = require("./utils")

const donatePayEndpoints = {
	ws: "wss://centrifugo.donatepay.ru:43002/connection/websocket",
	alertBoxWidget: "https://widget.donatepay.ru/alert-box/widget/",
	socketToken: "https://widget.donatepay.ru/socket/token"
}

class DonatePay {
	constructor(token) {
		this._token = token
	}

	async connect() {
		return got(donatePayEndpoints.alertBoxWidget + this._token)
			.then(parseAlertBoxWidget)
			.then(async ({ cookie, csrfToken, user }) => ({
				...await getSocketToken(cookie, csrfToken, this._token),
				user
			}))
			.then(setupDonatePayWs)
			// .catch(Debug.error)
	}
}

function parseAlertBoxWidget({ body, headers }) {
	const values = {
		cookie: headers["set-cookie"].find(cookie => cookie.match(/laravel_session/)),
		csrfToken: body.match(/return '(.+)';/)[1],
		user: body.match(/return parseInt\('(.+)'\);/)[1]
	}

	for (const key in values) {
		if (!values[key]) {
			const stringValues = JSON.stringify(values)
			throw new Error(`Cannot parse alertBoxWidget response ${stringValues}`)
		}	
	}

	return values
}

function getSocketToken(cookie, csrfToken, token) {
	return got.post(donatePayEndpoints.socketToken, {
		json: {
			_token: csrfToken,
			token
		},
		headers: { cookie }
	}).json()
}

function setupDonatePayWs(data) {	
	const socket = new DonatePayWS(donatePayEndpoints.ws)
	socket.on("open", () => connectToDonatePay(socket, data))
	socket.on("error", error => {
		Debug.error("DonatePayWS error: ", error)
		try {
			socket.reopen()
		} catch (e) {
			Debug.error("Can't reopen socket. Error:", e)
		}
	})
	socket.on("close", event => {
	    Debug.log(`[close] ${
	    	event.wasClean ? "Closed connection clearly" : "Droped connection"
	    }, code=${event.code} reason=${event.reason}`)
	})
	return socket
}

async function connectToDonatePay(socket, { user, time, token }) {
	return socket.connect(user, time, token)
		.then(({ client }) => { if (!client) throw new Error("Cannot connect") })
		.then(() => socket.subscribe("notifications", user))
		.then(({ status }) => { if (!status) throw new Error("Cannot subscribe to notifications") })
		.then(socket.reconnectOnDrop.bind(socket))
		.catch((e) => {
			Debug.error(e)
			socket.close(undefined, "Error")
		})
}

module.exports = { DonatePay }
