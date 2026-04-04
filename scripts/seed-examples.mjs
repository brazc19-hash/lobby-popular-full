/**
 * Seed: 3 lobbys de exemplo para demonstração do app Lobby Popular
 * Execução: node scripts/seed-examples.mjs
 */
import mysql from "mysql2/promise";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, "../.env") });

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// ─── Artigos da Constituição necessários ─────────────────────────────────────
// Art. 6º (id=2) → segurança/direitos sociais → Lobby 1
// Art. 37 (id=3) → transparência/eficiência → Lobby 2
// Art. 205 (id=5) → educação → Lobby 3
// Inserir Art. 208 se não existir
const [art208] = await conn.execute(
  "SELECT id FROM constitution_articles WHERE articleNumber = 'Art. 208'"
);
let art208Id;
if (art208.length === 0) {
  const [r] = await conn.execute(
    `INSERT INTO constitution_articles (articleNumber, title, summary, \`fullText\`, theme) VALUES (?, ?, ?, ?, ?)`,
    [
      "Art. 208",
      "Dever do Estado com a Educação",
      "O dever do Estado com a educação será efetivado mediante a garantia de educação básica obrigatória e gratuita dos 4 aos 17 anos de idade.",
      "Art. 208. O dever do Estado com a educação será efetivado mediante a garantia de: I - educação básica obrigatória e gratuita dos 4 (quatro) aos 17 (dezessete) anos de idade, assegurada inclusive sua oferta gratuita para todos os que a ela não tiveram acesso na idade própria; II - progressiva universalização do ensino médio gratuito; III - atendimento educacional especializado aos portadores de deficiência, preferencialmente na rede regular de ensino; IV - educação infantil, em creche e pré-escola, às crianças até 5 (cinco) anos de idade; V - acesso aos níveis mais elevados do ensino, da pesquisa e da criação artística, segundo a capacidade de cada um; VI - oferta de ensino noturno regular, adequado às condições do educando; VII - atendimento ao educando, em todas as etapas da educação básica, por meio de programas suplementares de material didático escolar, transporte, alimentação e assistência à saúde.",
      "education",
    ]
  );
  art208Id = r.insertId;
  console.log(`✅ Art. 208 inserido com id=${art208Id}`);
} else {
  art208Id = art208[0].id;
  console.log(`ℹ️  Art. 208 já existe com id=${art208Id}`);
}

// ─── Usuários de exemplo ─────────────────────────────────────────────────────
const seedUsers = [
  { openId: "seed_user_001", name: "Maria Silva", email: "maria.silva@exemplo.com.br", role: "user" },
  { openId: "seed_user_002", name: "João Santos", email: "joao.santos@exemplo.com.br", role: "user" },
  { openId: "seed_user_003", name: "Ana Oliveira", email: "ana.oliveira@exemplo.com.br", role: "user" },
  { openId: "seed_user_004", name: "Carlos Mendes", email: "carlos.mendes@exemplo.com.br", role: "user" },
  { openId: "seed_user_005", name: "Fernanda Costa", email: "fernanda.costa@exemplo.com.br", role: "moderator" },
];

const userIds = {};
for (const u of seedUsers) {
  const [existing] = await conn.execute("SELECT id FROM users WHERE openId = ?", [u.openId]);
  if (existing.length === 0) {
    const [r] = await conn.execute(
      "INSERT INTO users (openId, name, email, role) VALUES (?, ?, ?, ?)",
      [u.openId, u.name, u.email, u.role ?? "user"]
    );
    userIds[u.openId] = r.insertId;
    // Criar perfil
    await conn.execute(
      "INSERT INTO user_profiles (userId, bio, city, state) VALUES (?, ?, ?, ?)",
      [r.insertId, `Cidadão ativo no Populus, engajado em causas locais e nacionais.`, u.openId.includes("001") ? "São Paulo" : u.openId.includes("002") ? "Belo Horizonte" : "Rio de Janeiro", u.openId.includes("001") ? "SP" : u.openId.includes("002") ? "MG" : "RJ"]
    );
    console.log(`✅ Usuário ${u.name} inserido com id=${r.insertId}`);
  } else {
    userIds[u.openId] = existing[0].id;
    console.log(`ℹ️  Usuário ${u.name} já existe com id=${existing[0].id}`);
  }
}

