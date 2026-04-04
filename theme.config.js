/** @type {const} */
const themeColors = {
  // Azul-marinho: confiança, autoridade cívica
  primary:    { light: '#1E3A5F', dark: '#3B6EA8' },
  // Verde: esperança, progresso popular
  secondary:  { light: '#2D7D46', dark: '#3DAA60' },
  // Âmbar: destaque, alertas
  accent:     { light: '#E8A020', dark: '#F0B535' },
  // Fundo: branco puro (claro) / azul-escuro profundo (escuro)
  background: { light: '#FFFFFF', dark: '#0D1B2A' },
  // Superfície: cinza muito claro (claro) / azul-escuro médio (escuro)
  surface:    { light: '#F0F4FA', dark: '#162233' },
  // Texto principal
  foreground: { light: '#1E3A5F', dark: '#E8EDF5' },
  // Texto secundário
  muted:      { light: '#5C7A9A', dark: '#7A9BBF' },
  // Bordas
  border:     { light: '#C8D8EC', dark: '#243A52' },
  // Estados semânticos
  success:    { light: '#2D7D46', dark: '#3DAA60' },
  warning:    { light: '#E8A020', dark: '#F0B535' },
  error:      { light: '#C0392B', dark: '#E74C3C' },
  // Tint para tab bar e ícones ativos
  tint:       { light: '#1E3A5F', dark: '#3B6EA8' },
  // Verde cívico para botões de ação positiva
  civic:      { light: '#2D7D46', dark: '#3DAA60' },
  // Azul claro para destaques e badges
  highlight:  { light: '#EBF2FA', dark: '#1A2E42' },
};

module.exports = { themeColors };
