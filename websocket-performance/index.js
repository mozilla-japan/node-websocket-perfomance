/*
 * node-websocket-perfomance
 * © WebDINO Japan
 */

// modules
const WebSocket = require("ws");
const express = require("express");
const http = require("http");
const {
	exec
} = require("child_process");


// settings
const PORT = 8080;
const GREEN_GPIO = 29;
const ORANGE_GPIO = 25;
const MODE = "out";
// initialize
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({
	server: server
});
var greenValue = 0;
var orangeValue = 0;
writeGPIO(greenValue, GREEN_GPIO);
writeGPIO(orangeValue, ORANGE_GPIO);
// 0を書き込む



// wss
wss.on("connection", (client) => {
	console.log(`[${new Date().toISOString()}]接続されました。`);
	client.on("message", (message) => {
		onMessageFunction(message);
		client.send(message);
	});
})

function onMessageFunction(message) {
	/**
	 * message = {
	 * 	id:
	 * }
	 */
	//console.log(message)
	let value = JSON.parse(message);

	switch (value.data) {
		case "green":
			greenValue = greenValue ? 0 : 1;
			writeGPIO(greenValue, GREEN_GPIO);
			break;
		case "orange":
			orangeValue = orangeValue ? 0 : 1;
			writeGPIO(orangeValue, ORANGE_GPIO);
			break;
		case "none":
			break;
		default:
			break;
	}
}

/**
 * 
 * @param {Number} 0 or 1
 */
function writeGPIO(newValue, port) {
	exec(`gpio write ${port} ${newValue}`, (err, stdout, stderr) => {
		if (err) {
			//throw `[GPIO]ERROR:${stderr}`
		}
		/*
		console.log(`[GPIO]: writing.
			PIN:${port}(wPI)
			VALUE:${newValue}
		`);
		*/
	});
}
// 静的ファイルの提供
app.use('/', express.static(__dirname + '/public'));

server.listen(PORT, () => {
	console.info("server litening on " + PORT)
});