const userId1 = userIds["seed_user_001"]; // Maria Silva — criadora do lobby local
const userId2 = userIds["seed_user_002"]; // João Santos — criador do lobby nacional
const userId3 = userIds["seed_user_003"]; // Ana Oliveira — criadora do lobby estadual
const userId4 = userIds["seed_user_004"]; // Carlos Mendes — apoiador
const userId5 = userIds["seed_user_005"]; // Fernanda Costa — moderadora

// ─── Lobby 1: Iluminação da Praça Central (Local) ────────────────────────────
const [existL1] = await conn.execute("SELECT id FROM lobbies WHERE title = 'Iluminação da Praça Central'");
let lobby1Id;
if (existL1.length === 0) {
  const [r] = await conn.execute(
    `INSERT INTO lobbies (userId, title, description, objective, category, status, constitutionArticleId,
      latitude, longitude, locationAddress, locationCity, locationState,
      petitionCategory, goalCount, lobbyStatus, supportCount, viewCount,
      evidenceUrls, targetParlamentarians)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      userId1,
      "Iluminação da Praça Central",
      "A Praça da Matriz, no Centro de São Paulo, está sem iluminação adequada há 6 meses. Desde a falha no sistema elétrico em agosto, 3 assaltos foram registrados na área, segundo o boletim de ocorrências da 1ª Delegacia. Idosos e crianças evitam o local após as 18h. A praça é frequentada por mais de 2.000 moradores diariamente.",
      "Exigir que a Prefeitura de São Paulo restaure e modernize o sistema de iluminação da Praça da Matriz em até 30 dias, com instalação de luminárias LED de alta eficiência e câmeras de segurança, garantindo o direito à segurança pública previsto no Art. 6º da Constituição Federal.",
      "local",
      "active",
      2, // Art. 6º
      -23.5505, -46.6333,
      "Praça da Matriz, Centro",
      "São Paulo",
      "SP",
      "security",
      1000,
      "mobilization",
      347,
      1240,
      JSON.stringify(["https://exemplo.com/foto-praca-escura.jpg", "https://exemplo.com/bo-assalto.pdf"]),
      JSON.stringify(["Vereador José da Silva", "Secretaria de Infraestrutura Urbana"])
    ]
  );
  lobby1Id = r.insertId;
  console.log(`✅ Lobby 1 (Iluminação Praça) inserido com id=${lobby1Id}`);

  // Milestones
  await conn.execute(
    "INSERT INTO lobby_milestones (lobbyId, targetCount, title, description, reward) VALUES (?, ?, ?, ?, ?)",
    [lobby1Id, 100, "Primeiros 100 apoios", "Envio de ofício à Subprefeitura", "Protocolo oficial registrado"]
  );
  await conn.execute(
    "INSERT INTO lobby_milestones (lobbyId, targetCount, title, description, reward) VALUES (?, ?, ?, ?, ?)",
    [lobby1Id, 500, "500 apoios — Audiência pública", "Solicitação de audiência com o Vereador responsável", "Reunião com representante da Câmara Municipal"]
  );
  await conn.execute(
    "INSERT INTO lobby_milestones (lobbyId, targetCount, title, description, reward, reachedAt) VALUES (?, ?, ?, ?, ?, NOW())",
    [lobby1Id, 200, "200 apoios atingidos!", "Marco de mobilização comunitária alcançado", "Notícia publicada no portal da subprefeitura"]
  );

  // Timeline
  await conn.execute(
    "INSERT INTO lobby_timeline (lobbyId, type, title, description) VALUES (?, ?, ?, ?)",
    [lobby1Id, "created", "Lobby criado", "Maria Silva iniciou o lobby após o 3º assalto registrado na praça."]
  );
  await conn.execute(
    "INSERT INTO lobby_timeline (lobbyId, type, title, description) VALUES (?, ?, ?, ?)",
    [lobby1Id, "milestone", "200 apoios atingidos", "A comunidade mobilizou 200 assinaturas em apenas 5 dias."]
  );
  await conn.execute(
    "INSERT INTO lobby_timeline (lobbyId, type, title, description) VALUES (?, ?, ?, ?)",
    [lobby1Id, "update", "Resposta da Subprefeitura", "A Subprefeitura Centro informou que a licitação para reparo será aberta em 15 dias."]
  );
} else {
  lobby1Id = existL1[0].id;
  console.log(`ℹ️  Lobby 1 já existe com id=${lobby1Id}`);
}

// ─── Lobby 2: Reforma da Lei de Licitações (Nacional) ────────────────────────
const [existL2] = await conn.execute("SELECT id FROM lobbies WHERE title = 'Reforma da Lei de Licitações'");
let lobby2Id;
if (existL2.length === 0) {
  const [r] = await conn.execute(
    `INSERT INTO lobbies (userId, title, description, objective, category, status, constitutionArticleId,
      petitionCategory, goalCount, lobbyStatus, supportCount, viewCount,
      evidenceUrls, targetParlamentarians, isPriorityAgenda)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      userId2,
      "Reforma da Lei de Licitações",
      "A legislação atual de licitações públicas (Lei 8.666/93 e Lei 14.133/21) ainda permite brechas que resultam em contratos superfaturados. Dados do TCU apontam que 23% dos contratos públicos analisados em 2023 apresentaram irregularidades. O Brasil perde estimados R$ 200 bilhões por ano em contratos superfaturados, segundo o IBGE. A reforma proposta visa aumentar a transparência, obrigatoriedade de licitação eletrônica e punições mais severas para fraudes.",
      "Pressionar o Congresso Nacional a aprovar emendas à Lei 14.133/21 que tornem obrigatória a licitação eletrônica para todos os contratos acima de R$ 50.000, com publicação em tempo real no Portal da Transparência, garantindo o princípio constitucional da eficiência previsto no Art. 37 da CF.",
      "national",
      "active",
      3, // Art. 37
      "transparency",
      50000,
      "pressure",
      30000,
      89500,
      JSON.stringify(["https://tcu.gov.br/relatorio-2023.pdf", "https://transparencia.gov.br/dados"]),
      JSON.stringify(["Comissão de Finanças e Tributação", "Dep. Federal Paulo Guedes", "Sen. Simone Tebet"])
    ]
  );
  lobby2Id = r.insertId;
  console.log(`✅ Lobby 2 (Reforma Licitações) inserido com id=${lobby2Id}`);

  // Milestones
  await conn.execute(
    "INSERT INTO lobby_milestones (lobbyId, targetCount, title, description, reward, reachedAt) VALUES (?, ?, ?, ?, ?, NOW())",
    [lobby2Id, 1000, "1.000 apoios", "Envio de carta aberta ao Presidente da Câmara", "Carta protocolada e publicada"]
  );
  await conn.execute(
    "INSERT INTO lobby_milestones (lobbyId, targetCount, title, description, reward, reachedAt) VALUES (?, ?, ?, ?, ?, NOW())",
    [lobby2Id, 10000, "10.000 apoios", "Audiência pública na Câmara dos Deputados", "Audiência realizada em 15/01/2026"]
  );
  await conn.execute(
    "INSERT INTO lobby_milestones (lobbyId, targetCount, title, description, reward, reachedAt) VALUES (?, ?, ?, ?, ?, NOW())",
    [lobby2Id, 25000, "25.000 apoios", "Projeto de lei apresentado por deputado aliado", "PL 1234/2026 em tramitação"]
  );
  await conn.execute(
    "INSERT INTO lobby_milestones (lobbyId, targetCount, title, description, reward) VALUES (?, ?, ?, ?, ?)",
    [lobby2Id, 50000, "50.000 apoios — Meta final", "Pressão máxima para votação do PL", "Votação em plenário garantida"]
  );

  // Timeline
  await conn.execute(
    "INSERT INTO lobby_timeline (lobbyId, type, title, description) VALUES (?, ?, ?, ?)",
    [lobby2Id, "created", "Lobby criado", "João Santos lançou o lobby após relatório do TCU sobre irregularidades."]
  );
  await conn.execute(
    "INSERT INTO lobby_timeline (lobbyId, type, title, description) VALUES (?, ?, ?, ?)",
    [lobby2Id, "milestone", "10.000 apoios — Audiência pública realizada", "Representantes do lobby foram ouvidos na Comissão de Finanças da Câmara."]
  );
  await conn.execute(
    "INSERT INTO lobby_timeline (lobbyId, type, title, description) VALUES (?, ?, ?, ?)",
    [lobby2Id, "update", "PL 1234/2026 apresentado", "Dep. Carlos Henrique apresentou projeto de lei baseado nas demandas do lobby."]
  );
  await conn.execute(
    "INSERT INTO lobby_timeline (lobbyId, type, title, description) VALUES (?, ?, ?, ?)",
    [lobby2Id, "milestone", "25.000 apoios atingidos", "Lobby alcança metade da meta com crescimento acelerado."]
  );
} else {
  lobby2Id = existL2[0].id;
  console.log(`ℹ️  Lobby 2 já existe com id=${lobby2Id}`);
}

