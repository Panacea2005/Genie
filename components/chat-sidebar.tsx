"use client"

import { useState } from "react"
import { X, Plus, MessageSquare, Settings, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar"

type ChatSidebarProps = {
  open: boolean
  setOpen: (open: boolean) => void
  isMobile: boolean
}

export default function ChatSidebar({ open, setOpen, isMobile }: ChatSidebarProps) {
  const [conversations, setConversations] = useState([
    { id: "1", title: "Trip planning ideas", date: "Today" },
    { id: "2", title: "Creative writing help", date: "Yesterday" },
    { id: "3", title: "Research on AI trends", date: "May 5" },
  ])

  return (
    <SidebarProvider defaultOpen={open} open={open} onOpenChange={setOpen}>
      <Sidebar side="left" variant="sidebar" collapsible={isMobile ? "offcanvas" : "icon"}>
        <SidebarHeader>
          <div className="flex items-center justify-between p-4">
            <h2 className="font-semibold">Conversations</h2>
            {isMobile && (
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <div className="px-4 pb-2">
            <Button className="w-full justify-start" variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              New Chat
            </Button>
          </div>
        </SidebarHeader>

        <SidebarSeparator />

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Recent</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {conversations.map((conversation) => (
                  <SidebarMenuItem key={conversation.id}>
                    <SidebarMenuButton>
                      <MessageSquare className="h-4 w-4 mr-2" />
                      <div className="flex-1 truncate">
                        <span>{conversation.title}</span>
                        <span className="block text-xs text-gray-500">{conversation.date}</span>
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton>
                <Settings className="h-4 w-4 mr-2" />
                <span>Settings</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton>
                <Trash2 className="h-4 w-4 mr-2" />
                <span>Clear conversations</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
    </SidebarProvider>
  )
}
