/**
 * Configuración de la aplicación de videollamadas
 */

const config = {
    // URL del servidor WebSocket para señalización
    WEBSOCKET_URL: 'ws://localhost:8000',
    
    // Configuración de servidores ICE (STUN/TURN)
    ICE_SERVERS: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' },
    ],
    
    // Constraints por defecto para getUserMedia
    DEFAULT_MEDIA_CONSTRAINTS: {
        video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 30, max: 60 }
        },
        audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
        }
    },
    
    // Configuración de compartir pantalla
    SCREEN_SHARE_CONSTRAINTS: {
        video: {
            cursor: 'always',
            displaySurface: 'monitor',
        },
        audio: false
    },
    
    // Configuración de reconexión WebSocket
    WEBSOCKET_RECONNECT: {
        maxAttempts: 5,
        initialDelay: 2000, // 2 segundos
        maxDelay: 30000 // 30 segundos
    },
    
    // Configuración de UI
    UI: {
        notificationDuration: 4000, // 4 segundos
        chatMaxMessages: 100,
        videoGridMinSize: 300, // píxeles
    },
    
    // Características habilitadas
    FEATURES: {
        chat: true,
        screenShare: true,
        recording: false, // Para futuras versiones
        backgroundBlur: false, // Para futuras versiones
        virtualBackground: false // Para futuras versiones
    },
    
    // Configuración de desarrollo
    DEBUG: true, // Cambiar a false en producción
    LOG_LEVEL: 'info', // 'debug', 'info', 'warn', 'error'
};

export default config;