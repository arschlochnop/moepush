import { BaseChannel, ChannelConfig, SendMessageOptions } from "./base"

interface DingTalkMessage {
  msgtype: string
  text?: {
    content: string
  }
  markdown?: {
    title: string
    text: string
  }
  at?: {
    atMobiles?: string[]
    atUserIds?: string[]
    isAtAll?: boolean
  }
}

export class DingTalkChannel extends BaseChannel {
  readonly config: ChannelConfig = {
    type: "dingtalk",
    label: "钉钉群机器人",
    templates: [
      {
        type: "text",
        name: "文本消息",
        description: "最基础的消息类型",
        fields: [
          { key: "text.content", description: "消息内容", required: true, component: 'textarea' },
          { key: "at.atMobiles", description: "被@人的手机号" },
          { key: "at.atUserIds", description: "被@人的用户ID" },
          { key: "at.isAtAll", description: "是否@所有人", component: 'checkbox' },
          { key: "msgtype", component: 'hidden', defaultValue: "text" },
        ],
      },
      {
        type: "markdown",
        name: "Markdown消息",
        description: "支持Markdown格式的富文本消息",
        fields: [
          { key: "markdown.title", description: "首屏会话透出的展示内容", required: true },
          { key: "markdown.text", description: "markdown格式的消息内容", required: true, component: 'textarea' },
          { key: "at.atMobiles", description: "被@人的手机号" },
          { key: "at.atUserIds", description: "被@人的用户ID" },
          { key: "at.isAtAll", description: "是否@所有人", component: 'checkbox' },
          { key: "msgtype", component: 'hidden', defaultValue: "markdown" },
        ],
      },
    ]
  }

  async generateDingTalkSign(secret: string, timestamp: number): Promise<string> {
    const encoder = new TextEncoder()
    const keyData = encoder.encode(secret)
    const msgData = encoder.encode(`${timestamp}\n${secret}`)

    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )

    const signature = await crypto.subtle.sign(
      'HMAC',
      key,
      msgData
    )

    return btoa(String.fromCharCode(...new Uint8Array(signature)))
  }

  async sendMessage(
    message: DingTalkMessage,
    options: SendMessageOptions
  ): Promise<any> {
    try {
      const { webhook, secret } = options
      
      if (!webhook) {
        throw new Error("缺少 Webhook 地址")
      }
      
      let url = webhook
      // 如果提供了加签密钥，添加签名参数
      if (secret) {
        const timestamp = Date.now()
        const sign = await this.generateDingTalkSign(secret, timestamp)
        // 使用新的URL对象来处理参数拼接
        const urlObj = new URL(webhook)
        urlObj.searchParams.append('timestamp', timestamp.toString())
        urlObj.searchParams.append('sign', sign)
        url = urlObj.toString()
      }

      console.log('Sending DingTalk message to:', url)
      console.log('Message:', message)

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      })

      const data = await response.json() as { errcode: number, errmsg: string }
      if (data.errcode !== 0) {
        throw new Error(`钉钉消息推送失败: ${data.errmsg}`)
      }

      return response
    } catch (error) {
      console.error('DingTalk error:', error)
      throw error
    }
  }
} 