/**
 * ==============================================================================
 * VIERNES 13 • MARCOS MENCHACA — LÓGICA INTERACTIVA (script.js)
 * Funcionalidades:
 * 1. Desbloqueo y reproducción fluida de audio local (con respaldo YouTube).
 * 2. Transición cinemática del sobre cerrado a la tarjeta Polaroid inmersiva.
 * 3. Simulación de partículas en Canvas (pétalos de rosas flotantes y estrellas).
 * 4. Efecto de inclinación 3D (Tilt) interactivo con ratón y giroscopio móvil.
 * 5. Mini reproductor con ondas sonoras, scrubber interactivo y controles completos.
 * 6. Explosión de rosas, corazones y destellos al enviar abrazos con contador.
 * ==============================================================================
 */

document.addEventListener('DOMContentLoaded', () => {

    /* --------------------------------------------------------------------------
       1. REFERENCIAS AL DOM
       -------------------------------------------------------------------------- */
    // Pantalla de apertura y sobre
    const introScreen = document.getElementById('intro-screen');
    const envelopeWrapper = document.getElementById('envelope-wrapper');
    const btnOpenEnvelope = document.getElementById('btn-open-envelope');
    const waxSeal = document.getElementById('wax-seal');

    // Pantalla principal y reproductor
    const mainScreen = document.getElementById('main-screen');
    const audioElement = document.getElementById('audio-element');
    const btnPlayPause = document.getElementById('btn-play-pause');
    const iconPlay = document.getElementById('icon-play');
    const iconPause = document.getElementById('icon-pause');
    const btnReplay = document.getElementById('btn-replay');
    const btnQuickMute = document.getElementById('btn-quick-mute');
    const iconSoundOn = document.getElementById('icon-sound-on');
    const iconSoundOff = document.getElementById('icon-sound-off');
    const progressContainer = document.getElementById('progress-container');
    const progressFill = document.getElementById('progress-fill');
    const currentTimeLabel = document.getElementById('current-time');
    const totalDurationLabel = document.getElementById('total-duration');
    const soundWaveBars = document.querySelectorAll('.wave-bar');
    const nowPlayingPill = document.getElementById('now-playing-pill');
    const polaroidCard = document.getElementById('polaroid-card');
    const vinylDisc = document.getElementById('vinyl-disc');
    const audioStatusText = document.getElementById('audio-status-text');

    // Reproductor alternativo embebido
    const btnSwitchSource = document.getElementById('btn-switch-source');
    const fallbackEmbedWrapper = document.getElementById('fallback-embed-wrapper');
    const btnCloseFallback = document.getElementById('btn-close-fallback');
    const youtubeIframe = document.getElementById('youtube-fallback-iframe');

    // Escena 3D e interactividad
    const polaroidScene = document.getElementById('polaroid-scene');
    const polaroidGlare = document.getElementById('polaroid-glare');

    // Botón interactivo de abrazos y toast
    const btnSendHug = document.getElementById('btn-send-hug');
    const hugCountLabel = document.getElementById('hug-count');
    const toastWish = document.getElementById('toast-wish');
    const toastTitle = document.getElementById('toast-title');
    const toastMessage = document.getElementById('toast-message');
    const quotePills = document.querySelectorAll('.quote-pill');

    // Canvases
    const bgCanvas = document.getElementById('particles-canvas');
    const burstCanvas = document.getElementById('burst-canvas');

    /* --------------------------------------------------------------------------
       2. ESTADO DE LA APLICACIÓN
       -------------------------------------------------------------------------- */
    let isPlaying = false;
    let isSeeking = false;
    let hasUnlockedAudio = false;
    let toastTimeout = null;
    let hugCount = parseInt(localStorage.getItem('viernes13_hugs') || '0', 10);
    hugCountLabel.textContent = hugCount;

    // ID del video oficial de respaldo de YouTube: "Viernes 13 - Marcos Menchaca"
    const YOUTUBE_VIDEO_ID = '3hiYJIyDoBI';

    /* --------------------------------------------------------------------------
       3. TRANSICIÓN INICIAL: ABRIR SOBRE Y DESBLOQUEAR MÚSICA
       -------------------------------------------------------------------------- */
    /**
     * Inicia la experiencia: abre la solapa del sobre, inicia la música
     * y revela la tarjeta principal de forma suave y cinemática.
     */
    function handleOpenExperience() {
        if (hasUnlockedAudio) return;
        hasUnlockedAudio = true;

        // 1. Animación del sobre
        envelopeWrapper.classList.add('is-open');
        if (waxSeal) {
            waxSeal.style.opacity = '0';
            waxSeal.style.transform = 'translate(-50%, -50%) scale(0.6)';
        }

        // 2. Intento inmediato de reproducción de audio local en el evento de clic del usuario
        playAudio();

        // 3. Disparo de confeti inicial suave de rosas desde el centro del sobre
        const rect = envelopeWrapper.getBoundingClientRect();
        createBurstAt(rect.left + rect.width / 2, rect.top + rect.height / 2, 35);

        // 4. Transición visual entre pantallas
        setTimeout(() => {
            introScreen.classList.add('is-opening');

            setTimeout(() => {
                introScreen.classList.add('is-hidden');
                mainScreen.classList.remove('is-hidden');
                
                // Forzar reflujo para activar la transición CSS
                void mainScreen.offsetWidth;
                mainScreen.style.opacity = '1';
                mainScreen.style.transform = 'translateY(0)';

                // Ajustar tamaños de canvas tras mostrar la pantalla principal
                resizeCanvases();
            }, 600);
        }, 550);
    }

    btnOpenEnvelope.addEventListener('click', handleOpenExperience);
    envelopeWrapper.addEventListener('click', handleOpenExperience);
    envelopeWrapper.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleOpenExperience();
        }
    });

    /* --------------------------------------------------------------------------
       4. CONTROL Y GESTIÓN DEL AUDIO
       -------------------------------------------------------------------------- */
    /**
     * Inicia la reproducción del audio local de forma segura.
     */
    function playAudio() {
        const playPromise = audioElement.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                setPlayState(true);
            }).catch(error => {
                console.warn('Reproducción local pausada o bloqueada por política de navegador:', error);
                // Si la reproducción local falla, preparamos el reproductor de respaldo
                activateFallbackPlayer(false);
            });
        }
    }

    /**
     * Pausa la reproducción del audio.
     */
    function pauseAudio() {
        audioElement.pause();
        setPlayState(false);
    }

    /**
     * Alterna entre reproducir y pausar.
     */
    function togglePlayPause() {
        if (audioElement.paused) {
            playAudio();
        } else {
            pauseAudio();
        }
    }

    /**
     * Actualiza el estado visual de la interfaz según la reproducción.
     */
    function setPlayState(playing) {
        isPlaying = playing;
        if (playing) {
            iconPlay.classList.add('is-hidden');
            iconPause.classList.remove('is-hidden');
            nowPlayingPill.classList.remove('is-paused');
            polaroidCard.classList.add('is-playing');
            if (vinylDisc) vinylDisc.style.animationPlayState = 'running';

            soundWaveBars.forEach(bar => bar.classList.add('is-animated'));
        } else {
            iconPlay.classList.remove('is-hidden');
            iconPause.classList.add('is-hidden');
            nowPlayingPill.classList.add('is-paused');
            polaroidCard.classList.remove('is-playing');
            if (vinylDisc) vinylDisc.style.animationPlayState = 'paused';

            soundWaveBars.forEach(bar => bar.classList.remove('is-animated'));
        }
    }

    btnPlayPause.addEventListener('click', togglePlayPause);

    // Botón de reinicio a tiempo 0
    btnReplay.addEventListener('click', () => {
        audioElement.currentTime = 0;
        playAudio();
    });

    // Botón de silenciar rápido
    btnQuickMute.addEventListener('click', () => {
        audioElement.muted = !audioElement.muted;
        if (audioElement.muted) {
            iconSoundOn.classList.add('is-hidden');
            iconSoundOff.classList.remove('is-hidden');
        } else {
            iconSoundOn.classList.remove('is-hidden');
            iconSoundOff.classList.add('is-hidden');
        }
    });

    /**
     * Formatea segundos a mm:ss (ej: 181 -> "3:01")
     */
    function formatTime(seconds) {
        if (isNaN(seconds) || !isFinite(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }

    // Actualización continua de la barra de progreso
    audioElement.addEventListener('timeupdate', () => {
        if (isSeeking) return;
        const current = audioElement.currentTime;
        const duration = audioElement.duration || 181; // 3:01 por defecto si no está listo aún

        currentTimeLabel.textContent = formatTime(current);
        totalDurationLabel.textContent = formatTime(duration);

        const progressPercent = (current / duration) * 100;
        progressFill.style.width = `${progressPercent}%`;
        progressContainer.setAttribute('aria-valuenow', Math.round(progressPercent));
    });

    // Duración cargada
    audioElement.addEventListener('loadedmetadata', () => {
        totalDurationLabel.textContent = formatTime(audioElement.duration);
    });

    // Cuando termina la canción, reproducir en bucle continuo romántico
    audioElement.addEventListener('ended', () => {
        audioElement.currentTime = 0;
        playAudio();
    });

    // Control de arrastre / clic sobre la barra de progreso
    function updateProgressFromEvent(e) {
        const rect = progressContainer.getBoundingClientRect();
        const clientX = e.clientX || (e.touches && e.touches[0].clientX);
        if (clientX === undefined) return;

        let offsetX = clientX - rect.left;
        offsetX = Math.max(0, Math.min(offsetX, rect.width));
        const percentage = offsetX / rect.width;
        const duration = audioElement.duration || 181;

        progressFill.style.width = `${percentage * 100}%`;
        audioElement.currentTime = percentage * duration;
        currentTimeLabel.textContent = formatTime(audioElement.currentTime);
    }

    progressContainer.addEventListener('mousedown', (e) => {
        isSeeking = true;
        updateProgressFromEvent(e);

        const onMouseMove = (moveEvent) => updateProgressFromEvent(moveEvent);
        const onMouseUp = () => {
            isSeeking = false;
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
    });

    progressContainer.addEventListener('touchstart', (e) => {
        isSeeking = true;
        updateProgressFromEvent(e);

        const onTouchMove = (moveEvent) => updateProgressFromEvent(moveEvent);
        const onTouchEnd = () => {
            isSeeking = false;
            window.removeEventListener('touchmove', onTouchMove);
            window.removeEventListener('touchend', onTouchEnd);
        };

        window.addEventListener('touchmove', onTouchMove, { passive: true });
        window.addEventListener('touchend', onTouchEnd);
    }, { passive: true });

    /* --------------------------------------------------------------------------
       5. SISTEMA DE RESPALDO: REPRODUCTOR EMBEBIDO (YOUTUBE / SPOTIFY)
       -------------------------------------------------------------------------- */
    /**
     * Activa el reproductor alternativo de YouTube si el archivo local falla
     * o si el usuario desea abrir la versión oficial online.
     */
    function activateFallbackPlayer(autoplay = false) {
        fallbackEmbedWrapper.classList.remove('is-hidden');
        if (!youtubeIframe.src || youtubeIframe.src === '' || youtubeIframe.src === window.location.href) {
            const autoplayParam = autoplay ? '1' : '0';
            youtubeIframe.src = `https://www.youtube-nocookie.com/embed/${YOUTUBE_VIDEO_ID}?autoplay=${autoplayParam}&rel=0`;
        }
        audioStatusText.textContent = 'Reproduciendo versión oficial en YouTube';
        const indicator = document.querySelector('.status-indicator');
        if (indicator) indicator.style.backgroundColor = '#F59E0B';
    }

    // Si ocurre un error al cargar el mp3 local
    audioElement.addEventListener('error', (err) => {
        console.warn('El archivo de audio local no pudo reproducirse, activando respaldo:', err);
        activateFallbackPlayer(true);
    });

    // Botón para alternar manualmente al reproductor embebido
    btnSwitchSource.addEventListener('click', () => {
        const isCurrentlyHidden = fallbackEmbedWrapper.classList.contains('is-hidden');
        if (isCurrentlyHidden) {
            pauseAudio();
            activateFallbackPlayer(true);
        } else {
            fallbackEmbedWrapper.classList.add('is-hidden');
            youtubeIframe.src = ''; // Detener iframe
            audioStatusText.textContent = 'Audio local';
            playAudio();
        }
    });

    // Cerrar reproductor embebido
    btnCloseFallback.addEventListener('click', () => {
        fallbackEmbedWrapper.classList.add('is-hidden');
        youtubeIframe.src = '';
        audioStatusText.textContent = 'Audio local';
    });

    /* --------------------------------------------------------------------------
       6. EFECTO DE INCLINACIÓN 3D (TILT) EN LA POLAROID
       -------------------------------------------------------------------------- */
    const MAX_TILT_DEG = 14;

    function applyTilt(rotateX, rotateY, glareX, glareY, glareOpacity) {
        polaroidCard.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(10px)`;
        if (polaroidGlare) {
            polaroidGlare.style.opacity = glareOpacity;
            polaroidGlare.style.background = `radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0) 60%)`;
        }
    }

    function resetTilt() {
        polaroidCard.style.transform = 'rotateX(0deg) rotateY(0deg) translateZ(0)';
        if (polaroidGlare) {
            polaroidGlare.style.opacity = '0';
        }
    }

    // Efecto con ratón en escritorio
    polaroidScene.addEventListener('mousemove', (e) => {
        const rect = polaroidScene.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = ((y - centerY) / centerY) * -MAX_TILT_DEG;
        const rotateY = ((x - centerX) / centerX) * MAX_TILT_DEG;

        const glareX = (x / rect.width) * 100;
        const glareY = (y / rect.height) * 100;

        applyTilt(rotateX, rotateY, glareX, glareY, 0.45);
    });

    polaroidScene.addEventListener('mouseleave', resetTilt);

    // Soporte con Giroscopio en teléfonos móviles
    if (window.DeviceOrientationEvent && typeof window.DeviceOrientationEvent.requestPermission !== 'function') {
        window.addEventListener('deviceorientation', (e) => {
            if (!e.gamma || !e.beta) return;
            // Gamma: inclinación izquierda/derecha (-90 a 90)
            // Beta: inclinación adelante/atrás (-180 a 180)
            const tiltY = Math.max(-MAX_TILT_DEG, Math.min(MAX_TILT_DEG, e.gamma / 3));
            const tiltX = Math.max(-MAX_TILT_DEG, Math.min(MAX_TILT_DEG, (e.beta - 45) / 3));
            applyTilt(tiltX, tiltY, 50 + tiltY * 2, 50 + tiltX * 2, 0.3);
        }, { passive: true });
    }

    /* --------------------------------------------------------------------------
       7. SISTEMA DE PARTÍCULAS EN CANVAS (FONDO DE ROSAS Y ESTRELLAS)
       -------------------------------------------------------------------------- */
    const bgCtx = bgCanvas.getContext('2d');
    const burstCtx = burstCanvas.getContext('2d');

    let width = (bgCanvas.width = burstCanvas.width = window.innerWidth);
    let height = (bgCanvas.height = burstCanvas.height = window.innerHeight);

    function resizeCanvases() {
        width = bgCanvas.width = burstCanvas.width = window.innerWidth;
        height = bgCanvas.height = burstCanvas.height = window.innerHeight;
    }

    window.addEventListener('resize', resizeCanvases);

    // Generador de pétalos de rosa para el fondo
    class FallingPetal {
        constructor() {
            this.reset(true);
        }

        reset(initial = false) {
            this.x = Math.random() * width;
            this.y = initial ? Math.random() * height : -20;
            this.size = 10 + Math.random() * 14;
            this.speedY = 0.6 + Math.random() * 1.2;
            this.speedX = (Math.random() - 0.5) * 0.8;
            this.angle = Math.random() * Math.PI * 2;
            this.angularSpeed = (Math.random() - 0.5) * 0.03;
            this.oscillationSpeed = 0.015 + Math.random() * 0.02;
            this.oscillationOffset = Math.random() * Math.PI * 2;
            this.opacity = 0.35 + Math.random() * 0.45;
            
            // Variaciones de color: carmesí profundo a rosa suave
            const colors = [
                'rgba(220, 38, 38, ',
                'rgba(225, 29, 72, ',
                'rgba(244, 63, 94, ',
                'rgba(251, 113, 133, '
            ];
            this.colorBase = colors[Math.floor(Math.random() * colors.length)];
        }

        update(time) {
            this.y += this.speedY;
            this.x += this.speedX + Math.sin(time * this.oscillationSpeed + this.oscillationOffset) * 0.6;
            this.angle += this.angularSpeed;

            if (this.y > height + 25 || this.x < -30 || this.x > width + 30) {
                this.reset();
            }
        }

        draw(ctx) {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.angle);

            ctx.fillStyle = `${this.colorBase}${this.opacity})`;
            ctx.beginPath();
            // Dibujar forma orgánica de pétalo de rosa
            ctx.moveTo(0, -this.size / 2);
            ctx.bezierCurveTo(this.size / 2, -this.size / 2, this.size / 1.5, this.size / 2, 0, this.size);
            ctx.bezierCurveTo(-this.size / 1.5, this.size / 2, -this.size / 2, -this.size / 2, 0, -this.size / 2);
            ctx.fill();

            ctx.restore();
        }
    }

    // Estrellas diminutas parpadeantes en el cielo nocturno
    class BackgroundStar {
        constructor() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.radius = 0.5 + Math.random() * 1.2;
            this.alpha = Math.random();
            this.alphaSpeed = 0.008 + Math.random() * 0.015;
            this.isRed = Math.random() > 0.7; // Algunas con tonalidad rojiza sutil
        }

        update() {
            this.alpha += this.alphaSpeed;
            if (this.alpha > 1 || this.alpha < 0.1) {
                this.alphaSpeed = -this.alphaSpeed;
            }
        }

        draw(ctx) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = this.isRed 
                ? `rgba(251, 113, 133, ${this.alpha * 0.6})`
                : `rgba(255, 255, 255, ${this.alpha * 0.7})`;
            ctx.fill();
        }
    }

    // Creación de elementos de fondo
    const PETAL_COUNT = width < 600 ? 18 : 32;
    const STAR_COUNT = width < 600 ? 30 : 60;
    const backgroundPetals = Array.from({ length: PETAL_COUNT }, () => new FallingPetal());
    const backgroundStars = Array.from({ length: STAR_COUNT }, () => new BackgroundStar());

    let animationTime = 0;
    function renderBackground() {
        animationTime += 1;
        bgCtx.clearRect(0, 0, width, height);

        // Dibujar estrellas
        for (let i = 0; i < backgroundStars.length; i++) {
            backgroundStars[i].update();
            backgroundStars[i].draw(bgCtx);
        }

        // Dibujar pétalos
        for (let i = 0; i < backgroundPetals.length; i++) {
            backgroundPetals[i].update(animationTime);
            backgroundPetals[i].draw(bgCtx);
        }

        requestAnimationFrame(renderBackground);
    }
    renderBackground();

    /* --------------------------------------------------------------------------
       8. EXPLOSIÓN DE CONFETI, ROSAS Y DESTELLOS AL ENVIAR ABRAZOS
       -------------------------------------------------------------------------- */
    let burstParticles = [];

    class BurstParticle {
        constructor(originX, originY) {
            this.x = originX;
            this.y = originY;
            const angle = Math.random() * Math.PI * 2;
            const speed = 4 + Math.random() * 10;
            this.vx = Math.cos(angle) * speed;
            this.vy = Math.sin(angle) * speed - 2.5; // Impulso inicial hacia arriba
            this.gravity = 0.22 + Math.random() * 0.15;
            this.drag = 0.96;
            this.rotation = Math.random() * Math.PI * 2;
            this.rotationSpeed = (Math.random() - 0.5) * 0.2;
            this.size = 8 + Math.random() * 12;
            this.life = 1;
            this.decay = 0.012 + Math.random() * 0.012;

            // Tipo de partícula: 0 = pétalo rosa, 1 = destello/estrella, 2 = corazón pequeño
            this.type = Math.floor(Math.random() * 3);

            const colors = ['#E11D48', '#DC2626', '#FB7185', '#FFFFFF', '#FFE4E6'];
            this.color = colors[Math.floor(Math.random() * colors.length)];
        }

        update() {
            this.vx *= this.drag;
            this.vy = this.vy * this.drag + this.gravity;
            this.x += this.vx;
            this.y += this.vy;
            this.rotation += this.rotationSpeed;
            this.life -= this.decay;
        }

        draw(ctx) {
            if (this.life <= 0) return;
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation);
            ctx.globalAlpha = Math.max(0, this.life);
            ctx.fillStyle = this.color;

            if (this.type === 0) {
                // Pétalo
                ctx.beginPath();
                ctx.moveTo(0, -this.size / 2);
                ctx.bezierCurveTo(this.size / 2, -this.size / 2, this.size / 1.5, this.size / 2, 0, this.size);
                ctx.bezierCurveTo(-this.size / 1.5, this.size / 2, -this.size / 2, -this.size / 2, 0, -this.size / 2);
                ctx.fill();
            } else if (this.type === 1) {
                // Destello estrella
                ctx.beginPath();
                for (let i = 0; i < 4; i++) {
                    ctx.lineTo(Math.cos((i * Math.PI) / 2) * this.size, Math.sin((i * Math.PI) / 2) * this.size);
                    ctx.lineTo(Math.cos((i * Math.PI) / 2 + Math.PI / 4) * (this.size / 3), Math.sin((i * Math.PI) / 2 + Math.PI / 4) * (this.size / 3));
                }
                ctx.closePath();
                ctx.fill();
            } else {
                // Corazón
                ctx.beginPath();
                const d = this.size / 2;
                ctx.moveTo(0, d / 4);
                ctx.bezierCurveTo(-d, -d / 1.5, -d, d / 1.5, 0, d * 1.2);
                ctx.bezierCurveTo(d, d / 1.5, d, -d / 1.5, 0, d / 4);
                ctx.fill();
            }

            ctx.restore();
        }
    }

    function createBurstAt(x, y, count = 70) {
        for (let i = 0; i < count; i++) {
            burstParticles.push(new BurstParticle(x, y));
        }
    }

    function renderBurst() {
        burstCtx.clearRect(0, 0, width, height);

        for (let i = burstParticles.length - 1; i >= 0; i--) {
            const p = burstParticles[i];
            p.update();
            p.draw(burstCtx);
            if (p.life <= 0) {
                burstParticles.splice(i, 1);
            }
        }

        requestAnimationFrame(renderBurst);
    }
    renderBurst();

    /* --------------------------------------------------------------------------
       9. MENSAJES ALEATORIOS AL ENVIAR ABRAZO & PEDIR DESEO
       -------------------------------------------------------------------------- */
    const warmMessages = [
        {
            title: "¡Abrazo virtual enviado! 🌹",
            message: "La supuesta mala suerte del Viernes 13 no tiene oportunidad contra una amistad tan valiosa."
        },
        {
            title: "¡Deseo sellado en las estrellas! ✨",
            message: "Que nunca falten las risas, las pláticas interminables y las canciones que alegran el alma."
        },
        {
            title: "¡Buena suerte activada! 💖",
            message: "Tenerte como mejor amiga convierte cualquier día difícil en uno lleno de luz y esperanza."
        },
        {
            title: "¡Amistad infinita desbloqueada! 🧸",
            message: "Como dice Marcos Menchaca: 'Y si la vida me da a escoger, te escojo a ti otra vez'."
        },
        {
            title: "¡Un abrazo gigante para ti! 🫂",
            message: "Gracias por existir, por escucharme y por ser la mejor coincidencia de este mundo."
        }
    ];

    function showToast(titleText, messageText) {
        if (toastTimeout) clearTimeout(toastTimeout);

        toastTitle.textContent = titleText;
        toastMessage.textContent = messageText;

        toastWish.classList.remove('is-hidden');
        // Forzar reflujo para transición suave
        void toastWish.offsetWidth;
        toastWish.style.opacity = '1';
        toastWish.style.transform = 'translateX(-50%) translateY(0)';

        toastTimeout = setTimeout(() => {
            toastWish.style.opacity = '0';
            toastWish.style.transform = 'translateX(-50%) translateY(40px)';
            setTimeout(() => {
                toastWish.classList.add('is-hidden');
            }, 400);
        }, 4200);
    }

    // Acción al pulsar el botón principal de Enviar Abrazo
    btnSendHug.addEventListener('click', (e) => {
        const rect = btnSendHug.getBoundingClientRect();
        const originX = rect.left + rect.width / 2;
        const originY = rect.top + rect.height / 2;

        // Disparo masivo de rosas y destellos desde el botón
        createBurstAt(originX, originY, 85);
        // Y dos disparos laterales en cascada
        setTimeout(() => createBurstAt(originX - 120, originY, 35), 120);
        setTimeout(() => createBurstAt(originX + 120, originY, 35), 240);

        // Incrementar contador y guardar en almacenamiento local
        hugCount++;
        hugCountLabel.textContent = hugCount;
        localStorage.setItem('viernes13_hugs', hugCount.toString());

        // Efecto de pulso en el contador
        hugCountLabel.style.transform = 'scale(1.4)';
        setTimeout(() => {
            hugCountLabel.style.transform = 'scale(1)';
        }, 300);

        // Mostrar mensaje bonito aleatorio
        const randomMsg = warmMessages[Math.floor(Math.random() * warmMessages.length)];
        showToast(randomMsg.title, randomMsg.message);
    });

    /* --------------------------------------------------------------------------
       10. FRASES DESTACADAS INTERACTIVAS
       -------------------------------------------------------------------------- */
    quotePills.forEach((pill) => {
        pill.addEventListener('click', (e) => {
            const rect = pill.getBoundingClientRect();
            createBurstAt(rect.left + rect.width / 2, rect.top + rect.height / 2, 25);
            pill.style.transform = 'scale(1.08)';
            setTimeout(() => {
                pill.style.transform = '';
            }, 200);
        });
    });

});
