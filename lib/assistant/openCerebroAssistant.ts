export const CEREBRO_ASSISTANT_OPEN_EVENT = 'cerebro:open'

export function openCerebroAssistant() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(CEREBRO_ASSISTANT_OPEN_EVENT))
}
