//Websocketのconnectionを張る
const wsClient = new WebSocket(`ws://${location.host}`);
let newTest = "";

document.getElementById("submit").addEventListener("click", submit);

function submit() {
    const times = document.getElementById("times").value;
    const color = document.getElementById("color").value;
    const size = 0; //追加するファイルサイズなど
    //performanceのリソース内にある過去の履歴を削除
    performance.clearMeasures();
    performance.clearMarks();
    //performanceのバッファーを調整
    performance.setResourceTimingBufferSize(times * 4);
    newTest = new Test(wsClient, 0, times, color);
    newTest.start();
}

function writeMsg(text, type) {
    const msgDOM = document.getElementById("msg");
    msgDOM.innerHTML = text;
    switch (type) {
        case "danger":
            msgDOM.style.color = "red";
            break;
        case "success":
            msgDOM.style.color = "green";
            break;
        case "info":
            msgDOM.style.color = "info";
            break;
        default:
            msgDOM.style.color = "gray";
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
        const JSONPayload = JSON.stringify(this.payload)
        //lampを書き換える。
        document.getElementById("lamp").style.backgroundColor = "red";
        //JSONが大きくなる時は実装を変える必要アリ
        performance.mark(`s:${JSONPayload}`);
        this.client.send(JSONPayload);
    }

    catchMessage(JSONPayload) {
        performance.mark(`e:${JSONPayload}`);
        const value = JSON.parse(JSONPayload);
        //JSONの構文解析の時間が乗ってしまう...
        //performance.mark(`e:${value.time}`);
        performance.measure(value.id, `s:${JSONPayload}`, `e:${JSONPayload}`);


        if (this.count < this.times) {
            //まだ残カウントが残ってる場合
            //lampを書き換える。
            document.getElementById("lamp").style.backgroundColor = "blue";
            this.count++;
            //最新の値を書き換える。

            //console.log(performance.getEntriesByName(this.id));
            document.getElementById("new").innerHTML = performance.getEntriesByName(this.id)[performance.getEntriesByName(this.id).length - 1].duration.toFixed(this.DECIMAL);
            document.getElementById("endtime").innerHTML = this.count;

            this.shot(this.id, this.color);

        } else {
            this.success();
            //終了した回数を書き換える。
            document.getElementById("endtime").innerHTML = this.count;

            //lampを書き換える。
            document.getElementById("lamp").style.backgroundColor = "green";
        }


    }
    success() {
        //この結果書き出し
        const result = performance.getEntriesByName(this.id);
        const durations = floorDuraions(result, this.DECIMAL);
        //最後の値を更新する
        document.getElementById("new").innerHTML = durations[durations.length - 1];
        //平均値を出す。
        document.getElementById("avg").innerHTML = returnAvg(durations, this.DECIMAL);

        writeMsg("終了しました。結果をCSVに書き出しました。", "success");
        document.getElementById("csv").value = exportCSV(durations);
        renderChart(durations, document.getElementById("ctx"));



        function floorDuraions(array, DECIMAL) {
            //ここでしdurationの配列を作る。
            //小数点第何位までかここで決定する
            const fixedDurations = [];
            for (let ele of array) {
                fixedDurations.push(Number(ele.duration.toFixed(DECIMAL)));
            }
            return fixedDurations;
        }

        function returnAvg(array, DECIMAL) {
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
            const data = array;
            const labels = [];
            //ラベルを生成
            for (let i in data) {
                labels.push(i)
            }
            const myLineChart = new Chart(ctx, {
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