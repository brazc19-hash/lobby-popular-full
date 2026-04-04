/**
 * Dados de demonstração do Populus
 * Exemplos ricos e realistas para todas as funcionalidades do app
 */

export type DemoLobby = {
  id: string;
  title: string;
  description: string;
  category: string;
  petitionCategory: string;
  type: "local" | "national";
  state?: string;
  city?: string;
  supportCount: number;
  goalCount: number;
  status: "mobilization" | "pressure" | "tramitation" | "concluded";
  articleNumber: string;
  articleTitle: string;
  authorName: string;
  authorAvatar: string;
  createdAt: string;
  tags: string[];
  evidences: string[];
  lat?: number;
  lng?: number;
};

export type DemoCommunity = {
  id: string;
  name: string;
  description: string;
  category: string;
  memberCount: number;
  lobbyCount: number;
  avatar: string;
  recentActivity: string;
  posts: DemoPost[];
};

export type DemoPost = {
  id: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  likes: number;
  comments: number;
  createdAt: string;
  mentions?: string[];
};

export type DemoBill = {
  id: string;
  number: string;
  title: string;
  description: string;
  status: string;
  phase: string;
  author: string;
  party: string;
  state: string;
  presentedAt: string;
  lastUpdate: string;
  votesFor: number;
  votesAgainst: number;
  votesAbstain: number;
  relatedLobbyId?: string;
  category: string;
  urgency: "low" | "medium" | "high";
};

export type DemoParliamentarian = {
  id: string;
  name: string;
  party: string;
  state: string;
  role: "deputado" | "senador";
  avatar: string;
  phone: string;
  email: string;
  twitter: string;
  whatsapp: string;
  votingScore: number; // 0-100, alinhamento com causas populares
  recentVotes: { bill: string; vote: "sim" | "não" | "abstenção"; date: string }[];
  themes: string[];
};

export type DemoPressureAction = {
  channel: "whatsapp" | "email" | "twitter" | "phone";
  count: number;
  lastWeek: number;
  message: string;
  subject?: string;
};

// ============================================================
// CAMPANHAS DE DEMONSTRAÇÃO
// ============================================================

