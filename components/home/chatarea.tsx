"use client"

import {
  Send,
  Download,
  Plus,
  FlaskConical,
  BookOpenText,
  TextSearch,
  Copy,
  Check,
  RotateCcw,
  Mail,
} from "lucide-react"
import Image from "next/image"
import { TestChat, postTest } from "@/lib/api"
import { useRouter } from "next/navigation"
import { exportResponsePDF } from "@/gen/pdfmaker"
import { useState, useRef, useEffect, useCallback } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeHighlight from "rehype-highlight"
import { CodeBlock } from "./copyblock"
import TypingLoader from "./loader"
import { useUserStore } from "@/store/userStore"

// ─── Types ────────────────────────────────────────────────────────────────────

type Message = {
  role: "user" | "assistant"
  content: string
}

type Mode = {
  id: string
  label: string
  icon: React.ReactNode
  path: string
}

const MODES: Mode[] = [
  { id: "chat",     label: "Chat",          icon: <BookOpenText className="h-3.5 w-3.5" />, path: "stream" },
  { id: "research", label: "Research",     icon: <FlaskConical className="h-3.5 w-3.5" />, path: "research" },
  { id: "email",    label: "Email",        icon: <Mail className="h-3.5 w-3.5" />,         path: "stream" },
  { id: "test",     label: "Test Mode",    icon: <TextSearch className="h-3.5 w-3.5" />,   path: "test" },
  { id: "pdf",      label: "Deep Research",icon: <FlaskConical className="h-3.5 w-3.5" />, path: "stream" },
]

// ─── Markdown config ──────────────────────────────────────────────────────────

const markdownComponents: any = {
  code: CodeBlock,
  table: ({ children }: any) => (
    <div className="my-3 overflow-x-auto rounded-lg border border-white/10">
      <table className="w-full text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }: any) => (
    <thead className="border-b border-white/10 bg-white/5 text-left">{children}</thead>
  ),
  th: ({ children }: any) => (
    <th className="px-4 py-2.5 font-semibold text-neutral-200">{children}</th>
  ),
  td: ({ children }: any) => (
    <td className="border-t border-white/5 px-4 py-2 align-top text-neutral-300">{children}</td>
  ),
  tr: ({ children }: any) => <tr className="hover:bg-white/3">{children}</tr>,
  p: ({ children }: any) => <p className="mb-3 last:mb-0 leading-7">{children}</p>,
  ul: ({ children }: any) => <ul className="mb-3 space-y-1 pl-5 list-disc">{children}</ul>,
  ol: ({ children }: any) => <ol className="mb-3 space-y-1 pl-5 list-decimal">{children}</ol>,
  li: ({ children }: any) => <li className="text-neutral-200">{children}</li>,
  h1: ({ children }: any) => <h1 className="mb-3 mt-4 text-xl font-bold text-white">{children}</h1>,
  h2: ({ children }: any) => <h2 className="mb-2 mt-4 text-lg font-semibold text-white">{children}</h2>,
  h3: ({ children }: any) => <h3 className="mb-2 mt-3 text-base font-semibold text-neutral-100">{children}</h3>,
  blockquote: ({ children }: any) => (
    <blockquote className="my-3 border-l-2 border-blue-500 pl-4 text-neutral-400">{children}</blockquote>
  ),
}

// ─── Streaming JSON parser ────────────────────────────────────────────────────

