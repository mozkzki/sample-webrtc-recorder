"use strict";

// シグナリングサーバーをWSSで動かす

// 1. html は github pages(https) に配置
// 2. https からだと シグナリングサーバーは wss になる
// 3. wss は ip NG
// 4. ip は hosts で解決 (/etc/hosts)
// 5. オレオレ証明書作成
//      https://qiita.com/t-kuni/items/d3d72f429273cf0ee31e
// 6. chrome にオレオレ証明書を例外登録
//     ・Linux: > certutil - d sql:$HOME/.pki/nssdb -A -t P -n test.com -i ./server.crt
//     ・Mac: キーチェーンで許可

// 下記が必要
// > npm install ws

const fs = require("fs");
const httpServ = require("https");
const websocketServer = require("ws").Server;

const port = 8081;

var processRequest = function (req, res) {
  console.log("Request received.");
};

var app = httpServ
  .createServer(
    {
      key: fs.readFileSync("/etc/cert/server.key").toString(),
      cert: fs.readFileSync("/etc/cert/server.crt").toString(),
    },
    processRequest
  )
  .listen(port);

// [wss]
const wsServer = new websocketServer({ server: app });

wsServer.on("connection", function (ws) {
  console.log("-- websocket connected --");
  ws.on("message", function (message) {
    wsServer.clients.forEach(function each(client) {
      if (isSame(ws, client)) {
        console.log("- skip sender -");
      } else {
        client.send(message);
      }
    });
  });
});

function isSame(ws1, ws2) {
  // -- compare object --
  return ws1 === ws2;
}

console.log("websocket server start. port=" + port);
