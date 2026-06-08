import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getDb } from "@/lib/db"
import { endpointGroups, endpointToGroup } from "@/lib/db/schema/endpoint-groups"
import { endpoints } from "@/lib/db/schema/endpoints"
import { eq, and, inArray } from "drizzle-orm"
import { generateId } from "@/lib/utils"
import { z } from "zod"

export const runtime = 'edge'

export async function GET() {
  try {
    const session = await auth()

    const db = await getDb()
    
    const groups = await db.query.endpointGroups.findMany({
      where: eq(endpointGroups.userId, session!.user!.id!),
      orderBy: (endpointGroups, { desc }) => [desc(endpointGroups.createdAt)]
    })
    
    const result = []
    
    for (const group of groups) {
      const relations = await db.query.endpointToGroup.findMany({
        where: eq(endpointToGroup.groupId, group.id),
        with: {
          endpoint: true
        }
      })
      
      const groupEndpoints = relations
        .map(r => r.endpoint)
        .filter((endpoint): endpoint is NonNullable<typeof endpoint> => endpoint != null)
      
      result.push({
        id: group.id,
        name: group.name,
        userId: group.userId,
        status: group.status,
        createdAt: group.createdAt ?? new Date(),
        updatedAt: group.updatedAt ?? new Date(),
        endpointIds: groupEndpoints.map(e => e.id),
        endpoints: groupEndpoints
      })
    }
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('获取接口组失败:', error)
    return NextResponse.json(
      { error: '获取接口组失败' },
      { status: 500 }
    )
  }
}

const createEndpointGroupSchema = z.object({
  name: z.string().min(1),
  endpointIds: z.array(z.string()).min(1),
  id: z.string().optional().nullable()
})

export async function POST(request: Request) {
  try {
    const session = await auth()

    const data = await request.json() as {
      name: string
      endpointIds: string[]
      id?: string | null
    }

    const result = createEndpointGroupSchema.safeParse(data)
    if (!result.success) {
      return NextResponse.json(
        { error: "无效的请求数据" },
        { status: 400 }
      )
    }

    const db = await getDb()
    const groupId = generateId()

    const validEndpoints = await db.query.endpoints.findMany({
      where: and(
        eq(endpoints.userId, session!.user!.id!),
        inArray(endpoints.id, data.endpointIds)
      )
    })

    if (validEndpoints.length !== data.endpointIds.length) {
      return NextResponse.json(
        { error: "部分接口不存在或无权访问" },
        { status: 400 }
      )
    }

    await db.insert(endpointGroups).values({
      id: groupId,
      name: data.name,
      userId: session!.user!.id!,
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    await db.insert(endpointToGroup).values(
      data.endpointIds.map(endpointId => ({
        endpointId,
        groupId
      }))
    )

    return NextResponse.json({ id: groupId })
  } catch (error) {
    console.error('创建接口组失败:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '创建接口组失败' },
      { status: 500 }
    )
  }
} 