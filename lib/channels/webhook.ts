import { BaseChannel, ChannelConfig, SendMessageOptions } from "./base"

interface WebhookMessage {
  method?: string
  headers?: Record<string, string>
  body: string
}

export class WebhookChannel extends BaseChannel {
  readonly config: ChannelConfig = {
    type: "webhook",
    label: "通用 Webhook",
    templates: [
      {
        type: "advanced",
        name: "自定义请求",
        description: "发送自定义 HTTP 请求",
        fields: [
          { 
            key: "method", 
            description: "HTTP 方法", 
            required: false,
            component: 'select',
            options: [
              { value: "POST", label: "POST" },
              { value: "GET", label: "GET" }
            ]
          },
          { 
            key: "headers", 
            description: "HTTP 请求头 (JSON 格式)", 
            required: false,
            component: 'textarea',
            placeholder: '{\n  "Content-Type": "application/json",\n  "Authorization": "Bearer xxx"\n}'
          },
          { 
            key: "body", 
            description: "请求体/参数 (JSON 格式)", 
            required: true,
            component: 'textarea',
            placeholder: '{\n  "text": "Hello World",\n  "color": "good"\n}'
          }
        ]
      }
    ]
  }

  async sendMessage(
    message: WebhookMessage,
    options: SendMessageOptions
  ): Promise<Response> {
    const { webhook } = options
    
    if (!webhook) {
      throw new Error("缺少 Webhook 地址")
    }

    console.log('sendWebhookMessage message:', message)

    const method = message.method === 'GET' ? 'GET' : 'POST'
    const headers = message.method === 'GET' ? message.headers : {
      'Content-Type': 'application/json',
      ...(message.headers || {})
    }

    try {
      let url = webhook
      const fetchOptions: RequestInit = {
        method,
        headers
      }

      if (method === 'GET') {
        const urlObj = new URL(webhook)
        
        const bodyObj = JSON.parse(message.body || '{}') 
          
        Object.entries(bodyObj).forEach(([key, value]) => {
          urlObj.searchParams.append(key, String(value))
        })
        
        url = urlObj.toString()
      } else {
        fetchOptions.body = message.body
      }

      const response = await fetch(url, fetchOptions)

      if (!response.ok) {
        const text = await response.text()
        throw new Error(`Webhook 请求失败: ${text}`)
      }

      return response
    } catch (error) {
      console.error('Webhook error:', error)
      throw error
    }
  }
} 