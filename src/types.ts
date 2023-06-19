export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface CosplayItem {
  name: string
  content: string
}

export interface User {
  id: number
  email: string
  nickname: string
  times: number
  token: string
  share_code: string
}
export interface ErrorMessage {
  code: string
  message: string
}

export interface Setting {
  continuousDialogue: boolean
  flomoApi: string
}
