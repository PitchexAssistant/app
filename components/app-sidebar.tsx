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
import { useClerk } from "@clerk/nextjs"
import { useRouter } from "next/navigation"

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
  useSidebar,
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

export function AppSidebar({ user, ...props }: AppSidebarProps) {
  const [isPreviousSessionsOpen, setIsPreviousSessionsOpen] = React.useState(true)
  const { signOut } = useClerk()
  const router = useRouter()
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"

  const handleSignOut = async () => {
    await signOut()
    router.push("/")
  }

  return (
    <Sidebar collapsible="icon" {...props} className="bg-[var(--bg-dark-grey)] border-r border-zinc-800">
      {/* Header */}
      <SidebarHeader className="pt-3 pl-0 pr-5 bg-[var(--bg-dark-grey)]">
        {isCollapsed ? (
          <div className="w-6 h-6 ml-2.5 flex items-center justify-center">
            <Image 
              src="/logo-sidebar-collapsed.svg" 
              alt="Logo" 
              width={32} 
              height={20}
              className="w-8 h-5"
            />
          </div>
        ) : (
          <div className="inline-flex mt-3 justify-start pl-6 items-center gap-2">
            <div className="w-20 h-5 relative overflow-hidden">
              <Image 
                src="/pitchexLogo.png" 
                alt="Logo" 
                width={180} 
                height={180}
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        )}
      </SidebarHeader>
      
      <SidebarContent className="px-3 flex flex-col justify-between overflow-y-auto overflow-x-hidden scrollbar-hide bg-[var(--bg-dark-grey)]">
        <div className="flex flex-col justify-start items-start gap-6">
          {/* Integrations Section */}
          {!isCollapsed && (
            <div className="self-stretch h-10 px-3 inline-flex justify-between items-center">
              <div className="text-neutral-400 text-base font-medium font-['Uber_Move']">Integrations</div>
              <Image 
                  src="/integrations-icon-custom.svg" 
                  alt="Integrations" 
                  width={64} 
                  height={12}
                  className="h-10"
                />
            </div>
          )}

          {isCollapsed && (
            <div className="w-full flex justify-center">
               
            </div>
          )}

          {/* Separator */}
          <div className="self-stretch h-0 outline outline-[0.70px] outline-offset-[-0.35px] outline-zinc-800"></div>

          {/* Actions Section */}
          <div className="self-stretch flex flex-col justify-start items-start gap-3">
            {/* New Session Button */}
            <div className={`w-10 h-8 px-0 py-2  inline-flex justify-start items-center  rounded-xl cursor-pointer overflow-hidden ${isCollapsed ? 'justify-center px-0' : 'gap-3 px-2 w-full h-11 hover:bg-zinc-900'}`}>
              <Plus className={`w-6 h-6 text-stone-500 ${isCollapsed ? 'h-6 w-6 p-0' : 'mr-0'}`} />
              {!isCollapsed && (
                <div className="text-neutral-400 text-base font-medium font-['Uber_Move']">New Session</div>
              )}
            </div>

            {/* Pitch Maker */}
            <div className={`self-stretch rounded-xl inline-flex justify-start items-start ${isCollapsed ? 'justify-center' : 'hover:bg-zinc-900 rounded-xl cursor-pointer'}`}>
              <div className={`flex-1 h-11 px-0 py-2 rounded-xl flex items-center overflow-hidden ${isCollapsed ? 'justify-center' : 'justify-start gap-3 px-3 hover:bg-zinc-900 rounded-xl cursor-pointe'}`}>
                <Monitor className="w-5 h-5 text-stone-500 cursor-pointer" />
                {!isCollapsed && (
                  <div className="flex justify-between w-full">
                    <div className="text-neutral-400 text-s font-medium font-['Uber_Move']">Pitcher</div>
                    <div className="h-6 px-2 py-[5px] bg-amber-500/10 rounded-md flex justify-center items-center">
                      <div className="text-amber-500 text-xs font-bold font-['Uber_Move']">Coming Soon</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Separator */}
          <div className="self-stretch h-0 outline outline-[0.70px] outline-offset-[-0.35px] outline-zinc-800"></div>

          {/* Previous Sessions Section */}
          <div className="self-stretch flex flex-col justify-start items-start gap-3">
            {!isCollapsed ? (
              <Collapsible open={isPreviousSessionsOpen} onOpenChange={setIsPreviousSessionsOpen} className="w-full">
                <div className="self-stretch w-full h-11 px-3 py-2 rounded-xl inline-flex justify-between items-center overflow-hidden">
                  <div className="flex justify-start items-center gap-3">
                    <Mic className="w-5 h-5 text-stone-500" />
                    <div className="text-neutral-400 text-base font-medium font-['Uber_Move']">Recents </div>
                    <div className="h-6 px-2 py-[5px] bg-pink-500/10 rounded-[5.13px] flex justify-center items-center">
                      <div className="text-pink-500 text-xs font-bold font-['Uber_Move']">6</div>
                    </div>
                  </div>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-transparent">
                      <ChevronUp className={`w-5 h-5 text-neutral-400 transition-transform ${isPreviousSessionsOpen ? 'rotate-0' : 'rotate-180'}`} />
                    </Button>
                  </CollapsibleTrigger>
                </div>

                <CollapsibleContent>
                  <div className="self-stretch flex flex-col justify-start items-start gap-3">
                    <div className="self-stretch h-11 pl-12 pr-3 py-2 rounded-xl inline-flex justify-start items-center overflow-hidden hover:bg-zinc-900 rounded-xl cursor-pointer">
                      <div className="flex justify-start items-center gap-3">
                        <Mic className="w-5 h-5 text-stone-500" />
                        <div className="text-neutral-400 text-base font-medium font-['Uber_Move']">Pitch 1</div>
                      </div>
                    </div>
                    <div className="self-stretch h-11 pl-12 pr-3 py-2 rounded-xl inline-flex justify-start items-center overflow-hidden hover:bg-zinc-900">
                      <div className="flex justify-start items-center gap-3">
                        <Mic className="w-5 h-5 text-stone-500" />
                        <div className="text-neutral-400 text-base font-medium font-['Uber_Move']">Pitch 2</div>
                      </div>
                    </div>
                    <div className="self-stretch h-11 pl-12 pr-3 py-2 rounded-xl inline-flex justify-start items-center overflow-hidden hover:bg-zinc-900">
                      <div className="flex justify-start items-center gap-3">
                        <Mic className="w-5 h-5 text-stone-500" />
                        <div className="text-neutral-400 text-base font-medium font-['Uber_Move']">Pitch 3</div>
                      </div>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ) : (
              <div className="w-full flex justify-center">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0 hover:bg-zinc-900 rounded-md"
                >
                  <Mic className="w-5 h-5 text-neutral-400" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Section */}
        <div className="self-stretch pb-8 flex flex-col justify-start items-start gap-6">
          {/* Separator */}
          <div className="self-stretch h-0 outline outline-[0.70px] outline-offset-[-0.35px] outline-zinc-800"></div>

          {/* Help & Support */}
          <div className="self-stretch flex flex-col justify-start items-start gap-3">
            <div className={`self-stretch h-11 py-2 rounded-xl cursor-pointer inline-flex items-center overflow-hidden  ${isCollapsed ? 'justify-center' : 'justify-start  px-3  gap-3 hover:bg-zinc-900'}`}>
              <Info className="w-6 h-6 text-stone-500" />
              {!isCollapsed && (
                <div className="text-neutral-400 text-base font-medium font-['Uber_Move']">Help & Support</div>
              )}
            </div>
          </div>

          {/* Upgrade to Pro Card */}
          {!isCollapsed && (
            <div className="self-stretch p-4 rounded-2xl outline outline-1 outline-offset-[-1px] outline-zinc-800 flex flex-col justify-start items-start gap-3">
              <div className="h-6 px-2 py-2 bg-neutral-800 rounded-md inline-flex justify-center items-center">
                <div className="text-green-600 text-xs font-bold font-['Uber_Move']">Pro</div>
              </div>
              <div className="text-stone-300 text-base font-medium font-['Uber_Move']">Upgrade to Pro</div>
              <div className="text-neutral-500 text-sm font-medium font-['Uber_Move']">
                Unlock unlimited sessions, priority support, and advanced AI tools to take your pitches to the next level.
              </div>
              <div className="h-8 px-3 py-[5px] rounded-lg outline outline-1 outline-offset-[-1px] outline-zinc-800 inline-flex justify-start items-center gap-[3px] hover:bg-zinc-900 cursor-pointer">
                <div className="text-stone-300 text-xs font-medium font-['Uber_Move']">Upgrade Now</div>
                <ArrowUpRight className="w-3 h-3 text-stone-300" />
              </div>
            </div>
          )}

          {/* Separator */}
          <div className="self-stretch h-0 outline outline-[0.70px] outline-offset-[-0.35px] outline-zinc-800"></div>
        </div>
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="pb-8 bg-[var(--bg-dark-grey)]">
        {!isCollapsed ? (
          <div className="px-3 flex justify-center">    
          <div className="self-stretch inline-flex justify-between items-start">
            <div className="flex justify-start items-center gap-2">
              <div className="w-10 h-10 bg-orange-500 rounded-[110px] inline-flex flex-col justify-center items-center">
                <div className="text-white text-base font-medium font-['Uber_Move']">
                  {user.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                </div>
              </div>
               <div className="inline-flex flex-col justify-start items-start gap-0.5 max-w-[200px]">
                <div className="text-zinc-100 text-base font-medium font-['Uber_Move']">
                    {user.name}
                  </div>
                  <div className="text-stone-500 text-sm font-medium font-['Uber_Move'] truncate w-full overflow-hidden text-ellipsis whitespace-nowrap">
                    {user.email}
                  </div>
                </div>  
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-8 h-8 p-2 hover:bg-zinc-900 rounded-lg"
              onClick={handleSignOut}
            >
              <LogOut className="w-5 h-5 text-stone-500" />
            </Button>
          </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="w-10 h-10 bg-orange-500 rounded-[110px] inline-flex flex-col justify-center items-center">
              <div className="text-white text-base font-medium font-['Uber_Move']">
                {user.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
              </div>
            </div>
          </div>
        )}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
