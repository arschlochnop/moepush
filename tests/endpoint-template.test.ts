import assert from "node:assert/strict"
import test from "node:test"
import { CHANNEL_TEMPLATES } from "../lib/channels"
import { FeishuChannel } from "../lib/channels/feishu"
import {
  formatTemplateValue,
  getTemplateFieldValue,
  inferEndpointTemplate,
  parseEndpointRule,
  restoreStructuredFields,
  selectEndpointTemplate,
  updateTemplateField,
} from "../lib/endpoint-template"

const post = CHANNEL_TEMPLATES.feishu.find(template => template.type === "post")!
const card = CHANNEL_TEMPLATES.feishu.find(template => template.type === "interactive")!

test("飞书和 Telegram 规则还原正确的消息类型", () => {
  for (const type of ["text", "post", "interactive"]) {
    assert.equal(inferEndpointTemplate(JSON.stringify({ msg_type: type }), CHANNEL_TEMPLATES.feishu), type)
  }
  assert.equal(inferEndpointTemplate('{"parse_mode":"MarkdownV2"}', CHANNEL_TEMPLATES.telegram), "MarkdownV2")
  assert.equal(inferEndpointTemplate('{"msgtype":"actionCard","actionCard":{"btns":[]}}', CHANNEL_TEMPLATES.dingtalk), "actionCard-multi")
  assert.equal(inferEndpointTemplate('{"msgtype":"actionCard","actionCard":{"singleURL":"https://example.invalid"}}', CHANNEL_TEMPLATES.dingtalk), "actionCard-single")
})

test("未知或不合法的规则保留给原始 JSON 编辑器", () => {
  assert.equal(inferEndpointTemplate("{", CHANNEL_TEMPLATES.feishu), undefined)
  assert.equal(inferEndpointTemplate('{"msg_type":"custom"}', CHANNEL_TEMPLATES.feishu), undefined)
  assert.throws(() => parseEndpointRule("[]"))
  assert.throws(() => parseEndpointRule("null"))
})

test("未修改保存保持原始规则逐字一致", () => {
  const original = '{ "msg_type": "post", "content": {"post":{"zh_cn":{"title":"标题","content":[[{"tag":"text","text":"内容"}]]}}}, "custom":false }'
  assert.equal(restoreStructuredFields(original, original, post), original)
  const edited = updateTemplateField(original, "content.post.zh_cn.title", "新标题")
  const saved = JSON.parse(restoreStructuredFields(edited, original, post))
  assert.equal(saved.custom, false)
  assert.deepEqual(saved.content.post.zh_cn.content, [[{ tag: "text", text: "内容" }]])
})

test("数组以 JSON 显示，编辑后保持数组类型并拒绝错误 JSON", () => {
  const original = JSON.stringify({ msg_type: "post", content: { post: { zh_cn: { title: "标题", content: [[{ tag: "text", text: "内容" }]] } } } })
  const display = formatTemplateValue(getTemplateFieldValue(JSON.parse(original), "content.post.zh_cn.content"))
  assert.deepEqual(JSON.parse(display), [[{ tag: "text", text: "内容" }]])
  const edited = updateTemplateField(original, "content.post.zh_cn.content", '[[{"tag":"text","text":"新内容"}]]')
  assert.deepEqual(JSON.parse(restoreStructuredFields(edited, original, post)).content.post.zh_cn.content, [[{ tag: "text", text: "新内容" }]])
  assert.throws(() => restoreStructuredFields(updateTemplateField(original, "content.post.zh_cn.content", "["), original, post), /有效的 JSON/)
  assert.throws(() => restoreStructuredFields(updateTemplateField(original, "content.post.zh_cn.content", "{}"), original, post), /原有的 JSON 类型/)
})

test("JSON 字符串、零和 false 不被转换或丢失", () => {
  const original = JSON.stringify({ msg_type: "post", content: { post: { zh_cn: { title: "标题", content: "[]" } } }, extra: { count: 0, enabled: false } })
  const edited = updateTemplateField(original, "content.post.zh_cn.content", "[[]]")
  const saved = JSON.parse(restoreStructuredFields(edited, original, post))
  assert.equal(saved.content.post.zh_cn.content, "[[]]")
  assert.deepEqual(saved.extra, { count: 0, enabled: false })
  assert.equal(formatTemplateValue(0), "0")
})

test("旧卡片沿用顶层路径，当前卡片沿用嵌套路径", () => {
  for (const value of [JSON.stringify({ msg_type: "interactive", card: '{"elements":[]}', extra: 1 }), JSON.stringify({ msg_type: "interactive", content: { card: '{"elements":[]}' }, extra: 1 })]) {
    const rule = JSON.parse(value)
    assert.equal(getTemplateFieldValue(rule, "content.card"), '{"elements":[]}')
    const edited = JSON.parse(updateTemplateField(value, "content.card", '{"elements":[{}]}'))
    assert.equal(edited.extra, 1)
    assert.equal(Object.hasOwn(edited, "card"), Object.hasOwn(rule, "card"))
    assert.equal(restoreStructuredFields(value, value, card), value)
  }
})

test("主动切换模板更新消息类型，同时保留自定义字段", () => {
  const text = CHANNEL_TEMPLATES.feishu.find(template => template.type === "text")!
  const value = JSON.stringify({ msg_type: "post", content: { post: { zh_cn: { title: "标题", content: "[]" } } }, custom: { enabled: false } })
  const selected = JSON.parse(selectEndpointTemplate(value, text, post))
  assert.equal(selected.msg_type, "text")
  assert.equal(selected.content?.post, undefined)
  assert.deepEqual(selected.custom, { enabled: false })
  assert.equal(JSON.parse(selectEndpointTemplate("", post)).msg_type, "post")
})

test("两种卡片格式发送时统一为顶层 card，且不发出实际网络请求", async context => {
  const sent: any[] = []
  context.mock.method(console, "log", () => {})
  context.mock.method(globalThis, "fetch", async (_url: string, options: RequestInit) => {
    sent.push(JSON.parse(options.body as string))
    return new Response("{}", { status: 200 })
  })
  for (const rule of [{ msg_type: "interactive", card: '{"elements":[]}' }, { msg_type: "interactive", content: { card: { elements: [] } } }]) {
    await new FeishuChannel().sendMessage(rule as any, { webhook: "https://example.invalid/test-only" })
  }
  assert.equal(sent.length, 2)
  for (const message of sent) {
    assert.deepEqual(message.card, { elements: [] })
    assert.equal(message.content, undefined)
  }
})
