import { auth } from "@/lib/auth"
import { Key, LayoutGrid } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { SiteHeader } from "@/components/site-header"

export default async function MoeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  const nav = (
    <nav className="hidden md:flex items-center gap-1">
      <Link href="/moe/endpoints">
        <Button variant="ghost" size="sm" className={cn(
          "gap-2 text-muted-foreground hover:text-foreground",
        )}>
          <Key className="h-4 w-4" />
          接口管理
        </Button>
      </Link>
      <Link href="/moe/channels">
        <Button variant="ghost" size="sm" className={cn(
          "gap-2 text-muted-foreground hover:text-foreground",
        )}>
          <LayoutGrid className="h-4 w-4" />
          渠道管理
        </Button>
      </Link>
    </nav>
  )

  return (
    <div className="relative flex min-h-screen flex-col">
      <SiteHeader 
        user={session?.user} 
        variant="dashboard"
        nav={nav}
      />

      <main className="container flex-1 py-8">
        {children}
      </main>
    </div>
  );
} 