const express = require('express');
const app = express();
app.use(express.json());

app.post('/telegram-webhook', (req, res) => {
    const message = req.body.message;
    if (message) {
        console.log(`Nova mensagem: ${message.text}`);
        res.send('OK');
    } else {
        res.send('No message');
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
