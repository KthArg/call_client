export class PeerConnectionManager {
    constructor() {
        this.peerConnections = new Map(); // Map of userId -> RTCPeerConnection
        this.localStream = null;
        this.rtcManager = null;
        this.iceServers = [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
        ];
    }

    setRtcManager(rtcManager) {
        this.rtcManager = rtcManager;
    }

    async setupLocalStream(constraints = { video: true, audio: true }) {
        try {
            this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
            if (this.rtcManager) this.rtcManager.setLocalStream(this.localStream);
            return this.localStream;
        } catch (error) {
            console.error('Error al obtener stream local:', error);
            throw error;
        }
    }

    createPeerConnection(userId) {
        const configuration = {
            iceServers: this.iceServers,
            iceCandidatePoolSize: 10,
        };
        
        const peerConnection = new RTCPeerConnection(configuration);
        this.peerConnections.set(userId, peerConnection);
        
        // Monitorear estado de la conexión
        peerConnection.onconnectionstatechange = () => {
            console.log(`Estado de conexión con ${userId}: ${peerConnection.connectionState}`);
            
            switch (peerConnection.connectionState) {
                case 'connected':
                    console.log(`✓ Conectado exitosamente con ${userId}`);
                    break;
                case 'disconnected':
                    console.log(`⚠ Desconectado de ${userId}`);
                    break;
                case 'failed':
                    console.log(`✗ Fallo la conexión con ${userId}`);
                    this.removePeerConnection(userId);
                    break;
                case 'closed':
                    console.log(`Conexión cerrada con ${userId}`);
                    break;
            }
        };
        
        // Monitorear estado ICE
        peerConnection.oniceconnectionstatechange = () => {
            console.log(`Estado ICE con ${userId}: ${peerConnection.iceConnectionState}`);
        };
        
        return peerConnection;
    }

    removePeerConnection(userId) {
        const connection = this.peerConnections.get(userId);
        if (connection) {
            connection.close();
            this.peerConnections.delete(userId);
            console.log(`Conexión con ${userId} eliminada.`);
        }
    }
    
    /**
     * Obtiene estadísticas de una conexión específica
     */
    async getConnectionStats(userId) {
        const connection = this.peerConnections.get(userId);
        if (!connection) return null;
        
        try {
            const stats = await connection.getStats();
            const report = {
                video: {},
                audio: {},
                connection: {}
            };
            
            stats.forEach(stat => {
                if (stat.type === 'inbound-rtp') {
                    if (stat.kind === 'video') {
                        report.video = {
                            bytesReceived: stat.bytesReceived,
                            packetsReceived: stat.packetsReceived,
                            packetsLost: stat.packetsLost,
                            framesDecoded: stat.framesDecoded,
                            frameRate: stat.framesPerSecond
                        };
                    } else if (stat.kind === 'audio') {
                        report.audio = {
                            bytesReceived: stat.bytesReceived,
                            packetsReceived: stat.packetsReceived,
                            packetsLost: stat.packetsLost
                        };
                    }
                } else if (stat.type === 'candidate-pair' && stat.state === 'succeeded') {
                    report.connection = {
                        currentRoundTripTime: stat.currentRoundTripTime,
                        availableOutgoingBitrate: stat.availableOutgoingBitrate
                    };
                }
            });
            
            return report;
        } catch (error) {
            console.error('Error al obtener estadísticas:', error);
            return null;
        }
    }
    
    /**
     * Cierra todas las conexiones
     */
    closeAllConnections() {
        this.peerConnections.forEach((connection, userId) => {
            this.removePeerConnection(userId);
        });
        
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop());
            this.localStream = null;
        }
    }
}