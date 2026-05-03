// Batalha do Estreito — Cliente Multiplayer
class MultiplayerGame {
    constructor() {
        this.socket = null;
        this.token = null;
        this.user = null;
        this.currentRoom = null;
        this.gameState = null;
        this.isMyTurn = false;
        this.init();
    }

    init() {
        this.setupUI();
        this.checkAuth();
    }

    checkAuth() {
        this.token = localStorage.getItem('game_token');
        this.user = JSON.parse(localStorage.getItem('game_user') || 'null');
        
        // Setup 3D Menu Scene
        if (!this.engine3d) {
            // Need empty callbacks for the menu scene
            this.engine3d = new Engine3D(() => {}, () => {}, () => {});
        }
        this.engine3d.start('MENU');

        // Splash screen logic
        this.switchScreen('splash-screen');
        setTimeout(() => {
            if (this.token && this.user) {
                this.connectSocket();
                this.showMainMenu();
            } else {
                this.showLoginScreen();
            }
        }, 4000);
    }

    // ==================== UI SETUP ====================
    setupUI() {
        const screens = {
            'splash-screen': `
                <div style="width:100%;height:100%;background:url('assets/images/Gemini_Generated_Image_3ugg6s3ugg6s3ugg.png') center/cover no-repeat;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;padding-bottom:10%;z-index:9999;">
                    <div style="width:80%;max-width:300px;height:4px;background:rgba(255,255,255,0.2);border-radius:2px;overflow:hidden;box-shadow:0 0 10px rgba(0,242,255,0.5);">
                        <div style="width:100%;height:100%;background:var(--accent);animation:splashBar 4s linear forwards;"></div>
                    </div>
                    <div style="color:var(--accent);font-family:'Orbitron',sans-serif;margin-top:10px;font-size:0.8rem;letter-spacing:3px;animation:pulse 1s infinite alternate;text-shadow:0 0 5px rgba(0,0,0,0.8);">CARREGANDO...</div>
                </div>
                <style>
                    #splash-screen { padding: 0 !important; }
                    @keyframes splashBar { 0% { width: 0%; } 100% { width: 100%; } }
                    @keyframes pulse { from { opacity: 0.5; } to { opacity: 1; } }
                </style>
            `,
            'login-screen': `
                <div class="auth-container">
                    <div class="auth-tabs">
                        <button class="tab-btn active" data-tab="login">LOGIN</button>
                        <button class="tab-btn" data-tab="register">REGISTRO</button>
                    </div>
                    <div id="login-form" class="auth-form active">
                        <input type="text" id="login-username" placeholder="Usuário" autocomplete="username">
                        <input type="password" id="login-password" placeholder="Senha" autocomplete="current-password">
                        <button id="login-btn" class="casino-btn">ENTRAR</button>
                    </div>
                    <div id="register-form" class="auth-form">
                        <input type="text" id="reg-username" placeholder="Usuário">
                        <input type="email" id="reg-email" placeholder="Email">
                        <input type="password" id="reg-password" placeholder="Senha">
                        <button id="register-btn" class="casino-btn">CRIAR CONTA</button>
                    </div>
                </div>`,
            'menu-screen': `
                <div class="menu-container">
                    <div class="user-info">
                        <span id="username-display"></span>
                    </div>
                    <div class="menu-buttons">
                        <button id="create-room-btn" class="casino-btn">🏠 CRIAR SALA</button>
                        <button id="find-match-btn" class="casino-btn">🔍 ENCONTRAR OPONENTE</button>
                        <button id="ranking-btn" class="casino-btn">🏆 RANKING</button>
                        <button id="logout-btn" class="casino-btn danger">🚪 SAIR</button>
                    </div>
                    <div class="online-status">👥 Online: <span id="online-count">0</span></div>
                </div>`,
            'room-screen': `
                <div class="room-container">
                    <div class="room-header">
                        <h3>SALA: <span id="room-code-display"></span></h3>
                        <button id="leave-room-btn" class="small-btn">SAIR</button>
                    </div>
                    <div class="players-list">
                        <div class="player-card" id="player1-card">
                            <div class="player-name">Aguardando...</div>
                            <div class="player-status"></div>
                        </div>
                        <div class="vs-divider">VS</div>
                        <div class="player-card" id="player2-card">
                            <div class="player-name">Aguardando...</div>
                            <div class="player-status"></div>
                        </div>
                    </div>
                    <div class="chat-container">
                        <div class="chat-messages" id="chat-messages"></div>
                        <input type="text" id="chat-input" placeholder="Mensagem...">
                    </div>
                </div>`,
            'lobby-screen': `
                <div class="room-container">
                    <div class="room-header">
                        <h3>🔍 ENCONTRAR OPONENTE</h3>
                        <button id="lobby-back-btn" class="small-btn">VOLTAR</button>
                    </div>
                    <div style="margin-bottom:16px;">
                        <input type="text" id="lobby-search" placeholder="Buscar por código da sala..." style="width:100%;">
                    </div>
                    <div id="lobby-rooms-list" style="max-height:240px;overflow-y:auto;display:flex;flex-direction:column;gap:8px;"></div>
                    <p id="lobby-empty" style="text-align:center;color:var(--text-dim);padding:30px 0;font-size:0.85rem;">Nenhuma sala disponível</p>
                    <button id="lobby-refresh-btn" class="casino-btn" style="margin-top:16px;width:100%;">🔄 ATUALIZAR</button>
                </div>`,
            'placement-screen': `
                <canvas id="game-canvas-placement" style="display:none;"></canvas>
                <div style="position:fixed; top:0; left:0; width:100vw; height:100vh; z-index:5; pointer-events:none;">
                    <div style="position:absolute; top:90px; left:50%; transform:translateX(-50%); background:rgba(5, 11, 20, 0.9); backdrop-filter:blur(10px); border:1px solid var(--accent); padding:15px 25px; border-radius:12px; pointer-events:auto; text-align:center; max-width:420px; width:90%; z-index:10;">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                            <div class="turn-indicator my-turn" id="placement-info" style="font-size:0.85rem;">⚓ POSICIONE SUA FROTA</div>
                            <span id="placement-timer" style="color:var(--gold); font-family:'Orbitron',sans-serif; font-size:0.85rem;">⏱️ 50s</span>
                        </div>
                        <div style="font-size:0.8rem;color:var(--text-dim);">
                            Navio: <span id="current-ship-name" style="color:var(--accent);font-weight:bold;">Porta-Aviões (5)</span>
                            <div style="margin-top:10px; display:flex; gap:10px; justify-content:center;">
                                <button id="rotate-ship-btn" class="small-btn">🔄 GIRAR (HORIZONTAL)</button>
                                <button id="auto-place-btn" class="small-btn" style="background:var(--accent);color:black;">🎲 ALEATÓRIO</button>
                            </div>
                        </div>
                    </div>
                </div>`,
            'game-screen': `
                <div id="game-overlay" style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:100;pointer-events:none;">
                    <div id="feedback-text"></div>
                </div>
                <div id="drone-hud" class="drone-hud hidden">
                    <div class="scanlines"></div>
                    <div class="hud-top"><span class="rec-blink">● REC</span><span id="hud-latlong">LAT: 25.04 N / LONG: 121.50 E</span></div>
                    <div class="crosshair-container"><div class="crosshair"></div></div>
                    <div class="telemetry side-left"><div class="bar-container"><div id="alt-bar" class="bar-fill"></div></div><span>ALT: <span id="hud-alt">12.0</span>m</span></div>
                    <div class="telemetry side-right"><div class="bar-container"><div id="speed-bar" class="bar-fill"></div></div><span>SPD: <span id="hud-spd">45</span>km/h</span></div>
                    <div class="hud-bottom"><span>SIG: 📶 STRONG</span><span>BAT: 88%</span></div>
                </div>
                <div id="game-hud" style="position:fixed;top:90px;left:50%;transform:translateX(-50%);z-index:50;pointer-events:none;">
                    <div style="background:rgba(5,11,20,0.85);backdrop-filter:blur(10px);border:1px solid var(--accent);border-radius:8px;padding:8px 24px;display:flex;gap:20px;align-items:center;">
                        <div class="turn-indicator" id="turn-indicator" style="font-size:0.85rem;">⏳ AGUARDANDO...</div>
                        <span id="game-timer" style="font-family:'Orbitron',sans-serif;font-size:0.85rem;color:var(--gold);">⏱️ 20s</span>
                    </div>
                </div>
                <div id="fleet-hud" class="fleet-hud">
                    <div class="fleet-hud-label">MINHA FROTA</div>
                    <!-- Fleet ships will be injected here -->
                </div>
                <div style="position:fixed;bottom:20px;right:20px;z-index:50;">
                    <button id="forfeit-btn" class="casino-btn danger" style="padding:10px 20px;font-size:0.8rem;">🏳️ ABORTAR</button>
                </div>`,
            'vs-screen': `
                <div class="vs-overlay">
                    <div class="vs-players-row">
                        <div class="vs-player-card left" id="vs-player1">
                            <div class="vs-avatar">👤</div>
                            <div class="vs-player-name">Player 1</div>
                            <div class="vs-player-flag">🇧🇷</div>
                            <div class="vs-player-stats">
                                <span>🏆 1200</span>
                                <span>W/L: 1.5</span>
                            </div>
                        </div>
                        <div class="vs-badge">VS</div>
                        <div class="vs-player-card right" id="vs-player2">
                            <div class="vs-avatar">👤</div>
                            <div class="vs-player-name">Player 2</div>
                            <div class="vs-player-flag">🇺🇸</div>
                            <div class="vs-player-stats">
                                <span>🏆 1150</span>
                                <span>W/L: 1.2</span>
                            </div>
                        </div>
                    </div>
                    <div class="vs-subtitle">SISTEMAS DE COMBATE ATIVADOS</div>
                    <div class="vs-loading-bar"><div class="vs-bar-fill"></div></div>
                </div>`
        };

        // Adiciona o canvas 3D diretamente no body como fundo fixo
        if (!document.getElementById('game-canvas')) {
            const canvas = document.createElement('canvas');
            canvas.id = 'game-canvas';
            canvas.style.cssText = 'display:none;position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:0;';
            document.body.appendChild(canvas);
        }

        Object.entries(screens).forEach(([id, html]) => {
            const div = document.createElement('div');
            div.id = id;
            div.className = id === 'splash-screen' ? 'screen' : 'screen hidden';
            div.innerHTML = html;
            document.body.appendChild(div);
        });

        this.bindEvents();
    }

