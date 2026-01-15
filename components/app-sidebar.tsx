import * as React from "react"
import {
	Sidebar,
	SidebarContent,
	SidebarHeader,
	SidebarRail,
} from "@/components/ui/sidebar"
import { NavChats } from "@/components/nav-chats"
import { getUserChats } from "@/app/actions"

export async function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	const chats = await getUserChats()

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
