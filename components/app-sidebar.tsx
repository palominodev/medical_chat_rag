"use client"
import {
	Sidebar,
	SidebarContent,
	SidebarHeader,
	SidebarRail,
} from "@/components/ui/sidebar"

import { useEffect, useState } from "react"
import { ChatSession } from "@/lib/supabase"
import { getUserChats } from "@/app/actions"
import { NavChats } from "./nav-chats"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	const [chats, setChats] = useState<ChatSession[]>([])

	useEffect(() => {
		const fetchChats = async () => {
			const chats = await getUserChats()
			setChats(chats)
		}
		fetchChats()

		const handleSessionCreated = () => {
			fetchChats()
		}

		window.addEventListener('chat-session-created', handleSessionCreated)

		return () => {
			window.removeEventListener('chat-session-created', handleSessionCreated)
		}
	}, [])

	return (
		<Sidebar collapsible="icon" {...props}>
			<SidebarHeader>
				<div className="flex items-center gap-2 px-4 py-2 font-bold text-lg">
					MedChat
				</div>
			</SidebarHeader>
			<SidebarContent>
				<NavChats chats={chats} />
			</SidebarContent>
			<SidebarRail />
		</Sidebar>
	)
}
