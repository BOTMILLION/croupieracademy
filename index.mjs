import express from 'express';
import http from 'http';
import WebSocket from 'ws';
import bodyParser from 'body-parser';

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(bodyParser.json());

app.post('/webhook', (req, res) => {
  const message = req.body.message;
  if (message) {
    console.log('Received message:', message.text);
    // Broadcast the message to all connected WebSocket clients
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
    res.status(200).send('Message received');
  } else {
    res.status(400).send('No message received');
  }
});

wss.on('connection', (ws) => {
  console.log('Client connected');
  ws.on('message', (message) => {
    console.log('Received:', message);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
