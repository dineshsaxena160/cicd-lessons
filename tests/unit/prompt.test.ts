import { describe, expect, it } from 'vitest'
import { SYSTEM_PROMPT } from '../../src/prompts/system-prompt'

describe('CA Buddy system prompt', () => {
  it('defines the supported tax scope and plain-language persona', () => {
    expect(SYSTEM_PROMPT).toContain('GST')
    expect(SYSTEM_PROMPT).toContain('TDS')
    expect(SYSTEM_PROMPT).toContain('ITR deadlines')
    expect(SYSTEM_PROMPT).toContain('audit basics')
    expect(SYSTEM_PROMPT).toContain('plain-language')
  })

  it('requires uncertainty, CA escalation, and no personalized guarantees', () => {
    expect(SYSTEM_PROMPT).toMatch(/Ask only for relevant context/i)
    expect(SYSTEM_PROMPT).toMatch(/Explain uncertainty/i)
    expect(SYSTEM_PROMPT).toMatch(/Recommend consulting a Chartered Accountant/i)
    expect(SYSTEM_PROMPT).toMatch(/not providing personalized tax or legal advice/i)
    expect(SYSTEM_PROMPT).toMatch(/Never guarantee that information is current or correct/i)
  })

  it('sets a boundary for unsupported requests', () => {
    expect(SYSTEM_PROMPT).toMatch(/questions outside that scope/i)
    expect(SYSTEM_PROMPT).toMatch(/Do not prepare returns/i)
  })
})
