import { FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { UseFormReturn } from "react-hook-form"
import type { ChannelFormData } from "@/lib/db/schema/channels"

interface WebhookFieldsProps {
  form: UseFormReturn<ChannelFormData>
}

export function WebhookFields({ form }: WebhookFieldsProps) {
  return (
    <>
      <FormField
        control={form.control}
        name="webhook"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Webhook 地址
              <span className="text-red-500 ml-1">*</span>
            </FormLabel>
            <FormControl>
              <Input 
                placeholder="https://example.com/api/webhook" 
                className="font-mono"
                {...field} 
              />
            </FormControl>
            <FormDescription>
              输入您要推送消息的 Webhook 接口地址
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  )
} 