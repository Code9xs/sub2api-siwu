/**
 * useMarkdown - Composable for rendering Markdown with syntax highlighting
 * Uses `marked` for Markdown parsing and `highlight.js` for code highlighting.
 */

import { Marked } from 'marked'
import hljs from 'highlight.js/lib/core'

// Register common languages for code highlighting
import javascript from 'highlight.js/lib/languages/javascript'
import typescript from 'highlight.js/lib/languages/typescript'
import python from 'highlight.js/lib/languages/python'
import go from 'highlight.js/lib/languages/go'
import bash from 'highlight.js/lib/languages/bash'
import json from 'highlight.js/lib/languages/json'
import css from 'highlight.js/lib/languages/css'
import xml from 'highlight.js/lib/languages/xml'
import sql from 'highlight.js/lib/languages/sql'
import yaml from 'highlight.js/lib/languages/yaml'
import markdown from 'highlight.js/lib/languages/markdown'
import diff from 'highlight.js/lib/languages/diff'
import rust from 'highlight.js/lib/languages/rust'
import java from 'highlight.js/lib/languages/java'
import cpp from 'highlight.js/lib/languages/cpp'
import csharp from 'highlight.js/lib/languages/csharp'
import php from 'highlight.js/lib/languages/php'
import ruby from 'highlight.js/lib/languages/ruby'
import shell from 'highlight.js/lib/languages/shell'

hljs.registerLanguage('javascript', javascript)
hljs.registerLanguage('js', javascript)
hljs.registerLanguage('typescript', typescript)
hljs.registerLanguage('ts', typescript)
hljs.registerLanguage('python', python)
hljs.registerLanguage('py', python)
hljs.registerLanguage('go', go)
hljs.registerLanguage('golang', go)
hljs.registerLanguage('bash', bash)
hljs.registerLanguage('json', json)
hljs.registerLanguage('css', css)
hljs.registerLanguage('html', xml)
hljs.registerLanguage('xml', xml)
hljs.registerLanguage('sql', sql)
hljs.registerLanguage('yaml', yaml)
hljs.registerLanguage('yml', yaml)
hljs.registerLanguage('markdown', markdown)
hljs.registerLanguage('md', markdown)
hljs.registerLanguage('diff', diff)
hljs.registerLanguage('rust', rust)
hljs.registerLanguage('rs', rust)
hljs.registerLanguage('java', java)
hljs.registerLanguage('cpp', cpp)
hljs.registerLanguage('c++', cpp)
hljs.registerLanguage('csharp', csharp)
hljs.registerLanguage('cs', csharp)
hljs.registerLanguage('php', php)
hljs.registerLanguage('ruby', ruby)
hljs.registerLanguage('rb', ruby)
hljs.registerLanguage('shell', shell)
hljs.registerLanguage('sh', shell)

// Create a configured Marked instance
const marked = new Marked({
  gfm: true,
  breaks: true
})

// Custom renderer for code blocks with copy button and language badge
const renderer = {
  code(this: unknown, token: { text: string; lang?: string }) {
    const { text, lang } = token
    const language = lang && hljs.getLanguage(lang) ? lang : ''
    let highlighted: string

    if (language) {
      try {
        highlighted = hljs.highlight(text, { language }).value
      } catch {
        highlighted = escapeHtml(text)
      }
    } else {
      try {
        highlighted = hljs.highlightAuto(text).value
      } catch {
        highlighted = escapeHtml(text)
      }
    }

    const langLabel = language || 'code'
    return `<div class="code-block-wrapper">
      <div class="code-block-header">
        <span class="code-lang">${langLabel}</span>
        <button class="code-copy-btn" onclick="navigator.clipboard.writeText(decodeURIComponent('${encodeURIComponent(text)}'))">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          <span>Copy</span>
        </button>
      </div>
      <pre class="code-block"><code class="hljs${language ? ` language-${language}` : ''}">${highlighted}</code></pre>
    </div>`
  },

  codespan(this: unknown, token: { text: string }) {
    return `<code class="inline-code">${token.text}</code>`
  },

  link(this: unknown, token: { href: string; title?: string | null; text: string }) {
    const { href, title, text } = token
    const titleAttr = title ? ` title="${title}"` : ''
    return `<a href="${href}"${titleAttr} target="_blank" rel="noopener noreferrer">${text}</a>`
  }
}

marked.use({ renderer })

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * Render Markdown content to HTML
 */
export function renderMarkdown(content: string): string {
  if (!content) return ''
  try {
    return marked.parse(content) as string
  } catch {
    return escapeHtml(content).replace(/\n/g, '<br>')
  }
}

export function useMarkdown() {
  return { renderMarkdown }
}