export const DEMO_LOBBIES: DemoLobby[] = [
  {
    id: "demo-1",
    title: "Iluminação da Praça Central — São Paulo",
    description:
      "A Praça Central do bairro Vila Madalena está sem iluminação há 8 meses, causando insegurança para moradores e comerciantes. Já registramos 3 assaltos no local. Precisamos de postes de LED e câmeras de segurança.",
    category: "local",
    petitionCategory: "Segurança Pública",
    type: "local",
    state: "SP",
    city: "São Paulo",
    supportCount: 347,
    goalCount: 500,
    status: "pressure",
    articleNumber: "Art. 6º",
    articleTitle: "Direito à segurança — CF/88",
    authorName: "Maria Silva",
    authorAvatar: "👩",
    createdAt: "2026-01-15",
    tags: ["iluminação", "segurança", "Vila Madalena"],
    evidences: ["Foto do poste quebrado", "Boletim de ocorrência", "Abaixo-assinado físico"],
    lat: -23.5505,
    lng: -46.6333,
  },
  {
    id: "demo-2",
    title: "Merenda Escolar de Qualidade em MG",
    description:
      "30% das escolas estaduais de Minas Gerais servem merenda inadequada ou insuficiente. Crianças voltam para casa com fome. Exigimos cumprimento do PNAE (Programa Nacional de Alimentação Escolar) e fiscalização rigorosa.",
    category: "state",
    petitionCategory: "Educação",
    type: "local",
    state: "MG",
    city: "Belo Horizonte",
    supportCount: 7823,
    goalCount: 10000,
    status: "pressure",
    articleNumber: "Art. 208",
    articleTitle: "Dever do Estado com a educação — CF/88",
    authorName: "Ana Costa",
    authorAvatar: "👩‍🏫",
    createdAt: "2025-11-20",
    tags: ["merenda", "educação", "PNAE", "crianças"],
    evidences: ["Relatório do MEC", "Fotos das merendas", "Depoimentos de mães", "Dados do IBGE"],
    lat: -19.9167,
    lng: -43.9345,
  },
  {
    id: "demo-3",
    title: "Reforma da Lei de Licitações — Transparência",
    description:
      "A Lei 14.133/2021 ainda permite brechas para superfaturamento em obras públicas. Propomos emenda para tornar obrigatória a publicação de planilhas de custos detalhadas e auditoria independente em contratos acima de R$ 1 milhão.",
    category: "national",
    petitionCategory: "Transparência e Combate à Corrupção",
    type: "national",
    supportCount: 31420,
    goalCount: 50000,
    status: "tramitation",
    articleNumber: "Art. 37",
    articleTitle: "Princípios da Administração Pública — CF/88",
    authorName: "Carlos Mendes",
    authorAvatar: "👨‍💼",
    createdAt: "2025-09-01",
    tags: ["licitações", "transparência", "corrupção", "obras públicas"],
    evidences: ["Relatório TCU", "Estudo da FGV", "Casos documentados"],
  },
  {
    id: "demo-4",
    title: "UPA 24h para o Bairro Jardim Esperança — RJ",
    description:
      "O bairro Jardim Esperança tem 45.000 moradores e o hospital mais próximo fica a 18km. Em 2025, 3 pessoas morreram no trajeto. Precisamos de uma UPA 24 horas para atender emergências com rapidez.",
    category: "local",
    petitionCategory: "Saúde",
    type: "local",
    state: "RJ",
    city: "Rio de Janeiro",
    supportCount: 12890,
    goalCount: 15000,
    status: "pressure",
    articleNumber: "Art. 196",
    articleTitle: "Direito à saúde — CF/88",
    authorName: "João Ferreira",
    authorAvatar: "👨",
    createdAt: "2025-12-10",
    tags: ["saúde", "UPA", "emergência", "Jardim Esperança"],
    evidences: ["Certidões de óbito", "Mapa de distâncias", "Relatório médico"],
    lat: -22.9068,
    lng: -43.1729,
  },
  {
    id: "demo-5",
    title: "Transporte Público Noturno — Linha 47 Curitiba",
    description:
      "A linha 47 de ônibus foi suprimida às 22h, deixando 8.000 trabalhadores noturnos sem transporte. Trabalhadores de hospitais, supermercados e indústrias precisam caminhar até 5km ou pagar táxi. Exigimos a restauração do horário integral.",
    category: "local",
    petitionCategory: "Mobilidade Urbana",
    type: "local",
    state: "PR",
    city: "Curitiba",
    supportCount: 4231,
    goalCount: 5000,
    status: "mobilization",
    articleNumber: "Art. 30",
    articleTitle: "Competências dos Municípios — CF/88",
    authorName: "Fernanda Lima",
    authorAvatar: "👩‍🔧",
    createdAt: "2026-02-01",
    tags: ["transporte", "ônibus", "trabalhadores", "linha 47"],
    evidences: ["Petição física com 2.000 assinaturas", "Fotos de filas", "Depoimentos"],
    lat: -25.4284,
    lng: -49.2733,
  },
  {
    id: "demo-6",
    title: "Regulamentação do Trabalho de Aplicativo",
    description:
      "1,5 milhão de entregadores e motoristas de aplicativo trabalham sem carteira assinada, sem seguro de acidente e sem direito a férias. Propomos PL para garantir direitos trabalhistas mínimos e seguro obrigatório.",
    category: "national",
    petitionCategory: "Direitos Trabalhistas",
    type: "national",
    supportCount: 89340,
    goalCount: 100000,
    status: "tramitation",
    articleNumber: "Art. 7º",
    articleTitle: "Direitos dos trabalhadores — CF/88",
    authorName: "Roberto Souza",
    authorAvatar: "🧑‍💻",
    createdAt: "2025-08-15",
    tags: ["aplicativos", "trabalhadores", "direitos", "uberização"],
    evidences: ["Pesquisa IPEA", "Relatório OIT", "Dados de acidentes"],
  },
];

// ============================================================
// COMUNIDADES DE DEMONSTRAÇÃO
// ============================================================

