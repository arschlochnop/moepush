import { BaseChannel, ChannelConfig, SendMessageOptions } from "./base"

interface DiscordMessage {
  content: string
}

export class DiscordChannel extends BaseChannel {
  readonly config: ChannelConfig = {
    type: "discord",
    label: "Discord Webhook",
    templates: [
      {
        type: "text",
        name: "文本消息",
        description: "发送简单的文本消息",
        fields: [
          { key: "content", description: "消息内容", required: true, component: 'textarea' },
        ]
      }
    ]
  }

  async sendMessage(
    message: DiscordMessage,
    options: SendMessageOptions
  ): Promise<Response> {
    const { webhook } = options
    
    if (!webhook) {
      throw new Error("缺少 Discord Webhook 地址")
    }
    
    console.log('sendDiscordMessage message:', message)

    const response = await fetch(webhook, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    })

    if (!response.ok) {
      const text = await response.text()
      throw new Error(`Discord 消息推送失败: ${text}`)
    }

    return response
  }
} 