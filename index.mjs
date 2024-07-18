import express from 'express';
import { WebSocketServer } from 'ws';
import fetch from 'node-fetch';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

let mensagens = [];

// Iniciar o servidor
const server = app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);

    // Configurar o webhook do Telegram
    const urlWebhook = `https://api.telegram.org/bot7377232961:AAFAjIK6cV0ZHEwmRDgqdW_TtLeADyGAJDs/setWebhook?url=https://telegramheroku-87abbc9dd2f9.herokuapp.com/webhook`;

    fetch(urlWebhook)
        .then(response => response.json())
        .then(data => {
            console.log('Webhook configurado:', data);
        })
        .catch(error => {
            console.error('Erro ao configurar o webhook:', error);
        });
});

// Página inicial
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Chat Telegram</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    margin: 0;
                    padding: 20px;
                }
                #messages {
                    border: 1px solid #ccc;
                    padding: 10px;
                    height: 300px;
                    overflow-y: scroll;
                    margin-bottom: 20px;
                }
            </style>
        </head>
        <body>
            <h1>Bem-vindo ao Chat Telegram</h1>
            <div id="messages"></div>
            <script>
                let ws;

                function conectarWebSocket() {
                    ws = new WebSocket('wss://telegramheroku-87abbc9dd2f9.herokuapp.com');

                    ws.onopen = function() {
                        console.log('Conectado ao servidor WebSocket');
                    };

                    ws.onmessage = function(event) {
                        const messagesDiv = document.getElementById('messages');
                        messagesDiv.innerHTML += \`<p>\${event.data}</p>\`;
                        messagesDiv.scrollTop = messagesDiv.scrollHeight;
                    };

                    ws.onclose = function() {
                        console.log('Conexão WebSocket encerrada. Tentando reconectar...');
                        setTimeout(conectarWebSocket, 2000);
                    };

                    ws.onerror = function(error) {
                        console.error('Erro no WebSocket:', error);
                    };
                }

                conectarWebSocket();
            </script>
        </body>
        </html>
    `);
});

// Configurar o WebSocket
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
    console.log('Cliente conectado');

    const enviarMensagens = () => {
        if (mensagens.length > 0) {
            const ultimaMensagem = mensagens[mensagens.length - 1];
            ws.send(ultimaMensagem);
        }
    };

    enviarMensagens();

    ws.on('close', () => {
        console.log('Cliente desconectado');
    });
});

// Endpoint para o webhook
app.post('/webhook', async (req, res) => {
    console.log('Corpo da requisição recebido:', req.body);

    // Verificar se a requisição contém uma mensagem ou um post de canal
    const message = req.body.message || req.body.channel_post;

    if (message && message.text) {
        const text = message.text;
        mensagens.push(text);
        console.log(`Mensagem recebida: ${text}`);

        wss.clients.forEach((client) => {
            if (client.readyState === client.OPEN) {
                client.send(text);
                console.log(`Mensagem enviada ao cliente: ${text}`);
            }
        });

        return res.sendStatus(200); // Retorna 200 OK após processar a mensagem
    } else {
        console.error('Mensagem não encontrada no corpo da requisição');
        return res.sendStatus(400); // Retorna 400 Bad Request se a mensagem não estiver presente
    }
});