export const DEMO_COMMUNITIES: DemoCommunity[] = [
  {
    id: "demo-comm-1",
    name: "Saúde Pública para Todos",
    description:
      "Comunidade dedicada a lutar por um SUS de qualidade, UPAs bem equipadas e acesso universal à saúde. Reunimos médicos, pacientes e ativistas.",
    category: "Saúde",
    memberCount: 5420,
    lobbyCount: 12,
    avatar: "🏥",
    recentActivity: "Novo post: Resultado da audiência com o Ministério da Saúde",
    posts: [
      {
        id: "post-1",
        authorName: "Dra. Carla Nunes",
        authorAvatar: "👩‍⚕️",
        content:
          "Conseguimos audiência com o Secretário de Saúde do RJ! A reunião está marcada para 25/03. Precisamos de 50 voluntários para comparecer. Quem pode? Use @menção para chamar amigos!",
        likes: 234,
        comments: 47,
        createdAt: "2026-03-15",
        mentions: ["@AnaCostaRJ", "@MovimentoSUS"],
      },
      {
        id: "post-2",
        authorName: "Pedro Alves",
        authorAvatar: "👨",
        content:
          "📊 Dados do IBGE: 68% dos municípios brasileiros têm apenas 1 hospital público. Isso é inadmissível. Compartilhem este dado para pressionar os vereadores locais!",
        likes: 189,
        comments: 23,
        createdAt: "2026-03-14",
      },
      {
        id: "post-3",
        authorName: "Maria Fernanda",
        authorAvatar: "👩",
        content:
          "Vitória! O lobby da UPA Jardim Esperança atingiu 12.890 apoios. Faltam apenas 2.110 para a meta! Vamos pressionar o deputado @CarlosOliveiraPSB que é da Comissão de Saúde.",
        likes: 412,
        comments: 89,
        createdAt: "2026-03-13",
        mentions: ["@CarlosOliveiraPSB"],
      },
    ],
  },
  {
    id: "demo-comm-2",
    name: "Mobilidade Urbana Brasil",
    description:
      "Lutamos por transporte público de qualidade, ciclovias seguras e cidades mais humanas. Atuamos em 15 capitais brasileiras.",
    category: "Mobilidade Urbana",
    memberCount: 3180,
    lobbyCount: 8,
    avatar: "🚌",
    recentActivity: "Debate: Proposta de gratuidade para idosos no metrô de SP",
    posts: [
      {
        id: "post-4",
        authorName: "Lucas Rodrigues",
        authorAvatar: "🧑",
        content:
          "URGENTE: A Prefeitura de Curitiba vai votar amanhã a extinção de mais 3 linhas noturnas. Precisamos de mobilização HOJE! Liguem para o gabinete: (41) 3350-8000",
        likes: 567,
        comments: 134,
        createdAt: "2026-03-16",
      },
      {
        id: "post-5",
        authorName: "Beatriz Santos",
        authorAvatar: "👩‍🎓",
        content:
          "Pesquisa: 73% dos usuários de transporte público gastam mais de 2h/dia no trajeto. Isso representa 730h/ano perdidas. Usamos esse dado no lobby da Linha 47 e o vereador ficou impactado!",
        likes: 298,
        comments: 56,
        createdAt: "2026-03-12",
      },
    ],
  },
  {
    id: "demo-comm-3",
    name: "Educação é Direito",
    description:
      "Pais, professores e estudantes unidos pela qualidade da educação pública. Do ensino fundamental à universidade.",
    category: "Educação",
    memberCount: 8920,
    lobbyCount: 19,
    avatar: "📚",
    recentActivity: "Conquista: PL da Merenda Escolar aprovado em 1ª leitura na ALMG",
    posts: [
      {
        id: "post-6",
        authorName: "Prof. Ricardo Gomes",
        authorAvatar: "👨‍🏫",
        content:
          "🎉 CONQUISTA! O PL 2847/2026 (Merenda Escolar MG) foi aprovado em primeira leitura na Assembleia com 38 votos a favor e 7 contra! Isso é resultado de 7.823 apoios e meses de pressão. OBRIGADO a todos!",
        likes: 1243,
        comments: 287,
        createdAt: "2026-03-10",
      },
      {
        id: "post-7",
        authorName: "Juliana Martins",
        authorAvatar: "👩‍💼",
        content:
          "Dica para quem vai criar lobby de educação: use o Art. 208 da CF combinado com o Art. 227 (proteção à criança). A IA do Populus sugeriu essa combinação e fortaleceu muito nosso argumento jurídico!",
        likes: 445,
        comments: 78,
        createdAt: "2026-03-08",
      },
    ],
  },
];

