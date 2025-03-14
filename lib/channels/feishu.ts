import { BaseChannel, ChannelConfig, SendMessageOptions } from "./base"

interface FeishuMessage {
  msg_type: "text" | "post" | "interactive"
  content: {
    text?: string
    post?: {
      zh_cn: {
        title: string
        content: Array<Array<{
          tag: string
          text?: string
          href?: string
        }>>
      }
    }
    card?: any
  }
  card?: any
  timestamp?: string
  sign?: string
}

async function generateFeishuSign(secret: string, timestamp: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(timestamp + "\n" + secret)
  );
  
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

export class FeishuChannel extends BaseChannel {
  readonly config: ChannelConfig = {
    type: "feishu",
    label: "飞书群机器人",
    templates: [
      {
        type: "text",
        name: "文本消息",
        description: "简单文本消息",
        fields: [
          { key: "content.text", description: "文本内容", required: true, component: 'textarea' },
          { key: "msg_type", component: 'hidden', defaultValue: "text" },
        ],
      },
      {
        type: "post",
        name: "富文本消息",
        description: "支持标题和格式化内容的富文本消息",
        fields: [
          { key: "content.post.zh_cn.title", description: "标题", required: true },
          { 
            key: "content.post.zh_cn.content", 
            description: "富文本内容(JSON格式), 具体格式请参考<a target='_blank' href='https://open.feishu.cn/document/client-docs/bot-v3/add-custom-bot#f62e72d5'>飞书文档</a>", 
            required: true, 
            component: 'textarea',
            placeholder: JSON.stringify(
                [
                    [{
                        "tag": "text",
                        "text": "项目有更新: "
                    }, {
                        "tag": "a",
                        "text": "请查看",
                        "href": "http://www.example.com/"
                    }, {
                        "tag": "at",
                        "user_id": "ou_18eac8********17ad4f02e8bbbb"
                    }]
                ]
            ),
          },
          { key: "msg_type", component: 'hidden', defaultValue: "post" },
        ],
      },
      {
        type: "interactive",
        name: "交互式卡片",
        description: "支持丰富布局和交互元素的卡片消息",
        fields: [
          { 
            key: "card", 
            description: "卡片内容(JSON格式), 具体格式请参考<a target='_blank' href='https://open.feishu.cn/document/ukTMukTMukTM/ugTNwUjL4UDM14CO1ATN'>飞书卡片文档</a>", 
            required: true, 
            component: 'textarea',
            placeholder: JSON.stringify({
              "config": {
                "wide_screen_mode": true
              },
              "header": {
                "title": {
                  "tag": "plain_text",
                  "content": "项目有更新"
                },
                "template": "red"
              },
              "elements": [
                // 简化的示例元素
                {
                  "tag": "div",
                  "text": {
                    "tag": "lark_md",
                    "content": "**项目有更新**: [请查看](https://example.com)"
                  }
                }
              ]
            }, null, 2),
          },
          { key: "msg_type", component: 'hidden', defaultValue: "interactive" },
        ],
      }
    ]
  }

  getLabel(): string {
    return this.config.label
  }

  getTemplates() {
    return this.config.templates
  }

  async sendMessage(
    message: FeishuMessage,
    options: SendMessageOptions
  ): Promise<any> {
    const { webhook, secret } = options
    
    if (!webhook) {
      throw new Error("飞书机器人 Webhook 不能为空")
    }

    // 处理富文本消息的内容格式
    if (message.msg_type === "post" && typeof message.content.post?.zh_cn.content === 'string') {
      try {
        message.content.post.zh_cn.content = JSON.parse(message.content.post.zh_cn.content as any);
      } catch {
        throw new Error("富文本内容格式不正确，请提供有效的JSON格式");
      }
    }
    
    // 处理交互式卡片消息
    if (message.msg_type === "interactive" && typeof message.card === 'string') {
      try {
        message.card = JSON.parse(message.card);
      } catch {
        throw new Error("卡片内容格式不正确，请提供有效的JSON格式");
      }
    }

    // 如果有密钥，需要计算签名
    if (secret) {
      const timestamp = Math.floor(Date.now() / 1000).toString()
      message.timestamp = timestamp
      message.sign = await generateFeishuSign(secret, timestamp)
    }

    console.log('sendFeishuMessage message:', message)

    const response = await fetch(webhook, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    })

    if (!response.ok) {
      const data = await response.json() as { code: number, msg: string }
      throw new Error(`飞书消息推送失败: ${data.msg}`)
    }

    return response
  }
} 