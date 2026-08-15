import { useRef } from 'react'

interface TicketHtmlBodyProps {
  htmlBody: string
  iframeTitle?: string
}

export function TicketHtmlBody({ htmlBody, iframeTitle }: TicketHtmlBodyProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)

  function setIframeHeight() {
    const iframeDocument = iframeRef.current?.contentWindow?.document

    if (iframeDocument) {
      iframeRef.current!.style.height = `${iframeDocument.documentElement.scrollHeight}px`
    }
  }

  return (
    <iframe
      ref={iframeRef}
      srcDoc={htmlBody}
      sandbox="allow-same-origin"
      onLoad={setIframeHeight}
      className="w-full max-h-96 overflow-y-auto bg-white"
      title={iframeTitle || 'HTML body'}
    />
  )
}
