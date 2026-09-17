import { cn } from '@/lib/cn'
import DOMPurify from 'dompurify'
import { useMemo, useRef } from 'react'
interface TicketBodyProps {
  body: string
  htmlBody: string | null
  iframeTitle?: string
  className?: string
}

export function TicketBody({ body, htmlBody, iframeTitle, className }: TicketBodyProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)

  function setIframeHeight() {
    const iframeDocument = iframeRef.current?.contentWindow?.document

    if (iframeDocument) {
      iframeRef.current!.style.height = `${iframeDocument.documentElement.scrollHeight}px`
    }
  }

  const sanitizedHtmlBody = useMemo(() => {
    if (!htmlBody) return null

    const hasSanitizedContent = DOMPurify.sanitize(htmlBody).trim().length > 0
    return hasSanitizedContent ? DOMPurify.sanitize(htmlBody, { WHOLE_DOCUMENT: true }) : null
  }, [htmlBody])

  if (sanitizedHtmlBody) {
    return (
      // allow-same-origin is here only so setIframeHeight can read
      // contentWindow.document. Never add allow-scripts alongside it.
      <iframe
        ref={iframeRef}
        srcDoc={sanitizedHtmlBody}
        sandbox="allow-same-origin"
        onLoad={setIframeHeight}
        className="w-full max-h-96 overflow-y-auto bg-white"
        title={iframeTitle || 'HTML body'}
      />
    )
  }

  return (
    <div className={cn('whitespace-pre-wrap text-sm', className)}>
      {htmlBody && (
        <p className="mb-2 text-xs italic text-muted-foreground">
          The HTML version of this message couldn't be safely displayed.
        </p>
      )}
      {body}
    </div>
  )
}