const extractStreamText = (str: string): string => {
  if (!str.trim().startsWith("{")) return str
  try {
    const parsed = JSON.parse(str)
    if (parsed.blocks) {
      return parsed.blocks
        .map((b: any) => {
          if (b.type === "text" || b.type === "summary" || b.type === "conclusion") return b.text || ""
          if (b.type === "heading") return `## ${b.text || ""}`
          if (b.type === "key_points" && b.points) return b.points.map((p: string) => `- ${p}`).join("\n")
          if (b.type === "list" && b.items) return b.items.map((p: string) => `- ${p}`).join("\n")
          return ""
        })
        .join("\n\n")
    }
    return str
  } catch {
    const m = str.match(/"text"\s*:\s*"([^]*?)$/)
    if (m) return m[1].replace(/\\n/g, "\n").replace(/\\"/g, '"')
    return str
  }
}

// ─── Block renderers ──────────────────────────────────────────────────────────

const BlockRenderer = ({ block, i }: { block: any; i: number }) => {
  switch (block.type) {
    case "heading":
      return <h3 className="mt-4 mb-1.5 text-base font-semibold text-white">{block.text}</h3>

    case "text":
      return (
        <div className="leading-7 text-neutral-200">
          <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]} components={markdownComponents}>
            {block.text}
          </ReactMarkdown>
        </div>
      )

    case "summary":
      return (
        <div className="my-2 rounded-xl border border-blue-500/30 bg-blue-500/8 px-5 py-4">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-blue-400">Summary</p>
          <p className="text-sm leading-7 text-neutral-200">{block.text}</p>
        </div>
      )

    case "conclusion":
      return (
        <div className="my-2 rounded-xl border border-emerald-500/30 bg-emerald-500/8 px-5 py-4">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-emerald-400">Conclusion</p>
          <p className="text-sm leading-7 text-neutral-200">{block.text}</p>
        </div>
      )

    case "key_points":
      return (
        <div className="my-2 rounded-xl border border-white/10 bg-white/4 px-5 py-4">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-neutral-500">Key Points</p>
          <ul className="space-y-2">
            {(block.points || []).map((pt: string, j: number) => (
              <li key={j} className="flex items-start gap-3 text-sm text-neutral-200">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
                <span className="leading-6">{pt}</span>
              </li>
            ))}
          </ul>
        </div>
      )

    case "list":
      return (
        <ul className="my-2 space-y-2">
          {(block.items || []).map((item: string, j: number) => (
            <li key={j} className="flex items-start gap-3 text-sm text-neutral-200">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-neutral-500" />
              <span className="leading-6">{item}</span>
            </li>
          ))}
        </ul>
      )

    default:
      return null
  }
}

const MessageRenderer = ({ content, isStreaming, chatId }: { content: string; isStreaming: boolean; chatId?: string }) => {
  if (!isStreaming) {
    try {
      const parsed = JSON.parse(content)
      if (parsed.blocks) {
        const hasMeta = parsed.metadata && Object.keys(parsed.metadata).length > 0
        return (
          <div className="space-y-2">
            {parsed.blocks.map((b: any, i: number) => <BlockRenderer key={i} block={b} i={i} />)}
            {hasMeta && (
              <div className="flex flex-wrap gap-1.5 border-t border-white/8 pt-3 mt-3">
                {Object.entries(parsed.metadata).map(([k, v]: [string, any]) => (
                  <span key={k} className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[10px] text-neutral-400">
                    <span className="text-neutral-600">{k.replace(/_/g, " ")}: </span>{String(v)}
                  </span>
                ))}
              </div>
            )}
          </div>
        )
      }
    } catch { /* not JSON */ }
  }

  // ── Test JSON detection ──────────────────────────────────────────────────
  if (!isStreaming) {
    try {
      const parsed = JSON.parse(content)
      if (parsed.type === "test" && parsed.questions) {
        return <TestSummaryCard data={parsed} chatId={chatId || ""} />
      }
    } catch { /* not test JSON */ }
  }

  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]} components={markdownComponents}>
      {extractStreamText(content)}
    </ReactMarkdown>
  )
}

// ─── Test Summary Card ───────────────────────────────────────────────────────

