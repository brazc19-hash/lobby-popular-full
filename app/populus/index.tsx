import { useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { BackButton } from "@/components/ui/back-button";
import { trpc } from "@/lib/trpc";
import { useColors } from "@/hooks/use-colors";
import { useTour } from "@/contexts/tour-context";

type Tab = "chat" | "legal" | "evidence" | "content" | "impact" | "political";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "chat", label: "Chat", icon: "💬" },
  { id: "legal", label: "Jurídico", icon: "⚖️" },
  { id: "evidence", label: "Evidências", icon: "🔍" },
  { id: "content", label: "Conteúdo", icon: "📢" },
  { id: "impact", label: "Impacto", icon: "📊" },
  { id: "political", label: "Político", icon: "🏛️" },
];

const CONTENT_FORMATS = [
  { id: "twitter", label: "Twitter/X" },
  { id: "instagram", label: "Instagram" },
  { id: "whatsapp", label: "WhatsApp" },
  { id: "email", label: "E-mail" },
  { id: "video30s", label: "Vídeo 30s" },
  { id: "video1min", label: "Vídeo 1min" },
  { id: "video3min", label: "Vídeo 3min" },
];

interface PopulusProps {
  lobbyId?: number;
  lobbyTitle?: string;
  lobbyDescription?: string;
  lobbyCategory?: string;
  lobbyLocation?: string;
  lobbyState?: string;
  lobbyCity?: string;
  supportCount?: number;
}

