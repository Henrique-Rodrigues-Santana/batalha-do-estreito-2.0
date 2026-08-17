// ============================================================
// Batalha do Estreito 2.0 — Servidor Multiplayer Completo
// Segurança, Economia, Apostas (10% Rake), IA, Matchmaking
// ============================================================

require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
  pingTimeout: 30000,
  pingInterval: 10000
});

// ============== CONFIGURAÇÃO VIA .ENV ==============
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'batalha_estreito_fallback_secret_2026';
const NODE_ENV = process.env.NODE_ENV || 'development';
const HOUSE_COMMISSION = parseFloat(process.env.HOUSE_COMMISSION_PERCENT || '10') / 100;
const DAILY_BONUS = parseInt(process.env.DAILY_BONUS_AMOUNT || '200');
const INITIAL_COINS = parseInt(process.env.INITIAL_COINS || '1000');
const SALT_ROUNDS = 10;

// ============== MIDDLEWARE ==============
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// ---------- Rate Limiting Simples (sem dependência externa) ----------
const rateLimitMap = new Map();
function rateLimit(windowMs, maxRequests) {
  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    if (!rateLimitMap.has(ip)) {
      rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
      return next();
    }
    const entry = rateLimitMap.get(ip);
    if (now > entry.resetTime) {
      entry.count = 1;
      entry.resetTime = now + windowMs;
      return next();
    }
    entry.count++;
    if (entry.count > maxRequests) {
      return res.status(429).json({ error: 'Muitas tentativas. Aguarde um momento.' });
    }
    next();
  };
}
// Limpar o map periodicamente para não vazar memória
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap) {
    if (now > entry.resetTime) rateLimitMap.delete(ip);
  }
}, 60000);

const authRateLimit = rateLimit(60000, 10); // 10 tentativas por minuto

// ============== BANCO DE DADOS SQLITE ==============
// Auto-criação do diretório
const dbDir = path.join(__dirname, 'database');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
  console.log('📁 Diretório database/ criado automaticamente');
}

const db = new sqlite3.Database(path.join(dbDir, 'games.db'));

// Helper para promisify o SQLite
function dbRun(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}
function dbGet(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}
function dbAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

// Criar tabelas
db.serialize(() => {
  // Tabela de usuários (com coins)
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      email TEXT,
      avatar TEXT,
      coins REAL DEFAULT ${INITIAL_COINS},
      total_wins INTEGER DEFAULT 0,
      total_losses INTEGER DEFAULT 0,
      total_earnings REAL DEFAULT 0,
      last_daily_bonus TEXT,
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
      bet_amount REAL DEFAULT 0,
      house_commission REAL DEFAULT 0,
      match_type TEXT DEFAULT 'pvp',
      ai_difficulty TEXT,
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
      rank_points INTEGER DEFAULT 1000,
      total_matches INTEGER DEFAULT 0,
      win_streak INTEGER DEFAULT 0,
      best_streak INTEGER DEFAULT 0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Tabela de transações financeiras
  db.run(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      balance_after REAL,
      description TEXT,
      reference_id TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Tabela de receita da casa
  db.run(`
    CREATE TABLE IF NOT EXISTS house_revenue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      match_id INTEGER,
      match_type TEXT,
      bet_total REAL,
      commission REAL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (match_id) REFERENCES matches(id)
    )
  `);

  // Migrar coluna coins caso a tabela já exista sem ela
  db.run(`ALTER TABLE users ADD COLUMN coins REAL DEFAULT ${INITIAL_COINS}`, () => {});
  db.run(`ALTER TABLE users ADD COLUMN last_daily_bonus TEXT`, () => {});
  db.run(`ALTER TABLE matches ADD COLUMN bet_amount REAL DEFAULT 0`, () => {});
  db.run(`ALTER TABLE matches ADD COLUMN house_commission REAL DEFAULT 0`, () => {});
  db.run(`ALTER TABLE matches ADD COLUMN match_type TEXT DEFAULT 'pvp'`, () => {});
  db.run(`ALTER TABLE matches ADD COLUMN ai_difficulty TEXT`, () => {});

  console.log('✅ Banco de dados SQLite inicializado');
});

// ============== UTILITÁRIOS DE SEGURANÇA ==============
function escapeHTML(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ============== VALIDAÇÃO ANTI-CHEAT DE NAVIOS ==============
function validatePlacementBoard(board) {
  // Deve ser um array 10x10
  if (!Array.isArray(board) || board.length !== 10) return false;
  for (const row of board) {
    if (!Array.isArray(row) || row.length !== 10) return false;
  }

  // Coletar navios por ID
  const ships = {};
  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 10; c++) {
      const cell = board[r][c];
      if (cell === null) continue;
      if (typeof cell !== 'object' || !cell.id || !cell.size || cell.part === undefined) return false;
      if (!ships[cell.id]) ships[cell.id] = [];
      ships[cell.id].push({ r, c, size: cell.size, part: cell.part });
    }
  }

  // Validar exatamente 5 navios com tamanhos 5, 4, 3, 3, 2
  const expectedSizes = [5, 4, 3, 3, 2].sort().join(',');
  const actualSizes = Object.values(ships).map(parts => parts[0].size).sort().join(',');
  if (actualSizes !== expectedSizes) return false;

  // Validar cada navio: contiguidade e partes corretas
  for (const [shipId, parts] of Object.entries(ships)) {
    const expectedSize = parts[0].size;
    if (parts.length !== expectedSize) return false;

    // Ordenar por part
    parts.sort((a, b) => a.part - b.part);

    // Verificar partes 0..size-1
    for (let i = 0; i < parts.length; i++) {
      if (parts[i].part !== i) return false;
    }

    // Verificar alinhamento horizontal ou vertical
    const isHorizontal = parts.every(p => p.r === parts[0].r);
    const isVertical = parts.every(p => p.c === parts[0].c);
    if (!isHorizontal && !isVertical) return false;

    if (isHorizontal) {
      parts.sort((a, b) => a.c - b.c);
      for (let i = 1; i < parts.length; i++) {
        if (parts[i].c !== parts[i - 1].c + 1) return false;
      }
    } else {
      parts.sort((a, b) => a.r - b.r);
      for (let i = 1; i < parts.length; i++) {
        if (parts[i].r !== parts[i - 1].r + 1) return false;
      }
    }
  }

  return true;
}

