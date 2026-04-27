const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Configuração do SQLite
const db = new sqlite3.Database('./database/games.db');

// Criar tabelas
db.serialize(() => {
  // Tabela de usuários
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      email TEXT,
      avatar TEXT,
      total_wins INTEGER DEFAULT 0,
      total_losses INTEGER DEFAULT 0,
      total_earnings REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login DATETIME
    )
  `);

  // Tabela de partidas
  db.run(`
    CREATE TABLE IF NOT EXISTS matches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      match_code TEXT UNIQUE NOT NULL,
      player1_id INTEGER,
      player2_id INTEGER,
      winner_id INTEGER,
      player1_score REAL DEFAULT 0,
      player2_score REAL DEFAULT 0,
      status TEXT DEFAULT 'waiting',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      finished_at DATETIME,
      FOREIGN KEY (player1_id) REFERENCES users(id),
      FOREIGN KEY (player2_id) REFERENCES users(id),
      FOREIGN KEY (winner_id) REFERENCES users(id)
    )
  `);

  // Tabela de histórico de apostas
  db.run(`
    CREATE TABLE IF NOT EXISTS bet_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      match_id INTEGER,
      bet_amount REAL,
      multiplier REAL,
      profit REAL,
      ships_sunk INTEGER,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (match_id) REFERENCES matches(id)
    )
  `);

  // Tabela de rankings
  db.run(`
    CREATE TABLE IF NOT EXISTS rankings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE,
      rank_points INTEGER DEFAULT 0,
      total_matches INTEGER DEFAULT 0,
      win_streak INTEGER DEFAULT 0,
      best_streak INTEGER DEFAULT 0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Tabela de salas ativas
  db.run(`
    CREATE TABLE IF NOT EXISTS active_rooms (
      room_code TEXT PRIMARY KEY,
      host_id INTEGER,
      max_players INTEGER DEFAULT 2,
      current_players INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log('✅ Banco de dados SQLite inicializado');
});

// Configuração do JWT
const JWT_SECRET = 'batalha_naval_secret_key_2026';
const SALT_ROUNDS = 10;

// ============== ROTAS DA API ==============

// Registro de usuário
app.post('/api/register', async (req, res) => {
  const { username, password, email } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: 'Usuário e senha são obrigatórios' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    
    db.run(
      'INSERT INTO users (username, password, email) VALUES (?, ?, ?)',
      [username, hashedPassword, email],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE')) {
            return res.status(400).json({ error: 'Usuário já existe' });
          }
          return res.status(500).json({ error: err.message });
        }
        
        // Criar entrada no ranking
        db.run('INSERT INTO rankings (user_id, rank_points) VALUES (?, 1000)', [this.lastID]);
        
        const token = jwt.sign({ id: this.lastID, username }, JWT_SECRET, { expiresIn: '24h' });
        res.json({ token, user: { id: this.lastID, username } });
      }
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  
  db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
    if (err || !user) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }
    
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }
    
    // Atualizar último login
    db.run('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);
    
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        total_wins: user.total_wins,
        total_losses: user.total_losses,
        total_earnings: user.total_earnings
      }
    });
  });
});

// Buscar ranking global
app.get('/api/ranking', (req, res) => {
  db.all(`
    SELECT u.username, u.total_wins, u.total_losses, u.total_earnings, r.rank_points
    FROM users u
    JOIN rankings r ON u.id = r.user_id
    ORDER BY r.rank_points DESC, u.total_earnings DESC
    LIMIT 50
  `, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(rows);
    }
  });
});

// Buscar histórico do jogador
app.get('/api/history/:userId', (req, res) => {
  const { userId } = req.params;
  
  db.all(`
    SELECT bh.*, m.match_code, m.status as match_status
    FROM bet_history bh
    JOIN matches m ON bh.match_id = m.id
    WHERE bh.user_id = ?
    ORDER BY bh.timestamp DESC
    LIMIT 50
  `, [userId], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(rows);
    }
  });
});

// Estatísticas do jogador
app.get('/api/stats/:userId', (req, res) => {
  const { userId } = req.params;
  
  db.get(`
    SELECT 
      u.username,
      u.total_wins,
      u.total_losses,
      u.total_earnings,
      r.rank_points,
      r.win_streak,
      r.best_streak,
      (SELECT COUNT(*) FROM bet_history WHERE user_id = ?) as total_bets,
      (SELECT AVG(profit) FROM bet_history WHERE user_id = ? AND profit > 0) as avg_profit
    FROM users u
    JOIN rankings r ON u.id = r.user_id
    WHERE u.id = ?
  `, [userId, userId, userId], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(row);
    }
  });
});

// ============== SOCKET.IO - MULTIPLAYER ==============

// Salas ativas (em memória para acesso rápido)
const activeGames = new Map();
const waitingPlayers = new Map();
const userCache = new Map(); // Cache para nomes de usuários
const userSocketMap = new Map(); // userId -> socketId


io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication error'));
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    socket.userId = decoded.id;
    socket.username = decoded.username;
    next();
  } catch (err) {
    next(new Error('Invalid token'));
  }
});

io.on('connection', (socket) => {
  console.log(`👤 Jogador conectado: ${socket.username} (${socket.userId})`);
  
  // Atualizar cache de usuários
  userCache.set(socket.userId, socket.username);
  userSocketMap.set(socket.userId, socket.id);
  
  // Atualizar status online
  socket.join('online');
  io.to('online').emit('online_count', io.sockets.adapter.rooms.get('online')?.size || 0);
  
  // Criar sala privada
  socket.on('create_room', async (data, callback) => {
    const roomCode = generateRoomCode();
    const { maxPlayers = 2, betAmount = 100 } = data;
    
    db.run(`
      INSERT INTO matches (match_code, player1_id, status)
      VALUES (?, ?, 'waiting')
    `, [roomCode, socket.userId], function(err) {
      if (err) {
        return callback({ success: false, error: err.message });
      }
      
      socket.join(roomCode);
      activeGames.set(roomCode, {
        matchId: this.lastID,
        players: [socket.userId],
        playersReady: new Set(),
        betAmount,
        gameState: null
      });
      
      callback({ success: true, roomCode });
      io.to(roomCode).emit('room_created', { roomCode, host: socket.username });
    });
  });
  
  // Listar salas disponíveis
  socket.on('list_rooms', (callback) => {
    const rooms = [];
    for (const [code, room] of activeGames) {
      if (room.players.length < 2 && !room.gameState) {
        rooms.push({
          roomCode: code,
          host: getUsernameById(room.players[0]),
          players: room.players.length
        });
      }
    }
    callback(rooms);
  });

  // Entrar em sala
  socket.on('join_room', async (roomCode, callback) => {
    const room = activeGames.get(roomCode);
    
    if (!room) {
      return callback({ success: false, error: 'Sala não encontrada' });
    }
    
    if (room.players.length >= 2) {
      return callback({ success: false, error: 'Sala cheia' });
    }
    
    if (room.players.includes(socket.userId)) {
      return callback({ success: false, error: 'Você já está nesta sala' });
    }
    
    room.players.push(socket.userId);
    socket.join(roomCode);
    
    // Atualizar partida no banco
    db.run(`
      UPDATE matches 
      SET player2_id = ?, status = 'ready'
      WHERE match_code = ?
    `, [socket.userId, roomCode]);
    
    callback({ success: true });
    
    // Notificar todos na sala
    io.to(roomCode).emit('player_joined', {
      players: room.players.map(id => ({ id, username: getUsernameById(id) }))
    });
    
    // Se ambos estão na sala, iniciar fase de posicionamento
    if (room.players.length === 2) {
      setTimeout(() => startPlacementPhase(roomCode), 500);
    }
  });
  

  // Posicionamento de navios do jogador
  socket.on('ships_placed', (data) => {
    const { roomCode, board } = data;
    const room = activeGames.get(roomCode);
    if (!room || room.status !== 'placement') return;
    
    room.gameState.boards[socket.userId] = board;
    room.playersReady.add(socket.userId);
    
    // Se ambos posicionaram, inicia o jogo cancelando o timeout de 50s
    if (room.playersReady.size === 2) {
      clearTimeout(room.placementTimeout);
      startGameBattle(roomCode);
    }
  });

  // Ação do jogador (acerto/erro)
  socket.on('game_action', async (data) => {
    const { roomCode, action, cell } = data;
    const room = activeGames.get(roomCode);
    
    if (!room || room.status !== 'playing' || room.currentTurn !== socket.userId) {
      return socket.emit('action_invalid', { error: 'Não é sua vez' });
    }

    // Cancelar o timer de turno do servidor
    if (room.turnTimeout) clearTimeout(room.turnTimeout);
    
    // Processar ação se não for "skip"
    let result = { hit: false, shipSunk: false, gameEnded: false, cell: cell };
    if (action !== 'skip' && cell) {
        result = await processGameAction(room, socket.userId, action, cell);
    }
    
    // Atualizar estado do jogo
    io.to(roomCode).emit('action_result', { ...result, attackerId: socket.userId });
    
    // Verificar fim do jogo
    if (result.gameEnded) {
      endMatch(roomCode, result.winnerId, room.betAmount * 2);
    } else {
      // Mudar turno após 2 segundos
      setTimeout(() => {
        // Se acertou, continua sendo a vez do atacante. Se errou (ou timeout), passa a vez.
        const nextPlayer = result.hit ? socket.userId : room.players.find(id => id !== socket.userId);
        startTurn(roomCode, nextPlayer);
      }, 2000);
    }
  });
  
  // Desistência
  socket.on('forfeit', async (roomCode) => {
    const room = activeGames.get(roomCode);
    if (room) {
      const winnerId = room.players.find(id => id !== socket.userId);
      await endMatch(roomCode, winnerId, room.betAmount * 2);
    }
  });
  
  // Chat da sala
  socket.on('chat_message', (data) => {
    const { roomCode, message } = data;
    io.to(roomCode).emit('chat_message', {
      username: socket.username,
      message,
      timestamp: new Date()
    });
  });
  
  // Desconexão
  socket.on('disconnect', () => {
    console.log(`👋 Jogador desconectado: ${socket.username}`);
    
    // Procurar e fechar salas onde este jogador está
    for (const [roomCode, room] of activeGames) {
      if (room.players.includes(socket.userId)) {
        const otherPlayer = room.players.find(id => id !== socket.userId);
        if (otherPlayer) {
          io.to(roomCode).emit('player_disconnected', { username: socket.username });
          setTimeout(() => {
            endMatch(roomCode, otherPlayer, room.betAmount);
          }, 30000); // 30 segundos para reconectar
        } else {
          activeGames.delete(roomCode);
        }
      }
    }
    
    io.to('online').emit('online_count', io.sockets.adapter.rooms.get('online')?.size || 0);
    userSocketMap.delete(socket.userId);
  });
});

// ============== FUNÇÕES AUXILIARES ==============

function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function getUsernameById(userId) {
  return userCache.get(userId) || `Jogador_${userId}`;
}

async function startPlacementPhase(roomCode) {
  const room = activeGames.get(roomCode);
  if (!room) return;
  
  room.status = 'placement';
  room.playersReady.clear();
  room.gameState = {
    boards: {},
    scores: {}
  };
  
  io.to(roomCode).emit('placement_phase_started', { timeLimit: 50 });
  
  // Timeout de 50 segundos para posicionamento
  room.placementTimeout = setTimeout(() => {
    const r = activeGames.get(roomCode);
    if (!r || r.status !== 'placement') return;
    
    // Auto-posicionar para quem faltou
    for (const playerId of r.players) {
      if (!r.playersReady.has(playerId)) {
        r.gameState.boards[playerId] = generateShipsBoard();
        r.playersReady.add(playerId);
      }
    }
    startGameBattle(roomCode);
  }, 50000);
}

async function startGameBattle(roomCode) {
  const room = activeGames.get(roomCode);
  if (!room) return;
  
  room.status = 'playing';
  room.currentTurn = room.players[0];
  
  // Enviar tabuleiro específico para cada jogador
  const player1 = room.players[0];
  const player2 = room.players[1];
  
  const p1SocketId = userSocketMap.get(player1);
  const p2SocketId = userSocketMap.get(player2);

  room.gameState.scores[player1] = 0;
  room.gameState.scores[player2] = 0;

  if (p1SocketId) {
    io.to(p1SocketId).emit('game_started', {
      currentTurn: room.currentTurn,
      myShips: room.gameState.boards[player1]
    });
  }
  
  if (p2SocketId) {
    io.to(p2SocketId).emit('game_started', {
      currentTurn: room.currentTurn,
      myShips: room.gameState.boards[player2]
    });
  }

  // Iniciar timer do primeiro turno
  startTurn(roomCode, room.currentTurn);
}

function startTurn(roomCode, playerId) {
  const room = activeGames.get(roomCode);
  if (!room || room.status !== 'playing') return;

  room.currentTurn = playerId;
  io.to(roomCode).emit('turn_change', { playerId: room.currentTurn, timeLimit: 20 });

  // Timeout de 20 segundos para jogar
  if (room.turnTimeout) clearTimeout(room.turnTimeout);
  room.turnTimeout = setTimeout(() => {
    const r = activeGames.get(roomCode);
    if (!r || r.status !== 'playing' || r.currentTurn !== playerId) return;
    
    io.to(roomCode).emit('action_result', { hit: false, shipSunk: false, gameEnded: false, cell: null, attackerId: playerId, timeout: true });
    
    setTimeout(() => {
        const nextPlayer = r.players.find(id => id !== playerId);
        startTurn(roomCode, nextPlayer);
    }, 2000);
  }, 20000);
}

function generateShipsBoard() {
  const board = Array(10).fill().map(() => Array(10).fill(null));
  const ships = [
    { size: 5, count: 1 }, // Porta-aviões
    { size: 4, count: 1 }, // Encouraçado
    { size: 3, count: 2 }, // Cruzadores
    { size: 2, count: 1 }  // Destroyer
  ];
  
  let shipIdCounter = 1;
  for (const ship of ships) {
    for (let i = 0; i < ship.count; i++) {
      let placed = false;
      const currentShipId = shipIdCounter++;
      while (!placed) {
        const horizontal = Math.random() > 0.5;
        const row = Math.floor(Math.random() * 10);
        const col = Math.floor(Math.random() * (horizontal ? 10 - ship.size + 1 : 10));
        const r_limit = horizontal ? row : row + ship.size - 1;
        
        if (r_limit >= 10) continue; 

        let valid = true;
        for (let j = 0; j < ship.size; j++) {
          const r = horizontal ? row : row + j;
          const c = horizontal ? col + j : col;
          if (r >= 10 || c >= 10 || board[r][c] !== null) {
            valid = false;
            break;
          }
        }
        
        if (valid) {
          for (let j = 0; j < ship.size; j++) {
            const r = horizontal ? row : row + j;
            const c = horizontal ? col + j : col;
            board[r][c] = { id: currentShipId, size: ship.size, part: j };
          }
          placed = true;
        }
      }
    }
  }
  
  return board;
}

async function processGameAction(room, playerId, action, cell) {
  const opponentId = room.players.find(id => id !== playerId);
  const board = room.gameState.boards[opponentId];
  const [row, col] = cell;
  
  let hit = false;
  let shipSunk = false;
  let shipSize = 0;
  
  if (board[row] && board[row][col] !== null && board[row][col] !== 'hit') {
    hit = true;
    const ship = board[row][col];
    shipSize = ship.size;
    const shipId = ship.id;
    board[row][col] = 'hit';
    
    // Verificar se o navio específico foi afundado
    let allHit = true;
    for (let i = 0; i < 10; i++) {
      for (let j = 0; j < 10; j++) {
        if (board[i][j] && board[i][j].id === shipId && board[i][j] !== 'hit') {
          allHit = false;
          break;
        }
      }
      if (!allHit) break;
    }
    shipSunk = allHit;
    
    if (shipSunk) {
      room.gameState.scores[playerId] += shipSize * 100;
    } else {
      room.gameState.scores[playerId] += 50;
    }
  } else {
    board[row][col] = 'miss';
  }
  
  // Verificar fim do jogo
  let gameEnded = false;
  let winnerId = null;
  let allShipsDestroyed = true;
  
  for (let i = 0; i < 10; i++) {
    for (let j = 0; j < 10; j++) {
      if (board[i][j] && board[i][j] !== 'hit' && board[i][j] !== 'miss') {
        allShipsDestroyed = false;
        break;
      }
    }
    if (!allShipsDestroyed) break;
  }
  
  if (allShipsDestroyed) {
    gameEnded = true;
    winnerId = playerId;
  }
  
  return {
    hit,
    shipSunk,
    shipSize,
    cell,
    score: room.gameState.scores[playerId],
    opponentScore: room.gameState.scores[opponentId],
    gameEnded,
    winnerId
  };
}

async function endMatch(roomCode, winnerId, prizeAmount) {
  const room = activeGames.get(roomCode);
  if (!room) return;
  
  const loserId = room.players.find(id => id !== winnerId);
  
  // Atualizar vitórias/derrotas
  db.run('UPDATE users SET total_wins = total_wins + 1 WHERE id = ?', [winnerId]);
  db.run('UPDATE users SET total_losses = total_losses + 1 WHERE id = ?', [loserId]);
  
  // Atualizar ranking
  await updateRanking(winnerId, true);
  await updateRanking(loserId, false);
  
  // Salvar histórico da partida
  db.run(`
    UPDATE matches 
    SET winner_id = ?, 
        player1_score = ?,
        player2_score = ?,
        status = 'finished',
        finished_at = CURRENT_TIMESTAMP
    WHERE match_code = ?
  `, [winnerId, room.gameState?.scores[room.players[0]] || 0, room.gameState?.scores[room.players[1]] || 0, roomCode]);
  
  // Salvar histórico de apostas
  for (const playerId of room.players) {
    db.run(`
      INSERT INTO bet_history (user_id, match_id, bet_amount, profit, ships_sunk)
      VALUES (?, ?, ?, ?, ?)
    `, [playerId, room.matchId, room.betAmount, playerId === winnerId ? prizeAmount : -room.betAmount, room.gameState?.scores[playerId] || 0]);
  }
  
  io.to(roomCode).emit('match_ended', {
    winnerId,
    winnerName: getUsernameById(winnerId),
    prize: prizeAmount,
    finalScores: room.gameState?.scores || {}
  });
  
  activeGames.delete(roomCode);
}

async function updateRanking(userId, isWin) {
  const pointsChange = isWin ? 25 : -15;
  
  db.run(`
    UPDATE rankings 
    SET rank_points = rank_points + ?,
        total_matches = total_matches + 1,
        win_streak = CASE 
          WHEN ? = 1 THEN win_streak + 1 
          ELSE 0 
        END,
        best_streak = MAX(best_streak, win_streak + 1),
        updated_at = CURRENT_TIMESTAMP
    WHERE user_id = ?
  `, [pointsChange, isWin ? 1 : 0, userId]);
}

// Iniciar servidor
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Servidor multiplayer rodando em http://localhost:${PORT}`);
  console.log(`📊 Banco de dados SQLite: ./database/games.db`);
});