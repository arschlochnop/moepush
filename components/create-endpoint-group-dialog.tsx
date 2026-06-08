"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useRouter } from "next/navigation"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { createEndpointGroup } from "@/lib/services/endpoint-groups"
import { Endpoint } from "@/lib/db/schema/endpoints"

const createEndpointGroupSchema = z.object({
  name: z.string().min(1, "名称不能为空"),
})

type CreateEndpointGroupFormValues = z.infer<typeof createEndpointGroupSchema>

interface CreateEndpointGroupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedEndpoints: Endpoint[] // 使用正确的类型
  onSuccess: () => void
}

export function CreateEndpointGroupDialog({
  open,
  onOpenChange,
  selectedEndpoints,
  onSuccess
}: CreateEndpointGroupDialogProps) {
  const [isPending, setIsPending] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const form = useForm<CreateEndpointGroupFormValues>({
    resolver: zodResolver(createEndpointGroupSchema),
    defaultValues: {
      name: "",
    },
  })

  async function onSubmit(data: CreateEndpointGroupFormValues) {
    if (selectedEndpoints.length === 0) {
      toast({
        variant: "destructive",
        description: "请至少选择一个接口",
      })
      return
    }

    try {
      setIsPending(true)
      await createEndpointGroup({
        ...data,
        endpointIds: selectedEndpoints.map(e => e.id),
      })
      
      toast({ description: "接口组创建成功" })
      onOpenChange(false)
      form.reset()
      onSuccess()
      router.refresh()
    } catch (error) {
      console.error('创建接口组失败:', error)
      toast({
        variant: "destructive",
        description: "创建接口组失败，请重试"
      })
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>创建接口组</DialogTitle>
          <DialogDescription>
            创建一个包含多个接口的接口组，可以通过一个请求触发多个接口
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    接口组名称
                    <span className="text-red-500 ml-1">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="请输入接口组名称" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div>
              <h3 className="mb-2 text-sm font-medium">已选择的接口 ({selectedEndpoints.length})</h3>
              <div className="max-h-[200px] overflow-y-auto p-2 border rounded-md">
                <ul className="space-y-1">
                  {selectedEndpoints.map(endpoint => (
                    <li key={endpoint.id} className="text-sm text-muted-foreground">
                      {endpoint.name}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
              >
                取消
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                创建接口组
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
} 