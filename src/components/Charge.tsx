import { User } from '@/types'
import type { Accessor, Setter } from 'solid-js'
import { createSignal, Index, Show, onMount, onCleanup } from 'solid-js'
interface Props {
    showCharge: Accessor<boolean>
    setShowCharge: Setter<boolean>
    user: Accessor<User>
    setUser: Setter<User>
}

export default (props: Props) => {
    let emailRef: HTMLInputElement
    let codeRef: HTMLInputElement

    const [countdown, setCountdown] = createSignal(0)
    const [url, setUrl] = createSignal('')

    const selfCharge = async () => {
        const response = await fetch("/api/exchange", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                token: localStorage.getItem(`token`),
                code: emailRef.value
            }),
        });
        const responseJson = await response.json();
        if (responseJson.code === 200) {
            props.setUser(responseJson.data)
            setUrl(responseJson.data.url)
            alert(responseJson.data)
            props.setShowCharge(false)
        } else {
            alert(responseJson.message)
        }
    }

    const close = () => {
        props.setShowCharge(false)
    }

    const getPaycode=async(price)=>{
        const response = await fetch("/api/getpaycode", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                token: localStorage.getItem(`token`),
                price: price
            }),
        });
        const responseJson = await response.json();
        if (responseJson.code === 200) {
            setUrl(responseJson.data.url)
            setCountdown(300)
            const intv = setInterval(() => {
                setCountdown(countdown() - 1)
                if (countdown() <= 0) {
                    clearInterval(intv)
                    props.setShowCharge(false)
                    setUrl('')
                }
            }, 1000)

            // 检查是否到账
            const intv2 = setInterval(async() => {
                if (countdown() <= 0) {
                    clearInterval(intv2)
                }else{
                    const response = await fetch("/api/paynotice", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            token: localStorage.getItem(`token`)
                        }),
                    });
                    const responseJson = await response.json();
                    if (responseJson.code === 200) {
                        if(responseJson.data.msg=='充值已到账'){
                            props.setUser(responseJson.data)
                            alert(responseJson.data.msg)
                            props.setShowCharge(false)
                            setUrl('')
                        }
                    }
                }
            },3000)
        } else {
            alert(responseJson.message)
        }
    }

    return (
        <div id="input_container" class="mt-2 max-w-[450px]">
            <div>
                <Show when={!url()}>
                    <span class="text-sm">
                        请选择充值金额
                    </span>
                    <div class="flex space-x-2">
                        <button onClick={()=>{getPaycode(1)}} class="w-1/3 h-12 mt-2 px-4 py-2 bg-slate bg-op-15 hover:bg-op-20 rounded-sm">
                            1元60次
                        </button>
                        <button onClick={()=>{getPaycode(5)}} class="w-1/3 h-12 mt-2 px-4 py-2 bg-slate bg-op-15 hover:bg-op-20 rounded-sm">
                            5元320次
                        </button>
                        <button onClick={()=>{getPaycode(10)}} class="w-1/3 h-12 mt-2 px-4 py-2 bg-slate bg-op-15 hover:bg-op-20 rounded-sm">
                            10元650次
                        </button>
                    </div>
                </Show>
                <Show when={url()}>
                    <span class="text-sm">
                        请在{countdown()}秒内完成支付
                    </span>
                    <img class="w-1/3 mt-2" src={url()} />
                </Show>
                
            </div>
            <hr class="mt-4" />
            <div class="flex mt-4">
                <span class="text-sm">
                    有兑换码? 请在下方输入次数兑换码
                </span>
            </div>

            <input
                ref={emailRef!}
                placeholder="请输入次数兑换码"
                type="text"
                class="gpt-password-input w-full mt-2"
                value=""
            />
            <button onClick={selfCharge} class="w-1/3 h-12 mt-2 px-4 py-2 bg-slate bg-op-15 hover:bg-op-20 rounded-sm">
                兑换
            </button>
            <button onClick={close} class="w-1/3 h-12 mt-2 px-4 py-2 bg-slate bg-op-15 hover:bg-op-20 rounded-sm ml-2">
                关闭
            </button>
        </div>
    )
}