// ============== MOTOR DE IA ==============
class BattleshipAI {
  constructor(difficulty = 'easy') {
    this.difficulty = difficulty;
    this.board = null; // Tabuleiro do jogador que a IA ataca
    this.shotsFired = new Set();
    this.hitQueue = []; // Células adjacentes para perseguir
    this.lastHit = null;
    this.heatMap = null;
  }

  init(playerBoard) {
    this.board = playerBoard;
    this.shotsFired = new Set();
    this.hitQueue = [];
    this.lastHit = null;
    if (this.difficulty === 'hard') {
      this.heatMap = this.buildHeatMap();
    }
  }

  getNextShot() {
    switch (this.difficulty) {
      case 'easy': return this.easyShot();
      case 'medium': return this.mediumShot();
      case 'hard': return this.hardShot();
      default: return this.easyShot();
    }
  }

  easyShot() {
    // Disparos puramente aleatórios
    let r, c;
    let attempts = 0;
    do {
      r = Math.floor(Math.random() * 10);
      c = Math.floor(Math.random() * 10);
      attempts++;
      if (attempts > 200) return null;
    } while (this.shotsFired.has(`${r},${c}`));
    this.shotsFired.add(`${r},${c}`);
    return [r, c];
  }

  mediumShot() {
    // Modo caça: se acertou algo, perseguir adjacentes
    while (this.hitQueue.length > 0) {
      const [r, c] = this.hitQueue.shift();
      if (r >= 0 && r < 10 && c >= 0 && c < 10 && !this.shotsFired.has(`${r},${c}`)) {
        this.shotsFired.add(`${r},${c}`);
        return [r, c];
      }
    }
    // Senão, disparo aleatório
    return this.easyShot();
  }

  hardShot() {
    // Modo caça primeiro
    while (this.hitQueue.length > 0) {
      const [r, c] = this.hitQueue.shift();
      if (r >= 0 && r < 10 && c >= 0 && c < 10 && !this.shotsFired.has(`${r},${c}`)) {
        this.shotsFired.add(`${r},${c}`);
        return [r, c];
      }
    }

    // Algoritmo de paridade (tabuleiro xadrez) + heatmap
    this.heatMap = this.buildHeatMap();
    let bestR = -1, bestC = -1, bestScore = -1;
    for (let r = 0; r < 10; r++) {
      for (let c = 0; c < 10; c++) {
        if (this.shotsFired.has(`${r},${c}`)) continue;
        // Paridade: preferir células em padrão xadrez
        const parityBonus = (r + c) % 2 === 0 ? 1.5 : 1.0;
        const score = (this.heatMap[r][c] || 0) * parityBonus;
        if (score > bestScore) {
          bestScore = score;
          bestR = r;
          bestC = c;
        }
      }
    }

    if (bestR >= 0) {
      this.shotsFired.add(`${bestR},${bestC}`);
      return [bestR, bestC];
    }
    return this.easyShot();
  }

  buildHeatMap() {
    // Calcular probabilidade de cada célula conter um navio
    const map = Array.from({ length: 10 }, () => Array(10).fill(0));
    const remainingShips = this.getRemainingShipSizes();

    for (const size of remainingShips) {
      // Tentar posicionar horizontalmente
      for (let r = 0; r < 10; r++) {
        for (let c = 0; c <= 10 - size; c++) {
          let valid = true;
          for (let k = 0; k < size; k++) {
            if (this.shotsFired.has(`${r},${c + k}`)) {
              // Verificar se foi miss
              const cell = this.board[r][c + k];
              if (cell === 'miss' || (typeof cell === 'string')) {
                valid = false;
                break;
              }
            }
          }
          if (valid) {
            for (let k = 0; k < size; k++) {
              if (!this.shotsFired.has(`${r},${c + k}`)) {
                map[r][c + k]++;
              }
            }
          }
        }
      }
      // Tentar posicionar verticalmente
      for (let r = 0; r <= 10 - size; r++) {
        for (let c = 0; c < 10; c++) {
          let valid = true;
          for (let k = 0; k < size; k++) {
            if (this.shotsFired.has(`${r + k},${c}`)) {
              const cell = this.board[r + k][c];
              if (cell === 'miss' || (typeof cell === 'string')) {
                valid = false;
                break;
              }
            }
          }
          if (valid) {
            for (let k = 0; k < size; k++) {
              if (!this.shotsFired.has(`${r + k},${c}`)) {
                map[r + k][c]++;
              }
            }
          }
        }
      }
    }
    return map;
  }

  getRemainingShipSizes() {
    // Detectar quais navios do jogador ainda não afundaram
    const shipsAlive = {};
    for (let r = 0; r < 10; r++) {
      for (let c = 0; c < 10; c++) {
        const cell = this.board[r][c];
        if (cell && typeof cell === 'object' && cell.id) {
          if (!shipsAlive[cell.id]) shipsAlive[cell.id] = cell.size;
        }
      }
    }
    return Object.values(shipsAlive);
  }

  processHit(r, c) {
    this.lastHit = [r, c];
    // Adicionar adjacentes à fila de perseguição (N, S, E, W)
    if (this.difficulty !== 'easy') {
      this.hitQueue.push([r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]);
    }
  }

  processSink() {
    // Limpar a fila de perseguição quando um navio é afundado
    this.hitQueue = [];
  }
}

// ============== ROTAS DA API ==============

// ------ Autenticação ------
app.post('/api/register', authRateLimit, async (req, res) => {
  const { username, password, email } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Usuário e senha são obrigatórios' });
  }
  if (username.length < 3 || username.length > 20) {
    return res.status(400).json({ error: 'Usuário deve ter entre 3 e 20 caracteres' });
  }
  if (password.length < 4) {
    return res.status(400).json({ error: 'Senha deve ter pelo menos 4 caracteres' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    db.run(
      'INSERT INTO users (username, password, email, coins) VALUES (?, ?, ?, ?)',
      [escapeHTML(username), hashedPassword, escapeHTML(email || ''), INITIAL_COINS],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE')) {
            return res.status(400).json({ error: 'Usuário já existe' });
          }
          return res.status(500).json({ error: err.message });
        }

        // Criar entrada no ranking
        db.run('INSERT INTO rankings (user_id, rank_points) VALUES (?, 1000)', [this.lastID]);

        // Registrar transação de bônus inicial
        db.run(
          'INSERT INTO transactions (user_id, type, amount, balance_after, description) VALUES (?, ?, ?, ?, ?)',
          [this.lastID, 'bonus', INITIAL_COINS, INITIAL_COINS, 'Bônus de boas-vindas']
        );

        const token = jwt.sign({ id: this.lastID, username }, JWT_SECRET, { expiresIn: '7d' });
        res.json({
          token,
          user: { id: this.lastID, username, coins: INITIAL_COINS }
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/login', authRateLimit, (req, res) => {
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

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        coins: user.coins || INITIAL_COINS,
        total_wins: user.total_wins,
        total_losses: user.total_losses,
        total_earnings: user.total_earnings
      }
    });
  });
});

