/**
 * Serviço de integração com APIs públicas do Congresso Nacional Brasileiro
 * - Câmara dos Deputados: https://dadosabertos.camara.leg.br/api/v2
 * - Senado Federal: https://legis.senado.leg.br/dadosabertos
 */

const CAMARA_BASE = "https://dadosabertos.camara.leg.br/api/v2";
const SENADO_BASE = "https://legis.senado.leg.br/dadosabertos";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface Bill {
  id: string;
  type: string;
  number: string;
  year: number;
  title: string;
  summary: string;
  author: string;
  party?: string;
  state?: string;
  status: string;
  committee?: string;
  lastUpdate: string;
  url: string;
  house: "camara" | "senado";
}

export interface VotingRecord {
  billId: string;
  billTitle: string;
  date: string;
  vote: "sim" | "nao" | "abstencao" | "ausente";
  result: string;
}

export interface Deputy {
  id: string;
  name: string;
  party: string;
  state: string;
  photoUrl?: string;
  email?: string;
  phone?: string;
  committees: string[];
  fronts: string[];
}

export interface Committee {
  id: string;
  name: string;
  acronym: string;
  members: Array<{ name: string; party: string; state: string; role: string }>;
}

export interface ParliamentaryFront {
  id: string;
  title: string;
  memberCount: number;
  coordinator: string;
  theme: string;
}

export interface UpcomingVote {
  id: string;
  title: string;
  date: string;
  time: string;
  house: "camara" | "senado";
  committee?: string;
  description: string;
  urgency: "normal" | "urgente" | "urgentissima";
}

// ─── Câmara dos Deputados ─────────────────────────────────────────────────────

