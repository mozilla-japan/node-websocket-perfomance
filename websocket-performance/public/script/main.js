//Websocketのconnectionを張る
const wsClient = new WebSocket(`ws://${location.host}`);
var newTest = "";

$("#submit").on("click", () => {
    newTest = new Test(wsClient, $("#size").val(), $("#times").val());

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
        this.count = 0;
        this.payload = {
            id:"",//このテストのID
            time:"",//何回目か
            data: ""//何かしらここにデータが入るでしょう。
        }
        this.color = "";
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

        this.client.onmessage = (message) => {
            this.catchMessage(message.data);
        }
        this.start();
    }
    start() {
        /*
        for (let i=0;i<this.times;i++){
            this.shot(i);
        }
        */
        //カウンターを初期化
        this.count = 1;

        //performance.measure用IDを生成。
        this.id = Date.now();
        this.color = $("#color").val();
        //forループにすると帰って来る前に打ってしまうので、catchMessageから再帰的に呼ぶ。
        this.shot(this.id,this.color);
        writeMsg("テスト中", "info");

        //終了したら平均値を書き出す。
        /*
        $("#avg").html();
        writeMsg("終了しました","success");
        */
    }

    /**
     * 
     * @param {Number} [thisTime] - この時の試行回数
     */
    shot(id,data) {
        //
        this.payload["id"] = this.id;
        this.payload["time"] = this.count; //何回目か
        this.payload["data"] = data; //入るデータ
        let JSONPayload = JSON.stringify(this.payload)
        //performance.mark(`s:${this.payload.time}`);
        performance.mark(`s:${JSONPayload}`);
        this.client.send(JSONPayload);

        //lampを書き換える。
        $("#lamp").css("background-color", "Red");
    }

    catchMessage(JSONPayload) {
        //このメッセージが何番目かチェックする.
        //let catchTime = value.time;
        //console.log("CATCH:" + catchTime)
        //console.log(`e:${JSONPayload}`)
        performance.mark(`e:${JSONPayload}`);
        let value = JSON.parse(JSONPayload);
        //JSONの構文解析の時間が乗ってしまう...

        //performance.mark(`e:${value.time}`);
        performance.measure(value.id, `s:${JSONPayload}`, `e:${JSONPayload}`);


        if (this.count < this.times) {
            
            //まだ残カウントが残ってる場合
            //lampを書き換える。
            $("#lamp").css("background-color", "Blue");
            this.count++;
            this.shot(this.id,this.color);
            $("#new").html(performance.getEntriesByName(this.id)[performance.getEntriesByName(this.id).length - 1].duration);
            $("#endtime").html(this.count);
            
        } else {
            //console.log(this);
            this.success();
            //終了した回数を書き換える。
            $("#endtime").html(this.count);
            //lampを書き換える。
            $("#lamp").css("background-color", "Green");
        }


    }
    success() {
        //この結果書き出し
        $("#new").html(performance.getEntriesByName(this.id)[performance.getEntriesByName(this.id).length - 1].duration);

        $("#avg").html(avgDuration(performance.getEntriesByName(this.id)));
        writeMsg("終了しました", "success");

        function avgDuration(array) {
            let sum = 0;
            for (let ele of array) {
                sum += ele.duration;
            }
            return sum / array.length;
        }
    }


}