    bindEvents() {
        // Auth tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.tab;
                document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                document.getElementById(`${tab}-form`)?.classList.add('active');
                btn.classList.add('active');
            });
        });

        // Enter key on login
        document.getElementById('login-password')?.addEventListener('keypress', e => {
            if (e.key === 'Enter') this.login();
        });
        document.getElementById('reg-password')?.addEventListener('keypress', e => {
            if (e.key === 'Enter') this.register();
        });

        const on = (id, fn) => document.getElementById(id)?.addEventListener('click', fn);
        on('login-btn', () => this.login());
        on('register-btn', () => this.register());
        on('create-room-btn', () => this.createRoom());
        on('find-match-btn', () => this.showLobby());
        on('lobby-back-btn', () => this.showMainMenu());
        on('lobby-refresh-btn', () => this.refreshLobby());
        on('ranking-btn', () => this.showRankingModal());
        on('logout-btn', () => this.logout());
        on('leave-room-btn', () => this.leaveRoom());
        on('forfeit-btn', () => this.forfeit());

        document.getElementById('chat-input')?.addEventListener('keypress', e => {
            if (e.key === 'Enter') this.sendChatMessage();
        });
    }

    // ==================== AUTH ====================
    async login() {
        const username = document.getElementById('login-username')?.value?.trim();
        const password = document.getElementById('login-password')?.value;
        if (!username || !password) return this.notify('Preencha todos os campos', 'warning');

        try {
            const res = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await res.json();
            if (res.ok) {
                this.setAuth(data);
            } else {
                this.notify(data.error || 'Erro no login', 'error');
            }
        } catch { this.notify('Servidor indisponível', 'error'); }
    }

    async register() {
        const username = document.getElementById('reg-username')?.value?.trim();
        const email = document.getElementById('reg-email')?.value?.trim();
        const password = document.getElementById('reg-password')?.value;
        if (!username || !password) return this.notify('Preencha usuário e senha', 'warning');

        try {
            const res = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password })
            });
            const data = await res.json();
            if (res.ok) {
                this.setAuth(data);
            } else {
                this.notify(data.error || 'Erro no registro', 'error');
            }
        } catch { this.notify('Servidor indisponível', 'error'); }
    }

    setAuth(data) {
        this.token = data.token;
        this.user = data.user;
        localStorage.setItem('game_token', this.token);
        localStorage.setItem('game_user', JSON.stringify(this.user));
        this.connectSocket();
        this.showMainMenu();
    }

    logout() {
        localStorage.removeItem('game_token');
        localStorage.removeItem('game_user');
        if (this.engine3d) this.engine3d.start('MENU');
        this.socket?.disconnect();
        this.socket = null;
        this.token = null;
        this.user = null;
        this.showLoginScreen();
    }

    // ==================== SOCKET ====================
    connectSocket() {
        if (this.socket) this.socket.disconnect();
        this.socket = io({ auth: { token: this.token } });

        this.socket.on('connect', () => {
            this.setConnectionStatus(true);
            this.notify('Conectado!', 'success');
        });

        this.socket.on('disconnect', () => {
            this.setConnectionStatus(false);
            this.notify('Desconectado do servidor', 'error');
        });

        this.socket.on('online_count', count => {
            const el = document.getElementById('online-count');
            if (el) el.innerText = count;
        });

        this.socket.on('room_created', data => {
            this.currentRoom = data.roomCode;
            const el = document.getElementById('room-code-display');
            if (el) el.innerText = data.roomCode;
            this.showRoomScreen();
        });

        this.socket.on('player_joined', data => {
            this.currentPlayers = data.players;
            this.updatePlayersList(data.players);
        });

        this.socket.on('match_starting', data => {
            this.notify('Partida iniciando!', 'success');
            this.showVSScreen();
        });

        this.socket.on('placement_phase_started', data => this.startPlacementPhase(data));
        this.socket.on('game_started', data => this.startGame(data));
        this.socket.on('turn_change', data => {
            if (this.isAnimating) {
                this.pendingTurnChange = data;
            } else {
                this._applyTurnChange(data);
            }
        });
        this.socket.on('action_result', data => this.handleActionResult(data));
        this.socket.on('match_ended', data => this.endGame(data));
        this.socket.on('chat_message', data => this.addChatMessage(data));
        this.socket.on('player_disconnected', data => {
            this.notify(`${data.username} desconectou. Aguardando...`, 'warning');
        });
        this.socket.on('action_invalid', data => this.notify(data.error, 'warning'));
    }

    setConnectionStatus(connected) {
        const el = document.getElementById('connection-status');
        if (!el) return;
        el.className = `connection-status ${connected ? 'connected' : 'disconnected'}`;
        el.innerHTML = connected ? '🟢 ONLINE' : '🔴 OFFLINE';
    }

    // ==================== SCREENS ====================
    switchScreen(id) {
        document.querySelectorAll('.screen').forEach(s => {
            s.classList.add('hidden');
            s.classList.remove('screen-enter');
        });
        const target = document.getElementById(id);
        if (target) {
            target.classList.remove('hidden');
            // Trigger reflow for animation restart
            void target.offsetWidth;
            target.classList.add('screen-enter');
        }
    }

    showLoginScreen() {
        document.body.classList.remove('game-active');
        this.switchScreen('login-screen'); 
    }
    showRoomScreen() { this.switchScreen('room-screen'); }

    showMainMenu() {
        document.body.classList.remove('game-active');
        this.switchScreen('menu-screen');
        const el = document.getElementById('username-display');
        if (el) el.innerText = `👤 ${this.user?.username || ''}`;
        if (this.engine3d) this.engine3d.start('MENU');
    }

    showVSScreen() {
        this.switchScreen('vs-screen');
        // Populate VS Screen with current players
        if (this.currentPlayers && this.currentPlayers.length >= 2) {
            const p1 = this.currentPlayers[0];
            const p2 = this.currentPlayers[1];
            
            // Set Player 1 (Left)
            document.querySelector('#vs-player1 .vs-player-name').innerText = p1.id === this.user.id ? `${p1.username} (VOCÊ)` : p1.username;
            
            // Set Player 2 (Right)
            document.querySelector('#vs-player2 .vs-player-name').innerText = p2.id === this.user.id ? `${p2.username} (VOCÊ)` : p2.username;
        }

        // Add dramatic entry sound if AudioManager is available
        if (window.AudioManager) {
            AudioManager.getInstance().play('shoot'); // Placeholder for dramatic sound
        }

        // The vs-screen CSS animations run automatically.
        // Wait 4 seconds for the animation to finish, then proceed to placement implicitly 
        // by waiting for the 'placement_phase_started' socket event which typically fires shortly after.
        // If placement_phase_started already fired, we might need to queue it. 
        // For simplicity, let's let the server trigger the next phase and we just ensure the screen is shown.
    }

    showGameScreen() {
        this.switchScreen('game-screen');
    }

    // ==================== ROOM ====================
    createRoom() {
        this.socket.emit('create_room', { maxPlayers: 2, betAmount: 0 }, res => {
            if (!res.success) this.notify(res.error, 'error');
        });
    }

    // ==================== LOBBY ====================
    showLobby() {
        this.switchScreen('lobby-screen');
        this.refreshLobby();
        // Search filter
        const searchInput = document.getElementById('lobby-search');
        if (searchInput) {
            searchInput.value = '';
            searchInput.oninput = () => this.filterLobby(searchInput.value);
        }
    }

    refreshLobby() {
        if (!this.socket) return;
        this.socket.emit('list_rooms', (rooms) => {
            this._lobbyRooms = rooms || [];
            this.renderLobbyRooms(this._lobbyRooms);
        });
    }

    filterLobby(query) {
        const q = query.trim().toUpperCase();
        if (!q) return this.renderLobbyRooms(this._lobbyRooms || []);
        const filtered = (this._lobbyRooms || []).filter(r =>
            r.roomCode.includes(q) || r.host.toUpperCase().includes(q)
        );
        this.renderLobbyRooms(filtered);
    }

    renderLobbyRooms(rooms) {
        const list = document.getElementById('lobby-rooms-list');
        const empty = document.getElementById('lobby-empty');
        if (!list) return;
        list.innerHTML = '';

        if (rooms.length === 0) {
            if (empty) empty.style.display = 'block';
            return;
        }
        if (empty) empty.style.display = 'none';

        rooms.forEach(room => {
            const card = document.createElement('div');
            card.style.cssText = `display:flex;justify-content:space-between;align-items:center;
                padding:12px 14px;background:rgba(0,0,0,0.3);border:1px solid var(--glass-border);
                border-radius:var(--radius);cursor:pointer;transition:var(--transition);`;
            card.innerHTML = `
                <div>
                    <div style="font-weight:700;font-size:0.85rem;">🎮 ${room.host}</div>
                    <div style="font-size:0.7rem;color:var(--text-dim);margin-top:2px;">Código: ${room.roomCode}</div>
                </div>
                <div style="font-family:'Orbitron',sans-serif;font-size:0.65rem;color:var(--accent);">${room.players}/2</div>`;
            card.addEventListener('click', () => this.joinRoom(room.roomCode));
            card.addEventListener('mouseenter', () => card.style.borderColor = 'var(--accent)');
            card.addEventListener('mouseleave', () => card.style.borderColor = 'var(--glass-border)');
            list.appendChild(card);
        });
    }

    joinRoom(roomCode) {
        this.socket.emit('join_room', roomCode, res => {
            if (res.success) {
                this.currentRoom = roomCode;
                const el = document.getElementById('room-code-display');
                if (el) el.innerText = this.currentRoom;
                this.showRoomScreen();
            } else {
                this.notify(res.error, 'error');
            }
        });
    }

    leaveRoom() {
        if (this.currentRoom) {
            this.socket.emit('leave_room', this.currentRoom);
            this.currentRoom = null;
            this.showMainMenu();
        }
    }

    sendChatMessage() {
        const input = document.getElementById('chat-input');
        const msg = input?.value?.trim();
        if (msg && this.currentRoom) {
            this.socket.emit('chat_message', { roomCode: this.currentRoom, message: msg });
            input.value = '';
        }
    }

    addChatMessage(data) {
        const container = document.getElementById('chat-messages');
        if (!container) return;
        const div = document.createElement('div');
        div.className = 'chat-message';
        const t = new Date(data.timestamp).toLocaleTimeString();
        div.innerHTML = `<strong>${data.username}:</strong> ${data.message}<span class="time">${t}</span>`;
        container.appendChild(div);
        container.scrollTop = container.scrollHeight;
    }

    updatePlayersList(players) {
        players.forEach((p, i) => {
            const card = document.getElementById(`player${i + 1}-card`);
            if (!card) return;
            card.querySelector('.player-name').innerHTML = p.id === this.user.id ? `${p.username} (VOCÊ)` : p.username;
            card.querySelector('.player-status').innerHTML = '🟢 ONLINE';
        });
    }

    // ==================== PLACEMENT PHASE ====================
    startPlacementPhase(data) {
        // Delay placement screen if VS screen is showing
        const vsScreen = document.getElementById('vs-screen');
        if (vsScreen && !vsScreen.classList.contains('hidden')) {
            setTimeout(() => this._initPlacementPhase(data), 3500); // Wait for VS animation
        } else {
            this._initPlacementPhase(data);
        }
    }

    _initPlacementPhase(data) {
        document.body.classList.add('game-active');
        this.switchScreen('placement-screen');
        this.placementBoard = this.createEmptyBoard();
        this.shipsToPlace = [
            { id: 1, name: 'Porta-Aviões', size: 5 },
            { id: 2, name: 'Encouraçado', size: 4 },
            { id: 3, name: 'Cruzador', size: 3 },
            { id: 4, name: 'Cruzador', size: 3 },
            { id: 5, name: 'Destroyer', size: 2 }
        ];
        this.currentShipIndex = 0;
        this.isHorizontal = true;
        this.placementTimeLeft = data.timeLimit || 50;

        document.getElementById('rotate-ship-btn').onclick = () => {
            this.isHorizontal = !this.isHorizontal;
            document.getElementById('rotate-ship-btn').innerText = `🔄 GIRAR (${this.isHorizontal ? 'HORIZONTAL' : 'VERTICAL'})`;
            this.engine3d.clearPreview(); // Limpa preview ao girar
        };

        document.getElementById('auto-place-btn').onclick = () => {
            // Se clicar em aleatório, gera no cliente e envia
            this.placementBoard = this.generateRandomBoardClient();
            this.currentShipIndex = this.shipsToPlace.length;
            this.engine3d.renderShips(this.placementBoard);
            this.engine3d.clearPreview();
            this.sendPlacedShips();
        };

        if (this.engine3d) {
            this.engine3d.onCellClick = (col, row) => this.attackCell(row, col);
            this.engine3d.onPlacementClick = (col, row) => this.placeShipAt(row, col);
            this.engine3d.onHover = (col, row) => this.previewShip(row, col);
        } else {
            this.engine3d = new Engine3D(
                (col, row) => this.attackCell(row, col),
                (col, row) => this.placeShipAt(row, col),
                (col, row) => this.previewShip(row, col)
            );
        }
        
        this.engine3d.start('PLACEMENT');
        this.engine3d.renderShips(this.placementBoard);

        this.startPlacementTimer();
    }

    startPlacementTimer() {
        if (this.placementTimerInterval) clearInterval(this.placementTimerInterval);
        const timerEl = document.getElementById('placement-timer');
        
        this.placementTimerInterval = setInterval(() => {
            this.placementTimeLeft--;
            if (timerEl) {
                timerEl.innerText = `⏱️ ${this.placementTimeLeft}s`;
                if (this.placementTimeLeft <= 10) timerEl.style.color = 'var(--danger)';
            }
            if (this.placementTimeLeft <= 0) {
                clearInterval(this.placementTimerInterval);
                if (this.currentShipIndex < this.shipsToPlace.length) {
                    this.notify('Tempo esgotado! Posicionando automaticamente...', 'warning');
                    this.placementBoard = this.generateRandomBoardClient();
                    this.sendPlacedShips();
                }
            }
        }, 1000);
    }

    renderPlacementBoard() {
        // Obsoleto - agora usamos this.engine3d.renderShips
    }

    previewShip(row, col) {
        if (this.currentShipIndex >= this.shipsToPlace.length) {
            this.engine3d.clearPreview();
            return;
        }
        if (row < 0 || col < 0) {
            this.engine3d.clearPreview();
            return;
        }
        
        const ship = this.shipsToPlace[this.currentShipIndex];
        const valid = this.isValidPlacement(row, col, ship.size, this.isHorizontal);
        this.engine3d.renderPreview(row, col, ship.size, this.isHorizontal, valid);
    }

    isValidPlacement(row, col, size, isHoriz) {
        if (isHoriz && col + size > 10) return false;
        if (!isHoriz && row + size > 10) return false;
        for (let k = 0; k < size; k++) {
            const r = isHoriz ? row : row + k;
            const c = isHoriz ? col + k : col;
            if (this.placementBoard[r][c] !== null) return false;
        }
        return true;
    }

    placeShipAt(row, col) {
        if (this.currentShipIndex >= this.shipsToPlace.length) return;
        const ship = this.shipsToPlace[this.currentShipIndex];
        
        if (this.isValidPlacement(row, col, ship.size, this.isHorizontal)) {
            for (let k = 0; k < ship.size; k++) {
                const r = this.isHorizontal ? row : row + k;
                const c = this.isHorizontal ? col + k : col;
                this.placementBoard[r][c] = { id: ship.id, size: ship.size, part: k };
            }
            this.currentShipIndex++;
            this.engine3d.renderShips(this.placementBoard);
            
            if (this.currentShipIndex < this.shipsToPlace.length) {
                const nextShip = this.shipsToPlace[this.currentShipIndex];
                document.getElementById('current-ship-name').innerText = `${nextShip.name} (${nextShip.size})`;
            } else {
                document.getElementById('placement-info').innerText = '✅ FROTA POSICIONADA! AGUARDANDO ADVERSÁRIO...';
                document.getElementById('current-ship-name').parentElement.style.display = 'none';
                this.engine3d.clearPreview();
                this.sendPlacedShips();
            }
        } else {
            this.notify('Posição inválida!', 'warning');
        }
    }

    sendPlacedShips() {
        if (this.placementTimerInterval) clearInterval(this.placementTimerInterval);
        this.socket.emit('ships_placed', { roomCode: this.currentRoom, board: this.placementBoard });
    }

    generateRandomBoardClient() {
        const board = this.createEmptyBoard();
        const ships = this.shipsToPlace;
        
        for (const ship of ships) {
            let placed = false;
            while (!placed) {
                const isHoriz = Math.random() > 0.5;
                const r = Math.floor(Math.random() * 10);
                const c = Math.floor(Math.random() * 10);
                
                let valid = true;
                if (isHoriz && c + ship.size > 10) valid = false;
                if (!isHoriz && r + ship.size > 10) valid = false;
                
                if (valid) {
                    for (let k = 0; k < ship.size; k++) {
                        const rr = isHoriz ? r : r + k;
                        const cc = isHoriz ? c + k : c;
                        if (board[rr][cc] !== null) { valid = false; break; }
                    }
                }
                
                if (valid) {
                    for (let k = 0; k < ship.size; k++) {
                        const rr = isHoriz ? r : r + k;
                        const cc = isHoriz ? c + k : c;
                        board[rr][cc] = { id: ship.id, size: ship.size, part: k };
                    }
                    placed = true;
                }
            }
        }
        return board;
    }

    // ==================== GAME ====================
    startGame(data) {
        document.body.classList.add('game-active');
        if (this.placementTimerInterval) clearInterval(this.placementTimerInterval);
        this.gameState = {
            myBoard: data.myShips,
            enemyBoard: this.createEmptyBoard(),
            turnTimer: null,
            timeLeft: 20
        };
        this.isMyTurn = data.currentTurn === this.user.id;
        this.showGameScreen();
        this.initFleetHUD();
        // Start game in ATTACK mode
        if (this.engine3d) {
            this.engine3d.onCellClick = (col, row) => this.attackCell(row, col);
            this.engine3d.onPlacementClick = (col, row) => this.placeShipAt(row, col);
            this.engine3d.onHover = (col, row) => this.previewShip(row, col);
        } else {
            this.engine3d = new Engine3D(
                (col, row) => this.attackCell(row, col),
                (col, row) => this.placeShipAt(row, col),
                (col, row) => this.previewShip(row, col)
            );
        }
        this.engine3d.start('ATTACK');

        this.updateTurnIndicator();
        this.resetTurnTimer(20);
    }

    createEmptyBoard() {
        return Array.from({ length: 10 }, () => Array(10).fill(null));
    }

    createBoards() {
        // Obsoleto, o radar tático foi substituído pela visualização 3D e o Fleet HUD.
    }

    initFleetHUD() {
        const hud = document.getElementById('fleet-hud');
        if (!hud) return;

        // Limpa o hud deixando apenas o label
        hud.innerHTML = '<div class="fleet-hud-label">MINHA FROTA</div>';

        // Mapeamento dos navios do jogo
        const ships = [
            { id: 1, icon: '🚢', size: 5 }, // Porta-Aviões
            { id: 2, icon: '🛳️', size: 4 }, // Encouraçado
            { id: 3, icon: '🚤', size: 3 }, // Cruzador 1
            { id: 4, icon: '🚤', size: 3 }, // Cruzador 2
            { id: 5, icon: '⛵', size: 2 }  // Destroyer
        ];

        ships.forEach(ship => {
            const shipDiv = document.createElement('div');
            shipDiv.className = 'fleet-ship';
            shipDiv.id = `fleet-ship-${ship.id}`;
            
            const iconDiv = document.createElement('div');
            iconDiv.className = 'fleet-ship-icon';
            iconDiv.innerText = ship.icon;
            
            const barDiv = document.createElement('div');
            barDiv.className = 'fleet-ship-bar';
            
            for (let i = 0; i < ship.size; i++) {
                const block = document.createElement('div');
                block.className = 'bar-block';
                barDiv.appendChild(block);
            }
            
            shipDiv.appendChild(iconDiv);
            shipDiv.appendChild(barDiv);
            hud.appendChild(shipDiv);
        });
    }

    updateFleetHUD(shipId, damageAmount, isSunk) {
        const shipDiv = document.getElementById(`fleet-ship-${shipId}`);
        if (!shipDiv) return;

        const blocks = shipDiv.querySelectorAll('.bar-block');
        
        if (isSunk) {
            shipDiv.classList.add('sunk-ship');
            blocks.forEach(block => block.className = 'bar-block sunk');
        } else {
            // Conta os blocos normais (não danificados) e converte para damage class da direita pra esquerda
            let undamagedBlocks = Array.from(blocks).filter(b => !b.classList.contains('damaged'));
            // Remove o primeiro "undamaged" para indicar hit
            if (undamagedBlocks.length > 0) {
                undamagedBlocks[undamagedBlocks.length - 1].classList.add('damaged');
            }
        }
    }

    attackCell(row, col) {
        if (!this.isMyTurn || this.attackPending) return this.notify('Aguarde sua vez!', 'warning');
        if (!this.gameState) return;
        if (this.gameState.enemyBoard[row][col]) return this.notify('Já atacou aqui!', 'warning');

        // Marca como pendente para impedir duplo-clique, mas NÃO muda o turno visualmente.
        // O turno só muda quando o servidor enviar 'turn_change'.
        this.attackPending = true;

        this.socket.emit('game_action', {
            roomCode: this.currentRoom,
            action: 'attack',
            cell: [row, col],
            multiplier: 1
        });
    }

    async handleActionResult(data) {
        this.isAnimating = true;
        
        const { hit, shipSunk, cell, score, gameEnded, attackerId } = data;
        if (!cell) {
            this.isAnimating = false;
            return;
        }
        
        const [row, col] = cell;
        const isMyAttack = attackerId === this.user.id;

        if (isMyAttack) {
            this.gameState.enemyBoard[row][col] = hit ? 'hit' : 'miss';
            
            // Animacao do Drone
            if (this.engine3d) {
                // A UI aguarda o fim da animação
                const cinMode = shipSunk ? 'attack' : 'normal';
                await this.engine3d.processAttack(col, row, hit, shipSunk, cinMode);
            }

            if (!gameEnded) {
                const msg = hit ? (shipSunk ? '💥 AFUNDOU!' : '🎯 ACERTOU!') : '💧 ÁGUA';
                this.showFeedback(msg, hit ? 'text-hit' : 'text-miss');
            }
        } else {
            const cellData = this.gameState.myBoard[row][col];
            
            // Preserve ship object, just add status
            if (cellData && typeof cellData === 'object') {
                cellData.hit = true;
            } else {
                this.gameState.myBoard[row][col] = 'miss';
            }
            
            if (hit && cellData && cellData.id) {
                this.updateFleetHUD(cellData.id, 1, shipSunk);
            }
            
            if (this.engine3d) {
                // Toca a animação do drone inimigo atacando o nosso tabuleiro!
                const cinMode = shipSunk ? 'defense' : 'normal';
                await this.engine3d.processAttack(col, row, hit, shipSunk, cinMode);
                
                if (hit) {
                    this.showFeedback("INIMIGO ACERTOU SUA FROTA!", "text-miss");
                } else {
                    this.showFeedback("INIMIGO ERROU!", "text-hit");
                }
            }
        }

        if (data.timeout && !gameEnded) {
            this.notify('Tempo esgotado! Turno passado.', 'warning');
        }
        
        this.isAnimating = false;
        if (this.pendingTurnChange) {
            this._applyTurnChange(this.pendingTurnChange);
            this.pendingTurnChange = null;
        }
    }

    _applyTurnChange(data) {
        this.attackPending = false;
        this.isMyTurn = data.playerId === this.user.id;
        this.updateTurnIndicator();
        this.resetTurnTimer(data.timeLimit || 20);
    }

    showFeedback(txt, cls = '') {
        const el = document.getElementById('feedback-text');
        if (!el) return;
        el.innerText = txt;
        el.className = cls;
        gsap.fromTo(el, { opacity: 0, scale: 0.5 }, { opacity: 1, scale: 1.2, duration: 0.4, yoyo: true, repeat: 1 });
    }

    updateTurnIndicator() {
        const el = document.getElementById('turn-indicator');
        if (!el) return;
        if (this.isMyTurn) {
            el.innerHTML = '🎯 SUA VEZ — ATAQUE!';
            el.className = 'turn-indicator my-turn';
        } else {
            el.innerHTML = '⏳ TURNO DO ADVERSÁRIO';
            el.className = 'turn-indicator opponent-turn';
        }
        this.renderCurrentBoard();
    }

    renderCurrentBoard() {
        if (!this.engine3d || !this.gameState) return;
        if (this.isMyTurn) {
            // Meu turno: estou atacando, vejo a água inimiga (navios ocultos)
            this.engine3d.renderGameState(this.gameState.enemyBoard, false);
        } else {
            // Turno inimigo: ele ataca, vejo minha própria frota
            this.engine3d.renderGameState(this.gameState.myBoard, true);
        }
    }

    resetTurnTimer(timeLimit = 20) {
        if (this.gameState?.turnTimer) clearInterval(this.gameState.turnTimer);
        if (!this.gameState) return;
        this.gameState.timeLeft = timeLimit;
        const timerEl = document.getElementById('game-timer');

        this.gameState.turnTimer = setInterval(() => {
            if (!this.isMyTurn) {
                if (timerEl) timerEl.innerHTML = '⏱️ ···';
                return;
            }
            this.gameState.timeLeft--;
            if (timerEl) {
                const t = this.gameState.timeLeft;
                timerEl.innerHTML = `⏱️ ${t}s`;
                timerEl.style.color = t <= 5 ? '#ff4a4a' : '';
            }
            if (this.gameState.timeLeft <= 0) {
                clearInterval(this.gameState.turnTimer);
                this.isMyTurn = false;
                this.updateTurnIndicator();
            }
        }, 1000);
    }



    async endGame(data) {
        if (this.gameState?.turnTimer) clearInterval(this.gameState.turnTimer);
        const isWinner = data.winnerId === this.user.id;

        // Parar e esconder Engine 3D
        if (this.engine3d) {
            this.engine3d.stop();
        }

        // Modal
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.innerHTML = `
            <div class="modal-content">
                <h2 style="color:${isWinner ? 'var(--success)' : 'var(--danger)'}; font-size:1.4rem;">
                    ${isWinner ? '🏆 VITÓRIA!' : '💀 DERROTA'}
                </h2>
                <div class="modal-buttons">
                    <button class="casino-btn" id="modal-close-btn">VOLTAR AO MENU</button>
                </div>
            </div>`;
        document.body.appendChild(overlay);

        document.getElementById('modal-close-btn')?.addEventListener('click', () => {
            overlay.remove();
            this.currentRoom = null;
            this.gameState = null;
            this.showMainMenu();
        });
    }

    forfeit() {
        if (!this.currentRoom) return;
        // Custom confirm modal
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.innerHTML = `
            <div class="modal-content">
                <h2 style="color:var(--gold);font-size:1rem;">DESISTIR?</h2>
                <p style="margin:10px 0;font-size:0.85rem;color:var(--text-dim);">Você perderá a partida.</p>
                <div class="modal-buttons" style="flex-direction:row;justify-content:center;">
                    <button class="casino-btn danger" id="confirm-forfeit">SIM</button>
                    <button class="casino-btn" id="cancel-forfeit">NÃO</button>
                </div>
            </div>`;
        document.body.appendChild(overlay);
        document.getElementById('confirm-forfeit')?.addEventListener('click', () => {
            this.socket.emit('forfeit', this.currentRoom);
            overlay.remove();
        });
        document.getElementById('cancel-forfeit')?.addEventListener('click', () => overlay.remove());
    }

    async showRankingModal() {
        try {
            const res = await fetch('/api/ranking');
            const ranking = await res.json();
            let rows = ranking.slice(0, 10).map((r, i) =>
                `<tr><td>${i+1}</td><td>${r.username}</td><td>${r.rank_points}</td><td>${r.total_wins}/${r.total_losses}</td></tr>`
            ).join('');

            const overlay = document.createElement('div');
            overlay.className = 'modal-overlay';
            overlay.innerHTML = `
                <div class="modal-content" style="max-width:440px;">
                    <h2 style="color:var(--gold);font-size:1rem;">🏆 RANKING</h2>
                    <table style="width:100%;margin:16px 0;font-size:0.75rem;border-collapse:collapse;">
                        <tr style="color:var(--accent);"><th>#</th><th>Jogador</th><th>ELO</th><th>W/L</th></tr>
                        ${rows || '<tr><td colspan="4" style="padding:20px;">Nenhum jogador</td></tr>'}
                    </table>
                    <button class="casino-btn" id="close-ranking">FECHAR</button>
                </div>`;
            overlay.style.cssText += 'color:var(--text);';
            // Style table cells
            document.body.appendChild(overlay);
            overlay.querySelectorAll('td,th').forEach(el => el.style.padding = '8px 6px');
            document.getElementById('close-ranking')?.addEventListener('click', () => overlay.remove());
        } catch { this.notify('Erro ao carregar ranking', 'error'); }
    }

    notify(msg, type = 'info') {
        if (window.showNotification) window.showNotification(msg, type);
        else alert(msg);
    }
}

// Boot
document.addEventListener('DOMContentLoaded', () => {
    window.game = new MultiplayerGame();
});