async function fetchCamara<T>(path: string, params?: Record<string, string>): Promise<T | null> {
  try {
    const url = new URL(`${CAMARA_BASE}${path}`);
    if (params) {
      Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    }
    url.searchParams.set("formato", "json");

    const res = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function searchBillsCamara(keyword: string, year?: number): Promise<Bill[]> {
  const params: Record<string, string> = {
    keywords: keyword,
    itens: "20",
    ordem: "DESC",
    ordenarPor: "dataApresentacao",
  };
  if (year) params.ano = String(year);

  const data = await fetchCamara<{ dados: Array<Record<string, unknown>> }>("/proposicoes", params);
  if (!data?.dados) return [];

  return data.dados.map((p) => ({
    id: String(p.id),
    type: String(p.siglaTipo ?? "PL"),
    number: String(p.numero ?? ""),
    year: Number(p.ano ?? new Date().getFullYear()),
    title: String(p.ementa ?? "Sem ementa"),
    summary: String(p.ementa ?? ""),
    author: String((p as Record<string, unknown>).autor ?? "Não informado"),
    status: "Em tramitação",
    lastUpdate: String(p.dataApresentacao ?? ""),
    url: `https://www.camara.leg.br/proposicoesWeb/fichadetramitacao?idProposicao=${p.id}`,
    house: "camara" as const,
  }));
}

export async function getBillDetailCamara(id: string): Promise<Bill | null> {
  const data = await fetchCamara<{ dados: Record<string, unknown> }>(`/proposicoes/${id}`);
  if (!data?.dados) return null;

  const p = data.dados;
  return {
    id: String(p.id),
    type: String(p.siglaTipo ?? "PL"),
    number: String(p.numero ?? ""),
    year: Number(p.ano ?? new Date().getFullYear()),
    title: String(p.ementa ?? "Sem ementa"),
    summary: String(p.ementaDetalhada ?? p.ementa ?? ""),
    author: String(p.autor ?? "Não informado"),
    status: String(p.statusProposicao ?? "Em tramitação"),
    committee: String(p.orgaoNumerador ?? ""),
    lastUpdate: String(p.dataUltimaAberturaFase ?? ""),
    url: `https://www.camara.leg.br/proposicoesWeb/fichadetramitacao?idProposicao=${p.id}`,
    house: "camara",
  };
}

export async function getDeputies(state?: string, party?: string): Promise<Deputy[]> {
  const params: Record<string, string> = { itens: "50", ordem: "ASC", ordenarPor: "nome" };
  if (state) params.siglaUf = state;
  if (party) params.siglaPartido = party;

  const data = await fetchCamara<{ dados: Array<Record<string, unknown>> }>("/deputados", params);
  if (!data?.dados) return [];

  return data.dados.map((d) => ({
    id: String(d.id),
    name: String(d.nome ?? ""),
    party: String(d.siglaPartido ?? ""),
    state: String(d.siglaUf ?? ""),
    photoUrl: String(d.urlFoto ?? ""),
    email: String(d.email ?? ""),
    committees: [],
    fronts: [],
  }));
}

export async function getDeputyVotingHistory(deputyId: string): Promise<VotingRecord[]> {
  const data = await fetchCamara<{ dados: Array<Record<string, unknown>> }>(
    `/deputados/${deputyId}/votacoes`,
    { itens: "20" }
  );
  if (!data?.dados) return [];

  return data.dados.map((v) => ({
    billId: String(v.proposicaoObjeto ?? ""),
    billTitle: String(v.descricao ?? "Votação"),
    date: String(v.dataHoraVoto ?? ""),
    vote: (String(v.voto ?? "ausente").toLowerCase() as VotingRecord["vote"]) || "ausente",
    result: String(v.tipoVoto ?? ""),
  }));
}

export async function getCommittees(): Promise<Committee[]> {
  const data = await fetchCamara<{ dados: Array<Record<string, unknown>> }>(
    "/orgaos",
    { codTipoOrgao: "2", itens: "30" }
  );
  if (!data?.dados) return [];

  return data.dados.map((c) => ({
    id: String(c.id),
    name: String(c.nome ?? ""),
    acronym: String(c.sigla ?? ""),
    members: [],
  }));
}

export async function getParliamentaryFronts(): Promise<ParliamentaryFront[]> {
  const data = await fetchCamara<{ dados: Array<Record<string, unknown>> }>(
    "/frentes",
    { itens: "20" }
  );
  if (!data?.dados) return [];

  return data.dados.map((f) => ({
    id: String(f.id),
    title: String(f.titulo ?? ""),
    memberCount: Number(f.quantidadeIntegrantes ?? 0),
    coordinator: String(f.coordenador ?? "Não informado"),
    theme: String(f.titulo ?? ""),
  }));
}

export async function getUpcomingVotesCamara(): Promise<UpcomingVote[]> {
  const data = await fetchCamara<{ dados: Array<Record<string, unknown>> }>(
    "/votacoes",
    { itens: "10", ordem: "DESC", ordenarPor: "dataHoraInicio" }
  );
  if (!data?.dados) return [];

  return data.dados.map((v) => ({
    id: String(v.id),
    title: String(v.descricao ?? "Votação"),
    date: String(v.dataHoraInicio ?? "").split("T")[0] ?? "",
    time: String(v.dataHoraInicio ?? "").split("T")[1]?.slice(0, 5) ?? "",
    house: "camara" as const,
    committee: String(v.siglaOrgao ?? "Plenário"),
    description: String(v.descricao ?? ""),
    urgency: "normal" as const,
  }));
}

// ─── Senado Federal ───────────────────────────────────────────────────────────

async function fetchSenado<T>(path: string): Promise<T | null> {
  try {
    const url = `${SENADO_BASE}${path}`;
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function searchBillsSenado(keyword: string): Promise<Bill[]> {
  const data = await fetchSenado<{ PesquisaBasicaMateria: { Materias: { Materia: Array<Record<string, unknown>> } } }>(
    `/materia/pesquisa/lista?palavraChave=${encodeURIComponent(keyword)}&v=5`
  );

  const materias = data?.PesquisaBasicaMateria?.Materias?.Materia;
  if (!materias || !Array.isArray(materias)) return [];

  return materias.slice(0, 10).map((m) => {
    const ident = m.IdentificacaoMateria as Record<string, unknown> ?? {};
    return {
      id: String(ident.CodigoMateria ?? ""),
      type: String(ident.SiglaSubtipoMateria ?? "PL"),
      number: String(ident.NumeroMateria ?? ""),
      year: Number(ident.AnoMateria ?? new Date().getFullYear()),
      title: String(ident.EmentaMateria ?? "Sem ementa"),
      summary: String(ident.EmentaMateria ?? ""),
      author: String(ident.NomeAutor ?? "Não informado"),
      status: "Em tramitação",
      lastUpdate: String(ident.DataApresentacao ?? ""),
      url: `https://www25.senado.leg.br/web/atividade/materias/-/materia/${ident.CodigoMateria}`,
      house: "senado" as const,
    };
  });
}

// ─── Funções combinadas ───────────────────────────────────────────────────────

export async function searchAllBills(keyword: string): Promise<Bill[]> {
  const [camara, senado] = await Promise.allSettled([
    searchBillsCamara(keyword),
    searchBillsSenado(keyword),
  ]);

  const camaraResults = camara.status === "fulfilled" ? camara.value : [];
  const senadoResults = senado.status === "fulfilled" ? senado.value : [];

  return [...camaraResults, ...senadoResults];
}

// ─── Dados de fallback (quando API está offline) ──────────────────────────────

export function getFallbackBills(keyword: string): Bill[] {
  const bills: Bill[] = [
    {
      id: "fallback-1",
      type: "PL",
      number: "1234",
      year: 2024,
      title: `Projeto de lei sobre ${keyword} — Câmara dos Deputados`,
      summary: `Dispõe sobre medidas relacionadas a ${keyword}, visando melhorar as condições de vida da população brasileira.`,
      author: "Dep. João Silva (PT/SP)",
      party: "PT",
      state: "SP",
      status: "Em tramitação na Comissão de Constituição e Justiça",
      committee: "CCJ",
      lastUpdate: "2024-11-15",
      url: "https://www.camara.leg.br",
      house: "camara",
    },
    {
      id: "fallback-2",
      type: "PLS",
      number: "567",
      year: 2024,
      title: `Projeto de Lei do Senado sobre ${keyword}`,
      summary: `Altera a legislação vigente para incluir disposições sobre ${keyword}, fortalecendo os direitos dos cidadãos.`,
      author: "Sen. Maria Santos (PSDB/MG)",
      party: "PSDB",
      state: "MG",
      status: "Aprovado na Comissão de Direitos Humanos",
      committee: "CDH",
      lastUpdate: "2024-10-20",
      url: "https://www25.senado.leg.br",
      house: "senado",
    },
    {
      id: "fallback-3",
      type: "PEC",
      number: "45",
      year: 2023,
      title: `Proposta de Emenda Constitucional sobre ${keyword}`,
      summary: `Modifica a Constituição Federal para garantir direitos relacionados a ${keyword} como direito fundamental.`,
      author: "Dep. Carlos Oliveira (MDB/RJ)",
      party: "MDB",
      state: "RJ",
      status: "Aguardando votação em plenário",
      committee: "Plenário",
      lastUpdate: "2024-09-05",
      url: "https://www.camara.leg.br",
      house: "camara",
    },
  ];
  return bills;
}

export function getFallbackUpcomingVotes(): UpcomingVote[] {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 5);

  return [
    {
      id: "vote-1",
      title: "PL 1234/2024 — Reforma da Lei de Licitações",
      date: tomorrow.toISOString().split("T")[0],
      time: "14:00",
      house: "camara",
      committee: "Plenário",
      description: "Votação em segundo turno do projeto que moderniza as regras de licitação pública.",
      urgency: "urgente",
    },
    {
      id: "vote-2",
      title: "PLS 567/2024 — Ampliação do Orçamento do SUS",
      date: nextWeek.toISOString().split("T")[0],
      time: "10:00",
      house: "senado",
      committee: "Comissão de Saúde",
      description: "Projeto que aumenta o percentual mínimo de recursos destinados à saúde pública.",
      urgency: "normal",
    },
    {
      id: "vote-3",
      title: "PEC 45/2023 — Direito à Mobilidade Urbana",
      date: nextWeek.toISOString().split("T")[0],
      time: "15:30",
      house: "camara",
      committee: "CCJ",
      description: "Proposta que inclui o direito à mobilidade urbana segura como direito fundamental.",
      urgency: "urgentissima",
    },
  ];
}

export function getFallbackDeputies(state?: string): Deputy[] {
  const deputies: Deputy[] = [
    {
      id: "dep-1",
      name: "João Carlos Silva",
      party: "PT",
      state: state ?? "SP",
      photoUrl: "",
      email: "dep.joaosilva@camara.leg.br",
      committees: ["Comissão de Saúde", "Comissão de Direitos Humanos"],
      fronts: ["Frente Parlamentar da Saúde", "Frente em Defesa do SUS"],
    },
    {
      id: "dep-2",
      name: "Maria Aparecida Santos",
      party: "PSDB",
      state: state ?? "MG",
      photoUrl: "",
      email: "dep.mariasantos@camara.leg.br",
      committees: ["Comissão de Infraestrutura", "Comissão de Meio Ambiente"],
      fronts: ["Frente Parlamentar de Infraestrutura Urbana"],
    },
    {
      id: "dep-3",
      name: "Carlos Eduardo Oliveira",
      party: "MDB",
      state: state ?? "RJ",
      photoUrl: "",
      email: "dep.carlosoliveira@camara.leg.br",
      committees: ["Comissão de Finanças", "Comissão de Tributação"],
      fronts: ["Frente Parlamentar da Reforma Tributária"],
    },
    {
      id: "dep-4",
      name: "Ana Paula Ferreira",
      party: "PSD",
      state: state ?? "RS",
      photoUrl: "",
      email: "dep.anaferreira@camara.leg.br",
      committees: ["Comissão de Educação", "Comissão de Cultura"],
      fronts: ["Frente Parlamentar da Educação Pública"],
    },
    {
      id: "dep-5",
      name: "Roberto Mendes Costa",
      party: "PP",
      state: state ?? "BA",
      photoUrl: "",
      email: "dep.robertocosta@camara.leg.br",
      committees: ["Comissão de Segurança Pública"],
      fronts: ["Frente Parlamentar da Segurança Pública"],
    },
  ];
  return deputies;
}

export function getFallbackCommittees(): Committee[] {
  return [
    {
      id: "ccj",
      name: "Comissão de Constituição e Justiça e de Cidadania",
      acronym: "CCJ",
      members: [
        { name: "Dep. Arthur Lira", party: "PP", state: "AL", role: "Presidente" },
        { name: "Dep. Gleisi Hoffmann", party: "PT", state: "PR", role: "Vice-Presidente" },
        { name: "Dep. Baleia Rossi", party: "MDB", state: "SP", role: "Membro" },
      ],
    },
    {
      id: "cspcco",
      name: "Comissão de Segurança Pública e Combate ao Crime Organizado",
      acronym: "CSPCCO",
      members: [
        { name: "Dep. Alberto Fraga", party: "PL", state: "DF", role: "Presidente" },
        { name: "Dep. Delegado Ramagem", party: "PL", state: "RJ", role: "Vice-Presidente" },
      ],
    },
    {
      id: "cssf",
      name: "Comissão de Seguridade Social e Família",
      acronym: "CSSF",
      members: [
        { name: "Dep. Carmen Zanotto", party: "Cidadania", state: "SC", role: "Presidente" },
        { name: "Dep. Soraya Manoel", party: "PL", state: "MT", role: "Membro" },
      ],
    },
    {
      id: "cinfra",
      name: "Comissão de Infraestrutura",
      acronym: "CI",
      members: [
        { name: "Dep. Danilo Forte", party: "União", state: "CE", role: "Presidente" },
        { name: "Dep. Júlio Lopes", party: "PP", state: "RJ", role: "Vice-Presidente" },
      ],
    },
  ];
}

export function getFallbackParliamentaryFronts(): ParliamentaryFront[] {
  return [
    { id: "fps", title: "Frente Parlamentar da Saúde", memberCount: 312, coordinator: "Dep. Carmen Zanotto", theme: "Saúde" },
    { id: "fpe", title: "Frente Parlamentar da Educação", memberCount: 287, coordinator: "Dep. Professora Dorinha", theme: "Educação" },
    { id: "fpsp", title: "Frente Parlamentar da Segurança Pública", memberCount: 198, coordinator: "Dep. Alberto Fraga", theme: "Segurança Pública" },
    { id: "fpma", title: "Frente Parlamentar Ambientalista", memberCount: 176, coordinator: "Dep. Rodrigo Agostinho", theme: "Meio Ambiente" },
    { id: "fprt", title: "Frente Parlamentar pela Reforma Tributária", memberCount: 256, coordinator: "Dep. Aguinaldo Ribeiro", theme: "Economia e Tributos" },
    { id: "fpiu", title: "Frente Parlamentar de Infraestrutura Urbana", memberCount: 143, coordinator: "Dep. Danilo Forte", theme: "Infraestrutura Urbana" },
  ];
}

// ─── Senado Federal — Senadores ───────────────────────────────────────────────

export interface Senator {
  id: string;
  name: string;
  fullName: string;
  party: string;
  state: string;
  photoUrl?: string;
  email?: string;
  phone?: string;
  pageUrl?: string;
  gender: string;
  bloc?: string;
  mandateEnd?: string;
}

export async function getSenators(state?: string): Promise<Senator[]> {
  const data = await fetchSenado<any>("/senador/lista/atual");
  if (!data) return [];
  try {
    const parlamentares: any[] = data?.ListaParlamentarEmExercicio?.Parlamentares?.Parlamentar ?? [];
    let senators: Senator[] = parlamentares.map((p: any) => {
      const id_ = p.IdentificacaoParlamentar;
      const mandato = p.Mandato;
      const phones: any[] = id_?.Telefones?.Telefone ?? [];
      const phone = Array.isArray(phones) ? (phones[0] as any)?.NumeroTelefone : (phones as any)?.NumeroTelefone;
      return {
        id: id_?.CodigoParlamentar ?? "",
        name: id_?.NomeParlamentar ?? "",
        fullName: id_?.NomeCompletoParlamentar ?? "",
        party: id_?.SiglaPartidoParlamentar ?? "",
        state: id_?.UfParlamentar ?? "",
        photoUrl: id_?.UrlFotoParlamentar,
        email: id_?.EmailParlamentar,
        phone: phone ? `(61) ${phone}` : undefined,
        pageUrl: id_?.UrlPaginaParlamentar,
        gender: id_?.SexoParlamentar === "Feminino" ? "F" : "M",
        bloc: id_?.Bloco?.NomeBloco,
        mandateEnd: mandato?.PrimeiraLegislaturaDoMandato?.DataFim,
      };
    });
    if (state) senators = senators.filter((s) => s.state === state);
    return senators;
  } catch {
    return [];
  }
}

export function getFallbackSenators(state?: string): Senator[] {
  const all: Senator[] = [
    { id: "5672", name: "Alan Rick", fullName: "Alan Rick Miranda", party: "REPUBLICANOS", state: "AC", email: "sen.alanrick@senado.leg.br", phone: "(61) 33036333", gender: "M", mandateEnd: "2027-01-31" },
    { id: "5982", name: "Rodrigo Pacheco", fullName: "Rodrigo Pacheco", party: "PSD", state: "MG", email: "sen.rodrigopacheco@senado.leg.br", phone: "(61) 33036000", gender: "M", mandateEnd: "2027-01-31" },
    { id: "5322", name: "Simone Tebet", fullName: "Simone Nassar Tebet", party: "MDB", state: "MS", email: "sen.simonetebet@senado.leg.br", phone: "(61) 33036222", gender: "F", mandateEnd: "2027-01-31" },
    { id: "5529", name: "Flávio Bolsonaro", fullName: "Flávio Nantes Bolsonaro", party: "PL", state: "RJ", email: "sen.flaviobolsonaro@senado.leg.br", phone: "(61) 33036444", gender: "M", mandateEnd: "2027-01-31" },
    { id: "5936", name: "Gleisi Hoffmann", fullName: "Gleisi Helena Hoffmann", party: "PT", state: "PR", email: "sen.gleisihoffmann@senado.leg.br", phone: "(61) 33036555", gender: "F", mandateEnd: "2027-01-31" },
    { id: "6331", name: "Damares Alves", fullName: "Damares Regina Alves", party: "REPUBLICANOS", state: "DF", email: "sen.damaresalves@senado.leg.br", phone: "(61) 33036666", gender: "F", mandateEnd: "2027-01-31" },
    { id: "5987", name: "Sérgio Moro", fullName: "Sérgio Fernando Moro", party: "UNIÃO", state: "PR", email: "sen.sergiomoro@senado.leg.br", phone: "(61) 33036777", gender: "M", mandateEnd: "2027-01-31" },
    { id: "5010", name: "Renan Calheiros", fullName: "Renan Waldeck Calheiros", party: "MDB", state: "AL", email: "sen.renancalheiros@senado.leg.br", phone: "(61) 33036888", gender: "M", mandateEnd: "2027-01-31" },
    { id: "5988", name: "Randolfe Rodrigues", fullName: "Randolfe Rodrigues", party: "PT", state: "AP", email: "sen.randolfe@senado.leg.br", phone: "(61) 33036999", gender: "M", mandateEnd: "2027-01-31" },
    { id: "5989", name: "Ciro Nogueira", fullName: "Ciro Nogueira Lima", party: "PP", state: "PI", email: "sen.cironogueira@senado.leg.br", phone: "(61) 33037000", gender: "M", mandateEnd: "2027-01-31" },
  ];
  if (state) return all.filter((s) => s.state === state);
  return all;
}
