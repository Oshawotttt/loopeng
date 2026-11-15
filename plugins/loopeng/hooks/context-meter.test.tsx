import { expect, test } from 'claude-code/testing'

test('footer shows coloured count on terminal and desktop', async ($, on) => {
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('session.usage', () => ({ value: { startedAt: 0, rateLimits: [], context: { tokens: 182_000, window: 1_000_000, percent: 18 } } }))
  on('session.surfaces', () => ({ value: ['terminal'] }))
  on('ui.status', () => ({ value: undefined }))
  on('ui.render', ($, e) => {
    const { Text } = $.ui.resolve(e)
    return <Text>focus</Text>
  })
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await $.ui.mount({ plugin: 'loopeng', surface, component: 'SessionMode', props: { modes: ['focus'] } })
    expect((await ui.find({ type: 'Text', text: /182k/ }))?.text).toBe('● 182k')
    expect((await ui.find({ type: 'Text', text: /focus/ }))?.text).toBe('focus')
    await ui.unmount()
  }
})

test('off when the option is false', { options: { contextMeter: false } }, async ($, on) => {
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('session.usage', () => ({ value: { startedAt: 0, rateLimits: [], context: { tokens: 182_000, window: 1_000_000 } } }))
  on('session.surfaces', () => ({ value: ['terminal'] }))
  on('ui.render', ($, e) => {
    const { Text } = $.ui.resolve(e)
    return <Text>focus</Text>
  })
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  const ui = await $.ui.mount({ plugin: 'loopeng', surface: 'terminal', component: 'SessionMode', props: { modes: [] } })
  expect(await ui.find({ type: "Text", text: /182k/ })).toBeUndefined()
  await ui.unmount()
})
