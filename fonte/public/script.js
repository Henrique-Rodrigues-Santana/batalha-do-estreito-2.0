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
        if (this.token && this.user) {
            this.connectSocket();
            this.showMainMenu();
        } else {
            this.showLoginScreen();
        }
    }

    // ==================== UI SETUP ====================
    setupUI() {
        const screens = {
            'login-screen': `
                <div class="auth-container">
                    <h2>⚓ BATALHA DO ESTREITO</h2>
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
                <div class="game-container" style="max-width:500px;">
                    <div class="game-header">
                        <div class="turn-indicator my-turn" id="placement-info">⚓ POSICIONE SUA FROTA</div>
                        <div class="game-info">
                            <span id="placement-timer" style="color:var(--gold);">⏱️ 50s</span>
                        </div>
                    </div>
                    <div style="text-align:center;margin-bottom:10px;font-size:0.8rem;color:var(--text-dim);">
                        Navio: <span id="current-ship-name" style="color:var(--accent);font-weight:bold;">Porta-Aviões (5)</span> <br>
                        <button id="rotate-ship-btn" class="small-btn" style="margin-top:8px;">🔄 GIRAR (Atualmente: HORIZONTAL)</button>
                        <button id="auto-place-btn" class="small-btn" style="margin-top:8px;background:var(--accent);color:black;">🎲 POSICIONAR ALEATÓRIO</button>
                    </div>
                    <div class="boards-container" style="justify-content:center;">
                        <div class="board-section">
                            <div id="placement-board" class="game-board"></div>
                        </div>
                    </div>
                </div>`,
            'game-screen': `
                <div class="game-container">
                    <div class="game-header">
                        <div class="turn-indicator" id="turn-indicator">⏳ AGUARDANDO...</div>
                        <div class="game-info">
                            <span id="game-score">🎯 0</span>
                            <span id="game-timer">⏱️ 30s</span>
                        </div>
                    </div>
                    <div class="boards-container">
                        <div class="board-section">
                            <h4>MEU TABULEIRO</h4>
                            <div id="my-board" class="game-board"></div>
                        </div>
                        <div class="board-section">
                            <h4>TABULEIRO INIMIGO</h4>
                            <div id="enemy-board" class="game-board"></div>
                        </div>
                    </div>
                    <button id="forfeit-btn" class="casino-btn danger">🏳️ DESISTIR</button>
                </div>`
        };

        Object.entries(screens).forEach(([id, html]) => {
            const div = document.createElement('div');
            div.id = id;
            div.className = id === 'login-screen' ? 'screen' : 'screen hidden';
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

        this.socket.on('player_joined', data => this.updatePlayersList(data.players));

        this.socket.on('match_starting', data => {
            this.notify(`Partida iniciando! Aposta: R$ ${data.betAmount}`, 'success');
        });

        this.socket.on('placement_phase_started', data => this.startPlacementPhase(data));
        this.socket.on('game_started', data => this.startGame(data));
        this.socket.on('turn_change', data => {
            this.isMyTurn = data.playerId === this.user.id;
            this.updateTurnIndicator();
            this.resetTurnTimer(data.timeLimit || 20);
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
        document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
        document.getElementById(id)?.classList.remove('hidden');
    }

    showLoginScreen() { this.switchScreen('login-screen'); }
    showRoomScreen() { this.switchScreen('room-screen'); }

    showMainMenu() {
        this.switchScreen('menu-screen');
        const el = document.getElementById('username-display');
        if (el) el.innerText = `👤 ${this.user?.username || ''}`;
    }

    showGameScreen() {
        this.switchScreen('game-screen');
        this.createBoards();
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
            document.getElementById('rotate-ship-btn').innerText = `🔄 GIRAR (Atualmente: ${this.isHorizontal ? 'HORIZONTAL' : 'VERTICAL'})`;
        };

        document.getElementById('auto-place-btn').onclick = () => {
            // Se clicar em aleatório, gera no cliente e envia
            this.placementBoard = this.generateRandomBoardClient();
            this.currentShipIndex = this.shipsToPlace.length;
            this.renderPlacementBoard();
            this.sendPlacedShips();
        };

        this.renderPlacementBoard();
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
        const boardDiv = document.getElementById('placement-board');
        if (!boardDiv) return;
        boardDiv.innerHTML = '';
        const cols = [' ','A','B','C','D','E','F','G','H','I','J'];
        
        cols.forEach(c => {
            const lbl = document.createElement('div');
            lbl.className = 'board-label';
            lbl.innerText = c;
            boardDiv.appendChild(lbl);
        });

        for (let i = 0; i < 10; i++) {
            const lbl = document.createElement('div');
            lbl.className = 'board-label';
            lbl.innerText = i + 1;
            boardDiv.appendChild(lbl);

            for (let j = 0; j < 10; j++) {
                const cell = document.createElement('div');
                cell.className = 'board-cell';
                if (this.placementBoard[i][j]) cell.classList.add('ship');
                
                cell.addEventListener('mouseenter', () => this.previewShip(i, j, true));
                cell.addEventListener('mouseleave', () => this.previewShip(i, j, false));
                cell.addEventListener('click', () => this.placeShipAt(i, j));
                
                cell.dataset.r = i;
                cell.dataset.c = j;
                boardDiv.appendChild(cell);
            }
        }
    }

    previewShip(row, col, show) {
        if (this.currentShipIndex >= this.shipsToPlace.length) return;
        const ship = this.shipsToPlace[this.currentShipIndex];
        const valid = this.isValidPlacement(row, col, ship.size, this.isHorizontal);
        
        for (let k = 0; k < ship.size; k++) {
            const r = this.isHorizontal ? row : row + k;
            const c = this.isHorizontal ? col + k : col;
            if (r < 10 && c < 10) {
                const cellEl = document.querySelector(`#placement-board .board-cell[data-r="${r}"][data-c="${c}"]`);
                if (cellEl) {
                    if (show) {
                        cellEl.style.backgroundColor = valid ? 'rgba(0,255,136,0.5)' : 'rgba(255,68,0,0.5)';
                    } else {
                        cellEl.style.backgroundColor = '';
                    }
                }
            }
        }
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
            this.renderPlacementBoard();
            
            if (this.currentShipIndex < this.shipsToPlace.length) {
                const nextShip = this.shipsToPlace[this.currentShipIndex];
                document.getElementById('current-ship-name').innerText = `${nextShip.name} (${nextShip.size})`;
            } else {
                document.getElementById('placement-info').innerText = '✅ FROTA POSICIONADA! AGUARDANDO ADVERSÁRIO...';
                document.getElementById('current-ship-name').parentElement.style.display = 'none';
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
        if (this.placementTimerInterval) clearInterval(this.placementTimerInterval);
        this.gameState = {
            myBoard: data.myShips,
            enemyBoard: this.createEmptyBoard(),
            turnTimer: null,
            timeLeft: 20
        };
        this.isMyTurn = data.currentTurn === this.user.id;
        this.showGameScreen();
        this.updateTurnIndicator();
        this.resetTurnTimer(20);
    }

    createEmptyBoard() {
        return Array.from({ length: 10 }, () => Array(10).fill(null));
    }

    createBoards() {
        const myDiv = document.getElementById('my-board');
        const enemyDiv = document.getElementById('enemy-board');
        if (!myDiv || !enemyDiv) return;
        myDiv.innerHTML = '';
        enemyDiv.innerHTML = '';

        const cols = [' ','A','B','C','D','E','F','G','H','I','J'];

        const addHeaders = (container) => {
            cols.forEach(c => {
                const lbl = document.createElement('div');
                lbl.className = 'board-label';
                lbl.innerText = c;
                container.appendChild(lbl);
            });
        };

        addHeaders(myDiv);
        addHeaders(enemyDiv);

        for (let i = 0; i < 10; i++) {
            // Row labels
            [myDiv, enemyDiv].forEach(container => {
                const lbl = document.createElement('div');
                lbl.className = 'board-label';
                lbl.innerText = i + 1;
                container.appendChild(lbl);
            });

            for (let j = 0; j < 10; j++) {
                // My board cell
                const mc = document.createElement('div');
                mc.className = 'board-cell';
                mc.dataset.row = i;
                mc.dataset.col = j;
                if (this.gameState.myBoard?.[i]?.[j] && typeof this.gameState.myBoard[i][j] === 'object') {
                    mc.classList.add('ship');
                }
                myDiv.appendChild(mc);

                // Enemy board cell
                const ec = document.createElement('div');
                ec.className = 'board-cell';
                ec.dataset.row = i;
                ec.dataset.col = j;
                ec.addEventListener('click', () => this.attackCell(i, j));
                enemyDiv.appendChild(ec);
            }
        }
    }

    attackCell(row, col) {
        if (!this.isMyTurn) return this.notify('Aguarde sua vez!', 'warning');
        if (!this.gameState) return;
        if (this.gameState.enemyBoard[row][col]) return this.notify('Já atacou aqui!', 'warning');

        this.socket.emit('game_action', {
            roomCode: this.currentRoom,
            action: 'attack',
            cell: [row, col],
            multiplier: 1
        });

        this.isMyTurn = false;
        this.updateTurnIndicator();
    }

    handleActionResult(data) {
        const { hit, shipSunk, cell, score, gameEnded, attackerId } = data;
        if (!cell) return;
        const [row, col] = cell;
        const isMyAttack = attackerId === this.user.id;
        const boardId = isMyAttack ? 'enemy-board' : 'my-board';

        const cellEl = document.querySelector(`#${boardId} .board-cell[data-row='${row}'][data-col='${col}']`);
        if (cellEl) {
            cellEl.classList.add(hit ? 'hit' : 'miss');
            if (hit && shipSunk) cellEl.classList.add('sunk');
        }

        if (isMyAttack) {
            this.gameState.enemyBoard[row][col] = hit ? 'hit' : 'miss';
            const scoreEl = document.getElementById('game-score');
            if (scoreEl) scoreEl.innerHTML = `🎯 ${score}`;
        } else {
            this.gameState.myBoard[row][col] = hit ? 'hit' : 'miss';
        }

        if (!gameEnded) {
            if (data.timeout) {
                this.notify('Tempo esgotado! Turno passado.', 'warning');
            } else {
                const msg = hit ? (shipSunk ? '💥 AFUNDOU!' : '🎯 ACERTOU!') : '💧 ÁGUA';
                this.showFeedback(msg);
            }
        }
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

    showFeedback(message) {
        let el = document.getElementById('feedback-overlay');
        if (!el) {
            el = document.createElement('div');
            el.id = 'feedback-overlay';
            el.style.cssText = `position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);
                background:rgba(5,11,20,0.92);color:#ffd700;padding:16px 32px;border-radius:12px;
                font-family:'Orbitron',sans-serif;font-size:clamp(1rem,4vw,1.5rem);font-weight:700;
                z-index:5000;text-align:center;border:1px solid rgba(255,215,0,0.3);
                pointer-events:none;transition:opacity 0.4s;`;
            document.body.appendChild(el);
        }
        el.innerText = message;
        el.style.opacity = '1';
        el.style.display = 'block';
        setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.style.display = 'none', 400); }, 1800);
    }

    async endGame(data) {
        if (this.gameState?.turnTimer) clearInterval(this.gameState.turnTimer);
        const isWinner = data.winnerId === this.user.id;

        // Modal
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.innerHTML = `
            <div class="modal-content">
                <h2 style="color:${isWinner ? 'var(--success)' : 'var(--danger)'}; font-size:1.4rem;">
                    ${isWinner ? '🏆 VITÓRIA!' : '💀 DERROTA'}
                </h2>
                <p style="margin:12px 0;font-size:1.1rem;color:var(--gold);">
                    ${isWinner ? `+R$ ${data.prize?.toFixed(2) || '0.00'}` : 'Aposta perdida'}
                </p>
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
                <p style="margin:10px 0;font-size:0.85rem;color:var(--text-dim);">Você perderá a aposta.</p>
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