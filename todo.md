# Lobby Popular — TODO

## Configuração e Infraestrutura
- [x] Configurar tema de cores (azul-marinho, verde-cívico, âmbar)
- [x] Atualizar app.config.ts com nome e branding
- [x] Gerar logo do aplicativo
- [x] Instalar dependências: react-native-maps, expo-location

## Banco de Dados e Backend
- [x] Definir schema: lobbies, communities, community_members, supports, posts, comments, news_items
- [x] Criar tabela de artigos da Constituição (constitution_articles)
- [x] Rodar migração do banco de dados
- [x] Criar rotas tRPC: lobbies (CRUD, list, support)
- [x] Criar rotas tRPC: communities (CRUD, join, leave)
- [x] Criar rotas tRPC: posts e comments (CRUD)
- [x] Criar rotas tRPC: constitution_articles (list, search)
- [x] Criar rotas tRPC: news (list)
- [x] Popular dados de exemplo (3 lobbys iniciais)
- [x] Popular artigos da Constituição Federal

## Telas Principais
- [x] Tela Home (feed de lobbys + notícias)
- [x] Tela Explorar (mapa interativo com marcadores)
- [x] Tela Lobbys (lista com filtros Nacional/Local)
- [x] Tela Comunidades (grid de comunidades)
- [x] Tela Perfil / Autenticação

## Telas de Detalhe
- [x] Tela Detalhe do Lobby (base legal, apoiadores, mapa se local)
- [x] Tela Detalhe da Comunidade (fórum, lobbys aliados, membros)
- [x] Tela Base Legal (artigos da CF pesquisáveis)
- [x] Tela Notícias (feed de notícias)

## Fluxos de Criação
- [x] Tela Criar Lobby (multi-step: tipo → detalhes → base legal → localização)
- [x] Validação de base legal obrigatória
- [x] Seletor de artigo da CF
- [x] Mapa para pin de localização (lobbys locais)

## Funcionalidades
- [x] Sistema de apoio (support) a lobbys com contador
- [x] Sistema de fórum (posts e comentários) em comunidades
- [x] Entrar/sair de comunidades
- [x] Aliar comunidade a lobby
- [x] Busca de lobbys e comunidades
- [x] Filtros por categoria (Nacional/Local) e estado

## Autenticação e Papéis
- [x] Login com Manus OAuth
- [x] Proteção de rotas para usuários autenticados
- [x] Painel Admin para revisão de lobbys suspeitos
- [x] Moderação: aprovar/rejeitar lobbys

## Componentes UI
- [x] LobbyCard
- [x] CommunityCard
- [x] LegalBadge
- [x] SupportButton
- [x] CategoryBadge
- [x] NewsCard
- [x] ArticleItem
- [x] Tab bar com 5 abas (Home, Explorar, Criar, Comunidades, Perfil)

## Dados de Exemplo
- [x] Lobby 1: Alterar lei de licitações (Art. 37 CF)
- [x] Lobby 2: Redutor de velocidade na Rua Exemplo (local, com coordenadas)
- [x] Lobby 3: Aumentar verba para saúde (Art. 196 CF)
- [x] Comunidades de exemplo
- [x] Notícias de exemplo

## Testes
- [x] 23 testes unitários de API (todos passando)

## Filtros Avançados e Recomendações (v1.1)

### Filtros Avançados
- [x] Adicionar coluna `petitionCategory` na tabela lobbies (9 categorias)
- [x] Rota tRPC lobbies.list com filtros: category, petitionCategory, state, city, search
- [x] Componente FilterSheet (bottom sheet com filtros combinados)
- [x] Integrar FilterSheet na tela Home
- [x] Integrar FilterSheet na tela Explorar (mapa)
- [x] Chips de filtros ativos visíveis na tela
- [x] Atualizar dados de exemplo com petitionCategory

### Sistema de Recomendação
- [x] Tabela `user_interactions` (lobbyId, communityId, action, category, createdAt)
- [x] Tabela `user_preferences` (userId, topCategories, topStates, lastUpdated)
- [x] Rota tRPC interactions.track (registrar apoio, visualização, comentário)
- [x] Rota tRPC recommendations.lobbies (lobbies recomendados)
- [x] Rota tRPC recommendations.communities (comunidades recomendadas)
- [x] Seção "Para Você" na tela Home com lobbies recomendados
- [x] Seção "Comunidades Sugeridas" na tela Comunidades
- [x] Atualizar rotas existentes para rastrear interações automaticamente

