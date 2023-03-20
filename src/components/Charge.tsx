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

    const selfCharge = async () => {
        const response = await fetch("/api/selfCharge", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                token: localStorage.getItem(`token`),
                amount: emailRef.value
            }),
        });
        const responseJson = await response.json();
        if (responseJson.code === 200) {
            props.setShowCharge(true)
            props.setUser(responseJson.data)
            alert('充值成功')
            props.setShowCharge(false)
        } else {
        }
    }

    const close = () => {
        props.setShowCharge(false)
    }

    return (
        <div id="input_container" class="mt-2 max-w-[450px]">
            <div class="flex">
                <img class="w-30" src="/img/alipay.png" alt="" />
                <span class="ml-2 text-sm">
                    说明: <br />
                    当前为自助充值模式, 请使用支付宝扫码<br />
                    当前价格为1元/60次, 根据需要自行决定支付金额<br />
                    支付完成后在下方填入支付金额<br />
                    最后点击自助充值完成充值<br />
                </span>
            </div>

            <input
                ref={emailRef!}
                placeholder="金额"
                type="text"
                class="gpt-password-input w-full mt-2"
                value=""
            />
            <button onClick={selfCharge} class="w-1/3 h-12 mt-2 px-4 py-2 bg-slate bg-op-15 hover:bg-op-20 rounded-sm">
                自助充值
            </button>
            <button onClick={close} class="w-1/3 h-12 mt-2 px-4 py-2 bg-slate bg-op-15 hover:bg-op-20 rounded-sm ml-2">
                关闭
            </button>
        </div>
    )
}