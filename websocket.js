const ws = new WebSocket('wss://telegramheroku-87abbc9dd2f9.herokuapp.com'); // URL do servidor Heroku

ws.onopen = () => {
    console.log('Conectado ao WebSocket');
};

ws.onmessage = (event) => {
    const mensagensDiv = document.getElementById('messages'); // Certifique-se que o ID está correto
    const novaMensagem = document.createElement('div');
    novaMensagem.textContent = event.data; // Mensagem recebida do servidor
    mensagensDiv.appendChild(novaMensagem);
};

ws.onclose = () => {
    console.log('Desconectado do WebSocket');
    // Lógica de reconexão
    setTimeout(() => {
        console.log('Tentando reconectar...');
        conectarWebSocket(); // Chama a função para reconectar
    }, 2000); // Tenta reconectar após 2 segundos
};

ws.onerror = (error) => {
    console.error('Erro no WebSocket:', error);
};

// Função para conectar ao WebSocket
function conectarWebSocket() {
    // Cria uma nova instância do WebSocket
    const ws = new WebSocket('wss://telegramheroku-87abbc9dd2f9.herokuapp.com');

    ws.onopen = () => {
        console.log('Conectado ao WebSocket');
    };

    ws.onmessage = (event) => {
        const mensagensDiv = document.getElementById('messages'); // Certifique-se que o ID está correto
        const novaMensagem = document.createElement('div');
        novaMensagem.textContent = event.data; // Mensagem recebida do servidor
        mensagensDiv.appendChild(novaMensagem);
    };

    ws.onclose = () => {
        console.log('Desconectado do WebSocket');
        // Lógica de reconexão
        setTimeout(() => {
            console.log('Tentando reconectar...');
            conectarWebSocket(); // Chama a função para reconectar
        }, 2000); // Tenta reconectar após 2 segundos
    };

    ws.onerror = (error) => {
        console.error('Erro no WebSocket:', error);
    };
}

// Chama a função de conexão inicialmente
conectarWebSocket();