const TestSummaryCard = ({ data, chatId }: { data: any; chatId: string }) => {
  const router = useRouter()

  const diffColor: Record<string, string> = {
    easy: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    medium: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    hard: "bg-red-500/15 text-red-400 border-red-500/30",
  }

  const startTest = () => {
    sessionStorage.setItem(`test_${chatId}`, JSON.stringify(data))
    router.push(`/test/${chatId}`)
  }

  return (
    <div className="rounded-xl border border-white/10 bg-[#2a2a2a] p-5">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500 mb-1">Test Ready</p>
          <h3 className="text-base font-semibold text-white">{data.topic}</h3>
        </div>
        <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${diffColor[data.difficulty] || diffColor.medium}`}>
          {data.difficulty}
        </span>
      </div>

      {/* Summary */}
      <p className="mb-4 text-sm leading-relaxed text-neutral-300">{data.summary}</p>

      {/* Stats row */}
      <div className="mb-5 flex flex-wrap gap-4 text-xs text-neutral-400">
        <span>📝 {data.questionCount || data.questions?.length || 10} questions</span>
        <span>⏱ ~{data.estimatedMinutes || 12} minutes</span>
        <span>📊 Multiple choice</span>
      </div>

      {/* Start button */}
      <button
        onClick={startTest}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3 text-sm font-semibold text-black hover:bg-neutral-200 transition-colors"
      >
        Start Test →
      </button>
    </div>
  )
}


const CopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button onClick={copy} className="rounded p-1 text-neutral-500 hover:text-neutral-200 transition-colors">
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  )
}

// ─── Welcome screen ───────────────────────────────────────────────────────────

const WelcomeScreen = ({ user, onPrompt }: { user: any; onPrompt: (p: string) => void }) => {
  const suggestions = [
    "Explain quantum computing in simple terms",
    "Write a professional email to my team about project updates",
    "Research the latest trends in AI development",
    "Create a study plan for learning TypeScript",
  ]

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center">
        <Image src="/assets/logo.webp" alt="Logo" width={64} height={64} className="rounded-full object-cover" />
      </div>
      <h2 className="mb-1 text-xl font-semibold text-white">
        {user?.name ? `Hello, ${user.name}` : "How can I help you?"}
      </h2>
      <p className="mb-8 text-sm text-neutral-500">Digital Socratic AI Teaching Assistant</p>

      <div className="grid w-full max-w-xl grid-cols-2 gap-2">
        {suggestions.map((s, i) => (
          <button
            key={i}
            onClick={() => onPrompt(s)}
            className="rounded-xl border border-white/8 bg-white/4 px-4 py-3 text-left text-sm text-neutral-300 hover:bg-white/8 hover:text-white transition-colors"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Main ChatArea ────────────────────────────────────────────────────────────

export default function ChatArea({
  messages,
  setMessages,
  chatId,
}: {
  messages: Message[]
  setMessages: (msgs: Message[]) => void
  chatId: string | null
}) {
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [selectedMode, setSelectedMode] = useState<Mode>(MODES[0])
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { user } = useUserStore()

  const safeMessages = Array.isArray(messages) ? messages : []

  // Auto scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = "auto"
    ta.style.height = Math.min(ta.scrollHeight, 200) + "px"
  }, [input])

  const sendMessage = useCallback(async (text?: string) => {
    const userMessage = (text || input).trim()
    if (!userMessage || loading || !chatId) return

    setInput("")
    setLoading(true)

    // ── Test mode: non-streaming JSON quiz ───────────────────────────────────
    if (selectedMode.id === "test") {
      const newMessages: Message[] = [
        ...safeMessages,
        { role: "user", content: userMessage },
        { role: "assistant", content: "" },
      ]
      setMessages(newMessages)
      try {
        const result = await postTest(userMessage, chatId)
        const testJson = result?.test || result
        setMessages([
          ...newMessages.slice(0, -1),
          { role: "assistant", content: JSON.stringify(testJson) },
        ])
      } catch {
        setMessages([
          ...newMessages.slice(0, -1),
          { role: "assistant", content: "Failed to generate test. Please try again." },
        ])
      }
      setLoading(false)
      return
    }

    // ── Streaming mode ───────────────────────────────────────────────────────
    const newMessages: Message[] = [
      ...safeMessages,
      { role: "user", content: userMessage },
      { role: "assistant", content: "" },
    ]
    setMessages(newMessages)

    let accumulated = ""
    try {
      await TestChat(userMessage, selectedMode.path, selectedMode.id, chatId, (chunk) => {
        accumulated += chunk
        setMessages([
          ...newMessages.slice(0, -1),
          { role: "assistant", content: accumulated },
        ])
      })
    } catch (err) {
      setMessages([
        ...newMessages.slice(0, -1),
        { role: "assistant", content: "Sorry, an error occurred. Please try again." },
      ])
    }
    setLoading(false)
  }, [input, loading, chatId, safeMessages, selectedMode, setMessages])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-[#212121]">

      {/* Message list */}
      <div className="flex-1 overflow-y-auto">
        {safeMessages.length === 0 ? (
          <WelcomeScreen user={user} onPrompt={(p) => sendMessage(p)} />
        ) : (
          <div className="mx-auto max-w-3xl space-y-0 px-4 py-6">
            {safeMessages.map((msg, i) => {
              const isLast = i === safeMessages.length - 1
              const isStreaming = loading && isLast && msg.role === "assistant"

              if (msg.role === "user") {
                return (
                  <div key={i} className="flex justify-end py-2">
                    <div className="max-w-[75%] rounded-3xl bg-[#2f2f2f] px-5 py-3 text-sm text-neutral-100">
                      {msg.content}
                    </div>
                  </div>
                )
              }

              return (
                <div key={i} className="group flex gap-4 py-4">
                  {/* Bot avatar */}
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full overflow-hidden">
                    <Image src="/assets/logo-without.webp" alt="Logo" width={28} height={28} className="object-cover" />
                  </div>

                  {/* Response content */}
                  <div className="flex-1 min-w-0">
                    {isStreaming && !msg.content ? (
                      <TypingLoader />
                    ) : (
                      <div className="prose prose-invert max-w-none text-sm text-neutral-100">
                        <MessageRenderer content={msg.content} isStreaming={isStreaming} chatId={chatId || undefined} />
                      </div>
                    )}

                    {/* Action bar — shown on hover after completion */}
                    {!isStreaming && msg.content && (
                      <div className="mt-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <CopyButton text={msg.content} />
                        <button
                          onClick={() => exportResponsePDF(msg.content, i)}
                          className="rounded p-1 text-neutral-500 hover:text-neutral-200 transition-colors"
                          title="Export PDF"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => sendMessage(safeMessages[i - 1]?.content)}
                          className="rounded p-1 text-neutral-500 hover:text-neutral-200 transition-colors"
                          title="Regenerate"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="px-4 pb-4 pt-2">
        <div className="mx-auto max-w-3xl">
          {/* Mode pills */}
          <div className="mb-2 flex items-center gap-1.5">
            {MODES.map((mode) => (
              <button
                key={mode.id}
                onClick={() => setSelectedMode(mode)}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  selectedMode.id === mode.id
                    ? "border-white/20 bg-white/12 text-white"
                    : "border-white/8 text-neutral-500 hover:border-white/15 hover:text-neutral-300"
                }`}
              >
                {mode.icon}
                {mode.label}
              </button>
            ))}
          </div>

          {/* Text input box */}
          <div className="flex items-end gap-3 rounded-2xl border border-white/10 bg-[#2f2f2f] px-4 py-3 focus-within:border-white/20">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              placeholder={`Message ${selectedMode.label}...`}
              disabled={loading || !chatId}
              className="flex-1 resize-none bg-transparent text-sm text-neutral-100 placeholder-neutral-600 outline-none"
              style={{ maxHeight: "200px" }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={loading || !input.trim() || !chatId}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-black transition-all hover:bg-neutral-200 disabled:opacity-30"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
          <p className="mt-2 text-center text-[10px] text-neutral-600">
            AI can make mistakes. Verify important information.
          </p>
        </div>
      </div>
    </div>
  )
}
