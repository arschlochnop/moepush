import { BaseChannel, ChannelConfig, SendMessageOptions } from "./base"

interface BarkMessage {
  title?: string
  subtitle?: string
  body: string
  group?: string
  icon?: string
  url?: string
  copy?: string
  sound?: string
  isArchive?: string
  level?: string
  badge?: string
  autoCopy?: string  // 1 或 0
  device_key?: string
  device_keys?: string // 只能是逗号分隔的字符串
  volume?: string
  call?: string
  action?: string
}

// 定义公共的声音选项
const soundOptions = [
  { value: "none", label: "默认铃声" },
  { value: "alarm", label: "警报声" },
  { value: "anticipate", label: "期待" },
  { value: "bell", label: "铃声" },
  { value: "birdsong", label: "鸟鸣" },
  { value: "bloom", label: "绽放" },
  { value: "calypso", label: "卡里普索" },
  { value: "chime", label: "风铃" },
  { value: "choo", label: "啾" },
  { value: "complete", label: "完成" },
  { value: "descent", label: "下降" },
  { value: "electronic", label: "电子" },
  { value: "fanfare", label: "号角" },
  { value: "glass", label: "玻璃" },
  { value: "gotosleep", label: "睡眠" },
  { value: "healthnotification", label: "健康提醒" },
  { value: "horn", label: "喇叭" },
  { value: "ladder", label: "阶梯" },
  { value: "mailsent", label: "邮件已发送" },
  { value: "minuet", label: "小步舞曲" },
  { value: "multiwayinvitation", label: "多方邀请" },
  { value: "newmail", label: "新邮件" },
  { value: "newsflash", label: "新闻快讯" },
  { value: "noir", label: "黑色" },
  { value: "paymentsuccess", label: "支付成功" },
  { value: "shake", label: "摇动" },
  { value: "sherwoodforest", label: "舍伍德森林" },
  { value: "silence", label: "静音" },
  { value: "spell", label: "咒语" },
  { value: "suspense", label: "悬疑" },
  { value: "telegraph", label: "电报" },
  { value: "tiptoes", label: "足尖" },
  { value: "typewriters", label: "打字机" },
  { value: "update", label: "更新" }
];

// 定义级别选项
const levelOptions = [
  { value: "active", label: "默认值，系统会立即亮屏显示通知" },
  { value: "timeSensitive", label: "时效性通知，可在专注状态下显示通知" },
  { value: "passive", label: "仅将通知添加到通知列表，不会亮屏提醒" },
  { value: "critical", label: "重要警告，在静音模式下也会响铃" }
];

// 定义自动复制选项
const autoCopyOptions = [
  { value: "1", label: "是 - 自动复制推送内容" },
  { value: "0", label: "否 - 不自动复制" }
];

// 定义存档选项
const isArchiveOptions = [
  { value: "1", label: "是 - 保存到历史记录" },
  { value: "0", label: "否 - 不保存到历史记录" }
];

// 定义响铃选项
const callOptions = [
  { value: "1", label: "是 - 通知铃声重复播放" },
  { value: "0", label: "否 - 通知铃声播放一次" }
];

// 定义Action选项
const actionOptions = [
  { value: "none", label: "否 - 点击推送不会跳窗" },
  { value: "default", label: "是 - 点击推送会跳窗" }
];

