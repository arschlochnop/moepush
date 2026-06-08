"use client"

import { useState, useEffect } from "react"
import { EndpointGroupWithEndpoints } from "@/types/endpoint-group"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { generateExampleBody } from "@/lib/utils"

interface EndpointGroupExampleProps {
  group: EndpointGroupWithEndpoints | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EndpointGroupExample({ group, open, onOpenChange }: EndpointGroupExampleProps) {
  const [origin, setOrigin] = useState("")

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin)
    }
  }, [])

  if (!group) return null

  // 使用所有接口中的所有规则创建一个示例
  const allRules = group.endpoints.flatMap(e => e.rule ? [e.rule] : [])
  const exampleBody = generateExampleBody(allRules.length > 0 ? allRules.join('\n') : '{}')
  const exampleJson = JSON.stringify(exampleBody, null, 6)

  const curlExample = `curl -X POST "${origin}/api/push-group/${group.id}" \\
  -H "Content-Type: application/json" \\
  -d '${exampleJson}'`

  const fetchExample = `await fetch("${origin}/api/push-group/${group.id}", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(${exampleJson})
})`

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>接口组示例</DialogTitle>
          <DialogDescription>
            查看接口组调用示例和包含的接口
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          <div>
            <h3 className="mb-2 text-sm font-medium">包含的接口 ({group.endpoints.length})</h3>
            <div className="max-h-[150px] overflow-y-auto p-2 border rounded-md">
              <ul className="space-y-1">
                {group.endpoints.map(endpoint => (
                  <li key={endpoint.id} className="text-sm text-muted-foreground">
                    {endpoint.name}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <Tabs defaultValue="curl">
            <TabsList>
              <TabsTrigger value="curl">cURL</TabsTrigger>
              <TabsTrigger value="fetch">Fetch</TabsTrigger>
            </TabsList>
            <TabsContent value="curl" className="mt-4">
              <div className="rounded-lg bg-muted p-4">
                <pre className="text-sm whitespace-pre-wrap break-all font-mono">
                  {curlExample}
                </pre>
              </div>
            </TabsContent>
            <TabsContent value="fetch" className="mt-4">
              <div className="rounded-lg bg-muted p-4">
                <pre className="text-sm whitespace-pre-wrap break-all font-mono">
                  {fetchExample}
                </pre>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
} 