export const MessageRole = {
  user: 'user',
  assistant: 'assistant',
  system: 'system'
} as const

export type MessageRole = (typeof MessageRole)[keyof typeof MessageRole]
