import { cn } from '@/lib/cn'
import { useRef } from 'react'
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

  return htmlBody ? (
    <iframe
      ref={iframeRef}
      srcDoc={htmlBody}
      sandbox="allow-same-origin"
      onLoad={setIframeHeight}
      className="w-full max-h-96 overflow-y-auto bg-white"
      title={iframeTitle || 'HTML body'}
    />
  ) : (
    <div className={cn('whitespace-pre-wrap text-sm', className)}>{body}</div>
  )
}
