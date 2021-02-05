const { DonatePay, Debug } = require("./DonatePay")
const { donatePay, discord } = require("./config")

const token = ""
const client = new DonatePay(token)

client.connect().then(socket => {
	socket.on("message", handleDonation)
	socket.on("error", Debug.error.bind(null, "DonatePay WebSocket Error"))
}).catch(Debug.error.bind(null, "Connect DonatePay Error"))


function handleDonation({ data }) {
	const { notification } = data
	if (notification?.type !== "donation") return
	const { name, comment, sum } = JSON.parse(notification.vars)
	// Do smth with data
}
