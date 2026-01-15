import { ChatSession } from '@/lib/supabase'
import { SidebarMenuItem, SidebarMenuButton } from './ui/sidebar'
import Link from 'next/link'
import { MessageSquare, Trash2 } from 'lucide-react'
import { usePathname, useSearchParams } from 'next/navigation'
import { Button } from './ui/button'
import { useRouter } from 'next/navigation'

const ItemMenu = ({ chat }: { chat: ChatSession }) => {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    await fetch(`/api/chat/delete/${chat.id}`, {
      method: "DELETE",
    })
    router.refresh()
  }

  return (
    <SidebarMenuItem key={chat.id}>
      <SidebarMenuButton asChild isActive={pathname === "/" && searchParams.get('chatId') === chat.id}>
        <Link href={`/?chatId=${chat.id}`}>
          <MessageSquare className="opacity-60" />
          <span>{chat.title || "Chat sin título"}</span>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

export default ItemMenu