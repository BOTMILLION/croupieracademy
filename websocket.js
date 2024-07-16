const ws = new WebSocket('ws://localhost:3000'); // Substitua pelo URL do seu servidor se necessário

ws.onopen = () => {
    console.log('Conectado ao WebSocket');
};

ws.onmessage = (event) => {
    const mensagensDiv = document.getElementById('mensagens');
    const novaMensagem = document.createElement('div');
    novaMensagem.textContent = event.data; // Mensagem recebida do servidor
    mensagensDiv.appendChild(novaMensagem);
};

ws.onclose = () => {
    console.log('Desconectado do WebSocket');
};