// ─── Lobby 3: Melhoria da Merenda Escolar (Estadual) ─────────────────────────
const [existL3] = await conn.execute("SELECT id FROM lobbies WHERE title = 'Melhoria da Merenda Escolar em Minas Gerais'");
let lobby3Id;
if (existL3.length === 0) {
  const [r] = await conn.execute(
    `INSERT INTO lobbies (userId, title, description, objective, category, status, constitutionArticleId,
      locationCity, locationState,
      petitionCategory, goalCount, lobbyStatus, supportCount, viewCount,
      evidenceUrls, targetParlamentarians)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      userId3,
      "Melhoria da Merenda Escolar em Minas Gerais",
      "Pesquisa realizada pelo Conselho Estadual de Educação de Minas Gerais revelou que 30% das escolas da rede pública estadual servem merenda inadequada, com cardápios abaixo dos padrões nutricionais do PNAE (Programa Nacional de Alimentação Escolar). Em 847 escolas, alunos recebem apenas pão e achocolatado no almoço. Crianças em fase de desenvolvimento têm seu aprendizado comprometido pela desnutrição.",
      "Exigir que a Assembleia Legislativa de Minas Gerais aprove legislação que obrigue o Estado a cumprir integralmente os padrões nutricionais do PNAE em todas as escolas públicas estaduais, com fiscalização trimestral e publicação dos cardápios no Portal da Transparência, conforme o Art. 208 da Constituição Federal.",
      "local",
      "active",
      art208Id,
      "Belo Horizonte",
      "MG",
      "education",
      10000,
      "processing",
      7823,
      32100,
      JSON.stringify(["https://cee.mg.gov.br/pesquisa-merenda-2025.pdf"]),
      JSON.stringify(["Assembleia Legislativa de MG", "Secretaria Estadual de Educação MG", "Dep. Estadual Ana Paula Siqueira"])
    ]
  );
  lobby3Id = r.insertId;
  console.log(`✅ Lobby 3 (Merenda Escolar) inserido com id=${lobby3Id}`);

  // Milestones
  await conn.execute(
    "INSERT INTO lobby_milestones (lobbyId, targetCount, title, description, reward, reachedAt) VALUES (?, ?, ?, ?, ?, NOW())",
    [lobby3Id, 500, "500 apoios", "Entrega de abaixo-assinado à Secretaria de Educação", "Protocolo entregue em 10/12/2025"]
  );
  await conn.execute(
    "INSERT INTO lobby_milestones (lobbyId, targetCount, title, description, reward, reachedAt) VALUES (?, ?, ?, ?, ?, NOW())",
    [lobby3Id, 2000, "2.000 apoios", "Audiência na Assembleia Legislativa", "Audiência pública realizada em 20/01/2026"]
  );
  await conn.execute(
    "INSERT INTO lobby_milestones (lobbyId, targetCount, title, description, reward, reachedAt) VALUES (?, ?, ?, ?, ?, NOW())",
    [lobby3Id, 5000, "5.000 apoios", "Projeto de lei apresentado na ALMG", "PL 456/2026 em 2ª leitura"]
  );
  await conn.execute(
    "INSERT INTO lobby_milestones (lobbyId, targetCount, title, description, reward) VALUES (?, ?, ?, ?, ?)",
    [lobby3Id, 10000, "10.000 apoios — Meta final", "Pressão para votação em plenário da ALMG", "Aprovação do PL garantida"]
  );

  // Timeline
  await conn.execute(
    "INSERT INTO lobby_timeline (lobbyId, type, title, description) VALUES (?, ?, ?, ?)",
    [lobby3Id, "created", "Lobby criado", "Ana Oliveira iniciou o lobby após pesquisa do Conselho Estadual de Educação."]
  );
  await conn.execute(
    "INSERT INTO lobby_timeline (lobbyId, type, title, description) VALUES (?, ?, ?, ?)",
    [lobby3Id, "milestone", "2.000 apoios — Audiência na ALMG", "Deputados estaduais se comprometeram a analisar o projeto."]
  );
  await conn.execute(
    "INSERT INTO lobby_timeline (lobbyId, type, title, description) VALUES (?, ?, ?, ?)",
    [lobby3Id, "update", "PL 456/2026 em tramitação", "Projeto de lei apresentado pela Dep. Ana Paula Siqueira está em 2ª leitura."]
  );
  await conn.execute(
    "INSERT INTO lobby_timeline (lobbyId, type, title, description) VALUES (?, ?, ?, ?)",
    [lobby3Id, "milestone", "5.000 apoios atingidos", "Lobby ultrapassa metade da meta com apoio de sindicatos de professores."]
  );
} else {
  lobby3Id = existL3[0].id;
  console.log(`ℹ️  Lobby 3 já existe com id=${lobby3Id}`);
}

// ─── Apoios de exemplo ────────────────────────────────────────────────────────
const supportPairs = [
  [userId4, lobby1Id], [userId5, lobby1Id],
  [userId1, lobby2Id], [userId4, lobby2Id], [userId5, lobby2Id],
  [userId1, lobby3Id], [userId2, lobby3Id], [userId4, lobby3Id],
];
for (const [uid, lid] of supportPairs) {
  const [ex] = await conn.execute("SELECT id FROM lobby_supports WHERE userId=? AND lobbyId=?", [uid, lid]);
  if (ex.length === 0) {
    await conn.execute("INSERT INTO lobby_supports (userId, lobbyId) VALUES (?, ?)", [uid, lid]);
  }
}
console.log("✅ Apoios de exemplo inseridos");

// ─── Pressões de exemplo ──────────────────────────────────────────────────────
const pressurePairs = [
  [userId1, lobby2Id, "whatsapp"], [userId4, lobby2Id, "email"],
  [userId2, lobby3Id, "twitter"], [userId5, lobby3Id, "whatsapp"],
];
for (const [uid, lid, ch] of pressurePairs) {
  await conn.execute("INSERT INTO pressure_actions (userId, lobbyId, channel) VALUES (?, ?, ?)", [uid, lid, ch]);
}
console.log("✅ Pressões de exemplo inseridas");

// ─── Comunidades de exemplo ───────────────────────────────────────────────────
const [existC1] = await conn.execute("SELECT id FROM communities WHERE name = 'Moradores do Centro SP'");
let comm1Id;
if (existC1.length === 0) {
  const [r] = await conn.execute(
    "INSERT INTO communities (lobbyId, name, description, theme) VALUES (?, ?, ?, ?)",
    [lobby1Id, "Moradores do Centro SP", "Comunidade de moradores do Centro de São Paulo organizados para melhorar a infraestrutura e segurança do bairro.", "security"]
  );
  comm1Id = r.insertId;
  // Canal padrão
  await conn.execute(
    "INSERT INTO community_channels (communityId, name, slug, description, isDefault) VALUES (?, ?, ?, ?, ?)",
    [comm1Id, "Geral", "geral", "Canal principal da comunidade", true]
  );
  await conn.execute(
    "INSERT INTO community_channels (communityId, name, slug, description) VALUES (?, ?, ?, ?)",
    [comm1Id, "Denúncias", "denuncias", "Registre ocorrências e problemas da região"]
  );
  // Membros
  await conn.execute("INSERT INTO community_members (communityId, userId, role) VALUES (?, ?, ?)", [comm1Id, userId1, "admin"]);
  await conn.execute("INSERT INTO community_members (communityId, userId, role) VALUES (?, ?, ?)", [comm1Id, userId4, "member"]);
  console.log(`✅ Comunidade 1 (Moradores Centro SP) inserida com id=${comm1Id}`);
} else {
  comm1Id = existC1[0].id;
  console.log(`ℹ️  Comunidade 1 já existe com id=${comm1Id}`);
}

const [existC2] = await conn.execute("SELECT id FROM communities WHERE name = 'Frente Nacional pela Transparência'");
let comm2Id;
if (existC2.length === 0) {
  const [r] = await conn.execute(
    "INSERT INTO communities (lobbyId, name, description, theme) VALUES (?, ?, ?, ?)",
    [lobby2Id, "Frente Nacional pela Transparência", "Rede de cidadãos e organizações que lutam por maior transparência nos gastos públicos e combate à corrupção em contratos governamentais.", "transparency"]
  );
  comm2Id = r.insertId;
  await conn.execute(
    "INSERT INTO community_channels (communityId, name, slug, description, isDefault) VALUES (?, ?, ?, ?, ?)",
    [comm2Id, "Geral", "geral", "Canal principal", true]
  );
  await conn.execute(
    "INSERT INTO community_channels (communityId, name, slug, description) VALUES (?, ?, ?, ?)",
    [comm2Id, "Acompanhamento PL", "acompanhamento-pl", "Atualizações sobre o PL 1234/2026"]
  );
  await conn.execute(
    "INSERT INTO community_channels (communityId, name, slug, description) VALUES (?, ?, ?, ?)",
    [comm2Id, "Dados e Evidências", "dados-evidencias", "Compartilhe dados e documentos sobre superfaturamento"]
  );
  await conn.execute("INSERT INTO community_members (communityId, userId, role) VALUES (?, ?, ?)", [comm2Id, userId2, "admin"]);
  await conn.execute("INSERT INTO community_members (communityId, userId, role) VALUES (?, ?, ?)", [comm2Id, userId1, "member"]);
  await conn.execute("INSERT INTO community_members (communityId, userId, role) VALUES (?, ?, ?)", [comm2Id, userId4, "member"]);
  console.log(`✅ Comunidade 2 (Frente Transparência) inserida com id=${comm2Id}`);
} else {
  comm2Id = existC2[0].id;
  console.log(`ℹ️  Comunidade 2 já existe com id=${comm2Id}`);
}

const [existC3] = await conn.execute("SELECT id FROM communities WHERE name = 'Educação MG em Ação'");
let comm3Id;
if (existC3.length === 0) {
  const [r] = await conn.execute(
    "INSERT INTO communities (lobbyId, name, description, theme) VALUES (?, ?, ?, ?)",
    [lobby3Id, "Educação MG em Ação", "Pais, professores e estudantes de Minas Gerais unidos pela melhoria da qualidade da educação pública estadual, com foco em alimentação, infraestrutura e valorização docente.", "education"]
  );
  comm3Id = r.insertId;
  await conn.execute(
    "INSERT INTO community_channels (communityId, name, slug, description, isDefault) VALUES (?, ?, ?, ?, ?)",
    [comm3Id, "Geral", "geral", "Canal principal", true]
  );
  await conn.execute(
    "INSERT INTO community_channels (communityId, name, slug, description) VALUES (?, ?, ?, ?)",
    [comm3Id, "Relatos de Escolas", "relatos-escolas", "Compartilhe a realidade da sua escola"]
  );
  await conn.execute("INSERT INTO community_members (communityId, userId, role) VALUES (?, ?, ?)", [comm3Id, userId3, "admin"]);
  await conn.execute("INSERT INTO community_members (communityId, userId, role) VALUES (?, ?, ?)", [comm3Id, userId2, "member"]);
  await conn.execute("INSERT INTO community_members (communityId, userId, role) VALUES (?, ?, ?)", [comm3Id, userId5, "member"]);
  console.log(`✅ Comunidade 3 (Educação MG) inserida com id=${comm3Id}`);
} else {
  comm3Id = existC3[0].id;
  console.log(`ℹ️  Comunidade 3 já existe com id=${comm3Id}`);
}

// ─── Posts no fórum das comunidades ──────────────────────────────────────────
const [existP1] = await conn.execute("SELECT id FROM forum_posts WHERE title = 'Fotos da praça às 20h — situação preocupante'");
if (existP1.length === 0) {
  const [r] = await conn.execute(
    "INSERT INTO forum_posts (communityId, userId, title, content, isPinned) VALUES (?, ?, ?, ?, ?)",
    [comm1Id, userId1, "Fotos da praça às 20h — situação preocupante",
      "Tirei essas fotos ontem à noite. A praça está completamente escura, apenas a luz dos celulares ilumina o caminho. Já vi pelo menos 3 famílias desviarem o caminho para evitar passar por ali. Precisamos de mais apoios urgente!\n\nBoletim de ocorrência do último assalto: BO nº 2025/089234 — 1ª DP Centro SP.",
      true]
  );
  await conn.execute(
    "INSERT INTO forum_comments (postId, userId, content) VALUES (?, ?, ?)",
    [r.insertId, userId4, "Moro a 2 quadras dali. Confirmado, está muito perigoso. Já assinei e compartilhei com todos os vizinhos."]
  );
  await conn.execute(
    "INSERT INTO forum_comments (postId, userId, content) VALUES (?, ?, ?)",
    [r.insertId, userId5, "Entrei em contato com a Subprefeitura. Eles disseram que a licitação para reparo está prevista para março. Precisamos pressionar para antecipar."]
  );
  console.log("✅ Post 1 (Praça) inserido");
}

const [existP2] = await conn.execute("SELECT id FROM forum_posts WHERE title = 'PL 1234/2026 — Análise completa do texto'");
if (existP2.length === 0) {
  const [r] = await conn.execute(
    "INSERT INTO forum_posts (communityId, userId, title, content, isPinned) VALUES (?, ?, ?, ?, ?)",
    [comm2Id, userId2, "PL 1234/2026 — Análise completa do texto",
      "Fizemos uma análise detalhada do PL 1234/2026 apresentado pelo Dep. Carlos Henrique. O texto incorpora 4 das 6 demandas do nosso lobby:\n\n✅ Licitação eletrônica obrigatória acima de R$ 50k\n✅ Publicação em tempo real no Portal da Transparência\n✅ Punição de 5 a 10 anos para fraudes comprovadas\n✅ Auditoria independente para contratos acima de R$ 1M\n❌ Prazo de 90 dias para implementação (pedimos 30)\n❌ Extensão para municípios (ficou só para União e Estados)\n\nVamos continuar pressionando para melhorar o texto nas emendas!",
      true]
  );
  await conn.execute(
    "INSERT INTO forum_comments (postId, userId, content) VALUES (?, ?, ?)",
    [r.insertId, userId1, "Excelente análise! Vamos organizar uma campanha específica para os dois pontos que ficaram de fora."]
  );
  await conn.execute(
    "INSERT INTO forum_comments (postId, userId, content) VALUES (?, ?, ?)",
    [r.insertId, userId4, "Compartilhei com o grupo de advogados do TCU. Eles querem se juntar ao lobby para a fase de emendas."]
  );
  console.log("✅ Post 2 (PL Licitações) inserido");
}

const [existP3] = await conn.execute("SELECT id FROM forum_posts WHERE title = 'Relato: escola em Uberlândia serve só pão e achocolatado'");
if (existP3.length === 0) {
  const [r] = await conn.execute(
    "INSERT INTO forum_posts (communityId, userId, title, content, isPinned) VALUES (?, ?, ?, ?, ?)",
    [comm3Id, userId3, "Relato: escola em Uberlândia serve só pão e achocolatado",
      "Minha filha estuda na E.E. Prof. João Batista, em Uberlândia. Há 3 meses o cardápio do almoço é pão francês + achocolatado. A diretora disse que o repasse do Estado atrasou e não tem verba para comprar os ingredientes do cardápio completo.\n\nIsso é inconstitucional. O Art. 208 garante atendimento ao educando com programas suplementares de alimentação. Quem mais tem relatos assim? Precisamos documentar tudo para o processo na ALMG.",
      false]
  );
  await conn.execute(
    "INSERT INTO forum_comments (postId, userId, content) VALUES (?, ?, ?)",
    [r.insertId, userId2, "Situação idêntica em Montes Claros. Escola Estadual Dom Bosco — cardápio reduzido há 4 meses. Já registrei na Ouvidoria da SEE-MG."]
  );
  await conn.execute(
    "INSERT INTO forum_comments (postId, userId, content) VALUES (?, ?, ?)",
    [r.insertId, userId5, "Vou incluir esses relatos no dossiê que estamos preparando para a audiência na ALMG. Por favor, enviem os nomes das escolas e datas para o canal #relatos-escolas."]
  );
  console.log("✅ Post 3 (Merenda MG) inserido");
}

// ─── Smart Milestones ─────────────────────────────────────────────────────────
const [existSM1] = await conn.execute("SELECT id FROM smart_milestones WHERE lobbyId=? AND targetCount=500", [lobby1Id]);
if (existSM1.length === 0) {
  await conn.execute(
    "INSERT INTO smart_milestones (lobbyId, targetCount, action, description) VALUES (?, ?, ?, ?)",
    [lobby1Id, 500, "Solicitar audiência com o Vereador do bairro", "Com 500 apoios, temos base suficiente para exigir uma reunião formal com o vereador responsável pela região."]
  );
  await conn.execute(
    "INSERT INTO smart_milestones (lobbyId, targetCount, action, description) VALUES (?, ?, ?, ?)",
    [lobby1Id, 1000, "Protocolar ofício na Câmara Municipal de SP", "Meta final: protocolar ofício formal exigindo prazo de 30 dias para a obra."]
  );
}

const [existSM2] = await conn.execute("SELECT id FROM smart_milestones WHERE lobbyId=? AND targetCount=40000", [lobby2Id]);
if (existSM2.length === 0) {
  await conn.execute(
    "INSERT INTO smart_milestones (lobbyId, targetCount, action, description, achieved, achievedAt) VALUES (?, ?, ?, ?, ?, NOW())",
    [lobby2Id, 10000, "Audiência pública na Câmara dos Deputados", "Solicitar audiência formal com a Comissão de Finanças.", true]
  );
  await conn.execute(
    "INSERT INTO smart_milestones (lobbyId, targetCount, action, description) VALUES (?, ?, ?, ?)",
    [lobby2Id, 40000, "Pressão para votação em regime de urgência", "Com 40.000 apoios, solicitar ao Presidente da Câmara que o PL entre em regime de urgência."]
  );
  await conn.execute(
    "INSERT INTO smart_milestones (lobbyId, targetCount, action, description) VALUES (?, ?, ?, ?)",
    [lobby2Id, 50000, "Envio de manifesto ao Senado Federal", "Após aprovação na Câmara, pressionar o Senado para aprovação sem emendas."]
  );
}

// ─── Plebiscito nacional de exemplo ──────────────────────────────────────────
const [existNP] = await conn.execute("SELECT id FROM national_plebiscites WHERE title LIKE '%maioridade%'");
if (existNP.length === 0) {
  await conn.execute(
    `INSERT INTO national_plebiscites (title, description, category, status, yesVotes, noVotes, endsAt)
     VALUES (?, ?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 30 DAY))`,
    [
      "Redução da maioridade penal para 16 anos",
      "A população é a favor da redução da maioridade penal de 18 para 16 anos para crimes hediondos, como homicídio doloso e estupro? Esta consulta popular será encaminhada à Câmara dos Deputados como manifestação organizada da sociedade civil.",
      "security",
      "active",
      234567,
      189432
    ]
  );
  console.log("✅ Plebiscito nacional (maioridade penal) inserido");
}

// ─── Power Metrics ────────────────────────────────────────────────────────────
const [existPM] = await conn.execute("SELECT id FROM power_metrics LIMIT 1");
if (existPM.length === 0) {
  await conn.execute(
    `INSERT INTO power_metrics (totalCitizens, electoratePercent, billsInfluenced, victories)
     VALUES (?, ?, ?, ?)`,
    [1000000, 2.00, 15, 7]
  );
  console.log("✅ Power metrics inserido");
} else {
  await conn.execute(
    "UPDATE power_metrics SET totalCitizens=?, electoratePercent=?, billsInfluenced=?, victories=? WHERE id=?",
    [1000000, 2.00, 15, 7, existPM[0].id]
  );
  console.log("✅ Power metrics atualizado");
}

await conn.end();
console.log("\n🎉 Seed concluído com sucesso! Os 3 lobbys de exemplo estão disponíveis no app.");
