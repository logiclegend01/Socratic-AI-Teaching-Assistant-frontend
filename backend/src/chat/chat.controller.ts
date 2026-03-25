<<<<<<< HEAD
import { Controller, Post, Body, Res } from "@nestjs/common"
import { ChatService } from "./chat.service"
import express from "express"
import { modes } from "../agent/type/mode.type"

@Controller("api/chat")
export class ChatController {
  constructor(private chatService: ChatService) {}

  // Create a new chat
  @Post("new")
  async newChat(@Body() body: { email: string; title: string }) {
    const { email, title } = body
    return this.chatService.newChat(email, title)
  }

  // Stream a chat response (SSE)
  @Post("stream")
  async streamChat(
    @Body() body: { message: string; chatId: string; mode: modes },
    @Res() res: express.Response
  ) {
    const { message, chatId, mode } = body
    res.setHeader("Content-Type", "text/event-stream")
    res.setHeader("Cache-Control", "no-cache")
    res.setHeader("Connection", "keep-alive")
    res.flushHeaders()
    await this.chatService.handleStream(message, chatId, mode, res)
  }

  // Generate a test quiz (non-streamed)
  @Post("test")
  async generateTest(@Body() body: { topic: string; chatId: string }) {
    const { topic, chatId } = body
    return this.chatService.generateTest(topic, chatId)
  }

  // Get messages for a specific chat
  @Post("get")
  async getChatMessages(@Body() body: { chatId: string; email: string }) {
    const { chatId, email } = body
    return this.chatService.getChatHistory(chatId, email)
  }

  // Get all chats for a user
  @Post("getchat")
  async getChat(@Body() body: { userId: string }) {
    const { userId } = body
    return this.chatService.getChat(userId)
  }

  // Delete a chat (and its messages)
  @Post("delete")
  async deleteChat(@Body() body: { chatId: string }) {
    const { chatId } = body
    return this.chatService.deleteChat(chatId)
  }

  // Rename a chat
  @Post("rename")
  async renameChat(@Body() body: { chatId: string; title: string }) {
    const { chatId, title } = body
    return this.chatService.renameChat(chatId, title)
  }
}
=======
import { Controller, Post, Body, Res } from "@nestjs/common"
import { ChatService } from "./chat.service"
import express from "express"
import { modes } from "../agent/type/mode.type"

@Controller("api/chat")
export class ChatController {
  constructor(private chatService: ChatService) {}

  @Post("new")
  async newChat(@Body() body: { email: string; title: string }) {
    const { email, title } = body
    return this.chatService.newChat(email, title)
  }

  @Post("stream")
  async streamChat(
    @Body() body: { message: string; chatId: string; mode: modes },
    @Res() res: express.Response
  ) {
    const { message, chatId, mode } = body
    res.setHeader("Content-Type", "text/event-stream")
    res.setHeader("Cache-Control", "no-cache")
    res.setHeader("Connection", "keep-alive")
    res.flushHeaders()
    await this.chatService.handleStream(message, chatId, mode, res)
  }

  @Post("test")
  async generateTest(@Body() body: { topic: string; chatId: string }) {
    const { topic, chatId } = body
    return this.chatService.generateTest(topic, chatId)
  }

  @Post("get")
  async getChatMessages(@Body() body: { chatId: string; email: string }) {
    const { chatId, email } = body
    return this.chatService.getChatHistory(chatId, email)
  }

  @Post("getchat")
  async getChat(@Body() body: { userId: string }) {
    const { userId } = body
    return this.chatService.getChat(userId)
  }

  @Post("delete")
  async deleteChat(@Body() body: { chatId: string }) {
    const { chatId } = body
    return this.chatService.deleteChat(chatId)
  }

  @Post("rename")
  async renameChat(@Body() body: {chatId: string, title:string}){
    const {chatId,title} = body
    return this.chatService.renameChat(chatId,title)
  }

}
>>>>>>> 6c3787e9c47271587a746b843c83318d7b398e45
