import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common"
import { PrismaService } from "../prisma/primsa.service"
import { AgentService } from "../agent/agent.service"
import express from "express"
import { checkMode } from "../agent/helper/checkmode"
import { modes } from "../agent/type/mode.type"
import { RedisService } from "../redis/redis.service"
import { buildUserContext } from "./helper/userContext"

@Injectable()
export class ChatService {
  constructor(
    private prisma: PrismaService,
    private agent: AgentService,
    private redis: RedisService
  ) { }

  async newChat(email: string, title: string) {
    try {
      if (!email) throw new BadRequestException("email required")

      const cacheKey = `user:email:${email}`

      let user = await this.redis.get<any>(cacheKey)

      if (!user) {

        user = await this.prisma.user.findFirst({ where: { email } })

        if (!user) throw new UnauthorizedException("User not found")

        await this.redis.set(cacheKey, user, 300)
      }

      const chat = await this.prisma.chat.create({
        data: { title: title || "New Chat", userId: user.id },
      })

      await this.redis.del(`chats:${user.id}`)

      return {
        message: "Chat created",
        status: 200,
        chat,
      }
    } catch (e) {
      return {
        message: "Internal server error",
        status: 500,
        error: e.message,
      }
    }
  }

async handleStream(
  message: string,
  chatId: string,
  mode: modes,
  res: express.Response
) {
  try {
    await this.prisma.messages.create({
      data: { content: message, role: "user", chatId },
    });

    const cacheKey = `chat:${chatId}:history`;
    let lastMessages = await this.redis.get<{ role: string; content: string }[]>(cacheKey);

    if (!lastMessages) {
      const dbMessages = await this.prisma.messages.findMany({
        where: { chatId },
        orderBy: { createdAt: "asc" },
        take: 10,
      });
      lastMessages = dbMessages.map((m) => ({ role: m.role, content: m.content }));
      await this.redis.set(cacheKey, lastMessages, 240);
    }

    const user = await this.prisma.chat.findFirst({ where: { id: chatId } });
    if (user) {
      await this.redis.set(`user:${user.userId}`, user, 240);
    }
    const prompt = buildUserContext(user);

    const systemPrompt = checkMode(mode);
    console.log(systemPrompt)
    const messages = [
      { role: "system", content: `${prompt} + ${systemPrompt}` }, 
      ...lastMessages,
      { role: "user", content: message },
    ];

    console.log(message)

    let fullResponse = "";

    for await (const chunk of this.agent.chatStream(messages)) {
      if (!chunk || chunk.trim() === "") continue;
      fullResponse += chunk;

      res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
      (res as any).flush?.();
    }
    await this.prisma.messages.create({
      data: { content: fullResponse, role: "assistant", chatId },
    });

    const updatedHistory = [...lastMessages, { role: "assistant", content: fullResponse }];
    await this.redis.set(cacheKey, updatedHistory, 240);

    res.write("data: [DONE]\n\n");
    res.end();
  } catch (e) {
    res.write(`data: ${JSON.stringify({ error: e.message })}\n\n`);
    res.end();
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
      const key = `history:${chatId}`

      const cached = await this.redis.get(key)
      if (cached) return cached

      const messages = await this.prisma.messages.findMany({
        where: { chatId },
        orderBy: { createdAt: "asc" },
        take: 50,
      })

      await this.redis.set(key, messages, 60)

      return messages
    } catch (e) {
      return { message: "Internal server error", status: 500, error: e.message }
    }
  }

  async getChat(userId: string) {
    try {
      const key = `chats:${userId}`

      const cached = await this.redis.get(key)
      if (cached) return cached

      const chats = await this.prisma.chat.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
      })

      await this.redis.set(key, chats, 60)
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
      return { message: "Chat renamed", status: 200 }
    } catch (e) {
      return { message: "Internal Server error", status: 500, error: e.error }
    }

  }
}