// ------ Economia / Carteira ------
app.get('/api/user/balance', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token necessário' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    db.get('SELECT id, username, coins, total_wins, total_losses, total_earnings, last_daily_bonus FROM users WHERE id = ?',
      [decoded.id], (err, user) => {
        if (err || !user) return res.status(404).json({ error: 'Usuário não encontrado' });
        res.json({
          coins: user.coins,
          username: user.username,
          total_wins: user.total_wins,
          total_losses: user.total_losses,
          total_earnings: user.total_earnings,
          canClaimDailyBonus: canClaimDaily(user.last_daily_bonus)
        });
      });
  } catch { res.status(401).json({ error: 'Token inválido' }); }
});

function canClaimDaily(lastClaim) {
  if (!lastClaim) return true;
  const last = new Date(lastClaim);
  const now = new Date();
  return (now - last) >= 24 * 60 * 60 * 1000;
}

app.post('/api/daily-bonus', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token necessário' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await dbGet('SELECT * FROM users WHERE id = ?', [decoded.id]);
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });

    if (!canClaimDaily(user.last_daily_bonus)) {
      return res.status(400).json({ error: 'Bônus já coletado hoje. Volte amanhã!' });
    }

    const newBalance = (user.coins || 0) + DAILY_BONUS;
    await dbRun('UPDATE users SET coins = ?, last_daily_bonus = CURRENT_TIMESTAMP WHERE id = ?', [newBalance, user.id]);
    await dbRun(
      'INSERT INTO transactions (user_id, type, amount, balance_after, description) VALUES (?, ?, ?, ?, ?)',
      [user.id, 'daily_bonus', DAILY_BONUS, newBalance, `Bônus diário: +${DAILY_BONUS} moedas`]
    );

    res.json({ coins: newBalance, bonus: DAILY_BONUS });
  } catch { res.status(401).json({ error: 'Token inválido' }); }
});

// ------ Marketplace ------
const COIN_PACKAGES = [
  { id: 'pack_1000', coins: 1000, price: 5.00, label: '1.000 Moedas', badge: null },
  { id: 'pack_5000', coins: 5500, price: 20.00, label: '5.500 Moedas', badge: '+10% Bônus' },
  { id: 'pack_15000', coins: 17000, price: 50.00, label: '17.000 Moedas', badge: 'Mais Popular' },
  { id: 'pack_50000', coins: 60000, price: 150.00, label: '60.000 Moedas', badge: '+20% Bônus' }
];

app.get('/api/marketplace/packages', (req, res) => {
  res.json(COIN_PACKAGES);
});

app.post('/api/marketplace/buy', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token necessário' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const { packageId } = req.body;
    const pkg = COIN_PACKAGES.find(p => p.id === packageId);
    if (!pkg) return res.status(400).json({ error: 'Pacote inválido' });

    const user = await dbGet('SELECT * FROM users WHERE id = ?', [decoded.id]);
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });

    // Simulação de PIX (em produção, aqui integraria com gateway real)
    const pixCode = `00020126580014BR.GOV.BCB.PIX0136${Date.now()}520400005303986540${pkg.price.toFixed(2)}5802BR5925BATALHA DO ESTREITO6009SAO PAULO`;
    const transactionRef = `PIX_${Date.now()}_${user.id}`;

    // Creditar moedas imediatamente (modo demonstrativo)
    const newBalance = (user.coins || 0) + pkg.coins;
    await dbRun('UPDATE users SET coins = ? WHERE id = ?', [newBalance, user.id]);
    await dbRun(
      'INSERT INTO transactions (user_id, type, amount, balance_after, description, reference_id) VALUES (?, ?, ?, ?, ?, ?)',
      [user.id, 'purchase', pkg.coins, newBalance, `Compra: ${pkg.label}`, transactionRef]
    );

    res.json({
      success: true,
      coins: newBalance,
      purchased: pkg.coins,
      pixCode: pixCode,
      transactionRef: transactionRef,
      message: `+${pkg.coins} moedas creditadas!`
    });
  } catch { res.status(401).json({ error: 'Token inválido' }); }
});

app.get('/api/user/transactions', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token necessário' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const transactions = await dbAll(
      'SELECT * FROM transactions WHERE user_id = ? ORDER BY timestamp DESC LIMIT 50',
      [decoded.id]
    );
    res.json(transactions);
  } catch { res.status(401).json({ error: 'Token inválido' }); }
});

// ------ Ranking ------
app.get('/api/ranking', (req, res) => {
  db.all(`
    SELECT u.username, u.total_wins, u.total_losses, u.total_earnings, u.coins, r.rank_points
    FROM users u
    JOIN rankings r ON u.id = r.user_id
    ORDER BY r.rank_points DESC, u.total_earnings DESC
    LIMIT 50
  `, (err, rows) => {
    if (err) res.status(500).json({ error: err.message });
    else res.json(rows);
  });
});

// ------ Stats ------
app.get('/api/stats/:userId', (req, res) => {
  const { userId } = req.params;
  db.get(`
    SELECT 
      u.username, u.total_wins, u.total_losses, u.total_earnings, u.coins,
      r.rank_points, r.win_streak, r.best_streak,
      (SELECT COUNT(*) FROM bet_history WHERE user_id = ?) as total_bets,
      (SELECT AVG(profit) FROM bet_history WHERE user_id = ? AND profit > 0) as avg_profit
    FROM users u
    JOIN rankings r ON u.id = r.user_id
    WHERE u.id = ?
  `, [userId, userId, userId], (err, row) => {
    if (err) res.status(500).json({ error: err.message });
    else res.json(row);
  });
});

