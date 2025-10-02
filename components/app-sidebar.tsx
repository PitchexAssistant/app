"use client"

import * as React from "react"
import {
  Plus,
  Monitor,
  ChevronUp,
  Mic,
  Info,
  ArrowUpRight,
  LogOut,
} from "lucide-react"
import Image from "next/image"

import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarSeparator,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Badge } from "./ui/badge"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user: {
    name: string
    email: string
    avatar: string
  }
}

const GoogleDriveIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}>
    <path fill="#0066da" d="M15.1,1.1l-6,10.6l-3.3-5.9l-4.7,8.2h17.9l-3.9-6.9Z"></path>
    <path fill="#009e5d" d="M4.1,22.9l6-10.6l6.1,10.6Z"></path>
    <path fill="#ffcd00" d="M10.1,12.3l-6-10.6l-3,5.3l9,15.9l6-10.6Z"></path>
  </svg>
);

const FirebaseIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}>
    <path fill="#f57c00" d="M4.3,20.3l5.8-16.7c0.1-0.2,0.3-0.3,0.5-0.3s0.4,0.1,0.5,0.3l3.2,9.1l5.4-3.5c0.2-0.1,0.4-0.1,0.5,0l0,0c0.2,0.1,0.3,0.3,0.2,0.5l-5.1,15.1c-0.1,0.2-0.3,0.3-0.5,0.3s-0.4-0.1-0.5-0.3L10,12.4L4.5,20.8C4.4,21,4.1,21,3.9,20.9l0,0C3.8,20.8,3.7,20.5,3.8,20.3Z"></path>
    <path fill="#ffca28" d="M12.9,12.5l-3.2-9.1c-0.1-0.2-0.3-0.4-0.5-0.4s-0.4,0.1-0.5,0.3L3.8,15.4Z"></path>
    <path fill="#ffa726" d="M4.3,20.3l0.2,0.5c0.1,0.2,0.4,0.3,0.6,0.2l7.8-5.1Z"></path>
  </svg>
);

const DropboxIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}>
    <path fill="#0061ff" d="M12,4.2L6.1,8.1L12,12l5.9-3.9Zm0,8.7L6.1,17l5.9,3.9l5.9-3.9ZM6.1,4.2l-6,3.9l6,3.9l6-3.9Zm11.8,0l6,3.9l-6,3.9-6-3.9Z"></path>
  </svg>
);

export function AppSidebar({ user, ...props }: AppSidebarProps) {
  const [isPreviousSessionsOpen, setIsPreviousSessionsOpen] = React.useState(true)

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <Image src="/pitchexLogo.png" alt="Logo" width={100} height={100} />
        </div>
      </SidebarHeader>
      
      <SidebarContent className="px-4 overflow-y-auto overflow-x-hidden scrollbar-hide">
        {/* Integrations Section */}
        <SidebarGroup>
        <div className="flex items-center justify-between">
      <p className="text-base font-medium text-slate-200">Integrations</p>
      <div className="flex items-center gap-x-1.5 bg-[#27272A] p-1.5 rounded-full">
        <GoogleDriveIcon className="w-5 h-5" />
        <FirebaseIcon className="w-5 h-5" />
        <DropboxIcon className="w-5 h-5" />
      </div>
    </div>
        </SidebarGroup>

        {/* New Session Button */}
        <div className="mb-6">
          <Button className="w-full bg-slate-800 border border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white rounded-lg h-10">
            <Plus className="w-4 h-4 mr-2" />
            New Session
          </Button>
        </div>

        {/* Pitch Maker Section */}
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton className="text-slate-300 hover:bg-slate-800 hover:text-white">
                <Monitor className="w-4 h-4" />
                <span>Pitch Maker</span>
                <Badge className="ml-auto bg-orange-500 text-orange-900 text-xs px-2 py-0.5">
                  Coming Soon
                </Badge>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarSeparator className="my-4" />

        {/* Previous Sessions Section */}
        <SidebarGroup>
          <Collapsible open={isPreviousSessionsOpen} onOpenChange={setIsPreviousSessionsOpen}>
            <div className="flex items-center justify-between mb-3">
              <SidebarGroupLabel className="text-slate-400 text-sm">Previous Sessions</SidebarGroupLabel>
              <div className="flex items-center gap-2">
                <Badge className="bg-purple-500 text-white text-xs px-2 py-0.5">6</Badge>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-slate-400 hover:text-white">
                    <ChevronUp className={`w-3 h-3 transition-transform ${isPreviousSessionsOpen ? 'rotate-0' : 'rotate-180'}`} />
                  </Button>
                </CollapsibleTrigger>
              </div>
            </div>
            <CollapsibleContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton className="text-slate-300 hover:bg-slate-800 hover:text-white">
                    <Mic className="w-4 h-4" />
                    <span>Pitch 1</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton className="text-slate-300 hover:bg-slate-800 hover:text-white">
                    <Mic className="w-4 h-4" />
                    <span>Pitch 2</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton className="text-slate-300 hover:bg-slate-800 hover:text-white">
                    <Mic className="w-4 h-4" />
                    <span>Pitch 3</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </CollapsibleContent>
          </Collapsible>
        </SidebarGroup>

        <SidebarSeparator className="my-4" />

        {/* Help & Support Section */}
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton className="text-slate-300 hover:bg-slate-800 hover:text-white">
                <Info className="w-4 h-4" />
                <span>Help & Support</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        {/* Upgrade to Pro Card */}
        <div className="mt-6 p-4 bg-slate-800 border border-slate-600 rounded-lg">
          <div className="flex items-start justify-between mb-3">
            <Badge className="bg-green-500 text-green-900 text-xs px-2 py-0.5">Pro</Badge>
          </div>
          <h3 className="text-white font-semibold text-sm mb-2">Upgrade to Pro</h3>
          <p className="text-slate-400 text-xs leading-relaxed mb-4">
            Unlock unlimited sessions, priority support, and advanced AI tools to take your pitches to the next level.
          </p>
          <Button className="w-full bg-slate-700 border border-slate-600 text-white hover:bg-slate-600 rounded-lg h-8 text-xs">
            Upgrade Now
            <ArrowUpRight className="w-3 h-3 ml-1" />
          </Button>
        </div>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <SidebarSeparator className="mb-4" />
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
            <span className="text-white font-semibold text-sm">
              {user.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white font-medium text-sm truncate">{user.name}</div>
            <div className="text-slate-400 text-xs truncate">{user.email}</div>
          </div>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-white">
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