// ============================================================
// PROJETOS DE LEI DE DEMONSTRAÇÃO
// ============================================================

export const DEMO_BILLS: DemoBill[] = [
  {
    id: "bill-1",
    number: "PL 2847/2026",
    title: "Qualidade da Merenda Escolar nas Escolas Estaduais",
    description:
      "Estabelece padrões mínimos de qualidade nutricional para a merenda escolar nas escolas estaduais de Minas Gerais, com fiscalização semestral e punições para fornecedores que descumprirem os critérios.",
    status: "Em tramitação",
    phase: "2ª leitura — Comissão de Educação",
    author: "Dep. Ricardo Gomes (PT-MG)",
    party: "PT",
    state: "MG",
    presentedAt: "2026-01-15",
    lastUpdate: "2026-03-10",
    votesFor: 38,
    votesAgainst: 7,
    votesAbstain: 3,
    relatedLobbyId: "demo-2",
    category: "Educação",
    urgency: "high",
  },
  {
    id: "bill-2",
    number: "PL 1234/2025",
    title: "Regulamentação dos Direitos dos Trabalhadores de Plataformas Digitais",
    description:
      "Garante direitos trabalhistas mínimos para motoristas e entregadores de aplicativos, incluindo seguro de acidente, férias remuneradas, auxílio-doença e limite de jornada de 8 horas diárias.",
    status: "Em tramitação",
    phase: "Plenário — Aguardando votação",
    author: "Dep. Fernanda Lima (PSOL-SP)",
    party: "PSOL",
    state: "SP",
    presentedAt: "2025-08-20",
    lastUpdate: "2026-03-05",
    votesFor: 0,
    votesAgainst: 0,
    votesAbstain: 0,
    relatedLobbyId: "demo-6",
    category: "Direitos Trabalhistas",
    urgency: "high",
  },
  {
    id: "bill-3",
    number: "PL 3901/2025",
    title: "Transparência em Contratos Públicos — Emenda à Lei 14.133/2021",
    description:
      "Torna obrigatória a publicação de planilhas de custos detalhadas e auditoria independente em contratos públicos acima de R$ 1 milhão, com prazo de 30 dias para publicação após assinatura.",
    status: "Em tramitação",
    phase: "Comissão de Finanças — Aguardando parecer",
    author: "Dep. Carlos Mendes (PSDB-SP)",
    party: "PSDB",
    state: "SP",
    presentedAt: "2025-09-10",
    lastUpdate: "2026-02-20",
    votesFor: 0,
    votesAgainst: 0,
    votesAbstain: 0,
    relatedLobbyId: "demo-3",
    category: "Transparência",
    urgency: "medium",
  },
  {
    id: "bill-4",
    number: "PEC 45/2024",
    title: "Emenda Constitucional — Mínimo de 20% do Orçamento para Saúde",
    description:
      "Proposta de Emenda Constitucional que eleva o piso constitucional de investimento em saúde de 15% para 20% da receita corrente líquida da União, garantindo mais recursos para o SUS.",
    status: "Em tramitação",
    phase: "Comissão Especial — 1ª votação",
    author: "Dep. Ana Beatriz Costa (PDT-RJ)",
    party: "PDT",
    state: "RJ",
    presentedAt: "2024-11-05",
    lastUpdate: "2026-01-30",
    votesFor: 0,
    votesAgainst: 0,
    votesAbstain: 0,
    category: "Saúde",
    urgency: "high",
  },
];

// ============================================================
// PARLAMENTARES DE DEMONSTRAÇÃO
// ============================================================

