import express from 'express';
import fetch from 'node-fetch';
import WebSocket from 'ws';

const app = express();
const port = process.env.PORT || 3000;
const TELEGRAM_BOT_TOKEN = '7377232961:AAFAjIK6cV0ZHEwmRDgqdW_TtLeADyGAJDs';
const TELEGRAM_CHANNEL_ID = '-1002121843991';
const TELEGRAM_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;
const HEROKU_URL = 'https://telegramheroku-87abbc9dd2f9.herokuapp.com/';

const wss = new WebSocket.Server({ noServer: true });
let wsClient = null;

wss.on('connection', (ws) => {
  wsClient = ws;
  console.log('Cliente conectado via WebSocket');
  
  ws.on('message', (message) => {
    console.log('Recebido do cliente:', message);
  });

  ws.on('close', () => {
    console.log('Cliente desconectado');
    wsClient = null;
  });
});

app.use(express.json());

app.post('/webhook', (req, res) => {
  const message = req.body.message;
  if (message && message.text && message.chat && message.chat.id.toString() === TELEGRAM_CHANNEL_ID) {
    console.log('Mensagem recebida:', message.text);
    
    if (wsClient && wsClient.readyState === WebSocket.OPEN) {
      wsClient.send(message.text);
    }
  }
  res.sendStatus(200);
});

app.post('/setWebhook', async (req, res) => {
  try {
    const response = await fetch(`${TELEGRAM_URL}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: `${HEROKU_URL}/webhook` }),
    });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Erro ao configurar webhook:', error);
    res.sendStatus(500);
  }
});

const server = app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});

server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});
