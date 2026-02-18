import { Calendar, Home, Inbox} from "lucide-react"
import type { LucideIcon } from "lucide-react";
import type { TabId } from "../App";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

interface SidebarItem {
  title: string;
  id: TabId;
  icon: LucideIcon;
}

interface AppSidebarProps {
  activeTab: TabId;
  setActiveTab: (id: TabId) => void;
}

const items : SidebarItem[] = [
  { title: "Güllelieferscheine", id: "lieferscheine", icon: Home },
  { title: "Futterauswertung", id: "auswertung", icon: Inbox },
  { title: "Wagedatensätze", id: "wagedaten", icon: Calendar },
]

export function AppSidebar({setActiveTab, activeTab} : AppSidebarProps) {
  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Biogas</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={activeTab == item.id} onClick={() => setActiveTab(item.id)}>
                    <button type="button" className="w-full flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}