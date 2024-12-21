import { WebSocket } from "ws";

const wss = new WebSocket.Server({ port: 8080 });

//send server start message
console.log('Server started on port 8080');


let senderSocket: null | WebSocket = null;
let receiverSocket: null | WebSocket = null;


wss.on('connection', function connection(ws) {
  ws.on('error', console.error);

  ws.on('message', function message(data: any) {
    const message = JSON.parse(data);
    console.log('received: %s', data);
    if (message.type === 'sender') {
        senderSocket = ws;
      } else if (message.type === 'receiver') {
        receiverSocket = ws;
      } else if (message.type === 'createOffer') {
        if (ws !== senderSocket) {
          return;
        }
        console.log("reached here")
        receiverSocket?.send(JSON.stringify({ type: 'createOffer', sdp: message.sdp }));
      } else if (message.type === 'createAnswer') {
          if (ws !== receiverSocket) {
            return;
          }
          console.log('reached answer')
          senderSocket?.send(JSON.stringify({ type: 'createAnswer', sdp: message.sdp }));
      } else if (message.type === 'iceCandidate') {
        if (ws === senderSocket) {
          receiverSocket?.send(JSON.stringify({ type: 'iceCandidate', candidate: message.candidate }));
        } else if (ws === receiverSocket) {
          senderSocket?.send(JSON.stringify({ type: 'iceCandidate', candidate: message.candidate }));
        }
      }
    });
});

