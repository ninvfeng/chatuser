// #vercel-disable-blocks
import { ProxyAgent, fetch } from 'undici'
// #vercel-end
import { generatePayload, parseOpenAIStream } from '@/utils/openAI'
import { verifySignature } from '@/utils/auth'
import type { APIRoute } from 'astro'

const apiKey = import.meta.env.OPENAI_API_KEY
const httpsProxy = import.meta.env.HTTPS_PROXY
const baseUrl = ((import.meta.env.OPENAI_API_BASE_URL) || 'https://api.openai.com').trim().replace(/\/$/, '')
const sitePassword = import.meta.env.SITE_PASSWORD
const API_URL = import.meta.env.API_URL

export const post: APIRoute = async(context) => {
  const body = await context.request.json()
  const { sign, time, messages, pass, token } = body
  if (!messages) {
    return new Response(JSON.stringify({
      error: {
        message: 'No input text.',
      },
    }), { status: 400 })
  }
  if (sitePassword && sitePassword !== pass) {
    return new Response(JSON.stringify({
      error: {
        message: 'Invalid password.',
      },
    }), { status: 401 })
  }
  if (import.meta.env.PROD && !await verifySignature({ t: time, m: messages?.[messages.length - 1]?.content || '' }, sign)) {
    return new Response(JSON.stringify({
      error: {
        message: 'Invalid signature.',
      },
    }), { status: 401 })
  }

  // 消耗次数
  const useRes = await fetch(`${API_URL}/api/gpt/consume`, {
    headers: {
      'Content-Type': 'application/json',
      'Token': token,
    },
    method: 'POST',
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      token: JSON.stringify(messages).length * 4,
      times: Math.ceil(messages.length / 2),
      app_key: import.meta.env.APP_KEY,
    }),
  })
  const res = await useRes.text()
  const resJson = JSON.parse(res)
  if (resJson.code !== 200)
    return new Response(resJson.message)

  messages.unshift({
    role: 'system',
    content: '你是GPT3.5,比GPT3更聪明,请认真思考后回答',
  })

  // 从服务器获取可用key
  const domainRes = await fetch(`${import.meta.env.API_URL}/api/gpt/getChatInfo`, {
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
    body: JSON.stringify({
      app_key: import.meta.env.APP_KEY,
    }),
  })
  const chatInfo = await domainRes.json() as { data: { key: string, domain: string } }
  let apikeyTemp = apiKey
  let baseUrlTemp = baseUrl
  if (chatInfo.data && chatInfo.data.domain) {
    apikeyTemp = chatInfo.data.key
    baseUrlTemp = chatInfo.data.domain
  }

  const initOptions = generatePayload(apikeyTemp, messages)
  // #vercel-disable-blocks
  if (httpsProxy)
    initOptions.dispatcher = new ProxyAgent(httpsProxy)
  // #vercel-end

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  const response = await fetch(`${baseUrlTemp}/v1/chat/completions`, initOptions).catch((err: Error) => {
    console.error(err)
    return new Response(JSON.stringify({
      error: {
        code: err.name,
        message: err.message,
      },
    }), { status: 500 })
  }) as Response

  return parseOpenAIStream(response) as Response
}
