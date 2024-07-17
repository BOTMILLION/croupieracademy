const ws = new WebSocket('wss://telegramheroku-87abbc9dd2f9.herokuapp.com'); // URL do servidor Heroku

ws.onopen = () => {
    console.log('Conectado ao WebSocket');
};

ws.onmessage = (event) => {
    const mensagensDiv = document.getElementById('mensagens'); // Certifique-se que o ID está correto
    const novaMensagem = document.createElement('div');
    novaMensagem.textContent = event.data; // Mensagem recebida do servidor
    mensagensDiv.appendChild(novaMensagem);
};

ws.onclose = () => {
    console.log('Desconectado do WebSocket');
    // Aqui você pode implementar lógica de reconexão se necessário
};

ws.onerror = (error) => {
    console.error('Erro no WebSocket:', error);
};
