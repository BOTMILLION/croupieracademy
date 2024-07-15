const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch'); // Se precisar enviar requisições HTTP

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para analisar o corpo das requisições
app.use(bodyParser.json());

// Endpoint para receber mensagens do Telegram
app.post('/webhook', async (req, res) => {
    const message = req.body.message;

    if (message) {
        const chatId = message.chat.id;
        const text = message.text;

        // Processa a mensagem recebida
        console.log(`Mensagem recebida: ${text} de ${chatId}`);

        // Aqui você pode enviar a mensagem para o seu site (opcional)
        // const response = await fetch('https://www.seubet.com/cassino-ao-vivo/slots/all/28/evolution/8267-217032-football-studio?mode=real', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify({ chatId, text }),
        // });

        // Se precisar enviar uma resposta ao Telegram
        // await fetch(`https://api.telegram.org/bot7377232961:AAFAjIK6cV0ZHEwmRDgqdW_TtLeADyGAJDs/sendMessage`, {
        //     method: 'POST',
        //     body: JSON.stringify({
        //         chat_id: chatId,
        //         text: 'Sua mensagem foi recebida!',
        //     }),
        //     headers: { 'Content-Type': 'application/json' },
        // });

        res.sendStatus(200); // Responde ao Telegram que a mensagem foi recebida
    } else {
        res.sendStatus(400); // Se não houver mensagem
    }
});

// Iniciar o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
