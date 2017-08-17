/*
 * node-websocket-perfomance
 * © WebDINO Japan
 */

// modules
const WebSocket = require("ws");
const express = require("express");
const http = require("http");

// settings
const PORT = 8080;
// 
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({
	server: server
});


// wss
wss.on("connection",(client)=>{
	console.log("接続されました。");
	client.on("message",(message)=>{
		onMessageFunction(message);
		client.send(message);
	});
})

function onMessageFunction(message){
	//メッサージが来た時に実行する関数。pong以外を書く。
	//console.log(message);
}

// 静的ファイルの提供
app.use('/', express.static(__dirname + '/public'));

server.listen(PORT, () => {
	console.info("server litening on " + PORT)
});