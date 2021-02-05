function later(time, value) {
	return new Promise(res => {
		const id = setTimeout(value => {
			clearTimeout(id)
			res(value)
		}, time, value)
	})
}

const isoDateRegex = /(.+)T(.+)\..+Z/
const getDateString = (currentDate = new Date()) => {
	const [ , date, time ] = currentDate.toISOString().match(isoDateRegex)
	return `[${date}][${time}]`
}

const Debug = {
	log: console.log.bind(console, getDateString()),
	error: console.error.bind(console, getDateString())
}

module.exports = {
	Debug,
	later
}