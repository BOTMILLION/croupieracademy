import express from 'express';
import http from 'http';
import WebSocket from 'ws';
import bodyParser from 'body-parser';

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(bodyParser.json());

wss.on('connection', (ws) => {
    console.log('Cliente conectado');
    ws.on('message', (message) => {
        console.log(`Mensagem recebida: ${message}`);
    });
});

app.post('/webhook', (req, res) => {
    const message = req.body.message;
    if (message && message.text) {
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message.text);
            }
        });
    }
    res.sendStatus(200);
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
