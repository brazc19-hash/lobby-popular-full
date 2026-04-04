import { useCallback } from "react";
import { router, useNavigation } from "expo-router";

/**
 * useSmartBack
 *
 * Hook de navegação inteligente para o botão "← Voltar":
 *
 * 1. Se há histórico de navegação (canGoBack), usa router.back() — preserva
 *    estado de rolagem, filtros e dados de formulário da tela anterior.
 * 2. Se o usuário chegou via deep link (sem histórico), redireciona para
 *    `fallback` (padrão: Feed principal "/").
 *
 * Uso:
 * ```tsx
 * const goBack = useSmartBack();
 * const goBackToLobby = useSmartBack("/lobby/123");
 * ```
 */
export function useSmartBack(fallback: string = "/(tabs)") {
  const navigation = useNavigation();

  const goBack = useCallback(() => {
    if (navigation.canGoBack()) {
      router.back();
    } else {
      // Deep link: sem histórico — vai para o fallback
      router.replace(fallback as any);
    }
  }, [navigation, fallback]);

  return goBack;
}
