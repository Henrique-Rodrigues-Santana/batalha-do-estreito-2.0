# 🏛️ Análise Arquitetural: Banco de Dados, PIX e Unificação

Esta análise aborda a infraestrutura necessária para transformar o Batalha do Estreito 2.0 de um jogo demonstrativo para uma plataforma de apostas com dinheiro real via PIX.

---

## 1. O Melhor e Mais Simples Banco de Dados: PostgreSQL

Atualmente, o backend (`fonte/server.js`) utiliza **SQLite**. Embora excelente para testes locais, o SQLite armazena os dados em um arquivo local (`games.db`), o que é perigoso para escalar e impossível de manter em servidores serverless (como Vercel/Heroku) sem perdas de dados.

**Recomendação Absoluta: PostgreSQL**
Para sistemas que envolvem dinheiro real, apostas e webhooks de pagamento, o PostgreSQL é a escolha padrão da indústria.

*   **Por que não NoSQL (MongoDB)?** Porque transações financeiras exigem consistência forte (ACID). Precisamos garantir que a subtração de moedas e o registro da aposta ocorram juntos. Se um falhar, tudo deve ser desfeito (Rollback).
*   **Qual a ferramenta mais simples?** Usar o **Prisma ORM** com PostgreSQL. Ele gera tipos automáticos para o código e torna as consultas incrivelmente simples.
*   **Hospedagem:** Supabase (oferece PostgreSQL grátis e escalável) ou Neon.tech.

---

## 2. Unificação das Aplicações (Game + Website)

O website promocional e o jogo em si já estão no caminho certo. O website em React (`website-promo`) atualmente faz requisições (ex: `/api/login`, `/api/ranking`) para o servidor Node.js (`fonte/server.js`). 

**Como unificar de vez:**
1.  **Backend Centralizado:** O servidor Node.js será a única "fonte da verdade". Ele servirá a API REST para o website e a conexão Socket.io para o jogo 3D.
2.  **Banco de Dados Único:** O PostgreSQL na nuvem será acessado pelo servidor Node.js.
3.  **Token JWT Universal:** O token gerado no login servirá tanto para navegar no dashboard do site quanto para autenticar o websocket na hora de iniciar uma partida.

---

## 3. Implementação do PIX Real (Depósitos e Saques)

Para lidar com PIX automaticamente (sem ter que conferir comprovantes à mão), precisamos de um Gateway de Pagamento. O **Mercado Pago** ou o **Asaas** são as melhores opções para o Brasil (fáceis de implementar e taxas baixas para PIX).

### 📥 Fluxo de Compra de Moedas (Depósito)
1.  O usuário clica em "Comprar 2.000 moedas (R$ 10,00)".
2.  O React envia a requisição pro backend.
3.  O backend gera uma cobrança via API do Mercado Pago e devolve o **PIX Copia e Cola / QR Code** para o React.
4.  O banco de dados salva a transação como `PENDENTE`.
5.  O usuário paga no app do banco dele.
6.  O Mercado Pago envia um **Webhook** avisando o backend: *"A cobrança X foi paga!"*.
7.  O backend atualiza a transação para `CONCLUÍDA` e adiciona as 2.000 moedas ao saldo do jogador.

### 📤 Fluxo de Saque (Withdrawal)
**Regra de Conversão:** Exemplo: 200 moedas = R$ 1,00. 
*(Significa que 1 moeda = R$ 0,005. O pote de uma aposta de 10.000 moedas vale R$ 50,00).*

1.  O usuário solicita saque de 10.000 moedas (R$ 50,00) informando sua **Chave PIX**.
2.  O backend faz validações críticas: O usuário tem saldo? As moedas foram ganhas legitimamente?
3.  O backend subtrai 10.000 moedas do saldo do jogador para impedir gastos duplos.
4.  O backend chama a API do gateway (ex: *Mercado Pago Transferências*) ordenando o envio de R$ 50,00 para a chave PIX informada.
5.  Se sucesso, a transação é marcada como concluída.

> [!WARNING]
> **Segurança de Saques:** É crucial implementar verificação humana ou limites automáticos (ex: saques até R$ 100 são automáticos, acima disso exigem aprovação do admin) para evitar que hackers zerem o caixa em caso de falha no jogo.

---

## 4. Otimização das Apostas e Segurança

Quando lidamos com dinheiro real (mesmo que convertido em moedas virtuais), a segurança das apostas muda de patamar:

1.  **Inteiros vs Decimais:** NUNCA use números decimais (float) para dinheiro no banco de dados. Armazene as moedas sempre como inteiros. (ex: R$ 10,00 = 1000 centavos).
2.  **Transações no Banco (Transactions):** Ao iniciar uma partida, o sistema precisa:
    *   Verificar se ambos os jogadores têm o saldo.
    *   Subtrair o saldo de ambos.
    *   Criar a partida.
    *   *Tudo isso deve ocorrer em uma única "Transaction" no banco. Se a internet do jogador 2 cair no milissegundo exato da criação da partida, o saldo do jogador 1 é devolvido automaticamente pelo PostgreSQL.*
3.  **Validação Autoritativa:** O backend NUNCA deve confiar no cliente (React). Se o cliente disser "Destruí o navio", o backend deve conferir no mapa em memória se o tiro realmente acertou um navio antes de encerrar a partida e pagar o pote.
4.  **A Rake da Casa (10%):** A comissão de 10% já está idealizada no código. Se dois jogadores apostam 1.000 moedas (Total 2.000), o vencedor recebe 1.800 moedas, e 200 moedas vão para a conta "receita_casa" do banco de dados.

---

## Resumo dos Próximos Passos (Plano de Ação Sugerido)

Se decidirmos seguir com esta arquitetura, os passos práticos seriam:
1. Instalar o **Prisma** e migrar o schema do SQLite atual para um modelo relacional robusto para **PostgreSQL**.
2. Criar uma conta no **Mercado Pago** (ambiente de testes/sandbox).
3. Implementar a rota de Geração de PIX e a rota recebedora de Webhooks.
4. Criar a interface no React (Modais) para Saque via PIX e exibição do QR Code de depósito.
