/**
 * @fileoverview Configurações Centrais do Jogo
 */

const BASE_CONFIG = {
    // ==========================================
    // CONFIGURAÇÕES DE DIFICULDADE (EDITE AQUI)
    // ==========================================
    difficulty: {
        easy: {
            shipCount: 5, // Quantidade de navios
            multipliers: [1.5, 2.5, 5.0, 10.0, 20.0]
        },
        medium: {
            shipCount: 10, // Quantidade de navios
            multipliers: [2.0, 5.0, 15.0]
        },
        hard: {
            shipCount: 2, // Quantidade de navios
            multipliers: [10.0, 50.0]
        }
    },

    // Escolha o nível: 'easy', 'medium' ou 'hard'
    currentDifficulty: 'medium',

    // ==========================================
    // CONFIGURAÇÕES TÉCNICAS
    // ==========================================
    gridSize: 10,
    cellSize: 3,
    initialBalance: 1000,
    goldDroneChance: 0.15,
    cinematicSlowdown: 1.8,

    // MODO DEBUG (Mostra os navios no tabuleiro para teste)
    // ⚠️ NUNCA deixar true em produção — expõe posição dos navios do adversário!
    debugShowShips: false,

    // ==========================================
    // CALIBRAGEM DO CENÁRIO (MODIFICAR PARA ENCAIXAR)
    // ==========================================
    terrainSettings: {
        x: 100, // EIXO X (Positivo = Vai para a DIREITA / Negativo = Vai para a ESQUERDA)
        y: 0,  // EIXO Y (Positivo = Vai para CIMA / Negativo = Vai para BAIXO)
        z: 40,  // EIXO Z (Positivo = Vem na SUA DIREÇÃO / Negativo = Vai lá para TRÁS)
        scale: 0.15, // Tamanho do seu modelo (Para dobrar: 2.0 / Para ficar pela metade: 0.5)
        rotationY: Math.PI / 1.30 // rotação do modelo em radianos (opcional)
    }
};

// Exportar para uso global
window.GAME_CONFIG_BASE = BASE_CONFIG;