export const DEMO_PARLIAMENTARIANS: DemoParliamentarian[] = [
  {
    id: "parl-1",
    name: "Dep. Carlos Oliveira",
    party: "PSB",
    state: "RJ",
    role: "deputado",
    avatar: "👨‍💼",
    phone: "(21) 3215-5000",
    email: "carlos.oliveira@camara.leg.br",
    twitter: "@CarlosOliveiraPSB",
    whatsapp: "+55 21 99999-0001",
    votingScore: 78,
    recentVotes: [
      { bill: "PL 2847/2026 — Merenda Escolar", vote: "sim", date: "2026-03-10" },
      { bill: "PEC 45/2024 — Saúde 20%", vote: "sim", date: "2026-02-15" },
      { bill: "PL 1234/2025 — Trabalhadores App", vote: "abstenção", date: "2026-01-20" },
    ],
    themes: ["Saúde", "Educação", "Direitos Humanos"],
  },
  {
    id: "parl-2",
    name: "Dep. Fernanda Lima",
    party: "PSOL",
    state: "SP",
    role: "deputado",
    avatar: "👩‍💼",
    phone: "(11) 3215-5001",
    email: "fernanda.lima@camara.leg.br",
    twitter: "@FernandaLimaPSOL",
    whatsapp: "+55 11 99999-0002",
    votingScore: 92,
    recentVotes: [
      { bill: "PL 1234/2025 — Trabalhadores App", vote: "sim", date: "2026-01-20" },
      { bill: "PL 3901/2025 — Transparência", vote: "sim", date: "2026-02-20" },
      { bill: "PEC 45/2024 — Saúde 20%", vote: "sim", date: "2026-02-15" },
    ],
    themes: ["Trabalho", "Transparência", "Direitos Trabalhistas"],
  },
  {
    id: "parl-3",
    name: "Sen. Roberto Campos",
    party: "PL",
    state: "SP",
    role: "senador",
    avatar: "👴",
    phone: "(61) 3303-1000",
    email: "roberto.campos@senado.leg.br",
    twitter: "@RobertoCamposPL",
    whatsapp: "+55 61 99999-0003",
    votingScore: 34,
    recentVotes: [
      { bill: "PL 1234/2025 — Trabalhadores App", vote: "não", date: "2026-01-20" },
      { bill: "PEC 45/2024 — Saúde 20%", vote: "não", date: "2026-02-15" },
      { bill: "PL 3901/2025 — Transparência", vote: "abstenção", date: "2026-02-20" },
    ],
    themes: ["Economia", "Privatização", "Fiscal"],
  },
  {
    id: "parl-4",
    name: "Dep. Ana Beatriz Costa",
    party: "PDT",
    state: "RJ",
    role: "deputado",
    avatar: "👩",
    phone: "(21) 3215-5002",
    email: "ana.beatriz@camara.leg.br",
    twitter: "@AnaBeatrizPDT",
    whatsapp: "+55 21 99999-0004",
    votingScore: 85,
    recentVotes: [
      { bill: "PEC 45/2024 — Saúde 20%", vote: "sim", date: "2026-02-15" },
      { bill: "PL 2847/2026 — Merenda Escolar", vote: "sim", date: "2026-03-10" },
      { bill: "PL 1234/2025 — Trabalhadores App", vote: "sim", date: "2026-01-20" },
    ],
    themes: ["Saúde", "Mulher", "Criança e Adolescente"],
  },
];

// ============================================================
// AÇÕES DE PRESSÃO DE DEMONSTRAÇÃO
// ============================================================

export const DEMO_PRESSURE_ACTIONS: DemoPressureAction[] = [
  {
    channel: "whatsapp",
    count: 1247,
    lastWeek: 342,
    message:
      "Olá, Dep. {nome}. Sou cidadão(ã) do {estado} e apoio a campanha '{titulo}'. Com base no {artigo} da CF/88, solicito seu voto favorável ao {pl}. Esta causa afeta {afetados} pessoas da nossa comunidade. Conto com seu apoio! — Enviado via Populus",
  },
  {
    channel: "email",
    count: 834,
    lastWeek: 198,
    subject: "[Populus] Pedido de apoio ao {pl} — {titulo}",
    message:
      "Excelentíssimo(a) {cargo} {nome},\n\nEscrevo em nome de {apoios} cidadãos que apoiam a campanha '{titulo}' na plataforma Populus.\n\nFundamento constitucional: {artigo} da CF/88 — {artigo_titulo}.\n\nSolicitamos seu apoio ao {pl} que tramita na {casa}.\n\nAtenciosamente,\n{usuario}\nCidadão(ã) brasileiro(a)",
  },
  {
    channel: "twitter",
    count: 2891,
    lastWeek: 567,
    message:
      ".@{twitter} Dep. {nome}, {apoios} cidadãos pedem seu apoio ao {pl} sobre {titulo}. Base: {artigo} CF/88. #Populus #DemocraciaPopular #{hashtag}",
  },
  {
    channel: "phone",
    count: 156,
    lastWeek: 43,
    message:
      "Roteiro: 'Bom dia/tarde, meu nome é [SEU NOME], sou eleitor(a) do {estado}. Gostaria de falar sobre a campanha {titulo} que tem {apoios} apoiadores no Populus. Solicito o voto favorável do(a) deputado(a) ao {pl}. Obrigado(a).'",
  },
];

