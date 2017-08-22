//Websocketのconnectionを張る
const wsClient = new WebSocket(`ws://${location.host}`);
var newTest = "";

$("#submit").on("click", () => {
    //newTest = new Test(wsClient, $("#size").val(), $("#times").val(), $("#color").val());
    newTest = new Test(wsClient, 0, $("#times").val(), $("#color").val());

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

class Test {
    constructor(client, size, times, color) {
        this.client = client;
        this.size = size ? size : 1;
        this.times = times ? times : 10;
        this.id = Date.now();
        this.count = 0;
        this.payload = {
            id: "", //このテストのID
            time: "", //何回目か
            data: "" //何かしらここにデータが入るでしょう。
        }
        this.color = color;
        //小数点第何位までの値にするか
        this.DECIMAL = 3;
        /*
        if (this.size > 10 * 1024 * 1024) {
            writeMsg("サイズが大きすぎます", "danger");
            throw "Over max size";
        }
        if (this.time > (4294967296 - 1)) {
            writeMsg("回数が多すぎます", "danger");
            throw "Over max times";
        }
        */

        this.client.onmessage = (message) => {
            this.catchMessage(message.data);
        }
        this.start();
    }
    start() {
        //カウンターを初期化
        this.count = 1;

        //performance.measure用IDを生成。
        this.id = Date.now();
        //forループにすると帰って来る前に打ってしまうので、catchMessageから再帰的に呼ぶ。
        this.shot(this.id, this.color);
        writeMsg("テスト中", "info");
    }

    shot(id, data) {
        if (data == "random") {
            data = Math.random() > 0.5 ? "orange" : "green";
        }
        this.payload["id"] = this.id;
        this.payload["time"] = this.count; //何回目か
        this.payload["data"] = data; //入るデータ
        let JSONPayload = JSON.stringify(this.payload)
        //JSONが大きくなる時は実装を変える必要アリ
        performance.mark(`s:${JSONPayload}`);
        this.client.send(JSONPayload);

        //lampを書き換える。
        $("#lamp").css("background-color", "Red");
    }

    catchMessage(JSONPayload) {
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
            this.shot(this.id, this.color);
            //最新の値を書き換える。
            $("#new").html(performance.getEntriesByName(this.id)[performance.getEntriesByName(this.id).length - 1].duration.toFixed(this.DECIMAL));
            $("#endtime").html(this.count);

        } else {
            this.success();
            //終了した回数を書き換える。
            $("#endtime").html(this.count);
            //lampを書き換える。
            $("#lamp").css("background-color", "Green");
        }


    }
    success() {
        //この結果書き出し
        let result = performance.getEntriesByName(this.id);
        let durations = floorDuraions(result,this.DECIMAL);
        //最後の値を更新する
        $("#new").html(durations[durations.length -1 ]);
        //平均値を出す。
        $("#avg").html(returnAvg(durations,this.DECIMAL));

        writeMsg("終了しました。結果をCSVに書き出しました。", "success");
        $("#csv").val(exportCSV(durations));
        renderChart(durations, document.getElementById("ctx"))

        function floorDuraions(array,DECIMAL){
            //ここでしdurationの配列を作る。
            //小数点第何位までかここで決定する
            let fixedDurations = [];
            for (let ele of array){
                fixedDurations.push(Number(ele.duration.toFixed(DECIMAL)));
            }
            return fixedDurations;
        }
        function returnAvg(array,DECIMAL) {
            let sum = 0;
            for (let ele of array) {
                sum += ele;
            }
            return (sum / array.length).toFixed(DECIMAL);
        }

        function exportCSV(array) {
            let resultCSV = "";
            for (let ele of array) {
                resultCSV += `${ele},`;
            }
            return resultCSV.slice(0, -1)

        }

        function renderChart(array, ctx) {
            let data = array;
            let labels = [];
            //ラベルを生成
            for (let i in data){
                labels.push(i)
            }
            var myLineChart = new Chart(ctx, {
                //グラフの種類
                type: 'line',
                //データの設定
                data: {
                    //データ項目のラベル
                    labels: labels,
                    //データセット
                    datasets: [{
                        //凡例
                        label: "掛かった時間(ms)",
                        //背景色
                        backgroundColor: "rgba(75,192,192,0.4)",
                        //枠線の色
                        borderColor: "rgba(75,192,192,1)",
                        //グラフのデータ
                        data: data,
                        //ラインを表示するか否か
                        showLine: false, // disable for a single dataset
                        //滑らかに表示する
                        cubicInterpolationMode: `monotone`
                    }]
                },
                //オプションの設定
                options: {
                    scales: {
                        //縦軸の設定
                        yAxes: [{
                            ticks: {
                                //最小値を0にする
                                beginAtZero: false,
                                max: 100,
                            }
                        }]
                    }
                }
            });
        }


    }


}