"use client"

import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Variable, FunctionSquare } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"


const VARIABLES = [
  { key: "body", description: "请求参数对象", example: "假如请求参数为 { title: '标题' }, 可以通过 ${body.title} 获取标题" },
]

const FUNCTIONS = [
  {
    name: "truncate",
    description: "截断字符串,超过指定长度的部分用...替代",
    example: "${truncate(body.content, 100)}",
    args: [
      { name: "str", description: "要截断的字符串" },
      { name: "maxLength", description: "最大长度" }
    ]
  },
  {
    name: "now",
    description: "获取当前时间，支持自定义格式和时区",
    example: "${now('YYYY-MM-DD HH:mm:ss', 8)}",
    args: [
      { name: "format", description: "时间格式，支持：YYYY(年)、MM(月)、DD(日)、HH(时)、mm(分)、ss(秒)，默认：YYYY-MM-DD HH:mm:ss" },
      { name: "timezone", description: "时区设置，支持数字(如：8表示东八区,-5表示西五区)或时区名(如：Asia/Shanghai)，可选" }
    ]
  }
]

interface FunctionSelectorProps {
  onSelect: (value: string) => void
}

export function FunctionSelector({ onSelect }: FunctionSelectorProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm"
          className="h-6 px-2 text-muted-foreground"
        >
          <FunctionSquare className="h-4 w-4 mr-1" /> 
          插入变量/函数
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96" align="end">
        <Tabs defaultValue="variables">
          <TabsList className="w-full">
            <TabsTrigger value="variables" className="flex-1">
              <Variable className="h-4 w-4 mr-1" />
              变量
            </TabsTrigger>
            <TabsTrigger value="functions" className="flex-1">
              <FunctionSquare className="h-4 w-4 mr-1" />
              函数
            </TabsTrigger>
          </TabsList>

          <TabsContent value="variables" className="mt-2">
            <div className="space-y-2">
              <h4 className="font-medium">可用变量：</h4>
              <div className="grid gap-2">
                {VARIABLES.map((variable) => (
                  <Button
                    key={variable.key}
                    variant="outline"
                    size="sm"
                    className="flex flex-col items-start p-3 h-auto w-full text-left"
                    onClick={() => onSelect(`\${${variable.key}}`)}
                  >
                    <div className="flex items-start gap-2 w-full">
                      <code className="text-blue-500 font-mono">
                        ${variable.key}
                      </code>
                      <span className="text-muted-foreground text-sm flex-1">
                        {variable.description}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 font-normal break-words whitespace-pre-wrap">
                      示例：{variable.example}
                    </p>
                  </Button>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="functions" className="mt-2">
            <div className="space-y-2">
              <h4 className="font-medium">可用函数：</h4>
              <div className="grid gap-2 max-h-[400px] overflow-y-auto pr-1">
                {FUNCTIONS.map((fn) => (
                  <Button
                    key={fn.name}
                    variant="outline"
                    size="sm"
                    className="flex flex-col items-start p-3 h-auto w-full text-left"
                    onClick={() => onSelect(fn.example)}
                  >
                    <div className="flex items-start gap-2 w-full">
                      <code className="text-blue-500 font-mono">
                        {fn.name}()
                      </code>
                      <span className="text-muted-foreground text-sm flex-1">
                        {fn.description}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 font-normal break-words">
                      参数：
                      {fn.args.map((arg) => (
                        <div key={arg.name} className="ml-2 mt-1">
                          <span className="font-medium">{arg.name}</span>
                          <span>：{arg.description}</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 font-normal break-words whitespace-pre-wrap">
                      示例：{fn.example}
                    </p>
                  </Button>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  )
} 