<<<<<<< HEAD
import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common"
import { PrismaService } from "../prisma/primsa.service"
import { AgentService } from "../agent/agent.service"
import express from "express"
import { checkMode } from "../agent/helper/checkmode"
import { modes } from "../agent/type/mode.type"

@Injectable()
export class ChatService {
  constructor(
    private prisma: PrismaService,
    private agent: AgentService
  ) {}

  // ── Create a new chat (no dummy AI call) ───────────────────────────────────
  async newChat(email: string, title: string) {
    try {
      if (!email) throw new BadRequestException("email required")

      const user = await this.prisma.user.findFirst({ where: { email } })
      if (!user) throw new UnauthorizedException("User not found")

      const chat = await this.prisma.chat.create({
        data: { title: title || "New Chat", userId: user.id },
      })

      return { message: "Chat created", status: 200, chat }
    } catch (e) {
      return { message: "Internal server error", status: 500, error: e.message }
    }
  }

  // ── Stream a chat message ──────────────────────────────────────────────────
  async handleStream(message: string, chatId: string, mode: modes, res: express.Response) {
    try {
      // Save the user message
      await this.prisma.messages.create({
        data: { content: message, role: "user", chatId },
      })

      // Get recent conversation history (oldest first for context)
      const lastMessages = await this.prisma.messages.findMany({
        where: { chatId },
        orderBy: { createdAt: "asc" },
        take: 10,
      })

      const history = lastMessages.map((m) => ({ role: m.role, content: m.content }))

      const systemPrompt = checkMode(mode)
      const messages = [
        { role: "system", content: systemPrompt },
        ...history,
        { role: "user", content: message },
      ]

      let fullResponse = ""

      for await (const chunk of this.agent.chatStream(messages)) {
        if (!chunk || chunk.trim() === "") continue
        fullResponse += chunk
        res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`)
        ;(res as any).flush?.()
      }

      // Save the assistant response
      await this.prisma.messages.create({
        data: { content: fullResponse, role: "assistant", chatId },
      })

      res.write("data: [DONE]\n\n")
      res.end()
    } catch (e) {
      res.write(`data: ${JSON.stringify({ error: e.message })}\n\n`)
      res.end()
    }
  }

  // ── Generate a test (non-streamed JSON quiz) ───────────────────────────────
  async generateTest(topic: string, chatId: string) {
    try {
      const systemPrompt = checkMode(modes.test)
      const messages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Generate a comprehensive multiple-choice test about: ${topic}` },
      ]

      let fullResponse = ""
      for await (const chunk of this.agent.chatStream(messages)) {
        fullResponse += chunk
      }

      // Extract JSON even if model wraps it in markdown
      const jsonMatch = fullResponse.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error("Model did not return valid JSON")

      const parsed = JSON.parse(jsonMatch[0])

      // Save to messages for history
      if (chatId) {
        await this.prisma.messages.create({
          data: { content: topic, role: "user", chatId },
        })
        await this.prisma.messages.create({
          data: { content: JSON.stringify(parsed), role: "assistant", chatId },
        })
      }

      return { status: 200, test: parsed }
    } catch (e) {
      return { status: 500, error: e.message }
    }
  }

  // ── Get chat message history (oldest first) ────────────────────────────────
  async getChatHistory(chatId: string, _email: string) {
    try {
      const messages = await this.prisma.messages.findMany({
        where: { chatId },
        orderBy: { createdAt: "asc" },
        take: 50,
      })
      return messages
    } catch (e) {
      return { message: "Internal server error", status: 500, error: e.message }
    }
  }

  // ── Get all chats for a user ───────────────────────────────────────────────
  async getChat(userId: string) {
    try {
      const chats = await this.prisma.chat.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
      })
      return chats
    } catch (e) {
      return { message: "Internal server error", status: 500, error: e.message }
    }
  }

  // ── Delete a chat and all its messages ────────────────────────────────────
  async deleteChat(chatId: string) {
    try {
      // Delete messages first (foreign key constraint)
      await this.prisma.messages.deleteMany({ where: { chatId } })
      await this.prisma.chat.delete({ where: { id: chatId } })
      return { message: "Chat deleted", status: 200 }
    } catch (e) {
      return { message: "Internal server error", status: 500, error: e.message }
    }
  }

  // ── Rename a chat ──────────────────────────────────────────────────────────
  async renameChat(chatId: string, title: string) {
    try {
      const chat = await this.prisma.chat.update({
        where: { id: chatId },
        data: { title },
      })
      return { message: "Chat renamed", status: 200, chat }
    } catch (e) {
      return { message: "Internal server error", status: 500, error: e.message }
    }
  }
}
=======
import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common"
import { PrismaService } from "../prisma/primsa.service"
import { AgentService } from "../agent/agent.service"
import express from "express"
import { checkMode } from "../agent/helper/checkmode"
import { modes } from "../agent/type/mode.type"

