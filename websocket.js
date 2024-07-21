import { WebSocketServer } from 'ws';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Definir __dirname em módulos ES6
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const logFilePath = path.join(__dirname, 'server.log');
const logStream = fs.createWriteStream(logFilePath, { flags: 'a' });

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

// Configurar o WebSocket
const wss = new WebSocketServer({ port: 3000 });

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
        if (data === 'ping') {
            log('Recebido ping do cliente WebSocket');
            return; // Ignora mensagens de ping
        }

        log('Mensagem recebida do WebSocket:', data);
        // Enviar mensagem para todos os clientes conectados
        wss.clients.forEach(client => {
            if (client.readyState === client.OPEN) {
                client.send(data);
                log(`Mensagem enviada ao cliente: ${data}`);
            } else {
                log('Cliente WebSocket não está aberto. Ignorando envio.');
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
