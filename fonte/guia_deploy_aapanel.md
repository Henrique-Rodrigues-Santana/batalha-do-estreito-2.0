# 🚀 Guia de Deploy — Batalha do Estreito 2.0

## VPS com aaPanel (Node.js + PM2 + Nginx)

---

## Pré-requisitos

| Item         | Versão Mínima |
|-------------|---------------|
| Node.js     | 18.x LTS      |
| npm         | 9.x+          |
| Nginx       | 1.20+         |
| aaPanel      | 7.x           |

---

## 1. Configurar Node.js no aaPanel

1. No painel aaPanel, vá em **App Store → Installed**
2. Instale **Node.js Version Manager**
3. Instale Node.js `v18.x` ou superior
4. Instale **PM2** globalmente:

```bash
npm install pm2 -g
```

---

## 2. Upload do Projeto

1. Crie o diretório no servidor:
```bash
mkdir -p /www/wwwroot/batalha-estreito
```

2. Envie os arquivos da pasta `fonte/` via SFTP ou painel de arquivos do aaPanel

3. Instale dependências:
```bash
cd /www/wwwroot/batalha-estreito
npm install --production
```

---

## 3. Criar arquivo `.env`

```bash
cp .env.example .env
nano .env
```

Configure as variáveis para produção:
```env
PORT=3000
NODE_ENV=production

# OBRIGATÓRIO: gere com o comando abaixo
# node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=SUA_CHAVE_SECRETA_FORTE_AQUI

# Seu domínio (sem barra no final)
ALLOWED_ORIGINS=https://seudominio.com.br

# ID(s) dos usuários administradores (separados por vírgula)
ADMIN_USER_IDS=1

HOUSE_COMMISSION_PERCENT=10
DAILY_BONUS_AMOUNT=200
INITIAL_COINS=1000
```

---

## 4. Iniciar com PM2 (via ecosystem.config.js)

```bash
cd /www/wwwroot/batalha-estreito

# Criar pasta de logs (necessária para o PM2)
mkdir -p logs

# Iniciar usando o arquivo de configuração
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

### Comandos úteis PM2:
```bash
pm2 logs batalha-estreito    # Ver logs em tempo real
pm2 restart batalha-estreito # Reiniciar
pm2 stop batalha-estreito    # Parar
pm2 monit                    # Monitor de recursos
pm2 describe batalha-estreito # Detalhes da instância
```

---

## 5. Configurar Nginx como Reverse Proxy

No aaPanel → **Website → Add Site**:
- Domain: `seudominio.com.br`
- SSL: Ativar Let's Encrypt (HTTPS obrigatório para PWA!)

Depois, edite a configuração do site e adicione/substitua:

```nginx
server {
    listen 80;
    listen 443 ssl http2;
    server_name seudominio.com.br;

    # SSL (Let's Encrypt)
    ssl_certificate /www/server/panel/vhost/cert/seudominio.com.br/fullchain.pem;
    ssl_certificate_key /www/server/panel/vhost/cert/seudominio.com.br/privkey.pem;

    # PWA Headers
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";
    add_header X-XSS-Protection "1; mode=block";
    add_header Service-Worker-Allowed "/";

    # Proxy para Node.js
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts para WebSocket
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }

    # Cache para assets estáticos
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|glb|gltf|woff2|mp3|ogg|webp|avif)$ {
        proxy_pass http://127.0.0.1:3000;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript model/gltf-binary;
    gzip_min_length 256;

    # Redirect HTTP → HTTPS (obrigatório para PWA)
    if ($scheme = http) {
        return 301 https://$host$request_uri;
    }
}
```

---

## 6. Verificar que tudo funciona

```bash
# Testar healthcheck
curl https://seudominio.com.br/health

# Verificar PM2
pm2 list

# Verificar logs
pm2 logs batalha-estreito --lines 50
```

---

## 7. Backup do SQLite

Configure um cron no aaPanel para backup diário:

```bash
# Cron job (diário às 03:00)
0 3 * * * cp /www/wwwroot/batalha-estreito/database/games.db /www/backup/batalha-estreito/games_$(date +\%Y\%m\%d).db
```

---

## Checklist Final

- [ ] `.env` com `JWT_SECRET` forte (gerado com `crypto.randomBytes`)
- [ ] `.env` com `ALLOWED_ORIGINS` apontando para seu domínio
- [ ] `.env` com `ADMIN_USER_IDS` configurado
- [ ] `NODE_ENV=production` no `.env`
- [ ] Pasta `logs/` criada no servidor
- [ ] PM2 iniciado com `ecosystem.config.js` e configurado para auto-restart
- [ ] Nginx com SSL (HTTPS) — **obrigatório para PWA funcionar**
- [ ] WebSocket funcionando (testar chat e matchmaking)
- [ ] PWA instalável no celular
- [ ] Backup do SQLite configurado (cron diário)
- [ ] Domínio apontando para o IP do VPS
- [ ] `debugShowShips: false` em `public/config.js` (**crítico!**)
- [ ] `sw.js` com `CACHE_VERSION` atualizado para a data do deploy

---

## Estrutura no Servidor

```
/www/wwwroot/batalha-estreito/
├── .env                    # Variáveis de ambiente
├── server.js               # Servidor principal
├── package.json            # Dependências
├── database/               # SQLite (auto-criado)
│   └── games.db
└── public/                 # Frontend
    ├── index.html
    ├── style.css
    ├── script.js
    ├── engine3d.js
    ├── config.js
    ├── manifest.json       # PWA
    ├── sw.js               # Service Worker
    └── assets/
        ├── icons/
        └── models/
```