// ============================================================
// RESPOSTAS DE DEMONSTRAÇÃO DO ASSISTENTE POPULUS
// ============================================================

export const DEMO_AI_RESPONSES: Record<string, string> = {
  "Como crio um lobby?":
    "Para criar uma campanha no Populus, siga estes passos:\n\n1. **Toque em '+'** na barra inferior\n2. **Escolha o tipo**: Nacional (afeta todo o Brasil) ou Local (sua cidade/estado)\n3. **Descreva o problema**: Seja específico — mencione números, localização e impacto\n4. **Base legal**: A IA sugere artigos da CF/88 automaticamente. Escolha o mais adequado\n5. **Meta de apoios**: Defina quantos apoios você precisa (mínimo 100)\n6. **Publique**: Após revisão, sua campanha vai ao ar em até 24h\n\n💡 **Dica**: Campanhas com foto e dados concretos conseguem 3x mais apoios!",

  "O que é fundamento legal?":
    "O **fundamento legal** é o artigo da Constituição Federal de 1988 que embase juridicamente sua causa. Ele é obrigatório no Populus porque:\n\n• **Dá legitimidade** à sua campanha perante parlamentares\n• **Fortalece** o argumento jurídico para pressão\n• **Facilita** a transformação em projeto de lei\n\n**Exemplos por tema:**\n| Tema | Artigo |\n|------|--------|\n| Saúde | Art. 196 |\n| Educação | Art. 205-208 |\n| Segurança | Art. 6º |\n| Trabalho | Art. 7º |\n| Moradia | Art. 6º |\n| Meio Ambiente | Art. 225 |\n\nA IA do Populus sugere automaticamente os artigos mais relevantes para o seu tema!",

  "Como pressiono um deputado?":
    "A pressão popular é a ferramenta mais poderosa do Populus! Veja como funciona:\n\n**1. Acesse a tela de Pressão** do seu lobby\n**2. Escolha o canal:**\n• 📱 **WhatsApp**: Mensagem direta ao gabinete (mais efetivo)\n• 📧 **E-mail**: Formal, fica registrado\n• 🐦 **Twitter**: Visibilidade pública\n• 📞 **Telefone**: Roteiro de ligação fornecido\n\n**3. Metas de pressão:**\n• 500 mensagens → Protocolo oficial na Câmara\n• 1.000 mensagens → Audiência pública garantida\n• 10.000 mensagens → Cobertura da imprensa nacional\n\n💡 **Dica**: Coordene com a comunidade para pressionar no mesmo dia — o impacto é muito maior!",

  "Como a IA ajuda minha causa?":
    "O **Assistente Populus** oferece 5 ferramentas de IA:\n\n🔍 **Base Legal**: Analisa sua causa e sugere artigos da CF/88 com argumentação jurídica completa\n\n📊 **Evidências**: Busca dados do IBGE, IPEA e órgãos públicos para embasar sua campanha\n\n✍️ **Conteúdo**: Gera posts para WhatsApp, Instagram e Twitter; roteiros de ligação; e-mails formais\n\n📈 **Impacto**: Calcula quantas pessoas são afetadas e o custo econômico do problema\n\n🏛️ **Cenário Político**: Analisa quais parlamentares têm mais chances de apoiar sua causa\n\nTudo isso com base na Constituição Federal e em dados públicos verificados!",
};

// ============================================================
// ESTATÍSTICAS DE DEMONSTRAÇÃO
// ============================================================

export const DEMO_STATS = {
  totalLobbies: 6,
  totalSupports: 145055,
  totalCommunities: 3,
  totalMembers: 17520,
  billsInfluenced: 15,
  victoriesAchieved: 7,
  statesCovered: 27,
  activeUsers: 1000000,
};
