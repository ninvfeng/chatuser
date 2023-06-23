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
  inv_count: number
  inv_pay_count: number
  times_reward: number
  dir_inv_rate: number
}
export interface ErrorMessage {
  code: string
  message: string
}

export interface Setting {
  continuousDialogue: boolean
  flomoApi: string
}