export default function PopulusScreen() {
  const colors = useColors();
  const { currentStep, setAiToolsLayout } = useTour();
  const aiToolsViewRef = useRef<ScrollView>(null);
  const [activeTab, setActiveTab] = useState<Tab>("chat");

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [selectedFormat, setSelectedFormat] = useState<string>("twitter");

  // Chat state
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);

  // Results
  const [legalResult, setLegalResult] = useState<any>(null);
  const [evidenceResult, setEvidenceResult] = useState<any>(null);
  const [contentResult, setContentResult] = useState<any>(null);
  const [impactResult, setImpactResult] = useState<any>(null);
  const [politicalResult, setPoliticalResult] = useState<any>(null);

  // Mutations
  const legalMutation = trpc.populus.legalAnalysis.useMutation({
    onSuccess: (data) => setLegalResult(data),
  });
  const evidenceMutation = trpc.populus.evidenceCuration.useMutation({
    onSuccess: (data) => setEvidenceResult(data),
  });
  const contentMutation = trpc.populus.generateContent.useMutation({
    onSuccess: (data) => setContentResult(data),
  });
  const impactMutation = trpc.populus.impactCalculator.useMutation({
    onSuccess: (data) => setImpactResult(data),
  });
  const politicalMutation = trpc.populus.politicalScenario.useMutation({
    onSuccess: (data) => setPoliticalResult(data),
  });
  const chatMutation = trpc.populus.chat.useMutation({
    onSuccess: (data) => {
      setChatHistory((prev) => [...prev, { role: "assistant", content: data.content }]);
    },
  });

  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    const userMsg = { role: "user" as const, content: chatInput.trim() };
    const newHistory = [...chatHistory, userMsg];
    setChatHistory(newHistory);
    setChatInput("");
    chatMutation.mutate({
      messages: newHistory,
      lobbyContext: title ? { title, description, category, location } : undefined,
    });
  };

  const isLoading =
    legalMutation.isPending ||
    evidenceMutation.isPending ||
    contentMutation.isPending ||
    impactMutation.isPending ||
    politicalMutation.isPending;

  const renderFormHeader = () => (
    <View style={styles.formSection}>
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Contexto da Campanha</Text>
      <TextInput
        style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.surface }]}
        placeholder="Título do lobby/campanha"
        placeholderTextColor={colors.muted}
        value={title}
        onChangeText={setTitle}
      />
      <TextInput
        style={[styles.input, styles.inputMultiline, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.surface }]}
        placeholder="Descrição do problema e objetivo"
        placeholderTextColor={colors.muted}
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={3}
      />
      <TextInput
        style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.surface }]}
        placeholder="Categoria (ex: saúde, infraestrutura)"
        placeholderTextColor={colors.muted}
        value={category}
        onChangeText={setCategory}
      />
      <TextInput
        style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.surface }]}
        placeholder="Localização (ex: São Paulo, SP)"
        placeholderTextColor={colors.muted}
        value={location}
        onChangeText={setLocation}
      />
    </View>
  );

  const renderLegalTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {renderFormHeader()}
      <TouchableOpacity
        style={[styles.analyzeBtn, { backgroundColor: "#1a3a5c" }]}
        onPress={() => {
          if (!title || !description) return;
          legalMutation.mutate({ title, description, category });
        }}
        disabled={!title || !description || legalMutation.isPending}
      >
        {legalMutation.isPending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.analyzeBtnText}>⚖️ Analisar Juridicamente</Text>
        )}
      </TouchableOpacity>

      {legalResult && (
        <View style={styles.resultContainer}>
          <View style={[styles.probabilityCard, { backgroundColor: legalResult.successProbability >= 60 ? "#e8f5e9" : legalResult.successProbability >= 40 ? "#fff8e1" : "#ffebee" }]}>
            <Text style={styles.probabilityLabel}>Probabilidade de Sucesso Legal</Text>
            <Text style={[styles.probabilityValue, { color: legalResult.successProbability >= 60 ? "#2e7d32" : legalResult.successProbability >= 40 ? "#f57f17" : "#c62828" }]}>
              {legalResult.successProbability}%
            </Text>
          </View>

          {legalResult.summary && (
            <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>📋 Resumo</Text>
              <Text style={[styles.cardText, { color: colors.muted }]}>{legalResult.summary}</Text>
            </View>
          )}

          {legalResult.constitutionalArticles?.length > 0 && (
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>📜 Artigos Constitucionais</Text>
              {legalResult.constitutionalArticles.map((a: any, i: number) => (
                <View key={i} style={styles.listItem}>
                  <Text style={[styles.listItemTitle, { color: "#1a3a5c" }]}>{a.article}</Text>
                  <Text style={[styles.listItemText, { color: colors.muted }]}>{a.description}</Text>
                  <Text style={[styles.listItemRelevance, { color: "#2e7d32" }]}>Relevância: {a.relevance}</Text>
                </View>
              ))}
            </View>
          )}

          {legalResult.legalArguments?.length > 0 && (
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>💬 Argumentos Jurídicos</Text>
              {legalResult.legalArguments.map((arg: string, i: number) => (
                <View key={i} style={styles.bulletItem}>
                  <Text style={[styles.bullet, { color: "#1a3a5c" }]}>•</Text>
                  <Text style={[styles.bulletText, { color: colors.muted }]}>{arg}</Text>
                </View>
              ))}
            </View>
          )}

          {legalResult.federalLaws?.length > 0 && (
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>📚 Leis Federais Relacionadas</Text>
              {legalResult.federalLaws.map((law: any, i: number) => (
                <View key={i} style={styles.listItem}>
                  <Text style={[styles.listItemTitle, { color: "#1a3a5c" }]}>{law.law}</Text>
                  <Text style={[styles.listItemText, { color: colors.muted }]}>{law.description}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );

  const renderEvidenceTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {renderFormHeader()}
      <TouchableOpacity
        style={[styles.analyzeBtn, { backgroundColor: "#1a3a5c" }]}
        onPress={() => {
          if (!title || !description) return;
          evidenceMutation.mutate({ title, description, category, location });
        }}
        disabled={!title || !description || evidenceMutation.isPending}
      >
        {evidenceMutation.isPending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.analyzeBtnText}>🔍 Curar Evidências</Text>
        )}
      </TouchableOpacity>

      {evidenceResult && (
        <View style={styles.resultContainer}>
          {evidenceResult.statistics?.length > 0 && (
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>📊 Dados Estatísticos</Text>
              {evidenceResult.statistics.map((s: any, i: number) => (
                <View key={i} style={styles.listItem}>
                  <Text style={[styles.listItemTitle, { color: "#1a3a5c" }]}>{s.source}</Text>
                  <Text style={[styles.listItemText, { color: colors.muted }]}>{s.data}</Text>
                  <Text style={[styles.listItemRelevance, { color: "#2e7d32" }]}>{s.relevance}</Text>
                </View>
              ))}
            </View>
          )}

          {evidenceResult.laiQuestions?.length > 0 && (
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>📨 Perguntas para LAI</Text>
              <Text style={[styles.cardSubtitle, { color: colors.muted }]}>Lei de Acesso à Informação — solicite estes dados ao governo</Text>
              {evidenceResult.laiQuestions.map((q: string, i: number) => (
                <View key={i} style={styles.bulletItem}>
                  <Text style={[styles.bullet, { color: "#1a3a5c" }]}>{i + 1}.</Text>
                  <Text style={[styles.bulletText, { color: colors.muted }]}>{q}</Text>
                </View>
              ))}
            </View>
          )}

          {evidenceResult.documentsToCollect?.length > 0 && (
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>📁 Documentos a Coletar</Text>
              {evidenceResult.documentsToCollect.map((doc: string, i: number) => (
                <View key={i} style={styles.bulletItem}>
                  <Text style={[styles.bullet, { color: "#1a3a5c" }]}>•</Text>
                  <Text style={[styles.bulletText, { color: colors.muted }]}>{doc}</Text>
                </View>
              ))}
            </View>
          )}

          {evidenceResult.impactIndicators?.length > 0 && (
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>📈 Indicadores de Impacto</Text>
              {evidenceResult.impactIndicators.map((ind: string, i: number) => (
                <View key={i} style={styles.bulletItem}>
                  <Text style={[styles.bullet, { color: "#2e7d32" }]}>✓</Text>
                  <Text style={[styles.bulletText, { color: colors.muted }]}>{ind}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );

  const renderContentTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {renderFormHeader()}

      <View style={styles.formSection}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Formato</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.formatRow}>
            {CONTENT_FORMATS.map((f) => (
              <TouchableOpacity
                key={f.id}
                style={[
                  styles.formatChip,
                  { borderColor: colors.border, backgroundColor: selectedFormat === f.id ? "#1a3a5c" : colors.surface },
                ]}
                onPress={() => setSelectedFormat(f.id)}
              >
                <Text style={[styles.formatChipText, { color: selectedFormat === f.id ? "#fff" : colors.foreground }]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      <TouchableOpacity
        style={[styles.analyzeBtn, { backgroundColor: "#1a3a5c" }]}
        onPress={() => {
          if (!title || !description) return;
          contentMutation.mutate({ title, description, supportCount: 0, location, format: selectedFormat as any });
        }}
        disabled={!title || !description || contentMutation.isPending}
      >
        {contentMutation.isPending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.analyzeBtnText}>📢 Gerar Conteúdo</Text>
        )}
      </TouchableOpacity>

      {contentResult && (
        <View style={styles.resultContainer}>
          <View style={[styles.contentCard, { backgroundColor: "#e8f5e9", borderColor: "#a5d6a7" }]}>
            <Text style={[styles.cardTitle, { color: "#2e7d32" }]}>✅ Conteúdo Gerado</Text>
            <Text style={[styles.contentText, { color: "#1b5e20" }]}>{contentResult.content}</Text>
          </View>

          {contentResult.hashtags?.length > 0 && (
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>🏷️ Hashtags</Text>
              <View style={styles.hashtagRow}>
                {contentResult.hashtags.map((tag: string, i: number) => (
                  <View key={i} style={[styles.hashtagChip, { backgroundColor: "#e3f2fd" }]}>
                    <Text style={[styles.hashtagText, { color: "#1565c0" }]}>{tag.startsWith("#") ? tag : `#${tag}`}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {contentResult.callToAction && (
            <View style={[styles.card, { backgroundColor: "#fff8e1", borderColor: "#ffe082" }]}>
              <Text style={[styles.cardTitle, { color: "#f57f17" }]}>🎯 Call to Action</Text>
              <Text style={[styles.cardText, { color: "#e65100" }]}>{contentResult.callToAction}</Text>
            </View>
          )}

          {contentResult.tips?.length > 0 && (
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>💡 Dicas de Uso</Text>
              {contentResult.tips.map((tip: string, i: number) => (
                <View key={i} style={styles.bulletItem}>
                  <Text style={[styles.bullet, { color: "#f57f17" }]}>→</Text>
                  <Text style={[styles.bulletText, { color: colors.muted }]}>{tip}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );

  const renderImpactTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {renderFormHeader()}
      <TouchableOpacity
        style={[styles.analyzeBtn, { backgroundColor: "#1a3a5c" }]}
        onPress={() => {
          if (!title || !description) return;
          const state = location.includes(",") ? location.split(",")[1]?.trim() : undefined;
          impactMutation.mutate({ title, description, category, location, state });
        }}
        disabled={!title || !description || impactMutation.isPending}
      >
        {impactMutation.isPending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.analyzeBtnText}>📊 Calcular Impacto</Text>
        )}
      </TouchableOpacity>

      {impactResult && (
        <View style={styles.resultContainer}>
          {impactResult.affectedPopulation && (
            <View style={[styles.impactCard, { backgroundColor: "#e3f2fd", borderColor: "#90caf9" }]}>
              <Text style={[styles.impactCardTitle, { color: "#1565c0" }]}>👥 População Afetada</Text>
              <Text style={[styles.impactCardValue, { color: "#0d47a1" }]}>{impactResult.affectedPopulation.count}</Text>
              <Text style={[styles.impactCardDesc, { color: "#1565c0" }]}>{impactResult.affectedPopulation.profile}</Text>
            </View>
          )}

          <View style={styles.impactRow}>
            {impactResult.problemCost && (
              <View style={[styles.impactCardHalf, { backgroundColor: "#ffebee", borderColor: "#ef9a9a" }]}>
                <Text style={[styles.impactCardTitle, { color: "#c62828" }]}>💸 Custo do Problema</Text>
                <Text style={[styles.impactCardValue, { color: "#b71c1c" }]}>{impactResult.problemCost.annual}</Text>
                <Text style={[styles.impactCardDesc, { color: "#c62828" }]}>por ano</Text>
              </View>
            )}
            {impactResult.solutionCost && (
              <View style={[styles.impactCardHalf, { backgroundColor: "#e8f5e9", borderColor: "#a5d6a7" }]}>
                <Text style={[styles.impactCardTitle, { color: "#2e7d32" }]}>🔧 Custo da Solução</Text>
                <Text style={[styles.impactCardValue, { color: "#1b5e20" }]}>{impactResult.solutionCost.estimated}</Text>
                <Text style={[styles.impactCardDesc, { color: "#2e7d32" }]}>estimado</Text>
              </View>
            )}
          </View>

          {impactResult.budgetSources?.length > 0 && (
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>💰 Fontes de Orçamento</Text>
              {impactResult.budgetSources.map((src: any, i: number) => (
                <View key={i} style={styles.listItem}>
                  <Text style={[styles.listItemTitle, { color: "#1a3a5c" }]}>{src.source}</Text>
                  <Text style={[styles.listItemText, { color: colors.muted }]}>{src.amount} — {src.availability}</Text>
                </View>
              ))}
            </View>
          )}

          {impactResult.comparisons?.length > 0 && (
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>🏙️ Comparativo com Outras Cidades</Text>
              {impactResult.comparisons.map((c: any, i: number) => (
                <View key={i} style={styles.listItem}>
                  <Text style={[styles.listItemTitle, { color: "#1a3a5c" }]}>{c.city}</Text>
                  <Text style={[styles.listItemText, { color: colors.muted }]}>{c.situation}</Text>
                </View>
              ))}
            </View>
          )}

          {impactResult.summary && (
            <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>📋 Resumo do Impacto</Text>
              <Text style={[styles.cardText, { color: colors.muted }]}>{impactResult.summary}</Text>
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );

  const renderPoliticalTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {renderFormHeader()}
      <TouchableOpacity
        style={[styles.analyzeBtn, { backgroundColor: "#1a3a5c" }]}
        onPress={() => {
          if (!title || !description) return;
          const parts = location.split(",");
          const city = parts[0]?.trim();
          const state = parts[1]?.trim();
          politicalMutation.mutate({ title, description, category, state, city, supportCount: 0 });
        }}
        disabled={!title || !description || politicalMutation.isPending}
      >
        {politicalMutation.isPending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.analyzeBtnText}>🏛️ Analisar Cenário Político</Text>
        )}
      </TouchableOpacity>

      {politicalResult && (
        <View style={styles.resultContainer}>
          <View style={[styles.probabilityCard, { backgroundColor: politicalResult.approvalProbability >= 60 ? "#e8f5e9" : politicalResult.approvalProbability >= 40 ? "#fff8e1" : "#ffebee" }]}>
            <Text style={styles.probabilityLabel}>Probabilidade de Aprovação</Text>
            <Text style={[styles.probabilityValue, { color: politicalResult.approvalProbability >= 60 ? "#2e7d32" : politicalResult.approvalProbability >= 40 ? "#f57f17" : "#c62828" }]}>
              {politicalResult.approvalProbability}%
            </Text>
            {politicalResult.probabilityJustification && (
              <Text style={[styles.probabilityJustification, { color: colors.muted }]}>{politicalResult.probabilityJustification}</Text>
            )}
          </View>

          {politicalResult.immediateAlerts?.length > 0 && (
            <View style={[styles.card, { backgroundColor: "#fff8e1", borderColor: "#ffe082" }]}>
              <Text style={[styles.cardTitle, { color: "#f57f17" }]}>🚨 Alertas de Oportunidade</Text>
              {politicalResult.immediateAlerts.map((alert: string, i: number) => (
                <View key={i} style={styles.bulletItem}>
                  <Text style={[styles.bullet, { color: "#f57f17" }]}>⚡</Text>
                  <Text style={[styles.bulletText, { color: "#e65100" }]}>{alert}</Text>
                </View>
              ))}
            </View>
          )}

          {politicalResult.potentialAllies?.length > 0 && (
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>🤝 Aliados Potenciais</Text>
              {politicalResult.potentialAllies.map((ally: any, i: number) => (
                <View key={i} style={styles.listItem}>
                  <Text style={[styles.listItemTitle, { color: "#2e7d32" }]}>{ally.profile}</Text>
                  <Text style={[styles.listItemText, { color: colors.muted }]}>Motivação: {ally.motivation}</Text>
                  <Text style={[styles.listItemRelevance, { color: "#1a3a5c" }]}>Abordagem: {ally.approach}</Text>
                </View>
              ))}
            </View>
          )}

          {politicalResult.opportunities?.length > 0 && (
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>📅 Janelas de Oportunidade</Text>
              {politicalResult.opportunities.map((opp: any, i: number) => (
                <View key={i} style={styles.listItem}>
                  <Text style={[styles.listItemTitle, { color: "#1a3a5c" }]}>{opp.event}</Text>
                  {opp.date && <Text style={[styles.listItemText, { color: colors.muted }]}>📅 {opp.date}</Text>}
                  <Text style={[styles.listItemRelevance, { color: "#2e7d32" }]}>Ação: {opp.action}</Text>
                </View>
              ))}
            </View>
          )}

          {politicalResult.recommendedStrategy && (
            <View style={[styles.summaryCard, { backgroundColor: "#e8f5e9", borderColor: "#a5d6a7" }]}>
              <Text style={[styles.cardTitle, { color: "#2e7d32" }]}>🎯 Estratégia Recomendada</Text>
              <Text style={[styles.cardText, { color: "#1b5e20" }]}>{politicalResult.recommendedStrategy}</Text>
            </View>
          )}

          {politicalResult.mainObstacles?.length > 0 && (
            <View style={[styles.card, { backgroundColor: "#ffebee", borderColor: "#ef9a9a" }]}>
              <Text style={[styles.cardTitle, { color: "#c62828" }]}>⚠️ Principais Obstáculos</Text>
              {politicalResult.mainObstacles.map((obs: string, i: number) => (
                <View key={i} style={styles.bulletItem}>
                  <Text style={[styles.bullet, { color: "#c62828" }]}>•</Text>
                  <Text style={[styles.bulletText, { color: "#b71c1c" }]}>{obs}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );

  const renderChatTab = () => (
    <View style={styles.chatContainer}>
      <FlatList
        data={chatHistory}
        keyExtractor={(_, i) => i.toString()}
        style={styles.chatList}
        contentContainerStyle={styles.chatListContent}
        renderItem={({ item }) => (
          <View style={[
            styles.chatBubble,
            item.role === "user"
              ? [styles.chatBubbleUser, { backgroundColor: "#1a3a5c" }]
              : [styles.chatBubbleAssistant, { backgroundColor: colors.surface, borderColor: colors.border }],
          ]}>
            {item.role === "assistant" && (
              <Text style={[styles.chatBubbleLabel, { color: colors.muted }]}>🤖 Populus</Text>
            )}
            <Text style={[
              styles.chatBubbleText,
              { color: item.role === "user" ? "#fff" : colors.foreground },
            ]}>
              {item.content}
            </Text>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.chatEmpty}>
            <Text style={styles.chatEmptyIcon}>🤖</Text>
            <Text style={[styles.chatEmptyTitle, { color: colors.foreground }]}>Assistente Populus</Text>
            <Text style={[styles.chatEmptyText, { color: colors.muted }]}>
              Olá! Sou o Assistente Populus, especializado em lobby cidadão, direito constitucional e estratégia política. Como posso ajudar sua causa?
            </Text>
            <View style={styles.chatSuggestions}>
              {[
                "Quais artigos da CF protegem o direito à saúde?",
                "Como criar uma campanha eficaz?",
                "Como pressionar um vereador?",
              ].map((s, i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.chatSuggestion, { borderColor: "#1a3a5c" }]}
                  onPress={() => setChatInput(s)}
                >
                  <Text style={[styles.chatSuggestionText, { color: "#1a3a5c" }]}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        }
      />
      <View style={[styles.chatInputRow, { borderTopColor: colors.border, backgroundColor: colors.background }]}>
        <TextInput
          style={[styles.chatInput, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.surface }]}
          placeholder="Pergunte ao Populus..."
          placeholderTextColor={colors.muted}
          value={chatInput}
          onChangeText={setChatInput}
          multiline
          maxLength={500}
          returnKeyType="send"
          onSubmitEditing={handleSendChat}
        />
        <TouchableOpacity
          style={[styles.chatSendBtn, { backgroundColor: chatMutation.isPending ? colors.muted : "#1a3a5c" }]}
          onPress={handleSendChat}
          disabled={chatMutation.isPending || !chatInput.trim()}
        >
          {chatMutation.isPending ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.chatSendBtnText}>→</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ScreenContainer containerClassName="bg-background">
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: "#1a3a5c" }]}>
        <BackButton onPress={() => router.back()} label="Voltar" variant="dark" />
        <View style={styles.headerContent}>
          <Text style={styles.headerIcon}>🤖</Text>
          <View>
            <Text style={[styles.headerTitle, { color: "#fff" }]}>Assistente Populus</Text>
            <Text style={[styles.headerSubtitle, { color: "#90caf9" }]}>IA Estratégica para Lobby Cidadão</Text>
          </View>
        </View>
      </View>

      {/* Tabs — medido para o tour spotlight */}
      <ScrollView
        ref={aiToolsViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.tabsBar, { borderBottomColor: "#e0e0e0" }]}
        onLayout={() => {
          if (currentStep === "ai_populus" && aiToolsViewRef.current) {
            (aiToolsViewRef.current as any).measure((_x: number, _y: number, width: number, height: number, pageX: number, pageY: number) => {
              setAiToolsLayout({ x: pageX, y: pageY, width, height });
            });
          }
        }}
      >
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tabBtn,
              activeTab === tab.id && [styles.tabBtnActive, { borderBottomColor: "#1a3a5c" }],
            ]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Text style={styles.tabBtnIcon}>{tab.icon}</Text>
            <Text style={[
              styles.tabBtnLabel,
              { color: activeTab === tab.id ? "#1a3a5c" : "#9e9e9e" },
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Content */}
      <View style={styles.content}>
        {activeTab === "chat" && renderChatTab()}
        {activeTab === "legal" && renderLegalTab()}
        {activeTab === "evidence" && renderEvidenceTab()}
        {activeTab === "content" && renderContentTab()}
        {activeTab === "impact" && renderImpactTab()}
        {activeTab === "political" && renderPoliticalTab()}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: "#1a3a5c",
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 14,
    borderBottomWidth: 3,
  },
  backBtnPopulus: {
    alignSelf: "flex-start",
    paddingVertical: 4,
    marginBottom: 8,
  },
  backBtnPopulusText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    fontWeight: "600",
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerIcon: {
    fontSize: 32,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  tabsBar: {
    borderBottomWidth: 1,
    maxHeight: 56,
  },
  tabBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
    flexDirection: "row",
    gap: 4,
  },
  tabBtnActive: {
    borderBottomWidth: 2,
  },
  tabBtnIcon: {
    fontSize: 14,
  },
  tabBtnLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
  content: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
    padding: 16,
  },
  formSection: {
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  inputMultiline: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  analyzeBtn: {
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 20,
  },
  analyzeBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  resultContainer: {
    gap: 12,
    paddingBottom: 32,
  },
  probabilityCard: {
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "transparent",
  },
  probabilityLabel: {
    fontSize: 13,
    color: "#666",
    marginBottom: 4,
  },
  probabilityValue: {
    fontSize: 40,
    fontWeight: "800",
  },
  probabilityJustification: {
    fontSize: 12,
    textAlign: "center",
    marginTop: 8,
  },
  card: {
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    gap: 8,
  },
  summaryCard: {
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 12,
    marginBottom: 8,
  },
  cardText: {
    fontSize: 13,
    lineHeight: 20,
  },
  listItem: {
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: "#e0e0e0",
    gap: 2,
  },
  listItemTitle: {
    fontSize: 13,
    fontWeight: "600",
  },
  listItemText: {
    fontSize: 12,
    lineHeight: 18,
  },
  listItemRelevance: {
    fontSize: 11,
    fontStyle: "italic",
  },
  bulletItem: {
    flexDirection: "row",
    gap: 8,
    paddingVertical: 4,
  },
  bullet: {
    fontSize: 14,
    fontWeight: "700",
    width: 16,
  },
  bulletText: {
    fontSize: 13,
    flex: 1,
    lineHeight: 19,
  },
  formatRow: {
    flexDirection: "row",
    gap: 8,
    paddingVertical: 4,
  },
  formatChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  formatChipText: {
    fontSize: 12,
    fontWeight: "600",
  },
  contentCard: {
    borderRadius: 10,
    padding: 16,
    borderWidth: 1,
  },
  contentText: {
    fontSize: 14,
    lineHeight: 22,
    marginTop: 8,
  },
  hashtagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 4,
  },
  hashtagChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  hashtagText: {
    fontSize: 12,
    fontWeight: "600",
  },
  impactCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    alignItems: "center",
  },
  impactCardTitle: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
  },
  impactCardValue: {
    fontSize: 22,
    fontWeight: "800",
  },
  impactCardDesc: {
    fontSize: 11,
    marginTop: 2,
  },
  impactRow: {
    flexDirection: "row",
    gap: 10,
  },
  impactCardHalf: {
    flex: 1,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    alignItems: "center",
  },
  // Chat
  chatContainer: {
    flex: 1,
  },
  chatList: {
    flex: 1,
  },
  chatListContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 8,
  },
  chatBubble: {
    borderRadius: 12,
    padding: 12,
    maxWidth: "85%",
  },
  chatBubbleUser: {
    alignSelf: "flex-end",
    borderBottomRightRadius: 4,
  },
  chatBubbleAssistant: {
    alignSelf: "flex-start",
    borderBottomLeftRadius: 4,
    borderWidth: 1,
  },
  chatBubbleLabel: {
    fontSize: 10,
    fontWeight: "600",
    marginBottom: 4,
  },
  chatBubbleText: {
    fontSize: 14,
    lineHeight: 20,
  },
  chatEmpty: {
    alignItems: "center",
    paddingTop: 40,
    paddingHorizontal: 24,
    gap: 12,
  },
  chatEmptyIcon: {
    fontSize: 48,
  },
  chatEmptyTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  chatEmptyText: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  chatSuggestions: {
    width: "100%",
    gap: 8,
    marginTop: 8,
  },
  chatSuggestion: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
  },
  chatSuggestionText: {
    fontSize: 13,
  },
  chatInputRow: {
    flexDirection: "row",
    padding: 12,
    gap: 8,
    borderTopWidth: 1,
    alignItems: "flex-end",
  },
  chatInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    maxHeight: 100,
  },
  chatSendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  chatSendBtnText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
});
