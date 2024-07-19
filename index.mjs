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

// Função para enviar mensagens para o canal do Telegram
async function enviarMensagemParaCanal(mensagem) {
    const token = '7377232961:AAFAjIK6cV0ZHEwmRDgqdW_TtLeADyGAJDs';
    const chatId = '-1002121843991'; // ID do canal
    const url = `https://api.telegram.org/bot${token}/sendMessage`;

    log(`Enviando mensagem para o canal ${chatId}: ${mensagem}`);

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: mensagem
            })
        });

        const data = await response.json();
        log('Resposta da API do Telegram ao enviar mensagem:', JSON.stringify(data));

        if (!response.ok) {
            log(`Erro ao enviar mensagem para o canal: ${data.description}`);
        }

        // Enviar a mensagem enviada também para todos os clientes WebSocket
        if (wss.clients.size > 0) {
            wss.clients.forEach((client) => {
                if (client.readyState === client.OPEN) {
                    client.send(mensagem);
                    log(`Mensagem enviada ao cliente WebSocket: ${mensagem}`);
                } else {
                    log('Cliente WebSocket não está aberto. Estado:', client.readyState);
                }
            });
        } else {
            log('Nenhum cliente WebSocket conectado.');
        }

    } catch (error) {
        log('Erro ao enviar mensagem para o canal do Telegram:', error);
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
                        const messagesDiv = document.getElementById('messages');
                        console.log('Mensagem recebida do WebSocket:', event.data);
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
    log('Cliente WebSocket conectado');

    const manterConexaoAtiva = () => {
        if (ws.readyState === ws.OPEN) {
            ws.ping(); // Envia um ping para manter a conexão ativa
            setTimeout(manterConexaoAtiva, 30000); // Verifica a cada 30 segundos
        }
    };

    manterConexaoAtiva();

    ws.on('message', (data) => {
        log('Mensagem recebida do WebSocket:', data);
        // Enviar mensagem para todos os clientes conectados
        wss.clients.forEach(client => {
            if (client.readyState === client.OPEN) {
                client.send(data);
                log(`Mensagem enviada ao cliente: ${data}`);
            } else {
                log('Cliente WebSocket não está aberto. Estado:', client.readyState);
            }
        });
    });

    ws.on('close', () => {
        log('Cliente WebSocket desconectado');
    });

    ws.on('error', (error) => {
        log('Erro no WebSocket:', error);
    });
});

// Endpoint para o webhook
app.post('/webhook', async (req, res) => {
    try {
        log('Corpo da requisição recebido:', JSON.stringify(req.body));

        // Processar mensagens de chat e postagens de canal
        const message = req.body.message || req.body.channel_post || req.body.edited_message || req.body.edited_channel_post;

        // Verificar se a mensagem é do tipo esperado
        if (message) {
            const text = message.text || 'Mensagem sem texto';
            mensagens.push(text);
            log(`Mensagem recebida: ${text}`);

            // Enviar mensagem para o canal do Telegram
            await enviarMensagemParaCanal(text);

            // Enviar mensagem para os clientes conectados via WebSocket
            if (wss.clients.size > 0) {
                wss.clients.forEach((client) => {
                    if (client.readyState === client.OPEN) {
                        client.send(text);
                        log(`Mensagem enviada ao cliente WebSocket: ${text}`);
                    } else {
                        log('Cliente WebSocket não está aberto. Estado:', client.readyState);
                    }
                });
            } else {
                log('Nenhum cliente WebSocket conectado.');
            }

            return res.sendStatus(200);
        } else {
            log('Mensagem não encontrada no corpo da requisição');
            return res.sendStatus(400);
        }
    } catch (error) {
        log('Erro ao processar o webhook:', error);
        return res.sendStatus(500);
    }
});

// Tratamento global de erros
process.on('uncaughtException', (err) => {
    log('Exceção não capturada:', err);
});

process.on('unhandledRejection', (err) => {
    log('Rejeição de promessa não tratada:', err);
});
