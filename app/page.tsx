"use client"

import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import Sidebar from "@/components/home/sidebar"
import ChatArea from "@/components/home/chatarea"
import api from "@/lib/api"
import { useUserStore } from "@/store/userStore"

export default function Home() {
  const { user } = useUserStore()
  const queryClient = useQueryClient()
  const [activeChatId, setActiveChatId] = useState<string | null>(null)


  const { data: chats = [] } = useQuery<any[]>({
    queryKey: ["chats", user?.id],
    queryFn: async () => {
      if (!user?.id) return []
      const res = await api.post("/chat/getchat", { userId: user.id })
      return res.data || []
    },
    enabled: !!user?.id,
  })

  useEffect(() => {
    if (!activeChatId && chats.length > 0) {
      setActiveChatId(chats[0].id)
    }
  }, [chats, activeChatId])


  const { data: messages = [] } = useQuery<any[]>({
    queryKey: ["messages", activeChatId],
    queryFn: async () => {
      if (!activeChatId || !user?.email) return []
      const res = await api.post("/chat/get", { email: user.email, chatId: activeChatId })
      return res.data || []
    },
    enabled: !!activeChatId && !!user?.email,
  })


  const createChatMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post("/chat/new", { title: "New Chat", email: user?.email })
      return res.data?.chat || res.data
    },
    onSuccess: (newChat) => {
      if (!newChat?.id) return
      queryClient.setQueryData(["chats", user?.id], (old: any[]) => [newChat, ...(old || [])])
      setActiveChatId(newChat.id)
    },
  })

  const deleteChatMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.post("/chat/delete", { chatId: id, email: user?.email })
      return id
    },
    onSuccess: (deletedId) => {
      queryClient.setQueryData(["chats", user?.id], (old: any[]) =>
        old.filter((c) => c.id !== deletedId)
      )
      if (activeChatId === deletedId) setActiveChatId(null)
    },
  })

  const setMessagesOptimistic = (newMessages: any[]) => {
    queryClient.setQueryData(["messages", activeChatId], newMessages)
  }


  return (
    <div className="flex h-screen overflow-hidden bg-[#212121] text-neutral-100">
      <Sidebar
        chats={chats}
        activeChatId={activeChatId}
        onSelectChat={(id) => setActiveChatId(id)}
        onNewChat={() => createChatMutation.mutate()}
        onDeleteChat={(id) => deleteChatMutation.mutate(id)}
        isCreating={createChatMutation.isPending}
      />

      <ChatArea
        messages={messages}
        setMessages={setMessagesOptimistic}
        chatId={activeChatId}
      />
    </div>
  )
}