@Injectable()
export class ChatService {
  constructor(
    private prisma: PrismaService,
    private agent: AgentService
  ) { }

  async newChat(email: string, title: string) {
    try {
      if (!email) throw new BadRequestException("email required")

      const user = await this.prisma.user.findFirst({ where: { email } })
      if (!user) throw new UnauthorizedException("User not found")

      const chat = await this.prisma.chat.create({
        data: { title: title || "New Chat", userId: user.id },
      })

      return {
        message: "Chat created",
        status: 200, chat
      }
    } catch (e) {
      return {
        message: "Internal server error",
        status: 500, error: e.message
      }
    }
  }

  async handleStream(message: string, chatId: string, mode: modes, res: express.Response) {
    try {
      await this.prisma.messages.create({
        data: { content: message, role: "user", chatId },
      })

      const lastMessages = await this.prisma.messages.findMany({
        where: { chatId },
        orderBy: { createdAt: "asc" },
        take: 10,
      })

      const history = lastMessages.map((m) => ({ role: m.role, content: m.content }))

      const systemPrompt = checkMode(mode)
      const messages = [
        { role: "system", content: systemPrompt },
        ...history,
        { role: "user", content: message },
      ]

      let fullResponse = ""

      for await (const chunk of this.agent.chatStream(messages)) {
        if (!chunk || chunk.trim() === "") continue
        fullResponse += chunk
        res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`)
          ; (res as any).flush?.()
      }

      await this.prisma.messages.create({
        data: { content: fullResponse, role: "assistant", chatId },
      })

      res.write("data: [DONE]\n\n")
      res.end()
    } catch (e) {
      res.write(`data: ${JSON.stringify({ error: e.message })}\n\n`)
      res.end()
    }
  }

  async generateTest(topic: string, chatId: string) {
    try {
      const systemPrompt = checkMode(modes.test)
      const messages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Generate a comprehensive multiple-choice test about: ${topic}` },
      ]

      let fullResponse = ""
      for await (const chunk of this.agent.chatStream(messages)) {
        fullResponse += chunk
      }

      const jsonMatch = fullResponse.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error("Model did not return valid JSON")

      const parsed = JSON.parse(jsonMatch[0])

      if (chatId) {
        await this.prisma.messages.create({
          data: { content: topic, role: "user", chatId },
        })
        await this.prisma.messages.create({
          data: { content: JSON.stringify(parsed), role: "assistant", chatId },
        })
      }

      return { status: 200, test: parsed }
    } catch (e) {
      return { status: 500, error: e.message }
    }
  }

  async getChatHistory(chatId: string, _email: string) {
    try {
      const messages = await this.prisma.messages.findMany({
        where: { chatId },
        orderBy: { createdAt: "asc" },
        take: 50,
      })
      return messages
    } catch (e) {
      return { message: "Internal server error", status: 500, error: e.message }
    }
  }

  async getChat(userId: string) {
    try {
      const chats = await this.prisma.chat.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
      })
      return chats
    } catch (e) {
      return { message: "Internal server error", status: 500, error: e.message }
    }
  }

  async deleteChat(chatId: string) {
    try {
      await this.prisma.messages.deleteMany({ where: { chatId } })
      await this.prisma.chat.delete({ where: { id: chatId } })
      return { message: "Chat deleted", status: 200 }
    } catch (e) {
      return { message: "Internal server error", status: 500, error: e.message }
    }
  }


  async renameChat(chatId: string, title: string) {
    try {
        await this.prisma.chat.update({
        where: { id: chatId },
        data: { title }
      })
      return {message: "Chat renamed", status: 200}
    } catch (e) {
      return { message: "Internal Server error", status: 500, error: e.error }
    }

  }
}
>>>>>>> 6c3787e9c47271587a746b843c83318d7b398e45