## Comunicação em Tempo Real e Rede Social (v1.2)

### Schema e Backend
- [ ] Tabelas: community_channels, channel_messages, direct_messages, user_follows, post_media, post_polls, poll_votes
- [ ] Coluna petitionCategory nos lobbies (migração)
- [ ] Corrigir router users duplicado no routers.ts
- [ ] WebSocket server com Socket.IO para chat em tempo real
- [ ] Rotas tRPC: channels, messages, directMessages, follows, posts, polls

### Chat em Tempo Real
- [ ] Tela de chat da comunidade com canais temáticos (#debates, #mobilização, #documentos)
- [ ] Mensagens em tempo real via WebSocket
- [ ] Sistema de @menções com highlight
- [ ] Indicador de usuários online no canal

### Mensagens Diretas
- [ ] Tela de inbox (lista de conversas privadas)
- [ ] Tela de conversa direta entre dois usuários
- [ ] Notificações push para novas mensagens

### Perfis de Usuário
- [ ] Tela de perfil expandida (bio, foto, localização, interesses)
- [ ] Upload de foto de perfil
- [ ] Histórico de atividades (lobbys criados, apoiados, comunidades, posts)
- [ ] Sistema de followers (seguir/deixar de seguir)
- [ ] Feed personalizado com atividades de quem o usuário segue

### Postagens Multimídia
- [ ] Componente de criação de post com texto, imagem, vídeo, documento, enquete
- [ ] Upload de imagens (JPEG, PNG) para S3
- [ ] Incorporação de links de vídeo (YouTube, Vimeo)
- [ ] Criação de enquetes com opções e votação
- [ ] Feed geral com posts multimídia

## Perfis de Usuário (v1.3)

### Schema e Backend
- [x] Tabela `user_profiles` (bio, location, state, interests, avatarUrl)
- [x] Tabela `user_follows` (followerId, followingId, createdAt)
- [x] Tabela `activity_feed` (userId, type, targetId, targetTitle, createdAt)
- [x] Rota tRPC users.getProfile (perfil público por userId)
- [x] Rota tRPC users.updateProfile (editar perfil próprio)
- [x] Rota tRPC users.follow / users.unfollow
- [x] Rota tRPC users.followers / users.following (listas)
- [x] Rota tRPC users.activityFeed (histórico de atividades do usuário)
- [x] Rota tRPC feed.personalized (feed de atividades de quem o usuário segue)
- [x] Rota tRPC users.search (buscar usuários por nome)

### Telas
- [x] Tela Perfil Próprio (bio, foto, estatísticas, histórico, interesses)
- [x] Formulário de edição de perfil
- [x] Tela Perfil Público (de outros usuários, com botão Seguir)
- [x] Tela Seguidores / Seguindo (lista de conexões)
- [x] Seção Feed Personalizado na Home (atividades de quem segue)
- [x] Componente ActivityItem (card de atividade no feed)
- [x] Componente UserCard (card de usuário para listas)

## Comunicação Avançada e Dashboard de Lobby (v1.3)

### Schema e Backend
- [ ] Tabela `community_channels` (id, communityId, name, slug, description)
- [ ] Tabela `channel_messages` (id, channelId, userId, content, mentions, createdAt)
- [ ] Tabela `direct_messages` (id, senderId, receiverId, content, readAt, createdAt)
- [ ] Tabela `lobby_milestones` (id, lobbyId, targetCount, title, description, reachedAt)
- [ ] Tabela `lobby_timeline` (id, lobbyId, type, title, description, createdAt)
- [ ] Tabela `lobby_supporters_geo` (view/aggregate de apoios por estado)
- [ ] Coluna `goalCount`, `status`, `evidenceUrls` na tabela lobbies
- [ ] Rotas tRPC: channels.list, channels.create, channels.messages, channels.sendMessage
- [ ] Rotas tRPC: dm.conversations, dm.messages, dm.send
- [ ] Rotas tRPC: lobby.timeline, lobby.milestones, lobby.supportersGeo, lobby.updateStatus

### WebSocket (Socket.IO)
- [ ] Servidor WebSocket integrado ao Express
- [ ] Evento `join_channel` / `leave_channel`
- [ ] Evento `channel_message` (broadcast para membros do canal)
- [ ] Evento `dm_message` (entrega privada)
- [ ] Evento `mention_notification` (alerta de @menção)
- [ ] Hook `useChannelSocket` no frontend

### Telas de Chat
- [ ] Tela de canais da comunidade (lista de canais #debates, #mobilização, etc.)
- [ ] Tela de chat do canal com mensagens em tempo real
- [ ] Suporte a @menções com highlight
- [ ] Tela de inbox de mensagens diretas
- [ ] Tela de conversa direta entre dois usuários

### Dashboard do Lobby
- [ ] Contador de apoiadores com barra de progresso para meta
- [ ] Seção "Faltam X apoios para a próxima meta"
- [ ] Linha do tempo do lobby (atualizações, conquistas)
- [ ] Mapa de calor de apoios por estado (visualização geográfica)
- [ ] Lista de parlamentares alvo sugeridos por tema e localização
- [ ] Status do lobby: Mobilização / Pressão / Tramitação / Concluído
- [ ] Seção de evidências (fotos, documentos)
- [ ] Botões de ação: Compartilhar, Apoiar, Contatar parlamentar

## Módulo 4 — Pressão Popular Direta (v1.4)

- [ ] Tabela `pressure_actions` (userId, lobbyId, channel, createdAt)
- [ ] Rota tRPC pressure.track (registrar ação de pressão por canal)
- [ ] Rota tRPC pressure.stats (contador semanal por canal)
- [ ] Rota tRPC pressure.generateCard (gerar card com IA)
- [ ] Rota tRPC smartMilestones.list (listar metas inteligentes do lobby)
- [ ] Tela PressureScreen com botão único "Pressionar Agora"
- [ ] Canal WhatsApp: link wa.me com mensagem pré-formatada
- [ ] Canal E-mail: mailto com assunto e corpo pré-formatados
- [ ] Canal Twitter/X: link intent/tweet com texto e hashtag
- [ ] Canal Instagram: compartilhamento de card via expo-sharing
- [ ] Canal Telefone: exibição de número com roteiro de ligação (script)
- [ ] Contador de pressão semanal por canal
- [ ] Geração de cards de pressão com IA (problema, custo, alvo, impacto)
- [ ] Compartilhamento de card via expo-sharing
- [ ] Tabela de metas inteligentes progressivas (500, 1k, 5k, 10k, 50k apoios)
- [ ] Integração das metas inteligentes no dashboard do lobby
- [ ] Indicador de fase do lobby (Mobilização / Pressão / Tramitação / Concluído)

## Módulo 5 — Assistente Populus (IA Estratégica) (v1.5)

- [ ] Rota tRPC populus.legalAnalysis (análise jurídica com LLM)
- [ ] Rota tRPC populus.evidenceCuration (curadoria de evidências e dados)
- [ ] Rota tRPC populus.generateContent (posts, roteiros, cards para redes sociais)
- [ ] Rota tRPC populus.impactCalculator (calculadora de impacto social/financeiro)
- [ ] Rota tRPC populus.politicalScenario (análise de cenário político com probabilidade)
- [ ] Rota tRPC populus.targetParliamentarians (recomendação priorizada de parlamentares)
- [ ] Rota tRPC populus.opportunityAlerts (alertas de oportunidade na agenda do Congresso)
- [ ] Rota tRPC populus.chat (chat interativo com o assistente)
- [ ] Tela /populus/[id] com tabs: Jurídico, Evidências, Conteúdo, Impacto, Cenário Político
- [ ] Componente PopulusChat (chat interativo com o assistente)
- [ ] Botão "Assistente Populus" no dashboard do lobby
- [ ] Integração do Populus no fluxo de criação de lobby (sugestão de artigos CF)

## Módulo 6 — Congresso e Dados Legislativos (v1.6)

- [ ] Serviço de integração com API da Câmara dos Deputados (dados.camara.leg.br)
- [ ] Serviço de integração com API do Senado Federal (legis.senado.leg.br)
- [ ] Rota tRPC congress.searchBills (buscar projetos por tema/palavra-chave)
- [ ] Rota tRPC congress.billDetail (detalhe de projeto com tramitação)
- [ ] Rota tRPC congress.upcomingVotes (votações agendadas)
- [ ] Rota tRPC congress.deputyVotingHistory (histórico de votação por deputado)
- [ ] Rota tRPC congress.committees (composição de comissões)
- [ ] Rota tRPC congress.parliamentaryFronts (frentes parlamentares)
- [ ] Rota tRPC congress.partyLeaders (líderes partidários)
- [ ] Rota tRPC congress.transparencyReport (relatório de transparência do deputado)
- [ ] Rota tRPC congress.receptivityRanking (ranking de receptividade parlamentar)
- [ ] Tela de Congresso com abas: Projetos, Votações, Comissões, Transparência
- [ ] Busca de projetos por tema com resultados da API real
- [ ] Tela de detalhe de projeto com tramitação e histórico
- [ ] Seção de votações agendadas com alertas
- [ ] Mapeamento de poder: frentes parlamentares e comissões
- [ ] Relatório de transparência por deputado
- [ ] Ranking de receptividade parlamentar
- [ ] Alertas inteligentes de pautas e votações

## Módulo 7 — Plebiscitos Populares e Pautas Prioritárias (v1.7)

- [x] Tabela `lobby_plebiscites` (id, lobbyId, title, description, activatedAt, endsAt, status, yesVotes, noVotes)
- [x] Tabela `plebiscite_votes` (id, plebisciteId, userId, vote, createdAt)
- [x] Tabela `national_plebiscites` (id, title, description, category, status, yesVotes, noVotes, endsAt, sentToChamber)
- [x] Tabela `national_plebiscite_votes` (id, plebisciteId, userId, vote, state, createdAt)
- [x] Tabela `power_metrics` (id, totalCitizens, electoratePercent, billsInfluenced, victories, updatedAt)
- [x] Coluna `isPriorityAgenda` e `priorityAgendaUntil` na tabela lobbies
- [x] Rotas tRPC: plebiscites.activate, plebiscites.vote, plebiscites.getByLobby, plebiscites.getResult
- [x] Rotas tRPC: nationalPlebiscites.list, nationalPlebiscites.vote, nationalPlebiscites.getResult, nationalPlebiscites.sendToChamber
- [x] Rota tRPC: powerMetrics.get
- [x] Seed: 2 plebiscitos nacionais de exemplo + métricas de poder iniciais
- [x] Tela de plebiscito do lobby: ativação (5.000 apoios), votação, resultado, aprovação como Pauta Prioritária
- [x] Tela de plebiscitos nacionais: listagem, votação, resultados, envio à Câmara
- [x] Painel de Poder Popular na Home (total de cidadãos, peso político, projetos influenciados, vitórias)
- [x] Destaque de Pauta Prioritária na Home por 7 dias
- [x] Seção "Lobbys Relacionados" no dashboard (articulação entre lobbys similares)
- [x] Campanha de pressão em massa quando lobby vira Pauta Prioritária

## Navegação — Botões Voltar (v1.8)

### Prioridade 1 (Crítico)
- [x] Detalhes do Lobby: botão "← Voltar" no canto superior esquerdo
- [x] Página da Comunidade: botão "← Voltar para Lobby"
- [x] Criação de Lobby: botão "← Cancelar" na primeira etapa com confirmação "Descartar rascunho?"
- [x] Perfil de Usuário: botão "← Voltar" para tela anterior
- [x] Chat Privado: botão "← Voltar para Conversas"

### Prioridade 2 (Importante)
- [x] Resultados da Busca: botão "← Voltar"
- [x] Assistente Populus: botão "← Voltar para o Lobby"
- [x] Editor de Post: botão "← Cancelar" com confirmação "Descartar post?"
- [x] Tela de Configurações: subpáginas com botão "← Voltar"
- [x] Notificações: botão "← Voltar para Feed" ou "Fechar (X)"

### Prioridade 3 (Desejável)
- [x] Mapa Interativo expandido: botão "← Voltar para Explorar"
- [x] Visualização de Imagens/Vídeos: botão "← Fechar"
- [x] Tela de Apoiadores: botão "← Voltar para o Lobby"

## Especificações de Design — Botões Voltar (v1.9)

- [ ] Componente BackButton padronizado (44x44px, padding 16px, ícone chevron + texto)
- [ ] Cores por tema: azul-marinho (#1E3A5F) no claro, branco (#FFFFFF) no escuro
- [ ] Efeito hover/press: fundo com opacidade 10% e borda arredondada
- [ ] Hook useSmartBack: detecta deep link, usa router.canGoBack(), fallback para Feed
- [ ] Preservar estado de rolagem e filtros ao voltar
- [ ] Formulários multi-etapa: voltar para etapa anterior preservando dados
- [ ] Primeira etapa de formulário: confirmar "Descartar rascunho?" ao cancelar
- [ ] Editor de conteúdo: confirmar "Descartar alterações?" ao cancelar
- [ ] Swipe da esquerda para direita (gesto nativo iOS) em todas as telas de detalhe
- [ ] Aplicar BackButton em todas as telas substituindo implementações ad-hoc

## Módulo 8 — Gamificação e Engajamento (v1.8)

### Banco de Dados
- [ ] Tabela `user_points` (id, userId, action, points, referenceId, createdAt)
- [ ] Tabela `user_achievements` (id, userId, achievementKey, unlockedAt)
- [ ] Colunas `totalPoints` e `level` na tabela `users`

### Lógica de Pontuação
- [ ] +10 pontos ao apoiar lobby
- [ ] +50 pontos ao criar lobby
- [ ] +20 pontos ao pressionar (enviar mensagem)
- [ ] +5 pontos ao compartilhar card
- [ ] +100 pontos ao convidar amigo (quando amigo se cadastrar)
- [ ] +500 pontos ao ter lobby aprovado

### Níveis de Cidadão
- [ ] Nível 1 — Observador: 0–100 pontos
- [ ] Nível 2 — Apoiador: 101–500 pontos
- [ ] Nível 3 — Mobilizador: 501–2.000 pontos
- [ ] Nível 4 — Líder Comunitário: 2.001–10.000 pontos
- [ ] Nível 5 — Herói Popular: 10.000+ pontos

### Conquistas Especiais
- [ ] "Pressionador Incansável" (1.000 mensagens enviadas)
- [ ] "Articulador" (criou comunidade com 1.000+ membros)
- [ ] "Legislador Popular" (lobby virou projeto de lei)

### Telas e Componentes
- [ ] Tela de Gamificação: pontos totais, nível atual, barra de progresso, histórico, conquistas
- [ ] Indicador de nível e badge no perfil do usuário
- [ ] Ranking de cidadãos mais ativos
- [ ] Toast/modal de conquista desbloqueada
- [ ] Integrar pontuação automática nas ações existentes

## Módulo 9 — Segurança, Moderação e Transparência (v1.9)

### Banco de Dados
- [ ] Tabela `moderation_queue` (id, contentType, contentId, contentTitle, contentText, userId, status, aiScore, aiFlags, aiReason, reviewedBy, reviewedAt, reviewNote, createdAt)
- [ ] Tabela `moderation_logs` (id, queueId, moderatorId, action, note, createdAt)
- [ ] Tabela `privacy_settings` (id, userId, profileVisibility, showLocation, showActivity, allowAnonymous, anonymousAlias, dataConsentAt, updatedAt)

### Backend e IA
- [ ] Rota tRPC moderation.analyzeContent (IA de primeiro filtro)
- [ ] Rota tRPC moderation.queue.list, queue.review, queue.approve, queue.reject
- [ ] Rota tRPC moderation.report (denúncia de conteúdo)
- [ ] Rota tRPC privacy.getSettings, privacy.updateSettings, privacy.exportData
- [ ] IA de primeiro filtro integrada ao criar lobby
- [ ] IA de primeiro filtro integrada ao criar post no fórum

### Telas
- [ ] Tela de Painel de Moderação (fila, revisão, logs)
- [ ] Acesso ao painel para admin, moderator e nível 4+ (Comitê de Transparência)
- [ ] Tela de Configurações de Privacidade LGPD
- [ ] Integrar configurações de privacidade no perfil do usuário

## Diretrizes Visuais e Onboarding

- [x] Atualizar paleta de cores: azul-marinho (#1E3A5F), verde (#2D7D46), branco (#FFFFFF)
- [x] Modo escuro refinado com cores complementares
- [x] Onboarding etapa 1: Tela de boas-vindas "Junte-se à maior rede de lobby popular do Brasil"
- [x] Onboarding etapa 2: Seleção de interesses (categorias)
- [x] Onboarding etapa 3: Localização (cidade para ver problemas próximos)
- [x] Onboarding etapa 4: Sugestão de comunidades para seguir
- [x] Onboarding etapa 5: Tutorial rápido (como criar lobby, como pressionar)
- [x] Persistir estado de onboarding concluído com AsyncStorage
- [x] Integrar onboarding no fluxo de primeiro acesso (redirecionar usuário novo)

## Autenticação Gov.br

- [x] Rota de login Gov.br simulado no servidor (POST /api/auth/govbr)
- [x] Geração de JWT de sessão após login Gov.br
- [x] Botão "Entrar com Gov.br" na tela de login com logo oficial
- [x] Fluxo simulado: formulário CPF + nome → gera sessão autenticada
- [x] Badge "Verificado Gov.br" no perfil do usuário autenticado via Gov.br

## Funcionalidades Avançadas (v2.0)

- [x] QR Code: gerar QR code único por lobby para compartilhamento físico
- [x] QR Code: modal de exibição com opção de salvar/compartilhar imagem
- [x] QR Code: botão "QR Code" no dashboard do lobby
- [x] Modo Offline: cache de lobbys salvos com AsyncStorage
- [x] Modo Offline: hook useNetworkStatus para detectar conexão
- [x] Modo Offline: botão "Salvar para offline" no lobby
- [x] Modo Offline: banner de aviso quando sem internet
- [x] Modo Offline: tela "Meus Lobbys Salvos" acessível offline
- [x] Imprensa: tabela press_registrations (nome, veículo, email, beat, createdAt)
- [x] Imprensa: rota tRPC press.register (cadastro de jornalista)
- [x] Imprensa: rota tRPC press.sendAlert (enviar alerta sobre pauta popular)
- [x] Imprensa: tela de cadastro de jornalista com formulário
- [x] Imprensa: alerta automático quando lobby atinge 10.000 apoios
- [x] i18n: sistema de tradução com contexto React (PT/EN/ES)
- [x] i18n: traduções completas PT-BR (padrão)
- [x] i18n: traduções completas EN (inglês)
- [x] i18n: traduções completas ES (espanhol)
- [x] i18n: seletor de idioma nas configurações do perfil

## Melhorias de Navegação e Perfil (v2.1)

- [x] Adicionar botões de Idioma, Lobbys Salvos e Alertas para Imprensa no perfil do usuário

## Tutorial Guiado Interativo (v2.1)

- [x] Componente TourGuide com sistema de spotlight e sobreposição modal
- [x] Tela 1 do tour: Boas-Vindas com ilustração animada de cidadãos e botões "Começar Tour" / "Pular"
- [x] Tela 2 do tour: Descobrindo Causas — sobreposição na tela Home com destaque na barra de filtros
- [x] Tela 3 do tour: Apoiando uma Causa — destaque no botão Apoiar com feedback de contador e mensagem de parabéns
- [x] Contexto TourContext para controle global do estado do tour
- [x] Persistência: não mostrar tour novamente após conclusão (AsyncStorage)
- [x] Integrar tour no fluxo de onboarding (etapa 5 → inicia tour)
- [x] Botão "Fazer Tour" no perfil para repetir o tutorial

## Tutorial Guiado — Telas 4, 5 e 6 (v2.2)

- [x] Tela 4 do tour: Pressionando Parlamentares — spotlight no botão Pressionar, canais WhatsApp/E-mail/Twitter, simulação de envio, explicação de metas de pressão
- [x] Tela 5 do tour: Participando de Comunidades — spotlight nos canais de chat, simulação de post, explicação de @menções e mensagens privadas
- [x] Tela 6 do tour: Usando a IA Populus — spotlight nas ferramentas, simulação de geração de card para redes sociais
- [x] Atualizar TourContext com os 3 novos passos (press_action, community_channels, ai_populus)
- [x] Integrar refs de spotlight nas telas de Pressão, Comunidade e Populus
- [x] Atualizar indicadores de progresso (pontos) para 6 etapas

## Tutorial Guiado — Telas 7 e 8 (v2.3)

- [x] Tela 7 do tour: Acompanhando o Impacto no Congresso — spotlight no acompanhamento legislativo, exemplo de projeto em tramitação, histórico de votação, alerta de notificações
- [x] Tela 8 do tour: Conclusão — resumo visual com tabela de 6 funcionalidades, botões "Ir para o Feed", "Criar meu Primeiro Lobby" e "Ver Tutorial Completo"
- [x] Atualizar TourContext com passos legislative_tracking e tour_complete (8 passos totais)
- [x] Integrar ref de spotlight na tela de acompanhamento legislativo
- [x] Atualizar indicadores de progresso para 8 etapas

## Padronização do Nome e Menu Lateral (v2.4)

- [x] Substituição global de "lobby popular" / "Lobby Popular" por "Populus" nos textos visíveis da UI
- [x] Substituição de "lobby" por "campanha" nos CTAs e menus onde aplicável
- [x] Substituição de "Meus lobbys" por "Minhas campanhas"
- [x] Componente DrawerMenu com cabeçalho de usuário, overlay e animação de 300ms
- [x] Seção Navegação: Feed, Explorar, Minhas campanhas, Comunidades
- [x] Seção Suporte: Tutorial, Central de Ajuda, Dicas Rápidas
- [x] Seção Conta: Meu Perfil, Configurações, Notificações, Sair (com confirmação)
- [x] Seção Institucional: Sobre, Privacidade, Contato
- [x] Botão hambúrguer (44x44px) no canto superior esquerdo da tela inicial
- [x] Fechar drawer com overlay, botão ✕, swipe esquerda e back button
- [x] Item ativo destacado com cor primária e barra lateral

## Elementos Interativos e Multimídia (v2.5)

- [x] Tela "Como Funciona" com tabs: Animações, Simuladores, Casos Reais
- [x] Animação: fluxo Cidadão → App → Parlamentar → Votação (step-by-step animado)
- [x] Animação: ciclo Problema → Mobilização → Pressão → Projeto → Lei (roda animada)
- [x] Animação: mapa de calor simulado com pontos se espalhando
- [x] Simulador de Pressão: contador animado de mensagens sendo enviadas
- [x] Simulador de Meta: slider de apoios com conquistas desbloqueadas
- [x] Simulador de Impacto: ajuste de variáveis e cálculo de impacto estimado
- [x] Caso Prático 1: Lobby da Iluminação (8 etapas com ícones e timeline)
- [x] Caso Prático 2: Lobby da Merenda Escolar (6 etapas com ícones e timeline)
- [x] Placeholders de vídeo com thumbnail animada e botão de play
- [x] Integrar "Como Funciona" no menu lateral (seção Suporte)

## Tutorial Aprimorado e Chat de Ajuda com IA (v2.6)

- [x] Barra de progresso no topo do tour ("Passo X de 8") com animação de preenchimento
- [x] Botões "← Anterior" e "Próximo →" em todos os steps do tour
- [x] Botão "Sair" além do "Pular" em cada step
- [x] Botão "?" no canto superior direito do cabeçalho da Home
- [x] Componente ContextualTooltip reutilizável com persistência no AsyncStorage
- [x] Tooltip contextual na tela Criar Campanha (primeira visita)
- [x] Tooltip contextual na tela de Pressão (primeira visita)
- [x] Tooltip contextual no fórum da Comunidade (primeira visita)
- [x] Tela /help-chat com chat de ajuda usando IA (rota populus.chat existente)
- [x] Sugestões de perguntas frequentes no chat de ajuda
- [x] Indicador de "Digitando..." com ActivityIndicator
- [x] Integrar chat de ajuda no menu lateral (seção Suporte → 🤖 Chat com IA)

## Bugfix (v2.7)

- [x] Corrigir erro de runtime em create.tsx:291 que impede abertura do menu (DrawerProvider movido para dentro do QueryClientProvider)

## Mudança de Nome (v2.8)

- [x] Atualizar appName no app.config.ts para "Populus"

## Exemplos de Funcionalidades (v2.9)

- [ ] Arquivo lib/demo-data.ts com dados ricos de demonstração para todas as funcionalidades
- [ ] Feed Home: 6 campanhas de exemplo com categorias, apoios, progresso e localização
- [ ] Tela Explorar: lobbys de exemplo em todas as categorias (Saúde, Educação, Infraestrutura, etc.)
- [ ] Congresso: 4 projetos de lei de exemplo com tramitação, votações e parlamentares
- [ ] Comunidades: 3 comunidades de exemplo com membros, posts e debates
- [ ] Pressão: parlamentares de exemplo com contatos e histórico de votação
- [ ] Assistente Populus: respostas de demonstração e exemplos de base legal gerada

## Dados de Demonstração Ricos (v3.0)

- [x] Função seedDemoData() no server/db.ts com 6 campanhas detalhadas
- [x] Rota tRPC seed.demo para acionar o seed via API
- [x] 4 comunidades com 3 canais cada (geral, estratégia, documentos)
- [x] 3 posts por comunidade (boas-vindas, progresso, pesquisa)
- [x] Tela admin.tsx atualizada com seção "Dados de Demonstração"
- [x] Botão "Carregar Dados de Demo" com confirmação e feedback
- [x] Menu lateral com link para Painel Admin (admin/moderator)
- [x] Campanhas cobrindo: Educação, Saúde, Infraestrutura, Transparência, Meio Ambiente, Mobilidade

## Correção de Rotas do Menu Lateral

- [x] Corrigir rota "Comunidades" no drawer (/(tabs)/community → /(tabs)/communities)
- [x] Criar tela /settings (Configurações com idioma, notificações, tema, conta)
- [x] Criar tela /about (Sobre o Populus com missão, versão, equipe, links)
- [x] Criar tela /help (Central de Ajuda com FAQ e categorias)
- [x] Criar tela /tips (Dicas Rápidas com guia de uso do app)

## Próximos Passos v3.2

- [x] Criar tela /notifications (notificações de campanhas, comunidades, conquistas)
- [x] Compartilhamento de campanha com card visual (QR code já existia no QRCodeModal)
- [x] Onboarding contextual com tooltips por tela (ContextualTip em Congresso e Imprensa)
- [x] Pesquisar e documentar integração com APIs do Congresso Nacional

## Próximos Passos v3.3 — Congresso Completo + Feed Social

- [x] Criar tela /congress/live com player HLS TV Câmara e embed TV Senado
- [x] Integrar senadores na seção Congresso (nova aba + API Senado Federal)
- [x] Criar schema de banco: tabela citizen_posts (foto, vídeo, texto, localização, categoria)
- [x] Criar rotas tRPC: citizenFeed.create, citizenFeed.list, citizenFeed.like, citizenFeed.comment, citizenFeed.delete
- [x] Criar tela /feed (timeline de denúncias cidadãs com fotos/vídeos)
- [x] Criar tela /feed/create (novo post com câmera/galeria + localização + categoria)
- [ ] Integrar feed no perfil do usuário (aba "Posts" no perfil) [pendente]
- [x] Adicionar acesso ao Feed no menu lateral e na aba de navegação

## Navegação v3.4

- [x] Padronizar botão de voltar em todas as telas secundárias (BackButton + useSmartBack)
- [x] Corrigir import useEvent no congress/live.tsx (substituído por addListener)
- [x] Substituir botões ← texto puro por BackButton em: plebiscites, populus, how-it-works, feed/create, feed/index, dm/index

## Correção de Build APK v3.5

- [x] Ajustar minSdkVersion de 22 para 24 no app.config.ts (react-native-worklets exige 24) — já estava correto
- [x] Atualizar react-native-worklets de 0.5.1 para 0.8.1 (compatível com RN 0.81 e minSdkVersion 24)
- [x] Corrigir react-native-worklets para 0.7.4 (compatível com reanimated 4.1.x e minSdkVersion 24)

## Próximos Passos v3.8

- [x] Aba "Posts" no perfil do usuário com grid de posts do feed cidadão
- [x] Tela de detalhe do post /feed/[id] com galeria, comentários e compartilhamento
- [x] Sistema de acesso por convite no cadastro (código de convite beta)
- [x] Gestão de códigos de convite no Painel Admin
- [x] Link "Acesso por Convite" no menu lateral

## Configuração EAS Build v3.9

- [x] Instalar EAS CLI e criar eas.json no projeto
- [x] Configurar perfil de build iOS para TestFlight
- [x] Configurar owner e credenciais Apple no app.config.ts
- [ ] Usuário executa eas init + eas build --platform ios --profile preview

## Próximos Passos v4.0

- [x] Mapa de denúncias na tela Explorar (marcadores do Feed Cidadão com localização)
- [x] Perfil público do usuário acessível a partir do Feed Cidadão
- [x] Notificações push para curtidas e comentários no Feed Cidadão
- [x] Rota tRPC pushTokens.register e pushTokens.unregister
- [x] Hook usePushNotifications com registro automático e navegação por deep link
- [x] Navegação para perfil público ao clicar no avatar/nome do autor no Feed

## Melhorias TestFlight v4.1

- [x] Adicionar coluna passwordHash na tabela users (autenticação local)
- [x] Rota tRPC auth.registerEmail (cadastro com e-mail e senha)
- [x] Rota tRPC auth.loginEmail (login com e-mail e senha)
- [x] Nova tela de login unificada com abas: "E-mail" | "Gov.br"
- [x] Fluxo de cadastro com e-mail: nome, e-mail, senha, confirmação
- [x] Gov.br integrado na nova tela unificada (funciona sem deep link externo)
- [x] Tela de contato/interesse para testadores (/contact)
- [x] Rota tRPC contact.submit para salvar interesse/feedback
- [x] Tabela contact_submissions no schema
- [x] Fluxo completo: cadastro → onboarding automático → perfil → interações
- [x] Botão "Entrar / Criar conta" e "Quero ser testador" na tela de Perfil
