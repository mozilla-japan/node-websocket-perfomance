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
	a = client.on("message", (message) => {
		let onMessagePromise = new Promise((resolve, reject) => {
			resolve(message);
		}).then((message) => {
			onMessageFunction(message);
			console.log("onmessage func (1)")
			return message;
		}).then((message) => {
			client.send(message);
			console.log("client.send (2)")
		}).catch((e) => {
			console.err(`[${new Date().toISOString()}]${e}`)
		});
	});
})

function onMessageFunction(message) {
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
 * @param {Number} newValue - 0 or 書き込む値
 * @param {Number} port - GPIOピンの場所
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