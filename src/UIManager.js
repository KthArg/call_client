const videoGrid = document.getElementById('videoGrid');

/**
 * Gestiona la creación y eliminación de elementos de video en la interfaz de usuario.
 */
export const UIManager = {
    participants: new Map(),
    
    createVideoElement: (userId, isLocal = false) => {
        // Crear contenedor de video
        const container = document.createElement('div');
        container.className = 'video-container';
        container.id = `container-${userId}`;
        
        // Crear elemento de video
        const videoElement = document.createElement('video');
        videoElement.id = `video-${userId}`;
        videoElement.autoplay = true;
        videoElement.playsInline = true;
        if (isLocal) {
            videoElement.muted = true;
        }
        
        // Crear etiqueta con nombre
        const label = document.createElement('div');
        label.className = isLocal ? 'video-label local' : 'video-label';
        label.innerHTML = `
            <i class="fas fa-user"></i>
            <span>${isLocal ? 'Tú' : `Usuario ${userId.substring(0, 6)}`}</span>
        `;
        
        // Crear controles de video individuales
        const controls = document.createElement('div');
        controls.className = 'video-controls';
        controls.innerHTML = `
            <button onclick="UIManager.toggleFullscreen('${userId}')" title="Pantalla completa">
                <i class="fas fa-expand"></i>
            </button>
            ${!isLocal ? `<button onclick="UIManager.togglePinVideo('${userId}')" title="Fijar video">
                <i class="fas fa-thumbtack"></i>
            </button>` : ''}
        `;
        
        // Spinner de carga
        const spinner = document.createElement('div');
        spinner.className = 'loading-spinner';
        spinner.id = `spinner-${userId}`;
        
        // Ensamblar elementos
        container.appendChild(videoElement);
        container.appendChild(label);
        container.appendChild(controls);
        container.appendChild(spinner);
        videoGrid.appendChild(container);
        
        // Guardar información del participante
        UIManager.participants.set(userId, {
            container,
            videoElement,
            label,
            isLocal,
            isPinned: false
        });
        
        // Ocultar spinner cuando el video comience
        videoElement.addEventListener('loadeddata', () => {
            spinner.style.display = 'none';
        });
        
        UIManager.updateParticipantCount();
        
        return videoElement;
    },
    
    removeVideoElement: (userId) => {
        const container = document.getElementById(`container-${userId}`);
        if (container) {
            container.remove();
        }
        UIManager.participants.delete(userId);
        UIManager.updateParticipantCount();
    },
    
    updateParticipantCount: () => {
        const count = UIManager.participants.size;
        const countElement = document.getElementById('participantNumber');
        if (countElement) {
            countElement.textContent = count;
        }
    },
    
    toggleFullscreen: (userId) => {
        const container = document.getElementById(`container-${userId}`);
        if (!container) return;
        
        if (!document.fullscreenElement) {
            container.requestFullscreen().catch(err => {
                console.error('Error al entrar en pantalla completa:', err);
            });
        } else {
            document.exitFullscreen();
        }
    },
    
    togglePinVideo: (userId) => {
        const participant = UIManager.participants.get(userId);
        if (!participant) return;
        
        participant.isPinned = !participant.isPinned;
        
        if (participant.isPinned) {
            participant.container.style.gridColumn = 'span 2';
            participant.container.style.gridRow = 'span 2';
        } else {
            participant.container.style.gridColumn = '';
            participant.container.style.gridRow = '';
        }
    },
    
    updateVideoLabel: (userId, username) => {
        const participant = UIManager.participants.get(userId);
        if (participant && participant.label) {
            const span = participant.label.querySelector('span');
            if (span) {
                span.textContent = username;
            }
        }
    },
    
    showNotification: (message, type = 'info') => {
        const notificationsContainer = document.getElementById('notifications');
        if (!notificationsContainer) return;
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        const icon = type === 'success' ? 'fa-check-circle' : 
                     type === 'error' ? 'fa-exclamation-circle' : 
                     'fa-info-circle';
        
        notification.innerHTML = `
            <i class="fas ${icon}"></i>
            <span>${message}</span>
        `;
        
        notificationsContainer.appendChild(notification);
        
        // Remover después de 4 segundos
        setTimeout(() => {
            notification.style.animation = 'slideInRight 0.3s ease reverse';
            setTimeout(() => notification.remove(), 300);
        }, 4000);
    },
    
    addChatMessage: (message, senderId, isLocal = false) => {
        const chatMessages = document.getElementById('chatMessages');
        if (!chatMessages) return;
        
        const messageElement = document.createElement('div');
        messageElement.className = `chat-message ${isLocal ? 'local' : 'remote'}`;
        
        const senderName = isLocal ? 'Tú' : `Usuario ${senderId.substring(0, 6)}`;
        
        messageElement.innerHTML = `
            <div class="chat-message-sender">${senderName}</div>
            <div>${message}</div>
        `;
        
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
};