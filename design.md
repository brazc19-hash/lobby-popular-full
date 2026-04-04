# Lobby Popular — Design Document

## Conceito Visual

O aplicativo deve transmitir **confiança, seriedade e acessibilidade cívica**. O visual é inspirado em portais governamentais modernos e apps de participação cidadã, com uma linguagem limpa e sóbria.

## Paleta de Cores

| Token       | Light                | Dark                 | Uso                        |
|-------------|----------------------|----------------------|----------------------------|
| primary     | `#1A3A6B` (azul-marinho) | `#2E5FAA`        | Ações principais, botões   |
| secondary   | `#1B7A4A` (verde-cívico) | `#28A86A`        | Apoios, sucesso, destaque  |
| accent      | `#F5A623` (âmbar)    | `#F5A623`            | Alertas, badges, urgência  |
| background  | `#F4F6FA`            | `#0F1923`            | Fundo das telas            |
| surface     | `#FFFFFF`            | `#1A2535`            | Cards, modais              |
| foreground  | `#1C2B3A`            | `#E8EDF5`            | Texto principal            |
| muted       | `#6B7A8D`            | `#8A9BB0`            | Texto secundário           |
| border      | `#D8E0EC`            | `#2A3A50`            | Bordas, divisores          |

## Lista de Telas

### 1. Home (Feed Principal)
- **Conteúdo**: Feed de lobbys em destaque, lobbys recentes, notícias do Congresso
- **Funcionalidade**: Scroll infinito, filtro por categoria (Nacional/Local), busca
- **Layout**: Header com logo + busca, cards de lobby com título, categoria, apoiadores e status

### 2. Explorar (Mapa Interativo)
- **Conteúdo**: Mapa do Brasil com marcadores de lobbys locais ativos
- **Funcionalidade**: Zoom, tap em marcador abre popup com título e apoiadores, filtro por estado
- **Layout**: Mapa em tela cheia, FAB de filtro, bottom sheet ao tocar marcador

### 3. Lobbys (Lista Completa)
- **Conteúdo**: Lista de todos os lobbys com filtros por categoria, status, estado
- **Funcionalidade**: Filtro, ordenação por apoiadores/data, busca por texto
- **Layout**: Tabs "Nacional" / "Local", FlatList de cards

### 4. Comunidades
- **Conteúdo**: Lista de comunidades criadas por usuários
- **Funcionalidade**: Entrar/sair de comunidade, criar nova comunidade
- **Layout**: Grid de cards de comunidade com avatar, nome, membros e tema

### 5. Detalhe do Lobby
- **Conteúdo**: Título, descrição, objetivo, base legal (artigo da CF), categoria, localização (se local), apoiadores, status
- **Funcionalidade**: Apoiar lobby, compartilhar, ver comunidades aliadas, comentários
- **Layout**: Hero com título e badge de categoria, seção de base legal em destaque, botão "Apoiar" fixo no rodapé

### 6. Detalhe da Comunidade
- **Conteúdo**: Nome, descrição, membros, lobbys aliados, fórum de posts
- **Funcionalidade**: Entrar/sair, criar post, comentar, aliar a lobby
- **Layout**: Header com banner e info, tabs "Fórum" / "Lobbys Aliados" / "Membros"

### 7. Base Legal (Constituição)
- **Conteúdo**: Artigos da Constituição Federal organizados por tema
- **Funcionalidade**: Busca por artigo ou tema, selecionar artigo para usar em lobby
- **Layout**: Lista de artigos com número, título e resumo didático

### 8. Criar Lobby
- **Conteúdo**: Formulário multi-step: (1) Tipo, (2) Detalhes, (3) Base Legal, (4) Localização (se local)
- **Funcionalidade**: Validação de base legal obrigatória, seleção de artigo da CF, mapa para pin de localização
- **Layout**: Stepper no topo, formulário limpo, botão "Próximo" / "Publicar"

### 9. Notícias
- **Conteúdo**: Feed de notícias sobre legislação, Congresso e lobbys ativos
- **Funcionalidade**: Links para notícias externas, filtro por tema
- **Layout**: Cards de notícia com imagem, título, fonte e data

### 10. Perfil / Autenticação
- **Conteúdo**: Dados do usuário, lobbys criados, comunidades, apoios dados
- **Funcionalidade**: Login/logout, editar perfil, ver histórico
- **Layout**: Avatar, nome, estatísticas, lista de atividades

### 11. Painel Admin (apenas admins)
- **Conteúdo**: Lobbys pendentes de revisão, lobbys reportados
- **Funcionalidade**: Aprovar, rejeitar, banir lobby
- **Layout**: Lista de itens com ações rápidas

## Fluxos Principais

### Criar um Lobby Local
1. Usuário toca "+" na Home → Tela "Criar Lobby"
2. Seleciona tipo "Local"
3. Preenche título, descrição, objetivo
4. Seleciona artigo da CF como base legal (obrigatório)
5. Posiciona marcador no mapa (obrigatório para Local)
6. Confirma e publica → redireciona para detalhe do lobby

### Apoiar um Lobby
1. Usuário vê card de lobby no feed
2. Toca no card → Tela de Detalhe
3. Toca botão "Apoiar" → contador incrementa
4. Feedback visual (haptic + animação)

### Entrar em uma Comunidade e Comentar
1. Usuário acessa aba "Comunidades"
2. Toca em uma comunidade → Detalhe
3. Toca "Entrar" → membro confirmado
4. Vai para aba "Fórum" → cria post ou comenta

## Navegação

```
TabBar:
  - Home (house.fill)
  - Explorar/Mapa (map.fill)
  - Criar (+) (plus.circle.fill) — botão central destacado
  - Comunidades (person.3.fill)
  - Perfil (person.fill)
```

## Componentes Reutilizáveis

- `LobbyCard` — card de lobby com título, categoria, apoiadores, status
- `CommunityCard` — card de comunidade com avatar, nome, membros
- `LegalBadge` — badge com artigo da CF citado
- `SupportButton` — botão de apoio com contador animado
- `CategoryBadge` — badge "Nacional" (azul) ou "Local" (verde)
- `NewsCard` — card de notícia com imagem e fonte
- `ArticleItem` — item de artigo da CF com número e resumo
