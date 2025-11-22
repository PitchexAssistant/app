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
  Trash2,
  MoreVertical,
  Edit2,
  Copy,
  Archive,
  CheckCircle,
  Download,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useSessions } from "@/hooks/use-sessions"
import { Session } from "@/lib/api/client"

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user: {
    name: string
    email: string
    avatar: string
  }
  onNewSession?: () => void
  onSelectSession?: (session: Session) => void
}

export function AppSidebar({ user, onNewSession, onSelectSession, ...props }: AppSidebarProps) {
  const [isPreviousSessionsOpen, setIsPreviousSessionsOpen] = React.useState(true)
  const { signOut, user: clerkUser } = useClerk()
  const router = useRouter()
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"
  
  // Use sessions hook
  const {
    sessions,
    currentSession,
    loading,
    deleteSession,
    updateSession,
    createSession,
    completeSession,
    loadSessions,
  } = useSessions()

  const handleLogout = async () => {
    await signOut()
    router.push("/")
  }

  const handleNewSession = () => {
    // Navigate to dashboard and trigger new session
    router.push('/dashboard?newSession=true')
    // Also call the callback if provided
    onNewSession?.()
  }

  const handleSessionClick = (session: Session) => {
    // Navigate to dashboard when selecting a session
    router.push('/dashboard')
    onSelectSession?.(session)
  }

  const handleDeleteSession = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation()
    if (confirm('Are you sure you want to delete this session?')) {
      await deleteSession(sessionId)
    }
  }

  const handleRenameSession = async (e: React.MouseEvent, session: Session) => {
    e.stopPropagation()
    const newTitle = prompt('Enter new session name:', session.title)
    if (newTitle && newTitle.trim() !== session.title) {
      await updateSession(session.id, { title: newTitle.trim() })
    }
  }

  const handleDuplicateSession = async (e: React.MouseEvent, session: Session) => {
    e.stopPropagation()
    const newTitle = `${session.title} (Copy)`
    if (clerkUser?.id) {
      await createSession(newTitle, session.mode)
    }
  }

  const handleMarkComplete = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation()
    await completeSession(sessionId)
  }

  const handleDownloadTranscript = (e: React.MouseEvent, session: Session) => {
    e.stopPropagation()
    if (!session.transcript) {
      alert('No transcript available for this session')
      return
    }
    
    const blob = new Blob([session.transcript], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${session.title.replace(/[^a-z0-9]/gi, '_')}_transcript.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  // Get mode icon
  const getModeIcon = (mode: string) => {
    return <Mic className="w-5 h-5 text-stone-500" />
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
            <div 
              onClick={handleNewSession}
              className={`w-10 h-8 px-0 py-2  inline-flex justify-start items-center  rounded-xl cursor-pointer overflow-hidden ${isCollapsed ? 'justify-center px-0' : 'gap-3 px-2 w-full h-11 hover:bg-zinc-900'}`}
            >
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
                    {sessions.length > 0 && (
                      <div className="h-6 px-2 py-[5px] bg-pink-500/10 rounded-[5.13px] flex justify-center items-center">
                        <div className="text-pink-500 text-xs font-bold font-['Uber_Move']">{sessions.length}</div>
                      </div>
                    )}
                  </div>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-transparent">
                      <ChevronUp className={`w-5 h-5 text-neutral-400 transition-transform ${isPreviousSessionsOpen ? 'rotate-0' : 'rotate-180'}`} />
                    </Button>
                  </CollapsibleTrigger>
                </div>

                <CollapsibleContent>
                  <div className="self-stretch flex flex-col justify-start items-start gap-1">
                    {loading ? (
                      <div className="self-stretch h-11 pl-12 pr-3 py-2 flex items-center">
                        <div className="text-neutral-500 text-sm font-['Uber_Move']">Loading...</div>
                      </div>
                    ) : sessions.length === 0 ? (
                      <div className="self-stretch h-11 pl-12 pr-3 py-2 flex items-center">
                        <div className="text-neutral-500 text-sm font-['Uber_Move']">No sessions yet</div>
                      </div>
                    ) : (
                      sessions.slice(0, 10).map((session) => (
                        <div
                          key={session.id}
                          onClick={() => handleSessionClick(session)}
                          className={`self-stretch group pl-12 pr-2 py-2 rounded-xl inline-flex justify-between items-center overflow-hidden hover:bg-zinc-900 cursor-pointer ${
                            currentSession?.id === session.id ? 'bg-zinc-900' : ''
                          }`}
                        >
                          <div className="flex justify-start items-center gap-3 flex-1 min-w-0">
                            {getModeIcon(session.mode)}
                            <div className="flex flex-col min-w-0 flex-1">
                              <div className="text-neutral-400 text-sm font-medium font-['Uber_Move'] truncate">
                                {session.title}
                              </div>
                              <div className="text-stone-600 text-xs font-['Uber_Move']">
                                {formatDate(session.updated_at)}
                              </div>
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 hover:bg-zinc-800"
                              >
                                <MoreVertical className="w-4 h-4 text-neutral-400" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800">
                              <DropdownMenuItem
                                onClick={(e) => handleRenameSession(e, session)}
                                className="text-neutral-400 focus:text-neutral-300 focus:bg-zinc-800"
                              >
                                <Edit2 className="w-4 h-4 mr-2" />
                                Rename
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => handleDuplicateSession(e, session)}
                                className="text-neutral-400 focus:text-neutral-300 focus:bg-zinc-800"
                              >
                                <Copy className="w-4 h-4 mr-2" />
                                Duplicate
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => handleMarkComplete(e, session.id)}
                                className="text-neutral-400 focus:text-neutral-300 focus:bg-zinc-800"
                              >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Mark Complete
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => handleDownloadTranscript(e, session)}
                                className="text-neutral-400 focus:text-neutral-300 focus:bg-zinc-800"
                              >
                                <Download className="w-4 h-4 mr-2" />
                                Download Transcript
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => handleDeleteSession(e, session.id)}
                                className="text-red-400 focus:text-red-300 focus:bg-zinc-800"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      ))
                    )}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ) : (
              <div className="w-full flex justify-center">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0 hover:bg-zinc-900 rounded-md"
                  onClick={handleNewSession}
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
            <div 
              onClick={() => router.push('/help')}
              className={`self-stretch h-11 py-2 rounded-xl cursor-pointer inline-flex items-center overflow-hidden  ${isCollapsed ? 'justify-center' : 'justify-start  px-3  gap-3 hover:bg-zinc-900'}`}
            >
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

      {/* Footer - Empty for now */}
      <SidebarFooter className="pb-8 bg-[var(--bg-dark-grey)]">
        {/* Profile moved to top right header */}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
