import { Index, Show, createSignal, onMount } from 'solid-js'
import { useThrottleFn } from 'solidjs-use'
// import { getDate } from '@/utils/func'
import { generateSignature } from '@/utils/auth'
import Qustion from './Question.js'
import IconClear from './icons/Clear'
import IconRand from './icons/Rand'
import MessageItem from './MessageItem'
import SystemRoleSettings from './SystemRoleSettings'
import Login from './Login'
import Charge from './Charge.jsx'
import ErrorMessageItem from './ErrorMessageItem'
import SettingItem from './SettingItem.jsx'
import type { ChatMessage, ErrorMessage, Setting, User } from '@/types'

export default () => {
  let inputRef: HTMLTextAreaElement
  const [currentSystemRoleSettings, setCurrentSystemRoleSettings] = createSignal('')
  const [systemRoleEditing, setSystemRoleEditing] = createSignal(false)
  const [messageList, setMessageList] = createSignal<ChatMessage[]>([])
  const [currentError, setCurrentError] = createSignal<ErrorMessage>()
  const [currentAssistantMessage, setCurrentAssistantMessage] = createSignal('')
  const [loading, setLoading] = createSignal(false)
  const [controller, setController] = createSignal<AbortController>(null)
  const [isLogin, setIsLogin] = createSignal(true)
  const [showCharge, setShowCharge] = createSignal(false)
  const [showSetting, setShowSetting] = createSignal(false)
  const [setting, setSetting] = createSignal<Setting>({
    continuousDialogue: true,
    flomoApi: '',
  })
  const [user, setUser] = createSignal<User>({
    id: 0,
    email: '',
    nickname: '',
    times: 0,
    token: '',
    share_code: '',
  })

  onMount(async() => {
    try {
      // 读取设置
      if (localStorage.getItem('setting'))
        setSetting(JSON.parse(localStorage.getItem('setting')))

      // 读取token
      if (localStorage.getItem('token')) {
        setIsLogin(true)
        const response = await fetch('/api/info', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            token: localStorage.getItem('token'),
          }),
        })
        const responseJson = await response.json()
        if (responseJson.code === 200) {
          localStorage.setItem('user', JSON.stringify(responseJson.data))
          setUser(responseJson.data)
        } else {
          setIsLogin(false)
        }
      } else {
        setIsLogin(false)
      }
    } catch (err) {
      console.error(err)
    }
  })

  const handleButtonClick = async() => {
    const inputValue = inputRef.value
    if (!inputValue)
      return

    inputRef.value = ''
    setMessageList([
      ...messageList(),
      {
        role: 'user',
        content: inputValue,
      },
    ])
    requestWithLatestMessage()

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    if (window?.umami) umami.trackEvent('chat_generate')
  }

  const smoothToBottom = useThrottleFn(() => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
  }, 300, false, true)

  const requestWithLatestMessage = async() => {
    setLoading(true)
    setCurrentAssistantMessage('')
    setCurrentError(null)
    const storagePassword = localStorage.getItem('pass')
    try {
      const controller = new AbortController()
      setController(controller)

      // 是否连续对话
      // var requestMessageList=messageList()
      // if(!setting().continuousDialogue){
      //   requestMessageList=[{
      //     role: 'user',
      //     content: messageList()[messageList().length-1]['content'],
      //   }]
      // }
      let requestMessageList = [...messageList()]

      if (!setting().continuousDialogue)
        requestMessageList = [[...messageList()][messageList().length - 1]]

      if (currentSystemRoleSettings()) {
        requestMessageList.unshift({
          role: 'system',
          content: currentSystemRoleSettings(),
        })
      }

      const timestamp = Date.now()

      const response = await fetch('/api/generate', {
        method: 'POST',
        body: JSON.stringify({
          messages: requestMessageList,
          time: timestamp,
          pass: storagePassword,
          token: localStorage.getItem('token'),
          sign: await generateSignature({
            t: timestamp,
            m: requestMessageList?.[requestMessageList.length - 1]?.content || '',
          }),
        }),
        signal: controller.signal,
      })

      if (!response.ok) {
        const error = await response.json()
        console.error(error.error)
        setCurrentError(error.error)
        throw new Error('Request failed')
      }
      const data = response.body
      if (!data)
        throw new Error('No data')

      const reader = data.getReader()
      const decoder = new TextDecoder('utf-8')
      let done = false

      while (!done) {
        const { value, done: readerDone } = await reader.read()
        if (value) {
          const char = decoder.decode(value)
          if (char === '\n' && currentAssistantMessage().endsWith('\n'))
            continue

          if (char)
            setCurrentAssistantMessage(currentAssistantMessage() + char)

          smoothToBottom()
        }
        done = readerDone
      }
    } catch (e) {
      console.error(e)
      setLoading(false)
      setController(null)
      return
    }
    archiveCurrentMessage()
    if (setting().continuousDialogue) {
      let dec_times = Math.ceil(messageList().length / 2)
      if (dec_times > 5)
        dec_times = 5

      user().times = user().times - dec_times
    } else {
      user().times = user().times - 1
    }
    setUser({ ...user() })
  }

  const archiveCurrentMessage = () => {
    if (currentAssistantMessage()) {
      setMessageList([
        ...messageList(),
        {
          role: 'assistant',
          content: currentAssistantMessage(),
        },
      ])
      setCurrentAssistantMessage('')
      setLoading(false)
      setController(null)
      inputRef.focus()
    }
  }

  const clear = () => {
    inputRef.value = ''
    inputRef.style.height = 'auto'
    setMessageList([])
    setCurrentAssistantMessage('')
    // setCurrentSystemRoleSettings('')
    setCurrentError(null)
  }

  const stopStreamFetch = () => {
    if (controller()) {
      controller().abort()
      archiveCurrentMessage()
    }
  }

  const retryLastFetch = () => {
    if (messageList().length > 0) {
      const lastMessage = messageList()[messageList().length - 1]
      if (lastMessage.role === 'assistant')
        setMessageList(messageList().slice(0, -1))

      requestWithLatestMessage()
    }
  }

  const handleKeydown = (e: KeyboardEvent) => {
    if (e.isComposing || e.shiftKey)
      return

    if (e.keyCode === 13) {
      e.preventDefault()
      handleButtonClick()
    }
  }

  const randQuestion = () => {
    clear()
    inputRef.value = Qustion[Math.floor(Math.random() * Qustion.length)]
    inputRef.style.height = 'auto'
    inputRef.style.height = `${inputRef.scrollHeight}px`
    // setMessageList([
    //   ...messageList(),
    //   {
    //     role: 'user',
    //     content: Qustion[Math.floor(Math.random() * Qustion.length)],
    //   },
    // ])
    // requestWithLatestMessage()
  }

  return (
    <div my-1>
      <div>
        <Show when={!isLogin()}>
          <p mt-1 op-60>欢迎来到人工智能时代</p>
          <p mt-1 op-60>验证邮箱以获取免费额度</p>
        </Show>
      </div>
      <div class="flex items-center">
        <Show when={isLogin() && user().nickname}>
          <p mt-1 op-60>
            Hi,{user().nickname} 剩余额度{user().times}次
            <span onClick={() => { setShowCharge(true) }} class="border-1 px-2 py-1 ml-2 rounded-md transition-colors bg-slate/20 cursor-pointer hover:bg-slate/50">充值</span>
          </p>
        </Show>
      </div>

      <Show when={!isLogin()}>
        <Login
          setIsLogin={setIsLogin}
          setUser={setUser}
        />
      </Show>

      <Show when={showCharge()}>
        <Charge
          setShowCharge={setShowCharge}
          setUser={setUser}
        />
      </Show>

      <Show when={isLogin()}>
        <Show when={messageList().length === 0}>
          <div onClick={randQuestion}>
            <span class="mt-2 inline-flex items-center justify-center gap-1 text-sm  bg-slate/20 px-2 py-1 rounded-md transition-colors cursor-pointer hover:bg-slate/50">
              <IconRand />
              <span>随便问问</span>
            </span>
          </div>
        </Show>

        <SystemRoleSettings
          canEdit={() => messageList().length === 0}
          systemRoleEditing={systemRoleEditing}
          setSystemRoleEditing={setSystemRoleEditing}
          currentSystemRoleSettings={currentSystemRoleSettings}
          setCurrentSystemRoleSettings={setCurrentSystemRoleSettings}
        />
        <div id="message-container" class="px-1">
          <Index each={messageList()}>
            {(message, index) => (
              <MessageItem
                role={message().role}
                message={message().content}
                setting={setting}
                showRetry={() => (message().role === 'assistant' && index === messageList().length - 1)}
                onRetry={retryLastFetch}
              />
            )}
          </Index>
        </div>

        {
          currentAssistantMessage() && (
            <MessageItem
              role="assistant"
              message={currentAssistantMessage}
              setting={setting}
            />
          )
        }
        { currentError() && <ErrorMessageItem data={currentError()} onRetry={retryLastFetch} /> }
        <Show
          when={!loading()}
          fallback={() => (
            <div class="gen-cb-wrapper">
              <span>AI思考中...</span>
              <div class="gen-cb-stop" onClick={stopStreamFetch}>停止</div>
            </div>
          )}
        >
          <SettingItem
            messageList={messageList}
            onRetry={retryLastFetch}
            setting={setting}
            setSetting={setSetting}
            showSetting={showSetting}
            setShowSetting={setShowSetting}
            user={user}
          />
          <div class="gen-text-wrapper" class:op-50={systemRoleEditing()}>
            <textarea
              ref={inputRef!}
              disabled={systemRoleEditing()}
              onKeyDown={handleKeydown}
              placeholder="可输入任意问题"
              autocomplete="off"
              autofocus
              onInput={() => {
                inputRef.style.height = 'auto'
                inputRef.style.height = `${inputRef.scrollHeight}px`
              }}
              rows="1"
              class="gen-textarea"
            />
            <button
              onClick={handleButtonClick}
              h-12
              px-2
              py-2
              bg-slate
              bg-op-15
              hover:bg-op-20
              rounded-sm
              w-20
            >
              发送
            </button>
            <button title="Clear" onClick={clear} disabled={systemRoleEditing()} gen-slate-btn>
              <IconClear />
            </button>
          </div>
        </Show >
      </Show>
    </div >
  )
}