export class BarkChannel extends BaseChannel {
  readonly config: ChannelConfig = {
    type: "bark",
    label: "Bark 推送",
    templates: [
      {
        type: "text",
        name: "文本消息",
        description: "发送简单的文本消息",
        fields: [
          { key: "title", description: "消息标题", required: false, component: 'input' },
          { key: "body", description: "消息内容", required: true, component: 'textarea' },
          { key: "group", description: "消息分组", required: false, component: 'input' },
          { 
            key: "sound", 
            description: "消息铃声", 
            required: false, 
            component: 'select',
            options: soundOptions
          },
          {
            key: "autoCopy",
            description: "是否自动复制推送内容",
            required: false,
            component: 'select',
            options: autoCopyOptions
          }
        ]
      },
      {
        type: "url",
        name: "链接跳转消息",
        description: "点击后可跳转到指定链接的消息",
        fields: [
          { key: "title", description: "消息标题", required: true, component: 'input' },
          { key: "body", description: "消息内容", required: true, component: 'textarea' },
          { key: "url", description: "点击后跳转的URL", required: true, component: 'input' },
          { key: "group", description: "消息分组", required: false, component: 'input' },
          { 
            key: "sound", 
            description: "消息铃声", 
            required: false, 
            component: 'select',
            options: soundOptions
          },
          {
            key: "isArchive",
            description: "保存到历史记录",
            component: 'select',
            options: isArchiveOptions
          }
        ]
      },
      {
        type: "advanced",
        name: "高级消息",
        description: "包含更多自定义选项的高级消息",
        fields: [
          { key: "title", description: "推送标题", required: false, component: 'input' },
          { key: "subtitle", description: "推送副标题", required: false, component: 'input' },
          { key: "body", description: "推送内容", required: true, component: 'textarea' },
          { key: "device_key", description: "设备key", required: false, component: 'input' },
          { key: "device_keys", description: "key数组，用于批量推送", required: false, component: 'input', placeholder: "多个key以逗号分隔，将会自动转换为数组" },
          { key: "group", description: "消息分组", required: false, component: 'input', placeholder: "对消息进行分组，在通知中心中显示" },
          { key: "icon", description: "自定义图标URL", required: false, component: 'input', placeholder: "自定义图标URL，图标将自动缓存到本机" },
          { 
            key: "sound", 
            description: "可以为推送设置不同的铃声", 
            required: false, 
            component: 'select',
            options: soundOptions
          },
          { key: "url", description: "点击推送时跳转的URL", required: false, component: 'input' },
          { key: "copy", description: "复制推送时，指定复制的内容", required: false, component: 'input', placeholder: "不传则复制整个推送内容" },
          {
            key: "level", 
            description: "推送中断级别", 
            component: 'select',
            options: levelOptions
          },
          {
            key: "volume",
            description: "重要警告的通知音量",
            component: 'input',
            placeholder: "取值范围: 0-10，不传默认为系统音量"
          },
          { key: "badge", description: "推送角标", component: 'input', placeholder: "可以是任意数字" },
          {
            key: "autoCopy",
            description: "是否自动复制推送内容",
            component: 'select',
            options: autoCopyOptions
          },
          {
            key: "call",
            description: "是否重复播放通知铃声",
            component: 'select',
            options: callOptions
          },
          {
            key: "isArchive",
            description: "是否保存推送到历史记录",
            component: 'select',
            options: isArchiveOptions
          },
          { 
            key: "action", 
            description: "是否允许点击推送跳窗", 
            component: 'select',
            options: actionOptions
          }
        ]
      }
    ]
  }

  async sendMessage(
    message: BarkMessage,
    options: SendMessageOptions
  ): Promise<Response> {
    const { webhook } = options
    
    if (!webhook) {
      throw new Error("缺少 Bark 服务器地址")
    }
    
    console.log('sendBarkMessage message:', message)

    // 准备POST请求的数据
    const postData: Record<string, any> = {
      body: message.body
    }
    
    if (message.title) postData.title = message.title
    if (message.subtitle) postData.subtitle = message.subtitle
    if (message.group) postData.group = message.group
    if (message.icon) postData.icon = message.icon
    if (message.sound && message.sound !== "none") postData.sound = message.sound
    if (message.url) postData.url = message.url
    if (message.copy) postData.copy = message.copy
    if (message.isArchive) postData.isArchive = message.isArchive
    if (message.level) postData.level = message.level
    if (message.badge) postData.badge = message.badge
    if (message.autoCopy) postData.autoCopy = message.autoCopy
    if (message.device_key) postData.device_key = message.device_key
    
    // 处理 device_keys - 作为逗号分隔的字符串处理
    if (message.device_keys) {
      postData.device_keys = message.device_keys.split(',').map((key: string) => key.trim()).filter((key: string) => key.length > 0)
    }
    
    if (message.volume) postData.volume = message.volume
    if (message.call) postData.call = message.call
    // 对于 action，只有值为 "none" 时才发送，"default" 值不发送
    if (message.action && message.action !== "default") postData.action = message.action

    try {
      const response = await fetch(webhook, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData)
      });

      console.log('sendBarkMessage response status:', response.status);
      
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Bark 消息推送失败: ${text}`);
      }

      return response;
    } catch (error) {
      console.error('Bark 请求出错:', error);
      throw error;
    }
  }
} 
