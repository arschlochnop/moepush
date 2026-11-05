import type { MessageTemplate } from "@/lib/channels/base"
import { getNestedValue, setNestedValue } from "@/lib/utils"

export function parseEndpointRule(value: string): Record<string, any> {
  const rule = JSON.parse(value)
  if (!rule || typeof rule !== "object" || Array.isArray(rule)) {
    throw new Error("消息规则必须是 JSON 对象")
  }
  return rule
}

// 旧版飞书卡片保存在顶层，编辑时沿用原路径，避免无意改写配置。
function fieldPath(rule: Record<string, any>, key: string) {
  return key === "content.card" && getNestedValue(rule, key) === undefined && rule.card !== undefined
    ? "card"
    : key
}

export function getTemplateFieldValue(rule: Record<string, any>, key: string) {
  return getNestedValue(rule, fieldPath(rule, key))
}

export function formatTemplateValue(value: any): string {
  return value !== null && typeof value === "object"
    ? JSON.stringify(value, null, 2)
    : String(value ?? "")
}

export function inferEndpointTemplate(value: string, templates: MessageTemplate[]): string | undefined {
  try {
    const rule = parseEndpointRule(value)
    const discriminator = templates.flatMap(template => template.fields)
      .find(field => field.component === "hidden" && ["msg_type", "msgtype", "parse_mode"].includes(field.key))
    const type = discriminator ? rule[discriminator.key] : undefined
    if (type === "actionCard") {
      const cardType = rule.actionCard?.btns !== undefined ? "actionCard-multi" : "actionCard-single"
      return templates.find(template => template.type === cardType)?.type
    }
    if (type !== undefined) return templates.find(template => template.type === type)?.type
    if (templates.length === 1 && templates[0].fields
      .filter(field => field.required)
      .every(field => getTemplateFieldValue(rule, field.key) !== undefined)) {
      return templates[0].type
    }
  } catch {
    // 无法识别时保留原始 JSON，由编辑器直接展示。
  }
}

export function updateTemplateField(value: string, key: string, fieldValue: any): string {
  const rule = parseEndpointRule(value)
  setNestedValue(rule, fieldPath(rule, key), fieldValue)
  return JSON.stringify(rule, null, 2)
}

function removeField(rule: Record<string, any>, path: string) {
  const keys = path.split(".")
  const parents: Array<[Record<string, any>, string]> = []
  let parent = rule
  for (const key of keys.slice(0, -1)) {
    if (!parent[key] || typeof parent[key] !== "object") return
    parents.push([parent, key])
    parent = parent[key]
  }
  delete parent[keys[keys.length - 1]]
  for (const [container, key] of parents.reverse()) {
    if (Object.keys(container[key]).length === 0) delete container[key]
  }
}

// 只有用户主动切换模板时才调整模板字段；其他自定义字段继续保留。
export function selectEndpointTemplate(value: string, template: MessageTemplate, previous?: MessageTemplate): string {
  let rule: Record<string, any>
  try {
    rule = parseEndpointRule(value)
  } catch {
    if (value.trim()) throw new Error("请先修正原始 JSON，再切换消息类型")
    rule = {}
  }
  for (const field of previous?.fields ?? []) {
    if (!template.fields.some(next => next.key === field.key)) removeField(rule, fieldPath(rule, field.key))
  }
  for (const field of template.fields) {
    if (field.defaultValue !== undefined && (field.component === "hidden" || getTemplateFieldValue(rule, field.key) === undefined)) {
      setNestedValue(rule, fieldPath(rule, field.key), field.defaultValue)
    }
  }
  return JSON.stringify(rule, null, 2)
}

// 表单以 JSON 文本编辑数组和对象，保存时恢复原有类型；未编辑的规则原样返回。
export function restoreStructuredFields(value: string, original: string, template?: MessageTemplate): string {
  const rule = parseEndpointRule(value)
  if (!template || value === original) return value
  let originalRule: Record<string, any>
  try {
    originalRule = parseEndpointRule(original)
  } catch {
    return value
  }
  let changed = false
  for (const field of template.fields) {
    const before = getTemplateFieldValue(originalRule, field.key)
    const current = getTemplateFieldValue(rule, field.key)
    if (before !== null && typeof before === "object" && typeof current === "string") {
      let parsed: any
      try {
        parsed = JSON.parse(current)
      } catch {
        throw new Error(`${field.description || "配置内容"}必须是有效的 JSON`)
      }
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed) !== Array.isArray(before)) {
        throw new Error(`${field.description || "配置内容"}必须保持原有的 JSON 类型`)
      }
      setNestedValue(rule, fieldPath(rule, field.key), parsed)
      changed = true
    }
  }
  return changed ? JSON.stringify(rule, null, 2) : value
}
