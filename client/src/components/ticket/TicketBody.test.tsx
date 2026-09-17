import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { TicketBody } from './TicketBody'

describe('TicketBody', () => {
  describe('htmlBody is null (plain-text-only email)', () => {
    it('renders the plain text body with no HTML notice', () => {
      render(<TicketBody body="Plain text body content." htmlBody={null} />)

      expect(screen.getByText('Plain text body content.')).toBeInTheDocument()
      expect(document.querySelector('iframe')).not.toBeInTheDocument()
      expect(
        screen.queryByText("The HTML version of this message couldn't be safely displayed."),
      ).not.toBeInTheDocument()
    })
  })

  describe('htmlBody sanitizes down to real content', () => {
    it('strips a script tag but still renders the surviving markup as an iframe', () => {
      const maliciousHtmlBody = '<p>Hello</p><script>alert("xss")</script>'
      render(<TicketBody body="Hello" htmlBody={maliciousHtmlBody} />)

      const iframe = document.querySelector('iframe')
      expect(iframe).toBeInTheDocument()
      expect(iframe!.getAttribute('srcdoc')).not.toContain('<script')
      expect(iframe!.getAttribute('srcdoc')).not.toContain('alert(')
    })

    it('strips an onerror handler attribute but keeps the surviving img element', () => {
      const maliciousHtmlBody = '<img src="x" onerror="alert(1)">'
      render(<TicketBody body="Hello" htmlBody={maliciousHtmlBody} />)

      const iframe = document.querySelector('iframe')
      expect(iframe).toBeInTheDocument()
      expect(iframe!.getAttribute('srcdoc')).not.toContain('onerror')
    })

    it('preserves safe, functionally-equivalent markup', () => {
      const safeHtmlBody = '<p>Hello <b>world</b></p>'
      render(<TicketBody body="Hello" htmlBody={safeHtmlBody} />)

      const iframe = document.querySelector('iframe')
      expect(iframe).toBeInTheDocument()
      const sanitizedSourceDocument = iframe!.getAttribute('srcdoc')
      expect(sanitizedSourceDocument).toContain('<p>Hello <b>world</b></p>')
    })
  })

  describe('htmlBody sanitizes down to nothing', () => {
    it('shows fallback message alongside plain text body', () => {
      const fullyMaliciousHtmlBody =
        '<script>alert(1)</script><iframe src="https://malicious.example.com"></iframe>'
      render(<TicketBody body="Plain text body content." htmlBody={fullyMaliciousHtmlBody} />)

      expect(document.querySelector('iframe')).not.toBeInTheDocument()
      expect(
        screen.getByText("The HTML version of this message couldn't be safely displayed."),
      ).toBeInTheDocument()
      expect(screen.getByText('Plain text body content.')).toBeInTheDocument()
    })
  })
})
