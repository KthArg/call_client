/**
 * Gestiona la conexión y la comunicación con el servidor WebSocket.
 */
export class WebSocketManager {
    constructor(url) {
        this.url = url;
        this.ws = null;
        this.messageHandlers = new Map();
        this.onOpen = null;
        this.onClose = null;
        this.onError = null;
        this.isReady = false;
        this.messageQueue = [];
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 2000;
    }

    /**
     * Inicializa los manejadores de eventos del WebSocket y establece la conexión.
     */
    connect() {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
            console.log('Conexión WebSocket establecida.');
            this.isReady = true;
            this.reconnectAttempts = 0;
            
            // Actualizar indicador de conexión en UI
            const statusIndicator = document.getElementById('connection-status');
            if (statusIndicator) {
                statusIndicator.style.background = '#4ade80';
            }
            
            if (this.onOpen) {
                this.onOpen();
            }
            this.flushMessageQueue();
        };

        this.ws.onmessage = (event) => {
            const message = JSON.parse(event.data);
            if (this.messageHandlers.has(message.type)) {
                this.messageHandlers.get(message.type)(message);
            } else {
                console.log('Tipo de mensaje desconocido recibido:', message.type);
            }
        };

        this.ws.onclose = () => {
            console.log('Conexión WebSocket cerrada.');
            this.isReady = false;
            
            // Actualizar indicador de conexión en UI
            const statusIndicator = document.getElementById('connection-status');
            if (statusIndicator) {
                statusIndicator.style.background = '#ef4444';
            }
            
            if (this.onClose) {
                this.onClose();
            }
            
            // Intentar reconectar
            this.attemptReconnect();
        };

        this.ws.onerror = (error) => {
            console.error('Error en WebSocket:', error);
            
            // Actualizar indicador de conexión en UI
            const statusIndicator = document.getElementById('connection-status');
            if (statusIndicator) {
                statusIndicator.style.background = '#f59e0b';
            }
            
            if (this.onError) {
                this.onError(error);
            }
        };
    }

    /**
     * Intenta reconectar al servidor WebSocket
     */
    attemptReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`Intentando reconectar... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
            
            setTimeout(() => {
                this.connect();
            }, this.reconnectDelay * this.reconnectAttempts);
        } else {
            console.error('No se pudo reconectar al servidor después de múltiples intentos.');
            // Mostrar notificación de error
            import('./UIManager.js').then(module => {
                module.UIManager.showNotification(
                    'No se pudo conectar al servidor. Por favor, recarga la página.',
                    'error'
                );
            });
        }
    }

    /**
     * Registra un callback para un tipo de mensaje específico.
     * @param {string} messageType - El tipo de mensaje (ej. 'user-joined').
     * @param {function} handler - La función que manejará el mensaje.
     */
    onMessage(messageType, handler) {
        this.messageHandlers.set(messageType, handler);
    }

    send(message) {
        if (this.isReady && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(message));
        } else {
            console.log('WebSocket no está listo, encolando mensaje:', message);
            this.messageQueue.push(message);
        }
    }

    flushMessageQueue() {
        console.log(`Procesando ${this.messageQueue.length} mensajes encolados.`);
        while (this.messageQueue.length > 0) {
            const message = this.messageQueue.shift();
            this.send(message);
        }
    }
    
    /**
     * Cierra la conexión WebSocket
     */
    close() {
        if (this.ws) {
            this.reconnectAttempts = this.maxReconnectAttempts; // Prevenir reconexión
            this.ws.close();
            this.ws = null;
            this.isReady = false;
        }
    }
    
    /**
     * Verifica si la conexión está abierta
     */
    isConnected() {
        return this.isReady && this.ws && this.ws.readyState === WebSocket.OPEN;
    }
}