//Websocketのconnectionを張る
const wsClient = new WebSocket(`ws://${location.host}`);
var newTest = "";

$("#submit").on("click", () => {
    newTest = new Test(wsClient,$("#size").val(),$("#times").val());

});

function writeMsg(text, type) {
    $("#msg").html(text);
    switch (type) {
        case "danger":
            $("#msg").css("color", "Red");
            break;
        case "success":
            $("#msg").css("color", "Green");
            break;
        case "info":
            $("#msg").css("color", "Blue");
            break;
        default:
            $("#msg").css("color", "Gray");
    }
}

/**
 * 
 * @param {WebSocket} [client] -  websocketインスタンス
 * @param {Number} [size] -  ペイロードのサイズ(KB)
 * @param {Number} [times] - 回数
 */
class Test {
    constructor(client, size, times) {
        this.client = client;
        this.size = size ? size : 1;
        this.times = times ? times : 10;
        this.id = Date.now();
        if (this.size > 10 * 1024 * 1024) {
            writeMsg("サイズが大きすぎます", "danger");
            throw "Over max size";
        }
        if (this.time > (4294967296 - 1)) {
            writeMsg("回数が多すぎます", "danger");
            throw "Over max times";
        }
        //this.payload = new Uint32Array(size / 4);
        //今回の実装ではとりあえず文字を送る。

        this.client.onmessage = this.catchMessage;
        this.start();
    }
    start() {
        for (let i=0;i<this.times;i++){
            this.shotTime(i);
        }

        //終了したら平均値を書き出す。
        $("#avg").html();
        writeMsg("終了しました","success");

    }

    /**
     * 
     * @param {Number} [thisTime] - この時の試行回数
     */
    shotTime(thisTime) {
        //this.payload[0] = thisTime;
        //とりあえずこの実装ではこの回数のデータを
        this.payload = thisTime;
        let a = performance.mark(`s:${thisTime}`);
        this.client.send(this.payload);
    }
    catchMessage(payload) {
        //このメッセージが何番目かチェックする.
        let catchTime = payload.data;
        console.log("CATCH:" + catchTime)
        
        performance.mark(`e:${catchTime}`);
        performance.measure(catchTime,`s:${catchTime}`,`e:${catchTime}`);
        
        //この結果書き出し
        $("#new").html(performance.getEntriesByName(catchTime)[performance.getEntriesByName(catchTime).length-1].duration);
        $("#times").html(catchTime);
        
    }

}