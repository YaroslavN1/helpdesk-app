import { describe, test, expect } from 'vitest'
import { sanitizeHtml } from './sanitize-html'

describe('sanitizeHtml', () => {
  test('strips script tags and their content entirely', () => {
    const dirty = '<p>Hello</p><script>alert(1)</script>'

    const clean = sanitizeHtml(dirty)

    expect(clean).not.toContain('<script')
    expect(clean).not.toContain('alert(1)')
    expect(clean).toContain('<p>Hello</p>')
  })

  test('strips on* event handler attributes', () => {
    const dirty = '<img src="x" onerror="alert(1)">'

    const clean = sanitizeHtml(dirty)

    expect(clean).not.toContain('onerror')
    expect(clean).not.toContain('alert(1)')
  })

  test('strips iframe tags', () => {
    const dirty = '<p>Before</p><iframe src="https://dirty.example.com"></iframe><p>After</p>'

    const clean = sanitizeHtml(dirty)

    expect(clean).not.toContain('<iframe')
    expect(clean).not.toContain('dirty.example.com')
    expect(clean).toContain('<p>Before</p>')
    expect(clean).toContain('<p>After</p>')
  })

  test('preserves safe markup untouched', () => {
    const safe = '<p>Hello <b>world</b>, visit <a href="https://example.com">our site</a>.</p>'

    const clean = sanitizeHtml(safe)

    expect(clean).toContain(
      '<p>Hello <b>world</b>, visit <a href="https://example.com">our site</a>.</p>',
    )
  })

  test('sanitizes a full html document while preserving the html/body structure', () => {
    const dirtyDocument =
      '<html><head><title>Test</title></head><body><p>Safe content</p><script>alert(1)</script></body></html>'

    const clean = sanitizeHtml(dirtyDocument)

    expect(clean).toContain('<html>')
    expect(clean).toContain('<body>')
    expect(clean).toContain('<p>Safe content</p>')
    expect(clean).not.toContain('<script')
    expect(clean).not.toContain('alert(1)')
  })
})
