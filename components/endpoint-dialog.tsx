"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Plus, Loader2 } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { insertEndpointSchema } from "@/lib/db/schema/endpoints"
import { Endpoint, NewEndpoint } from "@/lib/db/schema/endpoints"
import { useToast } from "@/components/ui/use-toast"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { Channel, ChannelType } from "@/lib/channels"
import { CHANNEL_TEMPLATES } from "@/lib/channels"
import { TemplateFields } from "@/components/template-fields"
import { createEndpoint, updateEndpoint } from "@/lib/services/endpoints"
import { inferEndpointTemplate, parseEndpointRule, restoreStructuredFields, selectEndpointTemplate } from "@/lib/endpoint-template"

interface EndpointDialogProps {
  mode?: "create" | "edit"
  endpoint?: Endpoint
  channels: Channel[]
  icon?: React.ReactNode
  onSuccess?: () => void
}


const getInitialChannelType = (channels: Channel[], endpoint?: Endpoint) => {
  if (endpoint) {
    const channel = channels.find(c => c.id === endpoint.channelId)
    return channel?.type
  }
}

const getInitialTemplateType = (channels: Channel[], endpoint?: Endpoint) => {
  const channelType = getInitialChannelType(channels, endpoint)
  return endpoint && channelType
    ? inferEndpointTemplate(endpoint.rule, CHANNEL_TEMPLATES[channelType])
    : undefined
}

export function EndpointDialog({ 
  mode = "create", 
  endpoint,
  channels,
  icon,
  onSuccess,
}: EndpointDialogProps) {
  const [open, setOpen] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const [selectedChannelType, setSelectedChannelType] = useState<ChannelType | undefined>(
    getInitialChannelType(channels, endpoint)
  )
  const [selectedTemplateType, setSelectedTemplateType] = useState<string | undefined>(
    getInitialTemplateType(channels, endpoint)
  )
  const [showRawRule, setShowRawRule] = useState(false)
  const { toast } = useToast()

  const form = useForm<NewEndpoint>({
    resolver: zodResolver(insertEndpointSchema),
    defaultValues: {
      name: endpoint?.name ?? "",
      channelId: endpoint?.channelId ?? "",
      rule: endpoint?.rule ?? "",
    },
  })

  const templates = selectedChannelType ? CHANNEL_TEMPLATES[selectedChannelType] : []
  const template = templates.find(t => t.type === selectedTemplateType)

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      form.reset({ name: endpoint?.name ?? "", channelId: endpoint?.channelId ?? "", rule: endpoint?.rule ?? "" })
      setSelectedChannelType(getInitialChannelType(channels, endpoint))
      setSelectedTemplateType(getInitialTemplateType(channels, endpoint))
      setShowRawRule(false)
    }
    setOpen(nextOpen)
  }

  async function onSubmit(data: NewEndpoint) {
    try {
      parseEndpointRule(data.rule)
      const rule = showRawRule ? data.rule : restoreStructuredFields(data.rule, endpoint?.rule ?? "{}", template)
      const payload = { ...data, rule }
      setIsPending(true)
      if (mode === "edit" && endpoint) {
        await updateEndpoint(endpoint.id, payload)
        toast({ description: "接口已更新" })
      } else {
        await createEndpoint(payload)
        toast({ description: "接口已创建" })
      }
      setOpen(false)
      onSuccess?.()
    } catch (error) {
      console.error('Endpoint dialog error:', error)
      toast({
        variant: "destructive",
        description: error instanceof SyntaxError ? "消息规则必须是有效的 JSON" : error instanceof Error ? error.message : "保存失败，请重试"
      })
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {mode === "edit" ? (
          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
            {icon}
            编辑
          </DropdownMenuItem>
        ) : (
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            添加新的接口
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "edit" ? "编辑推送接口" : "新建推送接口"}
          </DialogTitle>
          <DialogDescription>
            {mode === "edit" ? "修改现有的推送接口" : "添加一个新的推送接口"}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <div className="max-h-[calc(80vh-160px)] overflow-y-auto">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4 px-1">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        名称
                        <span className="text-red-500 ml-1">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="请输入接口名称" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="channelId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        推送渠道
                        <span className="text-red-500 ml-1">*</span>
                      </FormLabel>
                      <Select 
                        onValueChange={(value) => {
                          field.onChange(value)
                          const channel = channels.find(c => c.id === value)
                          setSelectedChannelType(channel?.type)
                          if (channel?.type !== selectedChannelType) {
                            setSelectedTemplateType(undefined)
                            setShowRawRule(false)
                          }
                        }}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="选择推送渠道" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {channels.map((channel) => (
                            <SelectItem key={channel.id} value={channel.id}>
                              {channel.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="rule"
                render={({ field }) => (
                  <FormItem>
                    {selectedChannelType && (
                      <>
                        <FormLabel>
                          消息模版
                          <span className="text-red-500 ml-1">*</span>
                        </FormLabel>
                        <Select
                          onValueChange={(value) => {
                            const nextTemplate = templates.find(candidate => candidate.type === value)
                            if (!nextTemplate) return
                            try {
                              field.onChange(selectEndpointTemplate(field.value, nextTemplate, template))
                              setSelectedTemplateType(value)
                              setShowRawRule(false)
                            } catch (error) {
                              toast({ variant: "destructive", description: error instanceof Error ? error.message : "切换消息类型失败" })
                            }
                          }}
                          value={selectedTemplateType ?? ""}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="选择消息类型" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {templates.map((t) => (
                              <SelectItem key={t.type} value={t.type}>
                                {t.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {template && (
                          <p className="text-sm text-muted-foreground mb-2">
                            {template.description}
                          </p>
                        )}
                        {template && (
                          <Button type="button" variant="ghost" size="sm" onClick={() => setShowRawRule(value => !value)}>
                            {showRawRule ? "使用表单编辑" : "编辑完整 JSON"}
                          </Button>
                        )}
                        {template && !showRawRule ? (
                          <TemplateFields key={`${selectedChannelType}:${selectedTemplateType}`} form={form} template={template} />
                        ) : (
                          <FormControl>
                            <Textarea 
                              aria-label="完整消息规则 JSON"
                              placeholder="选择消息类型，或直接编辑完整 JSON 配置"
                              className="font-mono resize-none min-h-48"
                              {...field} 
                              onChange={(event) => {
                                field.onChange(event)
                                setSelectedTemplateType(inferEndpointTemplate(event.target.value, templates))
                                setShowRawRule(true)
                              }}
                            />
                          </FormControl>
                        )}
                      </>
                    )}
                    {!selectedChannelType && (
                      <FormControl>
                        <Textarea 
                          placeholder="请先选择推送渠道"
                          className="font-mono resize-none h-32"
                          disabled
                          {...field} 
                        />
                      </FormControl>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setOpen(false)} type="button">
                  取消
                </Button>
                <Button 
                  type="submit"
                  disabled={isPending}
                >
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  提交
                </Button>
              </div>
            </form>
          </div>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
