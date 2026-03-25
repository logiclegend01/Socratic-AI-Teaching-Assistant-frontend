"use client"

import { useState, useEffect } from "react"
import { useUserStore } from "@/store/userStore"
import { useRouter } from "next/navigation"
import { User, Mail, AtSign, Save, Sparkles, Brain, BookOpen, MessageSquare, LogOut, FileText } from "lucide-react"
import { postuser, getuser, postmode } from "@/auth/auth"

const ASSISTANTS = [
  {
    id: "socratic",
    name: "Sujan (Socratic Guide)",
    description: "Guides you to find answers yourself through thought-provoking questions.",
    icon: Brain,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    activeBorder: "border-amber-500",
  },
  {
    id: "direct",
    name: "Ashish (Direct Tutor)",
    description: "Provides clear, concise explanations and direct answers to your questions.",
    icon: BookOpen,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    activeBorder: "border-blue-500",
  },
  {
    id: "creative",
    name: "Silpa (Creative Mentor)",
    description: "Uses analogies, examples, and creative perspectives to explain complex topics.",
    icon: Sparkles,
    color: "text-purple-500",
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
    activeBorder: "border-purple-500",
  },
  {
    id: "evaluator",
    name: "Strict Evaluator",
    description: "Challenges your knowledge, points out flaws, and pushes you to perfection.",
    icon: MessageSquare,
    color: "text-red-500",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
    activeBorder: "border-red-500",
  }
]

export default function Profile() {
  const { user, logout } = useUserStore()
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    bio: ""
  })
  const [selectedAssistant, setSelectedAssistant] = useState("socratic")
  console.log(selectedAssistant)
  const [isSaving, setIsSaving] = useState(false)
  const [isSavingMode, setIsSavingMode] = useState(false)

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        username: user.username || "",
        email: user.email || "",
        bio: user.bio || ""
      })
    
      const savedAssistant = localStorage.getItem("preferredAssistant")
      if (savedAssistant && ASSISTANTS.some(a => a.id === savedAssistant)) {
        setSelectedAssistant(savedAssistant)
      }
    }
  }, [user])

  const handleSave = async () => {
    setIsSaving(true)

    try {
      await postuser({ name: formData.name, bio: formData.bio })
      
      const identifier = formData.email || formData.username
      if (identifier) {
        const fetchUser = await getuser(identifier)
        if (fetchUser) {
          useUserStore.getState().setUser(fetchUser)
        }
      }

      alert("Personal information saved successfully!")
    } catch (e) {
      console.error(e)
      alert("Failed to save personal information.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveMode = async () => {
    setIsSavingMode(true)

    try {
      await postmode({ assistantmode: selectedAssistant })
      localStorage.setItem("preferredAssistant", selectedAssistant)
      alert("Teaching Assistant mode saved successfully!")
    } catch (e) {
      console.error(e)
      alert("Failed to save mode.")
    } finally {
      setIsSavingMode(false)
    }
  }

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  return (
    <div className="flex h-full min-h-screen w-full flex-col bg-[#171717] text-white">
      <div className="mx-auto w-full max-w-4xl p-6 md:p-10">
        <h1 className="mb-8 text-3xl font-bold tracking-tight">Profile Settings</h1>
        
        <div className="grid gap-8 md:grid-cols-2">
    
          <div className="flex flex-col gap-6 rounded-2xl border border-white/10 bg-[#212121] p-6 lg:col-span-1">
            <div className="mb-2">
              <h2 className="text-xl font-semibold">Personal Information</h2>
              <p className="text-sm text-neutral-400">Update your account details.</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-300">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-[#2f2f2f] py-2.5 pl-10 pr-4 text-sm outline-none transition-colors focus:border-white/20"
                    placeholder="Enter your name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-300">Username</label>
                <div className="relative">
                  <AtSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
                  <input
                    type="text"
                    value={formData.username}
                    disabled
                    className="w-full rounded-xl border border-white/10 bg-[#2f2f2f] py-2.5 pl-10 pr-4 text-sm text-neutral-400 outline-none cursor-not-allowed opacity-70"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-300">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
                  <input
                    type="email"
                    value={formData.email}
                    disabled
                    className="w-full rounded-xl border border-white/10 bg-[#2f2f2f] py-2.5 pl-10 pr-4 text-sm text-neutral-400 outline-none cursor-not-allowed opacity-70"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-300">Bio</label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 h-4 w-4 text-neutral-500" />
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    rows={4}
                    className="w-full rounded-xl border border-white/10 bg-[#2f2f2f] py-2.5 pl-10 pr-4 text-sm outline-none transition-colors focus:border-white/20 resize-none"
                    placeholder="Tell us a little about yourself"
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-black transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {isSaving ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {isSaving ? "Saving..." : "Save Info"}
              </button>
            </div>
          </div>
          <div className="flex flex-col gap-6 rounded-2xl border border-white/10 bg-[#212121] p-6 lg:col-span-1">
            <div className="mb-2">
              <h2 className="text-xl font-semibold">Teaching Assistant</h2>
              <p className="text-sm text-neutral-400">Select how the AI should interact with you.</p>
            </div>

            <div className="space-y-3">
              {ASSISTANTS.map((assistant) => {
                const Icon = assistant.icon
                const isActive = selectedAssistant === assistant.id
                
                return (
                  <button
                    key={assistant.id}
                    onClick={() => setSelectedAssistant(assistant.id)}
                    className={`flex w-full items-start gap-4 rounded-xl border p-4 text-left transition-all ${
                      isActive 
                        ? `${assistant.activeBorder} bg-white/5` 
                        : "border-white/5 bg-[#2a2a2a] hover:border-white/20"
                    }`}
                  >
                    <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${assistant.bg} ${assistant.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-medium text-white">{assistant.name}</h3>
                      <p className="mt-1 text-xs leading-relaxed text-neutral-400">
                        {assistant.description}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={handleSaveMode}
                disabled={isSavingMode}
                className="flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-black transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {isSavingMode ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {isSavingMode ? "Saving..." : "Save Mode"}
              </button>
            </div>
          </div>
        </div>

    
        <div className="mt-8 flex items-center justify-start">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-6 py-3 text-sm font-semibold text-red-500 transition-colors hover:bg-red-500/20"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  )
}