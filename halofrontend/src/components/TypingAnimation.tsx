import { motion } from 'framer-motion'
import { useState, useEffect, useRef, ReactElement } from 'react'

interface TypingAnimationProps {
  text: string
  isTyping: boolean
  onComplete?: () => void
  onRequestScroll?: () => void
  className?: string
}

function CodeBlock({ code }: { code: string }) {
  const preRef = useRef<HTMLPreElement | null>(null)
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch (e) {
      // fallback
      const ta = document.createElement('textarea')
      ta.value = code
      document.body.appendChild(ta)
      ta.select()
      try { document.execCommand('copy') } catch {}
      document.body.removeChild(ta)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }
  }

  return (
    <div className="ai-code-block relative">
      <pre ref={preRef} className="ai-code-pre"><code>{code}</code></pre>
      <button aria-label="Copy code" onClick={handleCopy} className="ai-code-copy">
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  )
}

// Simple Markdown parser for AI responses
function parseMarkdown(text: string): ReactElement[] {
  const lines = text.split('\n')
  const elements: ReactElement[] = []
  let key = 0

  // Heuristic: classify short/simple messages so we avoid rendering heavy
  // markdown (headers / horizontal rules) for simple prompts. Increase
  // the threshold so brief but slightly longer replies still render cleanly
  // without an auto-generated title. Complex responses or those containing
  // code blocks will still render headers.
  const totalChars = text.replace(/\s+/g, '').length
  const shortMessage = totalChars > 0 && totalChars <= 120 && lines.length <= 6

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    
    // Headers (skip for short messages)
    if (!shortMessage && line.startsWith('# ')) {
      elements.push(<h1 key={key++}>{line.slice(2)}</h1>)
    } else if (!shortMessage && line.startsWith('## ')) {
      elements.push(<h2 key={key++}>{line.slice(3)}</h2>)
    } else if (!shortMessage && line.startsWith('### ')) {
      elements.push(<h3 key={key++}>{line.slice(4)}</h3>)
    }
  // Code blocks
    else if (line.startsWith('```')) {
      const codeLines: string[] = []
      i++ // Skip opening ```
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i])
        i++
      }
      elements.push(
        <CodeBlock key={key++} code={codeLines.join('\n')} />
      )
    }
    // Horizontal rule (---) or empty lines
    else if (!shortMessage && line.trim() === '---') {
      elements.push(<hr key={key++} className='my-3 border-t border-white/10' />)
    } else if (line.trim() === '') {
      // For shortMessage we still want small spacing but not huge gaps
      elements.push(<br key={key++} />)
    }
    // Regular paragraphs with inline formatting
    else {
      const formattedLine = formatInlineMarkdown(line)
      elements.push(<p key={key++}>{formattedLine}</p>)
    }
  }

  // Helper to extract plain text from a ReactElement or string
  function extractText(node: any): string {
    if (node == null) return ''
    if (typeof node === 'string' || typeof node === 'number') return String(node)
    if (Array.isArray(node)) return node.map(extractText).join('')
    if (typeof node === 'object' && node.props && node.props.children !== undefined) return extractText(node.props.children)
    return ''
  }

  // Remove redundant heading + hr when the assistant echoes a short title/header
  // followed by the same line as paragraph (e.g. "Hello there!" then "---" then the same greeting).
  if (elements.length >= 3) {
    const first: any = elements[0]
    const second: any = elements[1]
    const third: any = elements[2]
    if (first && typeof first.type === 'string' && /^h[1-6]$/.test(first.type) && second && second.type === 'hr' && third && third.type === 'p') {
      const headerText = extractText(first.props.children).trim().toLowerCase()
      const paraText = extractText(third.props.children).trim().toLowerCase()
      if (headerText && paraText) {
        // if paragraph starts with or equals the header, strip the header+hr
        if (paraText === headerText || paraText.startsWith(headerText) || paraText.includes(headerText)) {
          elements.splice(0, 2)
        }
      }
    }
  }

  return elements
}

// Format inline markdown (bold, italic, code)
function formatInlineMarkdown(text: string): ReactElement[] {
  const elements: ReactElement[] = []
  let key = 0
  let currentText = text

  // Split by code first (backticks)
  const codeParts = currentText.split(/`([^`]+)`/)
  
  for (let i = 0; i < codeParts.length; i++) {
    if (i % 2 === 1) {
      // This is code
      elements.push(<code key={key++}>{codeParts[i]}</code>)
    } else {
      // This is regular text, check for bold/italic
      const part = codeParts[i]
      const boldParts = part.split(/\*\*([^*]+)\*\*/)
      
      for (let j = 0; j < boldParts.length; j++) {
        if (j % 2 === 1) {
          elements.push(<strong key={key++}>{boldParts[j]}</strong>)
        } else if (boldParts[j]) {
          elements.push(<span key={key++}>{boldParts[j]}</span>)
        }
      }
    }
  }

  return elements
}

export function TypingAnimation({ text, isTyping, onComplete, onRequestScroll, className = '' }: TypingAnimationProps) {
  const [displayedText, setDisplayedText] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [hasStartedTyping, setHasStartedTyping] = useState(false)
  const textRef = useRef(text)

  // Update text reference when text changes
  useEffect(() => {
    if (textRef.current !== text) {
      textRef.current = text
      setDisplayedText('')
      setCurrentIndex(0)
      setHasStartedTyping(false)
    }
  }, [text])

  // Auto-scroll during typing (if enabled by parent)
  useEffect(() => {
    if (isTyping && hasStartedTyping && onRequestScroll) {
      onRequestScroll()
    }
  }, [displayedText, isTyping, hasStartedTyping, onRequestScroll])

  useEffect(() => {
    if (!isTyping) {
      // If not typing, show full text immediately
      if (!hasStartedTyping) {
        setDisplayedText(text)
        setCurrentIndex(text.length)
      }
      return
    }

    // Start typing animation
    if (!hasStartedTyping) {
      setHasStartedTyping(true)
    }

    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayedText(text.slice(0, currentIndex + 1))
        setCurrentIndex(prev => prev + 1)
      }, 8) // Much faster typing speed (8ms = 125 characters per second)

      return () => clearTimeout(timer)
    } else if (currentIndex >= text.length && onComplete && hasStartedTyping) {
      // Call completion callback after a small delay when typing is finished
      const completeTimer = setTimeout(() => {
        onComplete()
      }, 100)
      return () => clearTimeout(completeTimer)
    }
  }, [currentIndex, text, isTyping, onComplete, hasStartedTyping])

  // Parse the displayed text as Markdown
  const parsedContent = parseMarkdown(displayedText)

  return (
    <div className={className}>
      {parsedContent}
      {isTyping && hasStartedTyping && currentIndex < text.length && (
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            repeatType: 'reverse',
            ease: 'easeInOut'
          }}
          className="inline-block w-0.5 h-4 bg-blue-400 ml-0.5 rounded-sm"
        />
      )}
    </div>
  )
}

// Dot typing indicator for when AI is thinking
export function DotTypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center space-x-1 py-2"
    >
      {[0, 1, 2].map((index) => (
        <motion.div
          key={index}
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            delay: index * 0.2,
            ease: 'easeInOut'
          }}
          className="w-2 h-2 bg-blue-400 rounded-full"
        />
      ))}
      <span className="text-slate-400 text-sm ml-2">HALO is thinking...</span>
    </motion.div>
  )
}
