import type { EngineInterface, Register, RenderSurface } from 'claude-code'

// Context meter: a coloured dot and the live context-window token count.
// Terminal and desktop: drawn at the right of the prompt footer, no label.
// VSCode (no footer site there): a status entry under the prompt.
// Turned off by the `contextMeter` option.

// Thresholds in tokens. Below WARN: green. WARN to DANGER: orange. Past DANGER: red.
const WARN = 150_000
const DANGER = 400_000

const formatTokens = (n: number): string =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(2)}M` : `${Math.round(n / 1000)}k`

const colorFor = (tokens: number): string =>
  tokens >= DANGER ? '#e5484d' : tokens >= WARN ? '#f5a524' : '#30a46c'

const dotFor = (tokens: number): string =>
  tokens >= DANGER ? '🔴' : tokens >= WARN ? '🟠' : '🟢'

// Surfaces with no SessionMode footer site, where the status entry stands in.
const STATUS_SURFACES: readonly RenderSurface[] = ['vscode']

// Shows or clears the status entry: only where a status surface is attached.
async function refreshStatus($: EngineInterface, tokens: number | undefined): Promise<void> {
  const surfaces = await $.session.surfaces()
  const wantsStatus = surfaces.some(s => STATUS_SURFACES.includes(s))
  $.ui.status(wantsStatus && tokens !== undefined ? `${dotFor(tokens)} ${formatTokens(tokens)}` : undefined)
}

export const register: Register = (on, options) => {
  if (options.contextMeter === false) {
    return
  }

  // Module variable: a reload re-reads it in session.start.
  let tokens: number | undefined

  on('session.start', async ($, e, next) => {
    const result = await next(e)
    tokens = (await $.session.usage()).context.tokens
    await refreshStatus($, tokens)
    return result
  })

  on('session.attach', async ($, e, next) => {
    const result = await next(e)
    await refreshStatus($, tokens)
    return result
  })

  on('session.measure', async ($, e, next) => {
    if (e.changed.includes('context')) {
      tokens = e.context.tokens
      await refreshStatus($, tokens)
    }
    return next(e)
  })

  on('ui.render', { component: 'SessionMode' }, async ($, e, next) => {
    if (tokens === undefined) {
      return next(e)
    }
    const { Box, Text } = $.ui.resolve(e)
    return (
      <Box flexDirection="row" gap={1}>
        {await next(e)}
        <Text color={colorFor(tokens)} tabular>
          ● {formatTokens(tokens)}
        </Text>
      </Box>
    )
  })
}
