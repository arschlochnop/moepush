import { NextRequest } from "next/server"
import { getDb } from "@/lib/db"
import { endpoints } from "@/lib/db/schema/endpoints"
import { eq } from "drizzle-orm"
import { safeInterpolate } from "@/lib/template"
import { sendChannelMessage } from "@/lib/channels"

export const runtime = "edge"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const db = await getDb()
    const endpoint = await db.query.endpoints.findFirst({
      where: eq(endpoints.id, id),
      with: {
        channel: true,
      },
    })

    if (!endpoint || !endpoint.channel) {
      return new Response("接口不存在", { status: 404 })
    }

    if (endpoint.status !== "active") {
      return new Response("接口已禁用", { status: 403 })
    }

    const body = await request.json()
    console.log('body:', body)

    const processedTemplate = safeInterpolate(endpoint.rule, {
      body,
    })

    const messageObj = JSON.parse(processedTemplate)

    const response = await sendChannelMessage(
      endpoint.channel.type as any,
      messageObj,
      {
        webhook: endpoint.channel.webhook,
        secret: endpoint.channel.secret,
        corpId: endpoint.channel.corpId,
        agentId: endpoint.channel.agentId,
        botToken: endpoint.channel.botToken,
        chatId: endpoint.channel.chatId,
      }
    )

    console.log('response:', JSON.stringify(response))

    return new Response(JSON.stringify({ message: response }), { status: 200 })

  } catch (error) {
    console.error("Push error:", error)
    return new Response(
      JSON.stringify({ message: error instanceof Error ? error.message : "推送失败" }),
      { status: 500 }
    )
  }
} 