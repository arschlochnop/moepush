import { Endpoint, NewEndpoint } from "@/lib/db/schema/endpoints"
import { generateExampleBody } from "../generator"

const API_URL = "/api/endpoints"

export async function createEndpoint(data: NewEndpoint) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })

  if (!res.ok) {
    throw new Error("创建失败")
  }

  return res.json() as Promise<Endpoint>
}

export async function updateEndpoint(id: string, data: Partial<NewEndpoint>) {
  const res = await fetch(`${API_URL}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })

  if (!res.ok) {
    throw new Error("更新失败")
  }

  return res.json() as Promise<Endpoint>
}

export async function deleteEndpoint(id: string) {
  const res = await fetch(`${API_URL}/${id}`, {
    method: "DELETE",
  })

  if (!res.ok) {
    throw new Error("删除失败")
  }
}

export async function toggleEndpointStatus(id: string) {
  const res = await fetch(`${API_URL}/${id}/toggle`, {
    method: "POST"
  })

  if (!res.ok) {
    throw new Error("切换状态失败")
  }

  return res.json() as Promise<Endpoint>
}

export async function testEndpoint(id: string, rule: string) {
  const exampleBody = generateExampleBody(rule)
  const res = await fetch(`/api/push/${id}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(exampleBody),
  })

  if (!res.ok) {
    const error = await res.json() as { message?: string }
    throw new Error(error.message || "测试失败")
  }

  return res.json()
}

export async function getEndpoints() {
  const response = await fetch(API_URL)
  if (!response.ok) {
    const error = await response.json() as { error: string }
    throw new Error(error.error || '获取接口失败')
  }
  return response.json()
}   