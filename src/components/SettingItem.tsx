import { toBlob, toJpeg } from 'html-to-image'
import { Show, onMount } from 'solid-js'
import { copyToClipboard, dateFormat, isMobile } from '@/utils'
import type { ChatMessage, Setting } from '@/types'
import type { Accessor, Setter } from 'solid-js'

interface Props {
  messageList: Accessor<ChatMessage[]>
  onRetry?: () => void
  setting: Accessor<Setting>
  setSetting: Setter<Setting>
  showSetting: Accessor<boolean>
  setShowSetting: Setter<boolean>
}

export default (props: Props) => {
  let flomoRef: HTMLInputElement

  onMount(async() => {
    try {
      // 读取设置
      if (localStorage.getItem('setting')) {
        if (!props.setting().flomoApi) {
          props.setting().flomoApi = ''
          props.setSetting({ ...props.setting() })
        }
      }
    } catch (err) {
      console.error(err)
    }
  })

  async function exportJpg() {
    const messageContainer = document.querySelector(
      '#message-container',
    ) as HTMLElement
    async function downloadIMG() {
      const url = await toJpeg(messageContainer)
      const a = document.createElement('a')
      a.href = url
      a.download = `ChatGPT-${dateFormat(new Date(), 'HH-MM-SS')}.jpg`
      a.click()
    }
    if (!isMobile() && navigator.clipboard) {
      try {
        const blob = await toBlob(messageContainer)
        blob
              && (await navigator.clipboard.write([
                new ClipboardItem({
                  [blob.type]: blob,
                }),
              ]))
      } catch (e) {
        await downloadIMG()
      }
    } else {
      await downloadIMG()
    }
  }

  async function exportMD() {
    const role = {
      system: '系统',
      user: '我',
      assistant: 'ChatGPT',
      error: '错误',
    }
    await copyToClipboard(
      props.messageList().map((k) => {
        return `### ${role[k.role]}\n\n${k.content.trim()}`
      }).join('\n\n\n\n'),
    )
  }

  return (
    <div>
      <Show when={props.messageList().length > 0}>
        <div class="flex justify-end">
          <div class="flex space-x-2 op-70">
            <svg
              onClick={props.onRetry}
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              class="w-6 h-6 cursor-pointer"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>

            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              class="w-6 h-6 cursor-pointer"
              onClick={exportJpg}
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>

            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              class="w-6 h-6 cursor-pointer"
              onClick={exportMD}
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
            </svg>

            <div class="flex items-center cursor-pointer">
              <label class="relative inline-flex items-center cursor-pointer ml-1">
                <input
                  type="checkbox"
                  checked={props.setting().continuousDialogue}
                  class="sr-only peer"
                  onChange={(e) => {
                    props.setting().continuousDialogue = (e.target as HTMLInputElement).checked
                    localStorage.setItem('setting', JSON.stringify(props.setting()))
                    props.setSetting({ ...props.setting() })
                  }}
                />
                <div class="w-9 h-5 bg-slate bg-op-15 peer-focus:outline-none peer-focus:ring-0  rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-500" />
              </label>
            </div>

            <div
              class="flex cursor-pointer"
              onClick={() => {
                props.setShowSetting(!props.showSetting())
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                class="w-6 h-6"
              >
                <path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              功能说明
            </div>
          </div>
        </div>
      </Show>

      <Show when={props.showSetting()}>
        <div class="my-4 op-70">
          <div class="text-sm space-y-1">
            <div class="flex">
              <svg
                onClick={props.onRetry}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                class="w-6 h-6 cursor-pointer"
              >
                <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
              <span> 点击可重新生成答案</span>
            </div>
            <div class="flex">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                class="w-6 h-6 cursor-pointer"
                onClick={exportJpg}
              >
                <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
              <span> 将全部问答保存为图片</span>
            </div>
            <div class="flex">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                class="w-6 h-6 cursor-pointer"
                onClick={exportMD}
              >
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
              </svg>
              <span> 复制全部问答的文本</span>
            </div>
            <div>
              <div>开关为连续对话开关</div>
              <div>开启理解对话上下文,但次数消耗快,每次问答消耗累加(最高5次)</div>
              <div>关闭不理解对话上下文,次数消耗少,每次仅消耗1次</div>
            </div>
            <div>
              <div>↓网站集成了flomo笔记接口,可将某个提问或回答保存到笔记软件</div>
              <a class="mt-2 inline-flex items-center justify-center gap-1 text-sm  bg-slate/20 px-2 py-1 rounded-md transition-colors cursor-pointer hover:bg-slate/50" href="https://v.flomoapp.com/register/?NzQyMDE" target="_brank">注册浮墨笔记</a>
            </div>

          </div>
          <div class="flex space-x-2">
            <input
              ref={flomoRef!}
              placeholder="填写flomo API链接"
              type="text"
              class="gpt-password-input w-full mt-2"
              value={props.setting().flomoApi}
            />
            <button
              onClick={() => {
                props.setting().flomoApi = flomoRef.value
                localStorage.setItem('setting', JSON.stringify(props.setting()))
                props.setSetting({ ...props.setting() })
                props.setShowSetting(false)
              }}
              class="w-1/3 h-12 mt-2 px-4 py-2 bg-slate bg-op-15 hover:bg-op-20 rounded-sm"
            >
              保存
            </button>
          </div>

        </div>
      </Show>

    </div>
  )
}
