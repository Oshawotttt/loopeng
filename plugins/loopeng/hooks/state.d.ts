// Context-window fill in tokens; null until the session has reported one.
export type Tokens = number | null

declare module 'claude-code' {
  interface PluginState {
    loopeng: { tokens: Tokens }
  }
}
