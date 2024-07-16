import express from 'express';
import { WebSocketServer } from 'ws';
import fetch from 'node-fetch';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

let mensagens = [];

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
                        const message = event.data; // Recebe a mensagem como texto
                        console.log('Nova mensagem do Telegram:', message); // Log para verificação
                        const messagesDiv = document.getElementById('messages');
                        messagesDiv.innerHTML += \`<p>\${message}</p>\`;
                        messagesDiv.scrollTop = messagesDiv.scrollHeight; // Rolagem automática
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

const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
    console.log('Cliente conectado');

    const enviarMensagens = () => {
        if (mensagens.length > 0) {
            mensagens.forEach(msg => {
                ws.send(msg);
            });
        }
    };

    enviarMensagens();

    ws.on('close', () => {
        console.log('Cliente desconectado');
    });
});

app.post('/webhook', async (req, res) => {
    console.log('Corpo da requisição recebido:', JSON.stringify(req.body, null, 2));

    const message = req.body.channel_post; // Mudado para channel_post

    // Verifique se a mensagem é do canal correto
    if (message && message.chat && message.chat.id === -1002121843991 && message.text) {
        const text = message.text;
        mensagens.push(text);
        console.log(`Mensagem recebida do canal: ${text}`);

        // Enviar a mensagem a todos os clientes WebSocket conectados
        wss.clients.forEach((client) => {
            if (client.readyState === client.OPEN) {
                client.send(text);
                console.log(`Mensagem enviada ao cliente WebSocket: ${text}`);
            }
        });

        return res.sendStatus(200); // Retorna 200 OK após processar a mensagem
    } else {
        console.error('Mensagem não encontrada no corpo da requisição ou não é do canal');
        return res.sendStatus(400); // Retorna 400 Bad Request
    }
});
