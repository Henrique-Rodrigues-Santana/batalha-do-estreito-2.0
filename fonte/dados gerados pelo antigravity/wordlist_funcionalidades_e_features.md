# 📋 Wordlist Completa de Funcionalidades & Features
## Batalha do Estreito 2.0 — Especificação Funcional & Backlog de Engenharia

---

## 📑 Índice de Categorias
1. [Economia & Monetização (Marketplace, Rake, Ads Premiados)](#1-economia--monetização)
2. [Motor de Inteligência Artificial & Modos Solo](#2-motor-de-inteligência-artificial--modos-solo)
3. [Multiplayer, Matchmaking & Salas](#3-multiplayer-matchmaking--salas)
4. [Infraestrutura PWA, Mobile & Performance](#4-infraestrutura-pwa-mobile--performance)
5. [Segurança, Anti-Cheat & Resiliência](#5-segurança-anti-cheat--resiliência)
6. [Game Feel, Cinemática 3D & Efeitos](#6-game-feel-cinemática-3d--efeitos)
7. [Engajamento Social, Viralidade & Retenção](#7-engajamento-social-viralidade--retenção)
8. [Painel Administrativo & Gestão](#8-painel-administrativo--gestão)

---

## 1. Economia & Monetização

| ID | Feature / Termo | Descrição Técnica & Regra de Negócio | Status |
|---|---|---|---|
| **ECO-01** | `HOUSE_COMMISSION_RAKE` | Retenção fixa de **10%** pela casa sobre o pote acumulado de toda aposta em partida PvP ou PvAI. Ex: 2 apostas de 1.000 moedas = Pote de 2.000. Vencedor recebe 1.800 moedas; 200 moedas são computadas como receita líquida da casa na tabela `house_revenue`. | ✅ Implementado |
| **ECO-02** | `INITIAL_WELCOME_BONUS` | Novos cadastros recebem automaticamente **1.000 moedas** gratuitas para iniciar jogando sem necessidade de compra imediata. | ✅ Implementado |
| **ECO-03** | `DAILY_LOGIN_BONUS` | Recompensa de **+200 moedas** a cada 24 horas (`last_daily_bonus`), incentivando retorno diário com notificação toast e card dedicado. | ✅ Implementado |
| **ECO-04** | `REWARDED_VIDEO_ADS` | **Troca de Moedas por Anúncios**: Jogador assiste vídeo de **15 segundos** e recebe instantaneamente **+200 moedas**. Cooldown de 60s entre exibições para prevenção de bots. Disponível no Marketplace e como "Ressuscitar" na tela de derrota com saldo zerado. | 🚀 Especificado |
| **ECO-05** | `PIX_COIN_PACKAGES` | Pacotes de moedas escalonados no Marketplace: R$ 5,00 (1.000 moedas), R$ 20,00 (5.500 moedas / +10%), R$ 50,00 (17.000 moedas / Mais Popular), R$ 150,00 (60.000 moedas / +20%). | ✅ Implementado |
| **ECO-06** | `TRANSACTION_LEDGER` | Tabela `transactions` com rastreamento imutável de todas as movimentações financeiras (`bonus`, `daily_bonus`, `bet`, `win`, `ad_reward`, `purchase`, `rake`). | ✅ Implementado |
| **ECO-07** | `WALLET_REALTIME_HUD` | Indicador flutuante no topo direito exibindo saldo formatado (`💰 1.200`) com atualização em tempo real via Socket.io (`balance_update`) e botão de recarga rápida `+`. | ✅ Implementado |
| **ECO-08** | `COSMETIC_STORE` | Venda de skins exclusivas de drones, camuflagens de navios e trilhas de explosão através de saldo de moedas acumulado. | ⏳ Backlog |

---

## 2. Motor de Inteligência Artificial & Modos Solo

| ID | Feature / Termo | Descrição Técnica & Regra de Negócio | Status |
|---|---|---|---|
| **IA-01** | `AI_EASY_MODE` | **Nível Fácil**: Disparos puramente randômicos com taxa de erro alta, ideal para iniciantes testarem posicionamento. | ✅ Implementado |
| **IA-02** | `AI_MEDIUM_MODE` | **Nível Médio**: Modo Caçador (*Hunt Mode*). Ao acertar uma célula, enfileira células adjacentes (N, S, L, O) para liquidar o navio completo. | ✅ Implementado |
| **IA-03** | `AI_HARD_MODE` | **Nível Difícil**: Heatmap probabilístico combinado com estratégia de paridade em xadrez e perseguição vetorial linear. Dificuldade de nível torneio. | ✅ Implementado |
| **IA-04** | `AI_BET_MATCHES` | Partidas apostadas contra a IA onde o jogador escolhe aposta e dificuldade. Vitória credita o pote deduzido o rake da casa de 10%. | ✅ Implementado |
| **IA-05** | `BOT_FALLBACK_QUEUE` | Pareamento automático com Bot intermediário se a fila de matchmaking exceder **12 segundos** sem oponentes humanos. | ✅ Implementado |
| **IA-06** | `AI_CAMPAIGN_CHAPTERS` | Modo campanha com 10 missões progressivas (Estreito de Ormuz, Babilônia, Mar Vermelho, etc.) com frotas com handicap. | ⏳ Backlog |

---

## 3. Multiplayer, Matchmaking & Salas

| ID | Feature / Termo | Descrição Técnica & Regra de Negócio | Status |
|---|---|---|---|
| **NET-01** | `QUICK_MATCH_1CLICK` | Fila de busca rápida baseada em pontos de ELO e faixa de aposta correspondente. | ✅ Implementado |
| **NET-02** | `CUSTOM_ROOMS_LOBBY` | Criação de salas personalizadas com código alfanumérico de 6 dígitos e valor de aposta customizável. | ✅ Implementado |
| **NET-03** | `RECONNECT_SYNC_STATE` | Reconexão transparente em até **30 segundos** após queda de sinal, sincronizando tabuleiros, frota restante e turno ativo. | ✅ Implementado |
| **NET-04** | `ELO_RANKING_LADDER` | Sistema de classificação ELO (+25 pts vitória / -15 pts derrota) com cálculo de Win Streaks e tabela Top 50 global. | ✅ Implementado |
| **NET-05** | `TURN_TIMEOUT_TIMER` | Cronômetro de 20s por turno. Passagem automática de vez ao estourar o tempo para evitar abandono passivo (*rope stalling*). | ✅ Implementado |
| **NET-06** | `TACTICAL_IN_GAME_CHAT` | Chat em tempo real dentro da sala com sanitização rigorosa anti-XSS e registro de horário. | ✅ Implementado |
| **NET-07** | `WHATSAPP_DEEP_LINK` | Geração de link direto para WhatsApp (`/join/:roomCode`) permitindo entrar na sala com 1 clique no celular. | ⏳ Backlog |

---

## 4. Infraestrutura PWA, Mobile & Performance

| ID | Feature / Termo | Descrição Técnica & Regra de Negócio | Status |
|---|---|---|---|
| **PWA-01** | `PWA_STANDALONE_MANIFEST` | `manifest.json` configurado com ícones 192px/512px, tema escuro tático (`#050b14`), orientação livre e modo `standalone` sem barra do navegador. | ✅ Implementado |
| **PWA-02** | `SERVICE_WORKER_CACHING` | `sw.js` com estratégia híbrida: Cache-First para modelos 3D (`.glb`), imagens, áudio e bibliotecas CDN; Network-Only para API e WebSockets. | ✅ Implementado |
| **PWA-03** | `INSTALL_BANNER_PROMPT` | Banner nativo inteligente com evento `beforeinstallprompt` convidando o usuário a instalar o ícone direto na tela inicial. | ✅ Implementado |
| **PWA-04** | `100DVH_MOBILE_VIEWPORT` | Correção para barras dinâmicas do Safari iOS e Chrome Android usando `height: 100dvh` e `safe-area-inset`. | ✅ Implementado |
| **PWA-05** | `TOUCH_RAYCAST_OPTIMIZATION` | Detecção de toque mobile com bloqueio de arraste acidental (distância < 15px) e limitação de `pixelRatio` a 1.5x para economizar bateria e evitar superaquecimento. | ✅ Implementado |
| **PWA-06** | `ORIENTATION_LOCK_OVERLAY` | Overlay tático avisando para girar o celular em telas muito estreitas para melhor visualização do tabuleiro 3D. | ✅ Implementado |

---

## 5. Segurança, Anti-Cheat & Resiliência

| ID | Feature / Termo | Descrição Técnica & Regra de Negócio | Status |
|---|---|---|---|
| **SEC-01** | `ANTI_CHEAT_FLEET_VALIDATION` | Validação estrita no servidor do posicionamento de navios: exatamente 5 navios, tamanhos [5, 4, 3, 3, 2], alinhamento contíguo horizontal/vertical e sem sobreposição. | ✅ Implementado |
| **SEC-02** | `ANTI_XSS_INPUT_SANITIZATION` | Sanitização obrigatória com escape de caracteres HTML (`&`, `<`, `>`, `"`, `'`) em nomes de usuário, emails e mensagens de chat. | ✅ Implementado |
| **SEC-03** | `RATE_LIMIT_BRUTEFORCE` | Middleware de Rate Limiting (10 requisições/minuto por IP) nas rotas `/api/login` e `/api/register`. | ✅ Implementado |
| **SEC-04** | `ENV_SECRETS_MANAGEMENT` | Remoção de segredos hardcoded e adoção de `.env` para `JWT_SECRET`, `PORT`, `HOUSE_COMMISSION_PERCENT`, etc. | ✅ Implementado |
| **SEC-05** | `AUTO_DIR_SQLITE_CREATION` | Criação automática da pasta `database/` no startup para evitar falhas em deploys limpos de VPS. | ✅ Implementado |
| **SEC-06** | `GRACEFUL_SHUTDOWN_PM2` | Tratamento de sinais `SIGINT` e `SIGTERM` notificando jogadores conectados e fechando conexões do banco de forma segura. | ✅ Implementado |

---

## 6. Game Feel, Cinemática 3D & Efeitos

| ID | Feature / Termo | Descrição Técnica & Regra de Negócio | Status |
|---|---|---|---|
| **GFX-01** | `DRONE_KAMIKAZE_DIVE` | Voo balístico 3D do Drone Shahed-136 em direção às coordenadas atacadas com desaceleração e explosão de impacto. | ✅ Implementado |
| **GFX-02** | `DYNAMIC_SEA_SIMULATION` | Malha de água oceânica com shader reflexivo e névoa volumétrica no pôr do sol. | ✅ Implementado |
| **GFX-03** | `TACTICAL_FLEET_HUD` | Barra de integridade da frota exibindo status de cada embarcação em tempo real com blocos de dano e ícone de naufrágio. | ✅ Implementado |
| **GFX-04** | `FPV_ACTION_CAM` | Câmera em 1ª pessoa fixada na cauda do drone em disparos fatais (*Kill Cam*). | ⏳ Backlog |
| **GFX-05** | `HAPTIC_VIBRATION_FEEDBACK` | Vibração nativa do celular (`navigator.vibrate`) em momentos de impacto e tiro inimigo recebido. | ⏳ Backlog |

---

## 7. Engajamento Social, Viralidade & Retenção

| ID | Feature / Termo | Descrição Técnica & Regra de Negócio | Status |
|---|---|---|---|
| **SOC-01** | `WIN_FEED_TICKER` | Faixa no menu exibindo vitórias e lucros recentes de outros jogadores em tempo real para gerar efeito FOMO. | ⏳ Backlog |
| **SOC-02** | `TACTICAL_VOICE_EMOTES` | Botões de áudio rápidos durante a batalha (*"Alvo avistado!"*, *"Fogo cruzado!"*, *"Tente na próxima!"*). | ⏳ Backlog |
| **SOC-03** | `MILITARY_BADGES_RANKS` | Títulos honoríficos desbloqueáveis por conquistas: *Ás dos Drones*, *Inafundável*, *Predador Noturno*. | ⏳ Backlog |
| **SOC-04** | `STREAK_BONUS_MULTIPLIER` | Multiplicador de moedas por vitórias consecutivas (ex: 3 vitórias = +10% bônus no pote). | ⏳ Backlog |

---

## 8. Painel Administrativo & Gestão

| ID | Feature / Termo | Descrição Técnica & Regra de Negócio | Status |
|---|---|---|---|
| **ADM-01** | `HOUSE_REVENUE_METRICS` | Endpoint `/api/admin/revenue` com total de comissão acumulada, número de partidas realizadas e ticket médio por jogo. | ✅ Implementado |
| **ADM-02** | `AAPANEL_PM2_DEPLOY_SPEC` | Configuração validada para VPS rodando Node.js, PM2, SQLite e Nginx Reverse Proxy com SSL Let's Encrypt. | ✅ Implementado |
| **ADM-03** | `CRON_BACKUP_SQLITE` | Rotina automatizada de backup diário do arquivo `games.db` sem parada de serviço. | ✅ Implementado |
