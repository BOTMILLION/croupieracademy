// Variável global para o WebSocket
let ws;

// Função para conectar ao WebSocket
function conectarWebSocket() {
    try {
        // Inicializa a conexão WebSocket
        ws = new WebSocket('wss://telegramheroku-87abbc9dd2f9.herokuapp.com');

        // Evento quando a conexão WebSocket é aberta com sucesso
        ws.onopen = () => {
            console.log('Conectado ao WebSocket');
        };

        // Evento quando uma mensagem é recebida do WebSocket
        ws.onmessage = (event) => {
            const mensagensDiv = document.getElementById('messages'); // Certifique-se de que o ID está correto
            if (mensagensDiv) { // Verifica se o elemento existe
                const novaMensagem = document.createElement('div');
                novaMensagem.textContent = event.data; // Mensagem recebida do servidor
                mensagensDiv.appendChild(novaMensagem);
                mensagensDiv.scrollTop = mensagensDiv.scrollHeight; // Rolagem automática para a última mensagem
            } else {
                console.error('Elemento com ID "messages" não encontrado.');
            }
        };

        // Evento quando a conexão WebSocket é fechada
        ws.onclose = () => {
            console.log('Desconectado do WebSocket');
            // Lógica de reconexão
            setTimeout(() => {
                console.log('Tentando reconectar...');
                conectarWebSocket(); // Chama a função para reconectar
            }, 2000); // Tenta reconectar após 2 segundos
        };

        // Evento quando ocorre um erro na conexão WebSocket
        ws.onerror = (error) => {
            console.error('Erro no WebSocket:', error);
        };
    } catch (error) {
        console.error('Erro ao conectar ao WebSocket:', error);
    }
}

// Chama a função de conexão inicialmente
conectarWebSocket();
