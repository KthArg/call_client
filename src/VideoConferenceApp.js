/**
 * @file VideoConferenceApp.js
 * Este archivo define la clase principal que orquesta toda la aplicación de videoconferencia.
 * Actúa como el "cerebro" de la aplicación, inicializando y coordinando todos los módulos
 * (WebRTC, WebSocket, UI, etc.) para que funcionen juntos.
 */
import config from './config.js';
import { PeerConnectionManager } from './PeerConnectionManager.js';
import { WebSocketManager } from './WebSocketManager.js';
import { WebRTCManager } from './WebRTCManager.js';
import { UIManager } from './UIManager.js';

/**
 * Clase principal que orquesta toda la aplicación de videoconferencia.
 * Responsabilidades:
 * - Inicializar todos los managers.
 * - Gestionar el flujo de arranque de la aplicación.
 * - Registrar los manejadores de eventos del WebSocket.
 */
export class VideoConferenceApp {
    /**
     * Construye la aplicación, inicializando todos los gestores necesarios.
     */
    constructor() {
        this.localVideoElement = null;
        this.peerManager = new PeerConnectionManager();
        this.wsManager = new WebSocketManager(config.WEBSOCKET_URL);
        this.rtcManager = new WebRTCManager(this.peerManager, UIManager, this.wsManager);
        this.isAudioEnabled = true;
        this.isVideoEnabled = true;
        this.isScreenSharing = false;
        this.originalStream = null;
        this.username = 'Usuario';
    }

    /**
     * Inicia la aplicación siguiendo una secuencia ordenada:
     * 1. Configura los medios locales (cámara/micrófono).
     * 2. Registra los manejadores de eventos del WebSocket.
     * 3. Se conecta al servidor WebSocket.
     */
    async start() {
        // Acoplar el rtcManager al peerManager para la notificación del stream.
        this.peerManager.setRtcManager(this.rtcManager);

        await this.setupLocalMedia(); // Paso 1: Configurar medios locales (Cámara/Micrófono).
        this.registerWebSocketHandlers(); // Paso 2: Registrar manejadores de eventos del WebSocket.
        this.wsManager.connect(); // Paso 3: Conectar al servidor WebSocket.
    }

    /**
     * Solicita acceso a la cámara y micrófono del usuario y muestra el video en la UI.
     */
    async setupLocalMedia() {
        try {
            const stream = await this.peerManager.setupLocalStream();
            this.originalStream = stream;
            
            // Crear elemento de video local
            this.localVideoElement = UIManager.createVideoElement('local', true);
            this.localVideoElement.srcObject = stream;
            
            console.log('Stream local obtenido y listo.');
            UIManager.showNotification('Conectado exitosamente', 'success');
        } catch (error) {
            console.error('Error al configurar el stream local:', error);
            UIManager.showNotification('No se pudo acceder a la cámara y al micrófono', 'error');
            throw error;
        }
    }

    /**
     * Registra todos los manejadores para los mensajes del WebSocket.
     * Aquí es donde la aplicación reacciona a los eventos de señalización del servidor.
     */
    registerWebSocketHandlers() {
        // Evento: El servidor nos asigna un ID único al conectarnos.
        this.wsManager.onMessage('assign-id', (message) => {
            console.log('Evento recibido: assign-id', message);
            this.rtcManager.setMyUserId(message.userId);
            console.log(`ID de usuario asignado: ${message.userId}`);
        });

        // Evento: Un nuevo usuario se ha unido a la sala.
        this.wsManager.onMessage('user-joined', (message) => {
            console.log('Procesando evento: user-joined', message);
            this.rtcManager.handleUserJoined(message.userId);
            UIManager.showNotification(`Usuario ${message.userId.substring(0, 6)} se unió a la llamada`, 'info');
        });

        // Evento: Al entrar, el servidor nos envía una lista de los usuarios que ya estaban en la sala.
        this.wsManager.onMessage('existing-users', (message) => {
            console.log('Procesando evento: existing-users', message);
            message.userIds.forEach(userId => this.rtcManager.handleUserJoined(userId));
        });

        // Evento: Un usuario ha abandonado la sala.
        this.wsManager.onMessage('user-left', (message) => {
            console.log('Procesando evento: user-left', message);
            this.rtcManager.handleUserLeft(message.userId);
            UIManager.showNotification(`Usuario ${message.userId.substring(0, 6)} salió de la llamada`, 'info');
        });

        // Evento: Recibimos una "oferta" de otro par para iniciar una conexión WebRTC.
        this.wsManager.onMessage('offer', (message) => {
            console.log('Procesando evento: offer (oferta)', message);
            this.rtcManager.handleOffer(message.fromUserId, message.offer);
        });

        // Evento: Recibimos una "respuesta" a una oferta que enviamos previamente.
        this.wsManager.onMessage('answer', (message) => {
            console.log('Procesando evento: answer (respuesta)', message);
            this.rtcManager.handleAnswer(message.fromUserId, message.answer);
        });

        // Evento: Recibimos un "candidato ICE".
        this.wsManager.onMessage('ice-candidate', (message) => {
            console.log('Procesando evento: ice-candidate (candidato ICE)', message);
            this.rtcManager.handleIceCandidate(message.fromUserId, message.candidate);
        });
        
        // Evento: Mensaje de chat
        this.wsManager.onMessage('chat-message', (message) => {
            console.log('Procesando evento: chat-message', message);
            UIManager.addChatMessage(message.message, message.fromUserId, false);
        });
        
        // Evento: Actualización de nombre de usuario
        this.wsManager.onMessage('username-update', (message) => {
            console.log('Procesando evento: username-update', message);
            UIManager.updateVideoLabel(message.userId, message.username);
        });
    }
    
