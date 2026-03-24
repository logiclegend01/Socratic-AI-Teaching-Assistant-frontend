"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import {
  Plus,
  Trash2,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from "lucide-react"
import { useUserStore } from "@/store/userStore"
import { useRouter } from "next/navigation"

interface Chat {
  id: string
  title?: string
  createdAt?: string
}

interface SidebarProps {
  chats: Chat[]
  activeChatId: string | null
  onSelectChat: (id: string) => void
  onNewChat: () => void
  onDeleteChat: (id: string) => void
  isCreating?: boolean
}

export default function Sidebar({
  chats,
  activeChatId,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  isCreating,
}: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const { user, logout } = useUserStore()
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  const groupChats = () => {
    const now = new Date()
    const today: Chat[] = []
    const yesterday: Chat[] = []
    const older: Chat[] = []

    chats.forEach((chat) => {
      if (!chat.createdAt) {
        today.push(chat)
        return
      }
      const d = new Date(chat.createdAt)
      const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000)
      if (diffDays < 1) today.push(chat)
      else if (diffDays < 2) yesterday.push(chat)
      else older.push(chat)
    })

    return { today, yesterday, older }
  }

  const groups = groupChats()

  const ChatItem = ({ chat }: { chat: Chat }) => (
    <div
      className="group relative"
      onMouseEnter={() => setHoveredId(chat.id)}
      onMouseLeave={() => setHoveredId(null)}
    >
      <button
        onClick={() => onSelectChat(chat.id)}
        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
          activeChatId === chat.id
            ? "bg-white/10 text-white"
            : "text-neutral-400 hover:bg-white/5 hover:text-white"
        }`}
      >
        <MessageSquare className="h-3.5 w-3.5 shrink-0" />
        {!collapsed && (
          <span className="flex-1 truncate">{chat.title || "New Chat"}</span>
        )}
      </button>

    
      {!collapsed && hoveredId === chat.id && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDeleteChat(chat.id)
          }}
          className="absolute right-2 top-2 rounded p-1 text-neutral-500 hover:text-red-400 transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )

  const GroupSection = ({ label, items }: { label: string; items: Chat[] }) => {
    if (items.length === 0) return null
    return (
      <div className="mb-3">
        {!collapsed && (
          <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-neutral-600">
            {label}
          </p>
        )}
        <div className="space-y-0.5">
          {items.map((chat) => (
            <ChatItem key={chat.id} chat={chat} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <motion.aside
      animate={{ width: collapsed ? 60 : 260 }}
      transition={{ duration: 0.25, ease: "easeInOut" }}
      className="relative flex h-full shrink-0 flex-col border-r border-white/8 bg-[#171717] overflow-hidden"
    >
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="absolute -right-3 top-6 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-[#212121] text-neutral-400 hover:text-white shadow-sm"
      >
        {collapsed ? (
          <ChevronRight className="h-3 w-3" />
        ) : (
          <ChevronLeft className="h-3 w-3" />
        )}
      </button>

      <div className="flex h-14 items-center px-4 border-b border-white/8">
        <Image src="/assets/logo-without.webp" alt="Logo" width={28} height={28} className="shrink-0 object-contain" />
        {!collapsed && (
          <span className="ml-2.5 text-sm font-semibold text-white truncate">
            Digital Socratic
          </span>
        )}
      </div>

      <div className="px-2 py-3">
        <button
          onClick={onNewChat}
          disabled={isCreating}
          className={`flex w-full items-center gap-2.5 rounded-lg border border-white/10 px-3 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/8 disabled:opacity-50 ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <Plus className="h-4 w-4 shrink-0" />
          {!collapsed && <span>New chat</span>}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-1 scrollbar-thin scrollbar-thumb-white/10">
        {chats.length === 0 ? (
          !collapsed && (
            <p className="mt-4 px-3 text-xs text-neutral-600">
              No conversations yet
            </p>
          )
        ) : (
          <>
            <GroupSection label="Today" items={groups.today} />
            <GroupSection label="Yesterday" items={groups.yesterday} />
            <GroupSection label="Older" items={groups.older} />
          </>
        )}
      </div>

      <div className="border-t border-white/8 px-2 py-3">
        <button
          onClick={handleLogout}
          className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-neutral-400 hover:bg-white/5 hover:text-white transition-colors ${
            collapsed ? "justify-center" : ""
          }`}
        >
          {user?.name ? (
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-600 text-xs font-bold text-white">
              {user.name[0].toUpperCase()}
            </span>
          ) : (
            <LogOut className="h-4 w-4 shrink-0" />
          )}
          {!collapsed && (
            <span className="flex-1 truncate">{user?.name || user?.email || "Logout"}</span>
          )}
          {!collapsed && <LogOut className="h-3.5 w-3.5 text-neutral-600" />}
        </button>
      </div>
    </motion.aside>
  )
}
