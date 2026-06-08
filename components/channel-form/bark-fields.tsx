import { FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { UseFormReturn } from "react-hook-form"
import type { ChannelFormData } from "@/lib/db/schema/channels"

interface BarkFieldsProps {
  form: UseFormReturn<ChannelFormData>
}

export function BarkFields({ form }: BarkFieldsProps) {
  return (
    <>
      <FormField
        control={form.control}
        name="webhook"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Bark 服务器地址
              <span className="text-red-500 ml-1">*</span>
            </FormLabel>
            <FormControl>
              <Input 
                placeholder="https://api.day.app/YOUR_DEVICE_KEY/" 
                className="font-mono"
                {...field} 
              />
            </FormControl>
            <FormDescription>
              输入您的 Bark 服务器地址，如 https://api.day.app/YOUR_DEVICE_KEY/
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  )
} 