    /**
     * Toggle audio (mute/unmute)
     */
    toggleAudio() {
        const audioTrack = this.peerManager.localStream?.getAudioTracks()[0];
        if (audioTrack) {
            audioTrack.enabled = !audioTrack.enabled;
            this.isAudioEnabled = audioTrack.enabled;
            
            const btn = document.getElementById('toggleAudioBtn');
            if (this.isAudioEnabled) {
                btn.innerHTML = '<i class="fas fa-microphone"></i>';
                btn.classList.remove('active');
            } else {
                btn.innerHTML = '<i class="fas fa-microphone-slash"></i>';
                btn.classList.add('active');
            }
            
            UIManager.showNotification(
                this.isAudioEnabled ? 'Micrófono activado' : 'Micrófono silenciado',
                'info'
            );
        }
    }
    
    /**
     * Toggle video (on/off)
     */
    toggleVideo() {
        const videoTrack = this.peerManager.localStream?.getVideoTracks()[0];
        if (videoTrack) {
            videoTrack.enabled = !videoTrack.enabled;
            this.isVideoEnabled = videoTrack.enabled;
            
            const btn = document.getElementById('toggleVideoBtn');
            if (this.isVideoEnabled) {
                btn.innerHTML = '<i class="fas fa-video"></i>';
                btn.classList.remove('active');
            } else {
                btn.innerHTML = '<i class="fas fa-video-slash"></i>';
                btn.classList.add('active');
            }
            
            UIManager.showNotification(
                this.isVideoEnabled ? 'Cámara activada' : 'Cámara desactivada',
                'info'
            );
        }
    }
    
    /**
     * Toggle screen sharing
     */
    async toggleScreenShare() {
        try {
            if (!this.isScreenSharing) {
                // Iniciar compartir pantalla
                const screenStream = await navigator.mediaDevices.getDisplayMedia({
                    video: { cursor: 'always' },
                    audio: false
                });
                
                const screenTrack = screenStream.getVideoTracks()[0];
                
                // Reemplazar track de video en todas las conexiones
                this.peerManager.peerConnections.forEach((pc) => {
                    const sender = pc.getSenders().find(s => s.track?.kind === 'video');
                    if (sender) {
                        sender.replaceTrack(screenTrack);
                    }
                });
                
                // Actualizar video local
                if (this.localVideoElement) {
                    this.localVideoElement.srcObject = screenStream;
                }
                
                // Detectar cuando el usuario deja de compartir
                screenTrack.onended = () => {
                    this.stopScreenShare();
                };
                
                this.isScreenSharing = true;
                const btn = document.getElementById('shareScreenBtn');
                btn.classList.add('active');
                btn.innerHTML = '<i class="fas fa-stop"></i>';
                
                UIManager.showNotification('Compartiendo pantalla', 'success');
            } else {
                this.stopScreenShare();
            }
        } catch (error) {
            console.error('Error al compartir pantalla:', error);
            UIManager.showNotification('Error al compartir pantalla', 'error');
        }
    }
    
    /**
     * Stop screen sharing
     */
    stopScreenShare() {
        if (this.originalStream) {
            const videoTrack = this.originalStream.getVideoTracks()[0];
            
            // Restaurar track de video original
            this.peerManager.peerConnections.forEach((pc) => {
                const sender = pc.getSenders().find(s => s.track?.kind === 'video');
                if (sender) {
                    sender.replaceTrack(videoTrack);
                }
            });
            
            // Restaurar video local
            if (this.localVideoElement) {
                this.localVideoElement.srcObject = this.originalStream;
            }
        }
        
        this.isScreenSharing = false;
        const btn = document.getElementById('shareScreenBtn');
        btn.classList.remove('active');
        btn.innerHTML = '<i class="fas fa-desktop"></i>';
        
        UIManager.showNotification('Pantalla compartida detenida', 'info');
    }
    
    /**
     * Send chat message
     */
    sendChatMessage(message) {
        this.wsManager.send({
            type: 'chat-message',
            message: message
        });
        
        UIManager.addChatMessage(message, this.rtcManager.myUserId, true);
    }
    
    /**
     * Update username
     */
    updateUsername(username) {
        this.username = username;
        this.wsManager.send({
            type: 'username-update',
            username: username
        });
        
        UIManager.updateVideoLabel('local', username);
    }
    
    /**
     * Leave the call
     */
    leave() {
        // Detener todos los tracks
        if (this.peerManager.localStream) {
            this.peerManager.localStream.getTracks().forEach(track => track.stop());
        }
        
        // Cerrar todas las conexiones
        this.peerManager.peerConnections.forEach((pc, userId) => {
            pc.close();
        });
        
        // Cerrar WebSocket
        this.wsManager.close();
        
        UIManager.showNotification('Has salido de la llamada', 'info');
    }
}