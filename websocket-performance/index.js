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
const GPIO = 29;
const MODE = "OUT";
// initialize
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({
	server: server
});
var pinValue = 0;
writeGPIO(false);
// 0を書き込む



// wss
wss.on("connection", (client) => {
	console.log("接続されました。");
	client.on("message", (message) => {
		onMessageFunction(message);
		client.send(message);
	});
})

function onMessageFunction(message) {
	//console.log(message);
	//メッサージが来た時に実行する関数。pong以外を書く。
	//console.log(message);
	pinValue = pinValue ? 0:1;
	writeGPIO(pinValue);
	
}

/**
 * 
 * @param {Number} 0 or 1
 */
function writeGPIO(newValue) {

	exec(`gpio ${MODE} ${GPIO} ${newValue}`, (err, stdout, stderr) => {
		if (err) {
			//throw `[GPIO]ERROR:${stderr}`
		}
		console.log(`[GPIO]: writing.
			PIN:${GPIO}(wPI)
			VALUE:${newValue}
		`);
	});
}
// 静的ファイルの提供
app.use('/', express.static(__dirname + '/public'));

server.listen(PORT, () => {
	console.info("server litening on " + PORT)
});