import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarTrigger } from "@/components/ui/sidebar";

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<SidebarProvider>
			<AppSidebar />
			<main className="w-full h-screen overflow-hidden flex flex-col">
				<div className="p-2">
					<SidebarTrigger />
				</div>
				{children}
			</main>
		</SidebarProvider>
	);
}