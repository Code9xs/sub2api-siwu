import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const chatMessagePath = resolve(dirname(fileURLToPath(import.meta.url)), '../ChatMessage.vue')
const chatMessageSource = readFileSync(chatMessagePath, 'utf8')
const stylePath = resolve(dirname(fileURLToPath(import.meta.url)), '../../../style.css')
const styleSource = readFileSync(stylePath, 'utf8')

function extractCssBlock(selector: string) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = styleSource.match(new RegExp(`${escapedSelector}\\s*\\{[\\s\\S]*?\\n  \\}`))
  return match?.[0] ?? ''
}

describe('chat dark mode styles', () => {
  it('defines semantic chat colors for light and dark themes', () => {
    const lightThemeBlock = extractCssBlock(':root')
    const darkThemeBlock = extractCssBlock('.dark')

    expect(lightThemeBlock).toContain('--color-bg-primary:')
    expect(lightThemeBlock).toContain('--color-text-primary:')
    expect(lightThemeBlock).toContain('--color-border:')
    expect(lightThemeBlock).toContain('--color-bg-sidebar:')

    expect(darkThemeBlock).toContain('--color-bg-primary:')
    expect(darkThemeBlock).toContain('--color-text-primary:')
    expect(darkThemeBlock).toContain('--color-border:')
    expect(darkThemeBlock).toContain('--color-bg-sidebar:')
    expect(darkThemeBlock).toContain('--color-bg-inline-code:')
    expect(darkThemeBlock).toContain('--color-code-bg:')
    expect(darkThemeBlock).toContain('--color-hljs-string:')
  })

  it('keeps markdown code blocks readable in dark mode', () => {
    expect(chatMessageSource).toContain('background: var(--color-code-bg')
    expect(chatMessageSource).toContain('color: var(--color-code-text')
    expect(chatMessageSource).toContain('color: var(--color-hljs-string')
    expect(chatMessageSource).not.toContain(':global(.dark) .markdown-body')
  })
})
