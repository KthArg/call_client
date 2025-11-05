import { VideoConferenceApp } from './VideoConferenceApp.js';

// --- Inicialización de la Aplicación ---
async function main() {
    try {
        const app = new VideoConferenceApp();
        await app.start();
        
        // Configurar event listeners de la UI
        setupUIControls(app);
    } catch (error) {
        console.error('Fallo al iniciar la aplicación:', error);
        alert('Error al iniciar la aplicación. Por favor, verifica tus permisos de cámara y micrófono.');
    }
}

function setupUIControls(app) {
    // Control de audio
    const toggleAudioBtn = document.getElementById('toggleAudioBtn');
    toggleAudioBtn.addEventListener('click', () => {
        app.toggleAudio();
    });
    
    // Control de video
    const toggleVideoBtn = document.getElementById('toggleVideoBtn');
    toggleVideoBtn.addEventListener('click', () => {
        app.toggleVideo();
    });
    
    // Compartir pantalla
    const shareScreenBtn = document.getElementById('shareScreenBtn');
    shareScreenBtn.addEventListener('click', () => {
        app.toggleScreenShare();
    });
    
    // Salir de la llamada
    const leaveBtn = document.getElementById('leaveBtn');
    leaveBtn.addEventListener('click', () => {
        if (confirm('¿Estás seguro de que quieres salir de la llamada?')) {
            app.leave();
            window.location.reload();
        }
    });
    
    // Chat
    const chatBtn = document.getElementById('chatBtn');
    const chatPanel = document.getElementById('chatPanel');
    const closeChatBtn = document.getElementById('closeChatBtn');
    
    chatBtn.addEventListener('click', () => {
        chatPanel.classList.toggle('open');
    });
    
    closeChatBtn.addEventListener('click', () => {
        chatPanel.classList.remove('open');
    });
    
    // Enviar mensaje de chat
    const chatInput = document.getElementById('chatInput');
    const sendChatBtn = document.getElementById('sendChatBtn');
    
    const sendMessage = () => {
        const message = chatInput.value.trim();
        if (message) {
            app.sendChatMessage(message);
            chatInput.value = '';
        }
    };
    
    sendChatBtn.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
    
    // Configuración
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsModal = document.getElementById('settingsModal');
    const closeSettingsBtn = document.getElementById('closeSettingsBtn');
    
    settingsBtn.addEventListener('click', async () => {
        settingsModal.classList.add('open');
        await populateDeviceSelectors();
    });
    
    closeSettingsBtn.addEventListener('click', () => {
        settingsModal.classList.remove('open');
    });
    
    // Cerrar modal al hacer clic fuera
    settingsModal.addEventListener('click', (e) => {
        if (e.target === settingsModal) {
            settingsModal.classList.remove('open');
        }
    });
    
    // Copiar enlace
    const copyLinkBtn = document.getElementById('copyLinkBtn');
    copyLinkBtn.addEventListener('click', () => {
        const link = window.location.href;
        navigator.clipboard.writeText(link).then(() => {
            import('./UIManager.js').then(module => {
                module.UIManager.showNotification('Enlace copiado al portapapeles', 'success');
            });
        }).catch(err => {
            console.error('Error al copiar:', err);
        });
    });
    
    // Guardar nombre de usuario
    const usernameInput = document.getElementById('usernameInput');
    usernameInput.addEventListener('change', (e) => {
        const username = e.target.value.trim();
        if (username) {
            localStorage.setItem('username', username);
            app.updateUsername(username);
        }
    });
    
    // Cargar nombre guardado
    const savedUsername = localStorage.getItem('username');
    if (savedUsername) {
        usernameInput.value = savedUsername;
        app.updateUsername(savedUsername);
    }
}

async function populateDeviceSelectors() {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        
        const audioInputSelect = document.getElementById('audioInputSelect');
        const videoInputSelect = document.getElementById('videoInputSelect');
        const audioOutputSelect = document.getElementById('audioOutputSelect');
        
        // Limpiar opciones existentes
        audioInputSelect.innerHTML = '';
        videoInputSelect.innerHTML = '';
        audioOutputSelect.innerHTML = '';
        
        devices.forEach(device => {
            const option = document.createElement('option');
            option.value = device.deviceId;
            option.text = device.label || `${device.kind} ${audioInputSelect.length + 1}`;
            
            if (device.kind === 'audioinput') {
                audioInputSelect.appendChild(option);
            } else if (device.kind === 'videoinput') {
                videoInputSelect.appendChild(option);
            } else if (device.kind === 'audiooutput') {
                audioOutputSelect.appendChild(option);
            }
        });
    } catch (error) {
        console.error('Error al obtener dispositivos:', error);
    }
}

main().catch(console.error);

