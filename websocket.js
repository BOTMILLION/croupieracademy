const WebSocket = require('ws');
const express = require('express');
const http = require('http');

// Configura o servidor Express
const app = express();
const server = http.createServer(app);

// Configura o WebSocket
const wss = new WebSocket.Server({ server });

wss.on('connection', function connection(ws) {
  console.log('Cliente WebSocket conectado');

  // Evento quando uma mensagem é recebida do cliente WebSocket
  ws.on('message', function incoming(message) {
    console.log('Mensagem recebida do cliente WebSocket:', message);

    // Aqui você pode adicionar código para processar a mensagem
    // e, se necessário, enviar uma resposta para o cliente
  });

  // Envia uma mensagem de boas-vindas para o cliente
  ws.send('Bem-vindo ao WebSocket!');
});

// Inicia o servidor na porta 3000 (ou a porta que você estiver usando)
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor WebSocket rodando na porta ${PORT}`);
});
