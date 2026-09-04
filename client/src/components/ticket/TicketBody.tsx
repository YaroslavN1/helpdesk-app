import { useRef } from 'react'
interface TicketBodyProps {
  body: string
  htmlBody: string | null
  iframeTitle?: string
}

export function TicketBody({ body, htmlBody, iframeTitle }: TicketBodyProps) {
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
    <div className="whitespace-pre-wrap pt-2 text-sm">{body}</div>
  )
}
