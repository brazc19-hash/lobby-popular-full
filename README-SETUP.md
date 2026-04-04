# Lobby Popular — Guia de Configuração Local

## Pré-requisitos

- Node.js 22+
- pnpm 9+
- Banco de dados MySQL

## Instalação

```bash
# 1. Instalar dependências
pnpm install

# 2. Copiar o arquivo de variáveis de ambiente
cp .env.example .env
# Preencha os valores no .env conforme descrito abaixo

# 3. Rodar as migrações do banco de dados
pnpm db:push

# 4. Iniciar o servidor de desenvolvimento
pnpm dev
```

## Variáveis de Ambiente (.env)

| Variável | Descrição | Obrigatória |
|---|---|---|
| `DATABASE_URL` | URL de conexão MySQL (ex: `mysql://user:pass@host:3306/dbname`) | Sim |
| `JWT_SECRET` | Chave secreta para tokens JWT (string longa e aleatória) | Sim |
| `VITE_APP_ID` | ID único do app (ex: `lobby-popular-prod`) | Sim |
| `OAUTH_SERVER_URL` | URL do servidor OAuth do Manus (fornecido pela plataforma) | Sim |
| `OWNER_OPEN_ID` | OpenID do administrador principal | Não |
| `BUILT_IN_FORGE_API_URL` | URL da API de IA (fornecido pela plataforma Manus) | Não |
| `BUILT_IN_FORGE_API_KEY` | Chave da API de IA (fornecido pela plataforma Manus) | Não |

## Estrutura do Projeto

```
app/           → Telas do app (Expo Router)
server/        → Backend Express + tRPC
  _core/       → Infraestrutura (auth, db, env, push, oauth)
  db.ts        → Funções de acesso ao banco de dados
  routers.ts   → Rotas tRPC (auth, lobbies, feed, etc.)
shared/        → Tipos e constantes compartilhados
drizzle/       → Schema e migrações do banco de dados
hooks/         → Hooks React Native
components/    → Componentes reutilizáveis
constants/     → Constantes e tema
lib/           → Utilitários e providers
scripts/       → Scripts auxiliares (seed, QR code, etc.)
```

## Arquivos Importantes

- `server/_core/env.ts` — variáveis de ambiente do servidor
- `server/_core/oauth.ts` — autenticação OAuth (Manus + Gov.br)
- `server/_core/push.ts` — notificações push via Expo
- `server/db.ts` — todas as funções de banco de dados
- `server/routers.ts` — todas as rotas tRPC
- `shared/_core/errors.ts` — tipos de erro compartilhados
- `shared/types.ts` — tipos TypeScript compartilhados
- `drizzle/schema.ts` — schema completo do banco de dados

## Rodar no TestFlight

1. Configure as variáveis de ambiente no painel do Manus (Settings → Secrets)
2. Crie um checkpoint no Manus
3. Clique em **Publish** no Manus para gerar o build
4. Use `eas submit --platform ios` para enviar ao TestFlight
