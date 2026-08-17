# 🔍 Auditoria Estrutural — Batalha do Estreito 2.0

> Análise completa do sistema em **17/08/2026**. Foco em estabilidade, segurança e disponibilidade em produção.

---

## Visão Geral do Sistema

| Componente | Tecnologia | Status |
|---|---|---|
| **Backend** | Node.js + Express + Socket.IO + SQLite | ⚠️ Melhorias críticas |
| **Banco de Dados** | SQLite (`database/games.db`) | ⚠️ Limitações de escala |
| **Frontend (Jogo)** | HTML + Vanilla JS + Three.js + PWA | ✅ Funcional |
| **Site Promocional** | React + Vite + GSAP + Three.js | ✅ Funcional |
| **Deploy** | PM2 + Nginx + aaPanel (VPS) | ⚠️ Configurações pendentes |

---

## 🚨 Problemas Críticos (App pode cair)

### 1. Sem handlers de erro global no processo Node.js

**Arquivo:** [`server.js`](file:///c:/Users/henrique/Desktop/code/games/batalha-do-estreito-2.0/fonte/server.js)

O servidor **não captura** erros assíncronos não tratados. Qualquer `Promise` rejeitada sem `.catch()` vai **crashar o processo** em Node.js 15+.

```diff
// Adicionar no topo de server.js, após os requires
+process.on('uncaughtException', (err) => {
+  console.error('💥 uncaughtException:', err);
+  // Não finalizar o processo — PM2 cuida do restart se necessário
+});
+
+process.on('unhandledRejection', (reason, promise) => {
+  console.error('💥 unhandledRejection em:', promise, 'motivo:', reason);
+});
```

---

### 2. CORS completamente aberto em produção

**Linha 20 e 35 de `server.js`**

```js
// ATUAL — perigoso em produção:
cors: { origin: "*", methods: ["GET", "POST"] }
app.use(cors());
```

Qualquer origem pode fazer requisições ao servidor. Isso abre brechas para CSRF e abusos.

```diff
-const io = socketIo(server, {
-  cors: { origin: "*", methods: ["GET", "POST"] },
+const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
+  ? process.env.ALLOWED_ORIGINS.split(',')
+  : ['http://localhost:3000'];
+
+const io = socketIo(server, {
+  cors: { origin: ALLOWED_ORIGINS, methods: ["GET", "POST"] },

-app.use(cors());
+app.use(cors({ origin: ALLOWED_ORIGINS, credentials: true }));
```

Adicionar ao `.env`:
```env
ALLOWED_ORIGINS=https://seudominio.com.br
```

---

### 3. `debugShowShips: true` em produção

**Arquivo:** [`public/config.js`](file:///c:/Users/henrique/Desktop/code/games/batalha-do-estreito-2.0/fonte/public/config.js#L37)

```js
debugShowShips: true,  // ← CRÍTICO: expõe posição dos navios do adversário!
```

> [!CAUTION]
> Com `debugShowShips: true`, os navios do oponente ficam **visíveis no tabuleiro** para qualquer jogador que abra o DevTools. Isso **quebra o jogo competitivo** completamente. Deve ser `false` em produção.

```diff
-    debugShowShips: true,
+    debugShowShips: false,
```

---

### 4. `userLastAdWatch` (anúncios) é apenas em memória

**Linha 648 de `server.js`**

```js
const userLastAdWatch = new Map();
```

Ao reiniciar o PM2 (deploy, crash, atualização), o Map é zerado. Um jogador pode assistir anúncio ilimitado logo após cada restart, acumulando moedas infinitas.

**Solução:** Persistir no banco de dados com timestamp ou usar Redis para sessões voláteis.

---

## ⚠️ Problemas de Estabilidade (Degradação ao longo do tempo)

### 5. Leak de memória: `userCache` e `userSocketMap` crescem indefinidamente

**Linhas 755–756 de `server.js`**

```js
const userCache = new Map();      // username por userId
const userSocketMap = new Map();  // socketId por userId
```

Usuários que se desconectam são removidos de `userSocketMap`, mas **`userCache` nunca é limpo**. Com muitos usuários ao longo do tempo, o processo consome memória crescente.

```diff
socket.on('disconnect', () => {
+  // Limpar cache de username após desconexão (manter por 5 min p/ reconexão)
+  setTimeout(() => {
+    if (!userSocketMap.has(socket.userId)) {
+      userCache.delete(socket.userId);
+    }
+  }, 5 * 60 * 1000);
  userSocketMap.delete(socket.userId);
});
```

---

### 6. SQLite sem WAL mode e sem backup automático no código

SQLite no modo padrão (journal) pode corromper o arquivo em crashes simultâneos. O modo WAL é muito mais robusto para leituras/escritas concorrentes (Socket.IO tem alto nível de concorrência).

```diff
const db = new sqlite3.Database(path.join(dbDir, 'games.db'));
+// Ativar WAL mode para maior performance e segurança em concorrência
+db.run('PRAGMA journal_mode=WAL;');
+db.run('PRAGMA synchronous=NORMAL;');
+db.run('PRAGMA cache_size=10000;');
+db.run('PRAGMA foreign_keys=ON;');
```

---

### 7. Partidas `ai` encerram com `endMatch(roomCode, -1, room.betAmount)` ao desconectar

**Linha 1239 de `server.js`**

```js
// Partida vs IA: fim imediato com derrota
endMatch(roomCode, -1, room.betAmount);
```

Quando `winnerId = -1` (IA), a lógica de prêmio tenta buscar `coins` da IA (id `-1`) no banco, o que retorna `null`. O saldo não é devolvido e o jogador perde a aposta por simples queda de internet.

**Solução recomendada:** Devolver a aposta ao jogador quando a desconexão for vs IA, em vez de considerar derrota.

```diff
if (room.matchType === 'ai') {
-  endMatch(roomCode, -1, room.betAmount);
+  // Devolver aposta ao jogador (desconexão ≠ derrota vs IA)
+  if (room.betAmount > 0) {
+    dbRun('UPDATE users SET coins = coins + ? WHERE id = ?', [room.betAmount, socket.userId]);
+  }
+  activeGames.delete(roomCode);
  continue;
}
```

---

### 8. `generateShipsBoard` pode entrar em loop infinito

**Linha 1501 de `server.js`**

```js
while (!placed) { ... }
```

Sem limite de tentativas. Se o algoritmo de colocação falhar (edge case de tabuleiro preenchido), o loop nunca termina, **travando o event loop do Node.js** e derrubando o servidor.

```diff
+  let maxAttempts = 1000;
   while (!placed) {
+    if (--maxAttempts <= 0) {
+      console.error('generateShipsBoard: timeout ao colocar navio, gerando novo board');
+      return generateShipsBoard(); // Recomeçar
+    }
```

---

## 🔒 Problemas de Segurança

### 9. Rota `/api/admin/revenue` sem verificação de admin

**Linhas 735–744 de `server.js`**

```js
app.get('/api/admin/revenue', async (req, res) => {
  // Em produção, verificar se é admin  ← COMENTÁRIO, não implementado!
```

Qualquer usuário autenticado com um JWT válido pode ver a receita total da casa.

```diff
+function isAdmin(req, res, next) {
+  const token = req.headers.authorization?.split(' ')[1];
+  if (!token) return res.status(401).json({ error: 'Token necessário' });
+  try {
+    const decoded = jwt.verify(token, JWT_SECRET);
+    const ADMIN_IDS = (process.env.ADMIN_USER_IDS || '').split(',').map(Number);
+    if (!ADMIN_IDS.includes(decoded.id)) return res.status(403).json({ error: 'Acesso negado' });
+    req.user = decoded;
+    next();
+  } catch { res.status(401).json({ error: 'Token inválido' }); }
+}

-app.get('/api/admin/revenue', async (req, res) => {
+app.get('/api/admin/revenue', isAdmin, async (req, res) => {
```

Adicionar ao `.env`:
```env
ADMIN_USER_IDS=1,2
```

---

### 10. JWT secret com fallback hardcoded

**Linha 27 de `server.js`**

```js
const JWT_SECRET = process.env.JWT_SECRET || 'batalha_estreito_fallback_secret_2026';
```

Se `.env` não existir em produção, o app sobe com um secret **público e previsível**, permitindo forjar tokens.

```diff
-const JWT_SECRET = process.env.JWT_SECRET || 'batalha_estreito_fallback_secret_2026';
+if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
+  console.error('FATAL: JWT_SECRET não definido em produção. Encerrando.');
+  process.exit(1);
+}
+const JWT_SECRET = process.env.JWT_SECRET || 'dev_only_secret_change_in_production';
```

---

### 11. Headers de segurança HTTP ausentes no Express

O servidor não envia headers como `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`. O Nginx já adiciona alguns, mas em caso de acesso direto ao Node (bypass do proxy), o app fica exposto.

**Solução:** Adicionar o middleware `helmet`:
```bash
npm install helmet
```
```diff
+const helmet = require('helmet');
+app.use(helmet({
+  contentSecurityPolicy: false, // Ajustar depois conforme CDNs usados
+  crossOriginEmbedderPolicy: false
+}));
```

---

## 📦 Melhorias de Deploy e Operação

### 12. Falta arquivo `ecosystem.config.js` para PM2

O guia instrui `pm2 start server.js`, mas sem um arquivo de configuração o PM2 não persiste corretamente limites de memória, variáveis e estratégia de restart.

**Criar:** `fonte/ecosystem.config.js`
```js
module.exports = {
  apps: [{
    name: 'batalha-estreito',
    script: 'server.js',
    instances: 1,          // SQLite não suporta múltiplas instâncias sem WAL
    autorestart: true,
    watch: false,
    max_memory_restart: '512M',
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss'
  }]
};
```

Iniciar com:
```bash
pm2 start ecosystem.config.js --env production
```

---

### 13. Backup do SQLite apenas via cron externo, sem verificação de integridade

O guia menciona backup por cron, mas sem `PRAGMA integrity_check` periódico. Recomendado adicionar ao script de backup:
```bash
#!/bin/bash
sqlite3 /www/wwwroot/batalha-estreito/database/games.db "PRAGMA integrity_check;" | grep -q "ok" \
  && cp /www/wwwroot/batalha-estreito/database/games.db /www/backup/games_$(date +%Y%m%d).db \
  || echo "ALERTA: integridade do banco comprometida!"
```

---

### 14. `t-22.glb` (8MB) servido pelo Node.js sem compressão

O arquivo 3D `t-22.glb` tem **8MB**. O Express serve arquivos estáticos sem compressão gzip/brotli para arquivos binários como `.glb`. Isso impacta o tempo de carregamento do jogo.

**Solução no Nginx** (já parcialmente configurado):
```nginx
# Adicionar à seção location do Nginx
location ~* \.(glb|gltf)$ {
    gzip_static on;   # Serve .gz pré-comprimido se existir
    expires 30d;
    add_header Cache-Control "public, immutable";
}
```

**Pré-comprimir o arquivo:**
```bash
gzip -k -9 t-22.glb   # Gera t-22.glb.gz
```

---

### 15. Service Worker usa cache name fixo `batalha-estreito-v1`

**Arquivo:** [`sw.js`](file:///c:/Users/henrique/Desktop/code/games/batalha-do-estreito-2.0/fonte/public/sw.js#L6)

```js
const CACHE_NAME = 'batalha-estreito-v1';
```

A cada deploy que modifica arquivos CSS/JS, o Service Worker **não invalida o cache automaticamente**. O usuário pode ficar com versão antiga por dias.

**Solução:** Versionar o cache com timestamp de build ou hash:
```js
const CACHE_VERSION = 'v20260817'; // Atualizar a cada deploy
const CACHE_NAME = `batalha-estreito-${CACHE_VERSION}`;
```

Ou automatizar via script de deploy.

---

## 📋 Checklist de Prioridades

| # | Problema | Impacto | Dificuldade | Prioridade |
|---|---|---|---|---|
| 3 | `debugShowShips: true` em produção | 🔴 Game-breaking | Trivial | **Imediata** |
| 1 | Sem `unhandledRejection` handler | 🔴 Crash do servidor | Fácil | **Imediata** |
| 10 | JWT secret com fallback hardcoded | 🔴 Segurança crítica | Fácil | **Imediata** |
| 9 | Rota admin sem auth | 🔴 Vazamento de dados | Média | **Alta** |
| 2 | CORS aberto | 🔴 Segurança | Fácil | **Alta** |
| 6 | SQLite sem WAL mode | 🟡 Corrupção em crash | Trivial | **Alta** |
| 7 | Aposta perdida ao desconectar vs IA | 🟡 UX/Economia | Média | **Alta** |
| 8 | Loop infinito em `generateShipsBoard` | 🟡 Travar o servidor | Fácil | **Média** |
| 5 | Leak de memória em `userCache` | 🟡 Degradação lenta | Fácil | **Média** |
| 4 | `userLastAdWatch` em memória | 🟡 Exploração econômica | Média | **Média** |
| 12 | Sem `ecosystem.config.js` PM2 | 🟢 Deploy robusto | Fácil | **Média** |
| 11 | Headers HTTP ausentes | 🟢 Segurança extra | Fácil | **Baixa** |
| 15 | Cache SW fixo | 🟢 Cache stale | Fácil | **Baixa** |
| 13 | Backup sem integrity check | 🟢 Recuperação | Fácil | **Baixa** |
| 14 | GLB sem compressão | 🟢 Performance | Média | **Baixa** |

---

> [!TIP]
> Quer que eu implemente automaticamente todas as correções de **prioridade Imediata e Alta**? São mudanças cirúrgicas e não quebram nenhuma funcionalidade existente.
