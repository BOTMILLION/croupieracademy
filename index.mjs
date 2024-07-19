import express from 'express';
import { WebSocketServer } from 'ws';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Definir __dirname em módulos ES6
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const logFilePath = path.join(__dirname, 'server.log');
const logStream = fs.createWriteStream(logFilePath, { flags: 'a' });

let mensagens = [];

// Função para registrar logs
function log(message, error = null) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;
    logStream.write(logMessage);
    console.log(logMessage); // Também envia a mensagem para o console
    if (error) {
        const errorMessage = `[${timestamp}] ERROR: ${error.stack || error}\n`;
        logStream.write(errorMessage);
        console.error(errorMessage);
    }
}

// Configurar o servidor HTTP
const server = app.listen(PORT, () => {
    log(`Servidor rodando na porta ${PORT}`);

    // Configurar o webhook do Telegram
    const urlWebhook = `https://api.telegram.org/bot7377232961:AAFAjIK6cV0ZHEwmRDgqdW_TtLeADyGAJDs/setWebhook?url=https://telegramheroku-87abbc9dd2f9.herokuapp.com/webhook`;

    fetch(urlWebhook)
        .then(response => response.json())
        .then(data => {
            log('Webhook configurado:', JSON.stringify(data));
        })
        .catch(error => {
            log('Erro ao configurar o webhook:', error);
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
                    ws = new WebSocket('wss://telegramheroku-87abbc9dd2f9.herokuapp.com/');

                    ws.onopen = function() {
                        console.log('Conectado ao servidor WebSocket');
                    };

                    ws.onmessage = function(event) {
                        let message;

                        // Verifica o tipo de dado recebido
                        if (event.data instanceof Blob) {
                            const reader = new FileReader();
                            reader.onload = function() {
                                message = reader.result;
                                exibirMensagem(message);
                            };
                            reader.readAsText(event.data);
                        } else {
                            message = event.data;
                            exibirMensagem(message);
                        }
                    };

                    ws.onclose = function() {
                        console.log('Conexão WebSocket encerrada. Tentando reconectar...');
                        setTimeout(conectarWebSocket, 2000);
                    };

                    ws.onerror = function(error) {
                        console.error('Erro no WebSocket:', error);
                    };
                }

                function exibirMensagem(message) {
                    const messagesDiv = document.getElementById('messages');
                    messagesDiv.innerHTML += \`<p>\${message}</p>\`;
                    messagesDiv.scrollTop = messagesDiv.scrollHeight;
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
    log('Cliente conectado');

    // Função para manter a conexão ativa
    const manterConexaoAtiva = () => {
        if (ws.readyState === ws.OPEN) {
            ws.ping(); // Envia um ping para manter a conexão ativa
            setTimeout(manterConexaoAtiva, 30000); // Verifica a cada 30 segundos
        }
    };

    manterConexaoAtiva();

    ws.on('message', (data) => {
        // Verifica o tipo de dado e converte para string, se necessário
        const text = typeof data === 'string' ? data : data.toString();
        log('Mensagem recebida do Telegram:', text);
        
        // Enviar mensagem para o WebSocket
        wss.clients.forEach(client => {
            if (client.readyState === client.OPEN) {
                client.send(text); // Envia como texto
                log(`Mensagem enviada ao cliente: ${text}`);
            }
        });
    });

    ws.on('close', () => {
        log('Cliente desconectado');
    });

    ws.on('error', (error) => {
        log('Erro no WebSocket:', error);
    });
});

// Endpoint para o webhook
app.post('/webhook', async (req, res) => {
    try {
        log('Corpo da requisição recebido:', JSON.stringify(req.body));

        // Verificar se a requisição contém uma mensagem ou um post de canal
        const message = req.body.message || req.body.channel_post;

        if (message && message.text) {
            const text = message.text;
            mensagens.push(text);
            log(`Mensagem recebida: ${text}`);

            wss.clients.forEach((client) => {
                if (client.readyState === client.OPEN) {
                    client.send(text);
                    log(`Mensagem enviada ao cliente: ${text}`);
                }
            });

            return res.sendStatus(200); // Retorna 200 OK após processar a mensagem
        } else {
            log('Mensagem não encontrada no corpo da requisição');
            return res.sendStatus(400); // Retorna 400 Bad Request se a mensagem não estiver presente
        }
    } catch (error) {
        log('Erro ao processar o webhook:', error);
        return res.sendStatus(500); // Retorna 500 Internal Server Error em caso de exceção
    }
});

// Tratamento global de erros
process.on('uncaughtException', (err) => {
    log('Exceção não capturada:', err);
});

process.on('unhandledRejection', (err) => {
    log('Rejeição de promessa não tratada:', err);
});