// ------ Admin: Receita da Casa ------
app.get('/api/admin/revenue', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token necessário' });
  // Em produção, verificar se é admin
  try {
    const total = await dbGet('SELECT SUM(commission) as total_revenue, COUNT(*) as total_matches FROM house_revenue');
    const recent = await dbAll('SELECT * FROM house_revenue ORDER BY timestamp DESC LIMIT 20');
    res.json({ summary: total, recent });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ------ Healthcheck ------
app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

// ============== SOCKET.IO — MULTIPLAYER ==============

// Estruturas em memória
const activeGames = new Map();
const userCache = new Map();
const userSocketMap = new Map();
const matchmakingQueue = []; // Fila de matchmaking

// Autenticação de Socket
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('Authentication error'));

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

  userCache.set(socket.userId, socket.username);
  userSocketMap.set(socket.userId, socket.id);

  socket.join('online');
  io.to('online').emit('online_count', io.sockets.adapter.rooms.get('online')?.size || 0);

  // ----- Enviar saldo atual ao conectar -----
  db.get('SELECT coins FROM users WHERE id = ?', [socket.userId], (err, user) => {
    if (user) socket.emit('balance_update', { coins: user.coins });
  });

  // ----- Reconexão de Partida -----
  socket.on('reconnect_match', (callback) => {
    for (const [roomCode, room] of activeGames) {
      if (room.players.includes(socket.userId)) {
        // Reatribuir socket
        socket.join(roomCode);
        userSocketMap.set(socket.userId, socket.id);

        // Cancelar timeout de desconexão
        if (room.disconnectTimeouts && room.disconnectTimeouts[socket.userId]) {
          clearTimeout(room.disconnectTimeouts[socket.userId]);
          delete room.disconnectTimeouts[socket.userId];
        }

        // Enviar estado completo da partida
        const myBoard = room.gameState?.boards[socket.userId];
        const opponentId = room.players.find(id => id !== socket.userId);
        const enemyBoard = room.gameState?.attackedCells?.[socket.userId] || [];

        callback({
          success: true,
          roomCode,
          status: room.status,
          currentTurn: room.currentTurn,
          myBoard,
          isMyTurn: room.currentTurn === socket.userId,
          scores: room.gameState?.scores || {},
          betAmount: room.betAmount,
          matchType: room.matchType || 'pvp',
          players: room.players.map(id => ({ id, username: getUsernameById(id) }))
        });

        io.to(roomCode).emit('player_reconnected', { username: socket.username });
        return;
      }
    }
    callback({ success: false, error: 'Nenhuma partida ativa' });
  });

  // ----- Criar Sala com Aposta -----
  socket.on('create_room', async (data, callback) => {
    const roomCode = generateRoomCode();
    const { maxPlayers = 2, betAmount = 0 } = data;

    // Validar saldo para aposta
    if (betAmount > 0) {
      const user = await dbGet('SELECT coins FROM users WHERE id = ?', [socket.userId]);
      if (!user || user.coins < betAmount) {
        return callback({ success: false, error: 'Saldo insuficiente para apostar' });
      }
    }

    db.run(`
      INSERT INTO matches (match_code, player1_id, bet_amount, match_type, status)
      VALUES (?, ?, ?, 'pvp', 'waiting')
    `, [roomCode, socket.userId, betAmount], function(err) {
      if (err) return callback({ success: false, error: err.message });

      socket.join(roomCode);
      activeGames.set(roomCode, {
        matchId: this.lastID,
        players: [socket.userId],
        playersReady: new Set(),
        betAmount,
        matchType: 'pvp',
        gameState: null,
        disconnectTimeouts: {}
      });

      callback({ success: true, roomCode, betAmount });
      io.to(roomCode).emit('room_created', { roomCode, host: socket.username, betAmount });
    });
  });

  // ----- Listar Salas -----
  socket.on('list_rooms', (callback) => {
    const rooms = [];
    for (const [code, room] of activeGames) {
      if (room.players.length < 2 && !room.gameState && room.matchType === 'pvp') {
        rooms.push({
          roomCode: code,
          host: getUsernameById(room.players[0]),
          players: room.players.length,
          betAmount: room.betAmount || 0
        });
      }
    }
    callback(rooms);
  });

  // ----- Matchmaking 1-Clique -----
  socket.on('quick_match', async (data, callback) => {
    const { betAmount = 0 } = data || {};

    // Validar saldo
    if (betAmount > 0) {
      const user = await dbGet('SELECT coins FROM users WHERE id = ?', [socket.userId]);
      if (!user || user.coins < betAmount) {
        return callback({ success: false, error: 'Saldo insuficiente' });
      }
    }

    // Obter ELO do jogador
    const ranking = await dbGet('SELECT rank_points FROM rankings WHERE user_id = ?', [socket.userId]);
    const myElo = ranking?.rank_points || 1000;

    // Procurar oponente na fila com ELO similar
    const myEntry = {
      userId: socket.userId,
      socketId: socket.id,
      elo: myElo,
      betAmount,
      timestamp: Date.now()
    };

    // Encontrar melhor match na fila
    let bestMatch = null;
    let bestIndex = -1;
    for (let i = 0; i < matchmakingQueue.length; i++) {
      const candidate = matchmakingQueue[i];
      if (candidate.userId === socket.userId) continue;
      if (candidate.betAmount !== betAmount) continue;
      const eloDiff = Math.abs(candidate.elo - myElo);
      if (!bestMatch || eloDiff < Math.abs(bestMatch.elo - myElo)) {
        bestMatch = candidate;
        bestIndex = i;
      }
    }

    if (bestMatch) {
      // Pareou! Remover da fila e criar sala
      matchmakingQueue.splice(bestIndex, 1);
      const roomCode = generateRoomCode();

      const matchResult = await dbRun(`
        INSERT INTO matches (match_code, player1_id, player2_id, bet_amount, match_type, status)
        VALUES (?, ?, ?, ?, 'pvp', 'ready')
      `, [roomCode, bestMatch.userId, socket.userId, betAmount]);

      socket.join(roomCode);
      const opSocket = io.sockets.sockets.get(bestMatch.socketId);
      if (opSocket) opSocket.join(roomCode);

      const room = {
        matchId: matchResult.lastID,
        players: [bestMatch.userId, socket.userId],
        playersReady: new Set(),
        betAmount,
        matchType: 'pvp',
        gameState: null,
        disconnectTimeouts: {}
      };
      activeGames.set(roomCode, room);

      const players = room.players.map(id => ({ id, username: getUsernameById(id) }));

      callback({ success: true, roomCode, matched: true });
      if (opSocket) opSocket.emit('quick_match_found', { roomCode, players, betAmount });
      socket.emit('quick_match_found', { roomCode, players, betAmount });

      io.to(roomCode).emit('player_joined', { players });

      // Iniciar fase de posicionamento
      setTimeout(() => startPlacementPhase(roomCode), 500);
    } else {
      // Adicionar à fila
      // Remover entrada anterior do mesmo jogador se existir
      const existingIdx = matchmakingQueue.findIndex(e => e.userId === socket.userId);
      if (existingIdx >= 0) matchmakingQueue.splice(existingIdx, 1);

      matchmakingQueue.push(myEntry);
      callback({ success: true, queued: true, position: matchmakingQueue.length });

      // Bot Fallback: após 12 segundos, parear com IA
      setTimeout(() => {
        const idx = matchmakingQueue.findIndex(e => e.userId === socket.userId);
        if (idx >= 0) {
          matchmakingQueue.splice(idx, 1);
          // Iniciar partida contra bot
          startAIMatchFromQueue(socket, betAmount, 'medium');
        }
      }, 12000);
    }
  });

  socket.on('cancel_queue', () => {
    const idx = matchmakingQueue.findIndex(e => e.userId === socket.userId);
    if (idx >= 0) matchmakingQueue.splice(idx, 1);
  });

  // ----- Entrar em Sala -----
  socket.on('join_room', async (roomCode, callback) => {
    const room = activeGames.get(roomCode);

    if (!room) return callback({ success: false, error: 'Sala não encontrada' });
    if (room.players.length >= 2) return callback({ success: false, error: 'Sala cheia' });
    if (room.players.includes(socket.userId)) return callback({ success: false, error: 'Você já está nesta sala' });

    // Validar saldo para aposta
    if (room.betAmount > 0) {
      const user = await dbGet('SELECT coins FROM users WHERE id = ?', [socket.userId]);
      if (!user || user.coins < room.betAmount) {
        return callback({ success: false, error: 'Saldo insuficiente para a aposta desta sala' });
      }
    }

    room.players.push(socket.userId);
    socket.join(roomCode);

    db.run(`UPDATE matches SET player2_id = ?, status = 'ready' WHERE match_code = ?`,
      [socket.userId, roomCode]);

    callback({ success: true, betAmount: room.betAmount });

    io.to(roomCode).emit('player_joined', {
      players: room.players.map(id => ({ id, username: getUsernameById(id) }))
    });

    if (room.players.length === 2) {
      setTimeout(() => startPlacementPhase(roomCode), 500);
    }
  });

  // ----- Posicionamento de Navios -----
  socket.on('ships_placed', (data) => {
    const { roomCode, board } = data;
    const room = activeGames.get(roomCode);
    if (!room || room.status !== 'placement') return;

    // ANTI-CHEAT: Validação estrita do tabuleiro
    if (!validatePlacementBoard(board)) {
      console.log(`⚠️ Anti-Cheat: Tabuleiro inválido de ${socket.username}. Auto-gerando...`);
      room.gameState.boards[socket.userId] = generateShipsBoard();
    } else {
      room.gameState.boards[socket.userId] = board;
    }

    room.playersReady.add(socket.userId);

    if (room.playersReady.size === 2) {
      clearTimeout(room.placementTimeout);
      startGameBattle(roomCode);
    }
  });

  // ----- Iniciar Partida vs IA -----
  socket.on('start_ai_match', async (data, callback) => {
    const { betAmount = 0, difficulty = 'medium' } = data;

    // Validar saldo
    if (betAmount > 0) {
      const user = await dbGet('SELECT coins FROM users WHERE id = ?', [socket.userId]);
      if (!user || user.coins < betAmount) {
        return callback({ success: false, error: 'Saldo insuficiente' });
      }
      // Debitar aposta
      await dbRun('UPDATE users SET coins = coins - ? WHERE id = ?', [betAmount, socket.userId]);
      await dbRun(
        'INSERT INTO transactions (user_id, type, amount, balance_after, description) VALUES (?, ?, ?, ?, ?)',
        [socket.userId, 'bet', -betAmount, (user.coins - betAmount), `Aposta vs IA (${difficulty})`]
      );
      socket.emit('balance_update', { coins: user.coins - betAmount });
    }

    const roomCode = generateRoomCode();
    const AI_USER_ID = -1; // ID virtual da IA

    const matchResult = await dbRun(`
      INSERT INTO matches (match_code, player1_id, player2_id, bet_amount, match_type, ai_difficulty, status)
      VALUES (?, ?, ?, ?, 'ai', ?, 'playing')
    `, [roomCode, socket.userId, AI_USER_ID, betAmount, difficulty]);

    socket.join(roomCode);

    const aiBoard = generateShipsBoard();
    const ai = new BattleshipAI(difficulty);

    const room = {
      matchId: matchResult.lastID,
      players: [socket.userId, AI_USER_ID],
      playersReady: new Set([socket.userId, AI_USER_ID]),
      betAmount,
      matchType: 'ai',
      aiDifficulty: difficulty,
      ai: ai,
      status: 'ai_placement',
      currentTurn: socket.userId,
      gameState: {
        boards: { [AI_USER_ID]: aiBoard },
        scores: { [socket.userId]: 0, [AI_USER_ID]: 0 },
        attackedCells: { [socket.userId]: new Set(), [AI_USER_ID]: new Set() }
      },
      disconnectTimeouts: {}
    };

    activeGames.set(roomCode, room);

    callback({
      success: true,
      roomCode,
      betAmount,
      difficulty,
      aiName: getAIName(difficulty)
    });

    // Fase de posicionamento do jogador humano
    room.status = 'placement';
    socket.emit('placement_phase_started', { timeLimit: 50 });

    room.placementTimeout = setTimeout(() => {
      if (room.status !== 'placement') return;
      if (!room.playersReady.has(socket.userId) || !room.gameState.boards[socket.userId]) {
        room.gameState.boards[socket.userId] = generateShipsBoard();
      }
      startAIBattle(roomCode);
    }, 50000);
  });

  // Posicionamento para partida IA
  socket.on('ai_ships_placed', (data) => {
    const { roomCode, board } = data;
    const room = activeGames.get(roomCode);
    if (!room || room.matchType !== 'ai' || room.status !== 'placement') return;

    if (!validatePlacementBoard(board)) {
      room.gameState.boards[socket.userId] = generateShipsBoard();
    } else {
      room.gameState.boards[socket.userId] = board;
    }

    clearTimeout(room.placementTimeout);
    startAIBattle(roomCode);
  });

  // Ação em partida IA
  socket.on('ai_game_action', async (data) => {
    const { roomCode, cell } = data;
    const room = activeGames.get(roomCode);

    if (!room || room.matchType !== 'ai' || room.status !== 'playing') return;
    if (room.currentTurn !== socket.userId) return socket.emit('action_invalid', { error: 'Não é sua vez' });

    if (room.turnTimeout) clearTimeout(room.turnTimeout);

    const AI_USER_ID = -1;

    // Processar ataque do jogador contra o tabuleiro da IA
    const result = processGameAction(room, socket.userId, 'attack', cell);

    socket.emit('action_result', { ...result, attackerId: socket.userId });

    if (result.gameEnded) {
      await endMatch(roomCode, result.winnerId, room.betAmount * 2);
      return;
    }

    // Se acertou, o jogador joga de novo
    if (result.hit) {
      room.currentTurn = socket.userId;
      socket.emit('turn_change', { playerId: socket.userId, timeLimit: 20 });
      startAITurnTimeout(roomCode, socket.userId);
      return;
    }

    // Turno da IA
    room.currentTurn = AI_USER_ID;
    socket.emit('turn_change', { playerId: AI_USER_ID, timeLimit: 20 });

    // IA joga após 1.5 segundos (simular "pensamento")
    setTimeout(async () => {
      await executeAITurn(roomCode, socket);
    }, 1500);
  });

  // ----- Ação PvP -----
  socket.on('game_action', async (data) => {
    const { roomCode, action, cell } = data;
    const room = activeGames.get(roomCode);

    if (!room || room.status !== 'playing' || room.currentTurn !== socket.userId) {
      return socket.emit('action_invalid', { error: 'Não é sua vez' });
    }

    if (room.turnTimeout) clearTimeout(room.turnTimeout);

    let result = { hit: false, shipSunk: false, gameEnded: false, cell: cell };
    if (action !== 'skip' && cell) {
      // Anti-cheat: verificar se já atacou esta célula
      const cellKey = `${cell[0]},${cell[1]}`;
      const attackedSet = room.gameState.attackedCells?.[socket.userId];
      if (attackedSet && attackedSet.has(cellKey)) {
        return socket.emit('action_invalid', { error: 'Já atacou esta célula' });
      }
      if (attackedSet) attackedSet.add(cellKey);

      result = processGameAction(room, socket.userId, action, cell);
    }

    io.to(roomCode).emit('action_result', { ...result, attackerId: socket.userId });

    if (result.gameEnded) {
      await endMatch(roomCode, result.winnerId, room.betAmount * 2);
    } else {
      setTimeout(() => {
        const nextPlayer = result.hit ? socket.userId : room.players.find(id => id !== socket.userId);
        startTurn(roomCode, nextPlayer);
      }, 2000);
    }
  });

  // ----- Desistência -----
  socket.on('forfeit', async (roomCode) => {
    const room = activeGames.get(roomCode);
    if (room) {
      const winnerId = room.players.find(id => id !== socket.userId);
      await endMatch(roomCode, winnerId, room.betAmount * 2);
    }
  });

  // ----- Chat (com sanitização Anti-XSS) -----
  socket.on('chat_message', (data) => {
    const { roomCode, message } = data;
    if (!message || message.length > 200) return;
    io.to(roomCode).emit('chat_message', {
      username: escapeHTML(socket.username),
      message: escapeHTML(message),
      timestamp: new Date()
    });
  });

  // ----- Desconexão -----
  socket.on('disconnect', () => {
    console.log(`👋 Jogador desconectado: ${socket.username}`);

    // Remover da fila de matchmaking
    const qIdx = matchmakingQueue.findIndex(e => e.userId === socket.userId);
    if (qIdx >= 0) matchmakingQueue.splice(qIdx, 1);

    // Gerenciar partidas ativas
    for (const [roomCode, room] of activeGames) {
      if (room.players.includes(socket.userId)) {
        const otherPlayer = room.players.find(id => id !== socket.userId);

        if (room.matchType === 'ai') {
          // Partida vs IA: fim imediato com derrota
          endMatch(roomCode, -1, room.betAmount);
          continue;
        }

        if (otherPlayer && otherPlayer !== -1) {
          io.to(roomCode).emit('player_disconnected', { username: socket.username });

          // Timer de 30 segundos para reconectar
          if (!room.disconnectTimeouts) room.disconnectTimeouts = {};
          room.disconnectTimeouts[socket.userId] = setTimeout(() => {
            endMatch(roomCode, otherPlayer, room.betAmount * 2);
          }, 30000);
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
  if (userId === -1) return 'Almirante IA';
  return userCache.get(userId) || `Jogador_${userId}`;
}

function getAIName(difficulty) {
  const names = {
    easy: ['Recruta Silva', 'Marujo Junior', 'Cabo Ferreira'],
    medium: ['Cmte. Santos', 'Cap. Oliveira', 'Major Ribeiro'],
    hard: ['Almirante Hawk', 'General Tempest', 'Marechal Ironside']
  };
  const list = names[difficulty] || names.medium;
  return list[Math.floor(Math.random() * list.length)];
}

async function startPlacementPhase(roomCode) {
  const room = activeGames.get(roomCode);
  if (!room) return;

  room.status = 'placement';
  room.playersReady.clear();
  room.gameState = {
    boards: {},
    scores: {},
    attackedCells: {}
  };
  room.players.forEach(id => {
    room.gameState.attackedCells[id] = new Set();
  });

  io.to(roomCode).emit('placement_phase_started', { timeLimit: 50 });

  room.placementTimeout = setTimeout(() => {
    const r = activeGames.get(roomCode);
    if (!r || r.status !== 'placement') return;

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

  // Debitar apostas de ambos jogadores (PvP)
  if (room.betAmount > 0 && room.matchType === 'pvp') {
    for (const playerId of room.players) {
      const user = await dbGet('SELECT coins FROM users WHERE id = ?', [playerId]);
      if (user) {
        const newBalance = user.coins - room.betAmount;
        await dbRun('UPDATE users SET coins = ? WHERE id = ?', [newBalance, playerId]);
        await dbRun(
          'INSERT INTO transactions (user_id, type, amount, balance_after, description) VALUES (?, ?, ?, ?, ?)',
          [playerId, 'bet', -room.betAmount, newBalance, `Aposta PvP: ${room.betAmount} moedas`]
        );
        const sid = userSocketMap.get(playerId);
        if (sid) io.to(sid).emit('balance_update', { coins: newBalance });
      }
    }
  }

  const player1 = room.players[0];
  const player2 = room.players[1];
  const p1SocketId = userSocketMap.get(player1);
  const p2SocketId = userSocketMap.get(player2);

  room.gameState.scores[player1] = 0;
  room.gameState.scores[player2] = 0;

  if (p1SocketId) {
    io.to(p1SocketId).emit('game_started', {
      currentTurn: room.currentTurn,
      myShips: room.gameState.boards[player1],
      betAmount: room.betAmount
    });
  }

  if (p2SocketId) {
    io.to(p2SocketId).emit('game_started', {
      currentTurn: room.currentTurn,
      myShips: room.gameState.boards[player2],
      betAmount: room.betAmount
    });
  }

  startTurn(roomCode, room.currentTurn);
}

function startAIBattle(roomCode) {
  const room = activeGames.get(roomCode);
  if (!room) return;

  room.status = 'playing';
  room.currentTurn = room.players[0]; // Jogador humano sempre começa

  const playerId = room.players[0];
  room.gameState.scores[playerId] = 0;
  room.gameState.scores[-1] = 0;

  // Inicializar IA com o tabuleiro do jogador humano
  room.ai.init(room.gameState.boards[playerId]);

  const sid = userSocketMap.get(playerId);
  if (sid) {
    io.to(sid).emit('game_started', {
      currentTurn: playerId,
      myShips: room.gameState.boards[playerId],
      betAmount: room.betAmount,
      matchType: 'ai',
      aiDifficulty: room.aiDifficulty
    });
  }

  // Timer do primeiro turno
  startAITurnTimeout(roomCode, playerId);
}

function startTurn(roomCode, playerId) {
  const room = activeGames.get(roomCode);
  if (!room || room.status !== 'playing') return;

  room.currentTurn = playerId;
  io.to(roomCode).emit('turn_change', { playerId: room.currentTurn, timeLimit: 20 });

  if (room.turnTimeout) clearTimeout(room.turnTimeout);
  room.turnTimeout = setTimeout(() => {
    const r = activeGames.get(roomCode);
    if (!r || r.status !== 'playing' || r.currentTurn !== playerId) return;

    io.to(roomCode).emit('action_result', {
      hit: false, shipSunk: false, gameEnded: false, cell: null,
      attackerId: playerId, timeout: true
    });

    setTimeout(() => {
      const nextPlayer = r.players.find(id => id !== playerId);
      startTurn(roomCode, nextPlayer);
    }, 2000);
  }, 20000);
}

function startAITurnTimeout(roomCode, playerId) {
  const room = activeGames.get(roomCode);
  if (!room) return;

  if (room.turnTimeout) clearTimeout(room.turnTimeout);
  room.turnTimeout = setTimeout(() => {
    const r = activeGames.get(roomCode);
    if (!r || r.status !== 'playing' || r.currentTurn !== playerId) return;

    // Timeout do jogador humano => turno da IA
    const sid = userSocketMap.get(playerId);
    if (sid) {
      io.to(sid).emit('action_result', {
        hit: false, shipSunk: false, gameEnded: false, cell: null,
        attackerId: playerId, timeout: true
      });
    }

    r.currentTurn = -1;
    setTimeout(() => {
      const socket = io.sockets.sockets.get(userSocketMap.get(playerId));
      if (socket) executeAITurn(roomCode, socket);
    }, 2000);
  }, 20000);
}

async function executeAITurn(roomCode, playerSocket) {
  const room = activeGames.get(roomCode);
  if (!room || room.status !== 'playing' || !room.ai) return;

  const AI_USER_ID = -1;
  const playerId = room.players[0];

  // IA escolhe alvo
  const aiShot = room.ai.getNextShot();
  if (!aiShot) {
    // IA sem alvos (impossível normalmente)
    room.currentTurn = playerId;
    playerSocket.emit('turn_change', { playerId, timeLimit: 20 });
    startAITurnTimeout(roomCode, playerId);
    return;
  }

  // Processar ataque da IA contra o tabuleiro do jogador
  const result = processGameAction(room, AI_USER_ID, 'attack', aiShot);

  // Informar a IA sobre o resultado
  if (result.hit) {
    room.ai.processHit(aiShot[0], aiShot[1]);
    if (result.shipSunk) room.ai.processSink();
  }

  playerSocket.emit('action_result', { ...result, attackerId: AI_USER_ID });

  if (result.gameEnded) {
    await endMatch(roomCode, result.winnerId, room.betAmount * 2);
    return;
  }

  // Se acertou, IA joga de novo (após delay)
  if (result.hit) {
    room.currentTurn = AI_USER_ID;
    setTimeout(() => executeAITurn(roomCode, playerSocket), 2000);
  } else {
    // Passar para o jogador
    room.currentTurn = playerId;
    playerSocket.emit('turn_change', { playerId, timeLimit: 20 });
    startAITurnTimeout(roomCode, playerId);
  }
}

async function startAIMatchFromQueue(socket, betAmount, difficulty) {
  socket.emit('quick_match_bot', { message: 'Oponente encontrado!', aiName: getAIName(difficulty) });

  // Iniciar partida vs IA
  socket.emit('start_ai_match_auto', { betAmount, difficulty });
}

function generateShipsBoard() {
  const board = Array(10).fill().map(() => Array(10).fill(null));
  const ships = [
    { size: 5, count: 1 },
    { size: 4, count: 1 },
    { size: 3, count: 2 },
    { size: 2, count: 1 }
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

function processGameAction(room, playerId, action, cell) {
  const opponentId = room.players.find(id => id !== playerId);
  const board = room.gameState.boards[opponentId];
  const [row, col] = cell;

  let hit = false;
  let shipSunk = false;
  let shipSize = 0;
  let shipId = null;

  if (board[row] && board[row][col] !== null && board[row][col] !== 'hit' && board[row][col] !== 'miss') {
    hit = true;
    const ship = board[row][col];
    shipSize = ship.size;
    shipId = ship.id;
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
  } else if (board[row][col] !== 'hit') {
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
    hit, shipSunk, shipSize, shipId, cell,
    score: room.gameState.scores[playerId],
    opponentScore: room.gameState.scores[opponentId],
    gameEnded, winnerId
  };
}

async function endMatch(roomCode, winnerId, prizePool) {
  const room = activeGames.get(roomCode);
  if (!room) return;

  // Limpar timers
  if (room.turnTimeout) clearTimeout(room.turnTimeout);
  if (room.placementTimeout) clearTimeout(room.placementTimeout);
  for (const key of Object.keys(room.disconnectTimeouts || {})) {
    clearTimeout(room.disconnectTimeouts[key]);
  }

  const loserId = room.players.find(id => id !== winnerId);
  const betAmount = room.betAmount || 0;
  const isAIMatch = room.matchType === 'ai';
  const AI_USER_ID = -1;

  // Calcular prêmio com comissão
  let commission = 0;
  let winnerPrize = 0;

  if (betAmount > 0) {
    const totalPot = isAIMatch ? betAmount * 2 : betAmount * 2;
    commission = Math.floor(totalPot * HOUSE_COMMISSION);
    winnerPrize = totalPot - commission;

    // Creditar moedas ao vencedor (se não for IA)
    if (winnerId !== AI_USER_ID) {
      const winnerUser = await dbGet('SELECT coins FROM users WHERE id = ?', [winnerId]);
      if (winnerUser) {
        const newBalance = winnerUser.coins + winnerPrize;
        await dbRun('UPDATE users SET coins = ?, total_earnings = total_earnings + ? WHERE id = ?',
          [newBalance, winnerPrize - betAmount, winnerId]);
        await dbRun(
          'INSERT INTO transactions (user_id, type, amount, balance_after, description) VALUES (?, ?, ?, ?, ?)',
          [winnerId, 'win', winnerPrize, newBalance,
            `Vitória ${isAIMatch ? 'vs IA' : 'PvP'}: +${winnerPrize} moedas (prêmio ${totalPot} - ${commission} taxa)`]
        );
        const sid = userSocketMap.get(winnerId);
        if (sid) io.to(sid).emit('balance_update', { coins: newBalance });
      }
    }

    // Registrar receita da casa
    await dbRun(
      'INSERT INTO house_revenue (match_id, match_type, bet_total, commission) VALUES (?, ?, ?, ?)',
      [room.matchId, room.matchType, totalPot, commission]
    );
  }

  // Atualizar vitórias/derrotas (apenas jogadores reais)
  if (winnerId !== AI_USER_ID) {
    await dbRun('UPDATE users SET total_wins = total_wins + 1 WHERE id = ?', [winnerId]);
  }
  if (loserId !== AI_USER_ID && loserId) {
    await dbRun('UPDATE users SET total_losses = total_losses + 1 WHERE id = ?', [loserId]);
  }

  // Atualizar ranking
  if (winnerId !== AI_USER_ID) await updateRanking(winnerId, true);
  if (loserId !== AI_USER_ID && loserId) await updateRanking(loserId, false);

  // Salvar partida no banco
  await dbRun(`
    UPDATE matches 
    SET winner_id = ?, 
        player1_score = ?,
        player2_score = ?,
        house_commission = ?,
        status = 'finished',
        finished_at = CURRENT_TIMESTAMP
    WHERE match_code = ?
  `, [winnerId, room.gameState?.scores[room.players[0]] || 0,
    room.gameState?.scores[room.players[1]] || 0, commission, roomCode]);

  // Salvar histórico de apostas
  for (const playerId of room.players) {
    if (playerId === AI_USER_ID) continue;
    await dbRun(`
      INSERT INTO bet_history (user_id, match_id, bet_amount, profit, ships_sunk)
      VALUES (?, ?, ?, ?, ?)
    `, [playerId, room.matchId, betAmount,
      playerId === winnerId ? winnerPrize - betAmount : -betAmount,
      room.gameState?.scores[playerId] || 0]);
  }

  // Emitir resultado
  io.to(roomCode).emit('match_ended', {
    winnerId,
    winnerName: getUsernameById(winnerId),
    prize: winnerPrize,
    commission,
    commissionPercent: HOUSE_COMMISSION * 100,
    betAmount,
    finalScores: room.gameState?.scores || {},
    matchType: room.matchType
  });

  activeGames.delete(roomCode);
}

async function updateRanking(userId, isWin) {
  const pointsChange = isWin ? 25 : -15;

  await dbRun(`
    UPDATE rankings 
    SET rank_points = MAX(rank_points + ?, 0),
        total_matches = total_matches + 1,
        win_streak = CASE 
          WHEN ? = 1 THEN win_streak + 1 
          ELSE 0 
        END,
        best_streak = CASE 
          WHEN ? = 1 AND win_streak + 1 > best_streak THEN win_streak + 1
          ELSE best_streak
        END,
        updated_at = CURRENT_TIMESTAMP
    WHERE user_id = ?
  `, [pointsChange, isWin ? 1 : 0, isWin ? 1 : 0, userId]);
}

// ============== GRACEFUL SHUTDOWN ==============
function gracefulShutdown(signal) {
  console.log(`\n⚠️ Recebido ${signal}. Encerrando...`);

  // Notificar todos jogadores
  io.emit('server_shutdown', { message: 'Servidor reiniciando. Reconecte em breve.' });

  server.close(() => {
    db.close(() => {
      console.log('✅ Banco de dados fechado.');
      process.exit(0);
    });
  });

  // Forçar encerramento após 10s
  setTimeout(() => {
    console.error('⛔ Forçando encerramento...');
    process.exit(1);
  }, 10000);
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// ============== INICIAR SERVIDOR ==============
server.listen(PORT, () => {
  console.log(`🚀 Servidor Batalha do Estreito 2.0 rodando em http://localhost:${PORT}`);
  console.log(`📊 Banco de dados SQLite: ${path.join(dbDir, 'games.db')}`);
  console.log(`💰 Comissão da casa: ${HOUSE_COMMISSION * 100}%`);
  console.log(`🤖 Motor de IA: Fácil / Médio / Difícil`);
  console.log(`🌍 Ambiente: ${NODE_ENV}`);
});