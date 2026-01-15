"use client"

import * as React from "react"
import { MessageSquare, Plus } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import {
	SidebarGroup,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from "@/components/ui/sidebar"
import { ChatSession } from "@/lib/supabase"
import { createNewChat } from "@/app/actions"
import { Button } from "@/components/ui/button"

export function NavChats({
	chats,
}: {
	chats: ChatSession[]
}) {
	const pathname = usePathname()
	const searchParams = useSearchParams()
	const router = useRouter()
	const { isMobile } = useSidebar()
	const [loading, setLoading] = React.useState(false)

	const handleNewChat = async () => {
		setLoading(true)
		try {
			// Alternative: Just navigate to home to start fresh? 
			// But user wants "option to start a chat".
			// If we create a session immediately, we navigate to it.
			const newChat = await createNewChat()
			// Assuming the chat page URL structure is /chat/[id] or similar?
			// Looking at previous chats, it seems the user hasn't fully defined chat URL yet.
			// app/page.tsx was split view. 
			// If the chat is on the right side, maybe query param?
			// Or maybe /chat/[id].
			// For now, let's assume query param ?chatId=... or just reload to update list.
			// Wait, the user has existing `app/page.tsx` for "Split View".
			// The request is: "menu lateral con todos los chats que he iniciar".

			router.push(`/?chatId=${newChat.id}`)
			router.refresh()
		} catch (error) {
			console.error(error)
		} finally {
			setLoading(false)
		}
	}

	return (
		<SidebarGroup className="group-data-[collapsible=icon]:hidden">
			<SidebarGroupLabel>Chats</SidebarGroupLabel>
			<SidebarMenu>
				<SidebarMenuItem>
					<SidebarMenuButton onClick={handleNewChat} disabled={loading} className="text-sidebar-foreground/70 ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
						<Plus className="opacity-60" />
						<span>Nuevo Chat</span>
					</SidebarMenuButton>
				</SidebarMenuItem>
				{chats.map((chat) => (
					<SidebarMenuItem key={chat.id}>
						<SidebarMenuButton asChild isActive={pathname === "/" && searchParams.get('chatId') === chat.id}>
							<Link href={`/?chatId=${chat.id}`}>
								<MessageSquare className="opacity-60" />
								<span>{chat.title || "Chat sin título"}</span>
							</Link>
						</SidebarMenuButton>
					</SidebarMenuItem>
				))}
			</SidebarMenu>
		</SidebarGroup>
	)
}
