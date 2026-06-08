import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getDb } from "@/lib/db"
import { endpointGroups } from "@/lib/db/schema/endpoint-groups"
import { eq, and } from "drizzle-orm"

export const runtime = 'edge'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    const { id } = await params

    const db = await getDb()
    
    const group = await db.query.endpointGroups.findFirst({
      where: and(
        eq(endpointGroups.id, id),
        eq(endpointGroups.userId, session!.user!.id!)
      )
    })

    if (!group) {
      return NextResponse.json(
        { error: "接口组不存在或无权访问" },
        { status: 404 }
      )
    }

    // 切换状态
    const newStatus = group.status === "active" ? "inactive" : "active"
    
    // 更新状态
    await db
      .update(endpointGroups)
      .set({ 
        status: newStatus,
        updatedAt: new Date()
      })
      .where(eq(endpointGroups.id, id))

    // 返回更新后的接口组
    const updatedGroup = await db.query.endpointGroups.findFirst({
      where: eq(endpointGroups.id, id),
      with: {
        endpointToGroup: {
          with: {
            endpoint: true
          }
        }
      }
    })

    return NextResponse.json(updatedGroup)
  } catch (error) {
    console.error('切换接口组状态失败:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '切换状态失败' },
      { status: 500 }
    )
  }
} 