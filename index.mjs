import express from 'express';
import { WebSocketServer } from 'ws'; // Importa WebSocketServer
import fetch from 'node-fetch'; // Importa o node-fetch para fazer requisições HTTP

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para analisar o corpo das requisições como JSON
app.use(express.json());

// Array para armazenar mensagens
let mensagens = [];

// Iniciar o servidor HTTP
const server = app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});

// Rota GET para a raiz
app.get('/', (req, res) => {
    res.send('Servidor funcionando!'); // Mensagem simples ou você pode retornar um HTML
});

// Configurar WebSocket
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
    console.log('Cliente conectado');

    // Enviar a última mensagem recebida ao novo cliente
    const enviarMensagens = () => {
        if (mensagens.length > 0) {
            const ultimaMensagem = mensagens[mensagens.length - 1];
            ws.send(ultimaMensagem); // Envia a última mensagem recebida
        }
    };

    // A cada nova conexão, envia a última mensagem
    enviarMensagens();

    ws.on('close', () => {
        console.log('Cliente desconectado');
    });
});

// Endpoint para receber mensagens do Telegram
app.post('/webhook', async (req, res) => {
    console.log('Corpo da requisição recebido:', req.body);

    const message = req.body.message;

    if (message) {
        const text = message.text;

        // Armazenar a mensagem recebida
        mensagens.push(text);
        console.log(`Mensagem recebida: ${text}`);

        // Enviar a nova mensagem para todos os clientes conectados via WebSocket
        wss.clients.forEach((client) => {
            if (client.readyState === client.OPEN) {
                client.send(text); // Envia a mensagem para o cliente
            }
        });

        res.sendStatus(200); // Responde ao Telegram que a mensagem foi recebida
    } else {
        res.sendStatus(400); // Se não houver mensagem
    }
});
