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
  actionCard?: {
    title: string
    text: string
    btnOrientation?: string
    singleTitle?: string
    singleURL?: string
    btns?: Array<{
      title: string
      actionURL: string
    }>
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
      {
        type: "actionCard-single",
        name: "整体跳转ActionCard",
        description: "整体跳转的卡片消息",
        fields: [
          { key: "actionCard.title", description: "首屏会话透出的展示内容", required: true },
          { key: "actionCard.text", description: "markdown格式的消息内容", required: true, component: 'textarea' },
          { key: "actionCard.singleTitle", description: "单个按钮的标题", required: true },
          { key: "actionCard.singleURL", description: "点击按钮触发的URL", required: true },
          { key: "msgtype", component: 'hidden', defaultValue: "actionCard" },
        ],
      },
      {
        type: "actionCard-multi",
        name: "独立跳转ActionCard",
        description: "独立跳转的卡片消息，可添加多个按钮",
        fields: [
          { key: "actionCard.title", description: "首屏会话透出的展示内容", required: true },
          { key: "actionCard.text", description: "markdown格式的消息内容", required: true, component: 'textarea' },
          { key: "actionCard.btnOrientation", description: "按钮排列方向", component: 'select', options: [
            { label: "按钮竖直排列", value: "0" },
            { label: "按钮横向排列", value: "1" }
          ], defaultValue: "0" },
          { key: "actionCard.btns", description: "按钮列表", placeholder: "按钮列表，格式为JSON数组：[{\"title\":\"按钮标题\",\"actionURL\":\"跳转链接\"}]", required: true, component: 'textarea' },
          { key: "msgtype", component: 'hidden', defaultValue: "actionCard" },
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
  ): Promise<Response> {
    try {
      const { webhook, secret } = options
      
      if (!webhook) {
        throw new Error("缺少 Webhook 地址")
      }
      
      if (message.msgtype === 'actionCard' && message.actionCard?.btns && typeof message.actionCard.btns === 'string') {
        message.actionCard.btns = JSON.parse(message.actionCard.btns as unknown as string);
      }
      
      let url = webhook
      if (secret) {
        const timestamp = Date.now()
        const sign = await this.generateDingTalkSign(secret, timestamp)
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