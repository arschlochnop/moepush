import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getDb } from "@/lib/db"
import { endpointGroups, endpointToGroup } from "@/lib/db/schema/endpoint-groups"
import { eq } from "drizzle-orm"

export const runtime = 'edge'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    const db = await getDb()

    const { id } = await params
    
    const group = await db.query.endpointGroups.findFirst({
      where: (groups, { and, eq }) => and(
        eq(groups.id, id),
        eq(groups.userId, session!.user!.id!)
      )
    })

    if (!group) {
      return NextResponse.json(
        { error: "接口组不存在或无权访问" },
        { status: 404 }
      )
    }

    await db.delete(endpointToGroup).where(eq(endpointToGroup.groupId, id))
    
    await db.delete(endpointGroups).where(eq(endpointGroups.id, id))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('删除接口组失败:', error)
    return NextResponse.json(
      { error: '删除接口组失败' },
      { status: 500 }
    )
  }
} 