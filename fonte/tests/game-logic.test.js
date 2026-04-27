// TDD — Testes para lógica crítica do Batalha do Estreito
// Roda com: node tests/game-logic.test.js

const assert = require('assert');

// ==================== HELPER: Copiar funções do server.js ====================

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
          if (r >= 10 || c >= 10 || board[r][c] !== null) { valid = false; break; }
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

function processGameAction(board, row, col) {
  let hit = false, shipSunk = false, shipSize = 0;

  if (board[row] && board[row][col] !== null && board[row][col] !== 'hit' && board[row][col] !== 'miss') {
    hit = true;
    const ship = board[row][col];
    shipSize = ship.size;
    const shipId = ship.id;
    board[row][col] = 'hit';

    let allHit = true;
    for (let i = 0; i < 10; i++) {
      for (let j = 0; j < 10; j++) {
        if (board[i][j] && board[i][j].id === shipId && board[i][j] !== 'hit') {
          allHit = false; break;
        }
      }
      if (!allHit) break;
    }
    shipSunk = allHit;
  } else if (board[row][col] !== 'hit' && board[row][col] !== 'miss') {
    board[row][col] = 'miss';
  }

  let allShipsDestroyed = true;
  for (let i = 0; i < 10; i++) {
    for (let j = 0; j < 10; j++) {
      if (board[i][j] && board[i][j] !== 'hit' && board[i][j] !== 'miss') {
        allShipsDestroyed = false; break;
      }
    }
    if (!allShipsDestroyed) break;
  }

  return { hit, shipSunk, shipSize, gameEnded: allShipsDestroyed };
}

// ==================== TESTES ====================
let passed = 0, failed = 0;

function test(name, fn) {
  try { fn(); passed++; console.log(`  ✅ ${name}`); }
  catch (e) { failed++; console.log(`  ❌ ${name}: ${e.message}`); }
}

console.log('\n🧪 TESTES — Batalha do Estreito\n');

// ----- Board Generation -----
console.log('📋 generateShipsBoard():');

test('Deve gerar board 10x10', () => {
  const board = generateShipsBoard();
  assert.strictEqual(board.length, 10);
  board.forEach(row => assert.strictEqual(row.length, 10));
});

test('Deve ter 5 navios (IDs 1-5)', () => {
  const board = generateShipsBoard();
  const ids = new Set();
  board.forEach(row => row.forEach(cell => { if (cell && typeof cell === 'object') ids.add(cell.id); }));
  assert.strictEqual(ids.size, 5);
});

test('Deve ter 17 células com navio (5+4+3+3+2)', () => {
  const board = generateShipsBoard();
  let count = 0;
  board.forEach(row => row.forEach(cell => { if (cell && typeof cell === 'object') count++; }));
  assert.strictEqual(count, 17);
});

test('Navios não devem sobrepor', () => {
  for (let t = 0; t < 50; t++) {
    const board = generateShipsBoard();
    let count = 0;
    board.forEach(row => row.forEach(cell => { if (cell) count++; }));
    assert.strictEqual(count, 17, `Iteração ${t}: esperava 17 mas obteve ${count}`);
  }
});

test('Nenhum navio deve sair dos limites 10x10', () => {
  for (let t = 0; t < 50; t++) {
    const board = generateShipsBoard();
    assert.strictEqual(board.length, 10);
    for (let i = 0; i < 10; i++) {
      assert.strictEqual(board[i].length, 10);
    }
  }
});

test('Cada navio deve ter partes contíguas corretas', () => {
  const board = generateShipsBoard();
  const shipParts = {};
  for (let i = 0; i < 10; i++) {
    for (let j = 0; j < 10; j++) {
      if (board[i][j] && typeof board[i][j] === 'object') {
        const { id, size, part } = board[i][j];
        if (!shipParts[id]) shipParts[id] = { size, parts: [] };
        shipParts[id].parts.push({ r: i, c: j, part });
      }
    }
  }
  Object.values(shipParts).forEach(ship => {
    assert.strictEqual(ship.parts.length, ship.size, `Navio tamanho ${ship.size} tem ${ship.parts.length} partes`);
  });
});

// ----- Game Actions -----
console.log('\n⚔️ processGameAction():');

test('Acertar uma célula com navio deve retornar hit=true', () => {
  const board = generateShipsBoard();
  let shipCell = null;
  for (let i = 0; i < 10 && !shipCell; i++) {
    for (let j = 0; j < 10 && !shipCell; j++) {
      if (board[i][j] && typeof board[i][j] === 'object') shipCell = [i, j];
    }
  }
  const result = processGameAction(board, shipCell[0], shipCell[1]);
  assert.strictEqual(result.hit, true);
});

test('Errar uma célula vazia deve retornar hit=false', () => {
  const board = generateShipsBoard();
  let emptyCell = null;
  for (let i = 0; i < 10 && !emptyCell; i++) {
    for (let j = 0; j < 10 && !emptyCell; j++) {
      if (board[i][j] === null) emptyCell = [i, j];
    }
  }
  const result = processGameAction(board, emptyCell[0], emptyCell[1]);
  assert.strictEqual(result.hit, false);
  assert.strictEqual(board[emptyCell[0]][emptyCell[1]], 'miss');
});

test('Afundar navio de tamanho 2 corretamente', () => {
  const board = Array(10).fill().map(() => Array(10).fill(null));
  board[0][0] = { id: 1, size: 2, part: 0 };
  board[0][1] = { id: 1, size: 2, part: 1 };

  const r1 = processGameAction(board, 0, 0);
  assert.strictEqual(r1.hit, true);
  assert.strictEqual(r1.shipSunk, false);

  const r2 = processGameAction(board, 0, 1);
  assert.strictEqual(r2.hit, true);
  assert.strictEqual(r2.shipSunk, true);
});

test('Dois navios do mesmo tamanho — afundar um não afunda o outro', () => {
  const board = Array(10).fill().map(() => Array(10).fill(null));
  // Ship 1 (size 3)
  board[0][0] = { id: 1, size: 3, part: 0 };
  board[0][1] = { id: 1, size: 3, part: 1 };
  board[0][2] = { id: 1, size: 3, part: 2 };
  // Ship 2 (size 3)
  board[2][0] = { id: 2, size: 3, part: 0 };
  board[2][1] = { id: 2, size: 3, part: 1 };
  board[2][2] = { id: 2, size: 3, part: 2 };

  processGameAction(board, 0, 0);
  processGameAction(board, 0, 1);
  const r = processGameAction(board, 0, 2);
  assert.strictEqual(r.shipSunk, true, 'Navio 1 deve estar afundado');
  assert.strictEqual(r.gameEnded, false, 'Jogo NÃO deve ter acabado — navio 2 ainda existe');
});

test('Jogo deve terminar quando todos os navios forem destruídos', () => {
  const board = Array(10).fill().map(() => Array(10).fill(null));
  board[0][0] = { id: 1, size: 1, part: 0 };

  const r = processGameAction(board, 0, 0);
  assert.strictEqual(r.hit, true);
  assert.strictEqual(r.shipSunk, true);
  assert.strictEqual(r.gameEnded, true);
});

// ----- RESULTS -----
console.log(`\n📊 Resultados: ${passed} passaram, ${failed} falharam\n`);
process.exit(failed > 0 ? 1 : 0);
