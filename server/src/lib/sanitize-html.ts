import { JSDOM } from 'jsdom'
import createDOMPurify from 'dompurify'

const window = new JSDOM('').window
const DOMPurify = createDOMPurify(window)

export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, { WHOLE_DOCUMENT: true })
}
