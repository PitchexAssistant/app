"use client"

import * as React from "react"
import {
  Plus,
  Monitor,
  ChevronDown,
  Mic,
  Trash2,
  MoreVertical,
  Edit2,
  Copy,
  CheckCircle,
  Download,
  Link2,
  X,
} from "lucide-react"
import Image from "next/image"
import { useClerk } from "@clerk/nextjs"
import { useRouter } from "next/navigation"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarSeparator,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  useSidebar,
  SidebarTrigger,
  SidebarMenuSkeleton,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Badge } from "./ui/badge"
import { Input } from "@/components/ui/input"
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
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
  const [isHistoryOpen, setIsHistoryOpen] = React.useState(true)
  const [renameDialogOpen, setRenameDialogOpen] = React.useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [sessionToRename, setSessionToRename] = React.useState<Session | null>(null)
  const [sessionToDelete, setSessionToDelete] = React.useState<string | null>(null)
  const [newSessionTitle, setNewSessionTitle] = React.useState("")
  const { user: clerkUser } = useClerk()
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

  const handleNewSession = () => {
    router.push('/dashboard')
    onNewSession?.()
  }

  const handleSessionClick = (session: Session) => {
    router.push('/dashboard')
    onSelectSession?.(session)
  }

  const handleDeleteSession = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation()
    setSessionToDelete(sessionId)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (sessionToDelete) {
      await deleteSession(sessionToDelete)
    }
    setDeleteDialogOpen(false)
    setSessionToDelete(null)
  }

  const handleRenameSession = (e: React.MouseEvent, session: Session) => {
    e.stopPropagation()
    setSessionToRename(session)
    setNewSessionTitle(session.title)
    setRenameDialogOpen(true)
  }

  const handleConfirmRename = async () => {
    if (sessionToRename && newSessionTitle.trim() && newSessionTitle.trim() !== sessionToRename.title) {
      await updateSession(sessionToRename.id, { title: newSessionTitle.trim() })
    }
    setRenameDialogOpen(false)
    setSessionToRename(null)
    setNewSessionTitle("")
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

  return (
    <Sidebar
      collapsible="icon"
      {...props}
      className="bg-surface-1 border-0  overflow-x-hidden"
    >
      {/* Header with Logo */}
      <SidebarHeader className="py-4 bg-surface-1">
        {isCollapsed ? (
          <div className="flex px-1 items-center justify-center">
            <Image
              src="/logo-sidebar-collapsed.svg"
              alt="Pitchex"
              width={28}
              height={20}
              className="w-7 h-5"
            />
          </div>
        ) : (
          <div className="flex items-center justify-between pl-1">
            <div className="flex items-center">
              <Image
                src="/pitchexLogo.png"
                alt="Pitchex"
                width={100}
                height={24}
                className="h-6 w-auto object-contain"
              />
            </div>
            <SidebarTrigger className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]" />
          </div>
        )}
      </SidebarHeader>

      <SidebarContent className="bg-surface-1 overflow-x-hidden">
        {/* Main Menu Group */}
        <SidebarGroup>
          <SidebarMenu>
            {/* 1. New Session - Styled as Button */}
            <SidebarMenuItem className="mb-1">
              <SidebarMenuButton
                onClick={handleNewSession}
                tooltip="New Session"
                className="h-10 bg-surface-2 text-text-primary hover:bg-surface-3 hover:text-text-primary rounded-lg group justify-start px-3"
              >
                <Plus className="w-5 h-5 shrink-0 text-accent-lime" />
                <span className="text-sm font-medium truncate">New Session</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            {/* 3. Pitcher with Coming Soon */}
            <SidebarMenuItem>
              <SidebarMenuButton
                tooltip="Pitcher"
                className="h-10 text-text-primary hover:bg-surface-2 hover:text-text-primary rounded-lg"
              >
                <Monitor className="w-5 h-5 shrink-0" />
                <span className="text-sm font-normal flex-1 truncate">Pitcher</span>
                {!isCollapsed && (
                  <Badge
                    variant="outline"
                    className="bg-accent-lime/10 py-1 text-accent-lime rounded-sm border-0 text-xs font-normal shrink-0"
                  >
                    Coming Soon
                  </Badge>
                )}
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarSeparator className="bg-surface-2 mx-2" />

        {/* Chat History Group */}
        <SidebarGroup>
          <Collapsible
            open={isHistoryOpen}
            onOpenChange={setIsHistoryOpen}
            className="group/collapsible"
          >
            <SidebarMenuItem className="list-none">
              <CollapsibleTrigger asChild>
                <SidebarMenuButton
                  tooltip="Recents"
                  className="h-10 text-[var(--text-primary)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)] rounded-lg"
                >
                  <Mic className="w-5 h-5 shrink-0" />
                  <span className="text-sm font-normal flex-1 truncate">Recents</span>
                  {!isCollapsed && sessions.length > 0 && (
                    <Badge
                      variant="outline"
                      className="bg-pink-500/10 text-pink-500 border-0 text-xs font-normal mr-1 shrink-0"
                    >
                      {sessions.length}
                    </Badge>
                  )}
                  {!isCollapsed && (
                    <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${isHistoryOpen ? 'rotate-0' : '-rotate-90'}`} />
                  )}
                </SidebarMenuButton>
              </CollapsibleTrigger>
            </SidebarMenuItem>

            <CollapsibleContent>
              <SidebarMenuSub className="border-l-surface-3 mx-0 px-1 mt-1">
                {loading ? (
                  Array.from({ length: 3 }).map((_, index) => (
                    <SidebarMenuSubItem key={index}>
                      <SidebarMenuSkeleton showIcon />
                    </SidebarMenuSubItem>
                  ))
                ) : sessions.length === 0 ? (
                  <SidebarMenuSubItem>
                    <div className="px-3 py-2 text-text-tertiary text-sm font-normal">
                      No sessions yet
                    </div>
                  </SidebarMenuSubItem>
                ) : (
                  sessions.slice(0, 10).map((session) => (
                    <SidebarMenuSubItem key={session.id}>
                      <div
                        onClick={() => handleSessionClick(session)}
                        className={`group/session flex w-full items-center justify-between px-2 py-2 rounded-md cursor-pointer hover:bg-surface-2 ${currentSession?.id === session.id ? 'bg-surface-2' : ''
                          }`}
                      >
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="text-[var(--text-secondary)] text-sm font-normal truncate">
                            {session.title}
                          </span>
                          <span className="text-[var(--text-tertiary)] text-xs font-normal">
                            {formatDate(session.updated_at)}
                          </span>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 opacity-0 rounded-sm group-hover/session:opacity-100 hover:bg-[var(--surface-3)] shrink-0"
                            >
                              <MoreVertical className="w-4 h-4 text-[var(--text-tertiary)]" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-[var(--surface-2)] ml-2rounded-sm border-[var(--border-gray)]">
                            <DropdownMenuItem
                              onClick={(e) => handleRenameSession(e, session)}
                              className="text-[var(--text-secondary)] focus:text-[var(--text-primary)] focus:bg-[var(--surface-2)]"
                            >
                              <Edit2 className="w-4 h-4 mr-2" />
                              Rename
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => handleDuplicateSession(e, session)}
                              className="text-[var(--text-secondary)] focus:text-[var(--text-primary)] focus:bg-[var(--surface-2)]"
                            >
                              <Copy className="w-4 h-4 mr-2" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => handleMarkComplete(e, session.id)}
                              className="text-[var(--text-secondary)] focus:text-[var(--text-primary)] focus:bg-[var(--surface-2)]"
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Mark Complete
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => handleDownloadTranscript(e, session)}
                              className="text-[var(--text-secondary)] focus:text-[var(--text-primary)] focus:bg-[var(--surface-2)]"
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Download Transcript
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => handleDeleteSession(e, session.id)}
                              className="text-[var(--red)] focus:text-[var(--red)] focus:bg-[var(--surface-2)]"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </SidebarMenuSubItem>
                  ))
                )}
              </SidebarMenuSub>
            </CollapsibleContent>
          </Collapsible>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="bg-[var(--surface-0)] p-4">
        {isCollapsed && (
          <div className="flex justify-center">
            <SidebarTrigger className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]" />
          </div>
        )}
      </SidebarFooter>
      <SidebarRail />

      {/* Rename Session Dialog */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent
          showCloseButton={false}
          className="bg-surface-1 border-surface-3 rounded-xl p-5 w-[480px] max-w-[480px] gap-4"
        >
          <DialogHeader className="gap-1">
            <DialogTitle className="text-base font-semibold text-text-primary">
              Rename Session
            </DialogTitle>
            <p className="text-sm text-text-secondary">
              Enter a new name for your session
            </p>
          </DialogHeader>

          <Input
            value={newSessionTitle}
            onChange={(e) => setNewSessionTitle(e.target.value)}
            placeholder="Session name"
            className="bg-surface-2 border-surface-3 text-text-primary placeholder:text-text-tertiary focus:border-accent-lime focus:ring-0"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleConfirmRename()
              }
            }}
            autoFocus
          />

          <DialogFooter className="gap-3 pt-2">
            <Button
              variant="nav"
              onClick={() => setRenameDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="default"
              onClick={handleConfirmRename}
              disabled={!newSessionTitle.trim()}
            >
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Session Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent
          showCloseButton={false}
          className="bg-surface-1 border-surface-3 rounded-xl p-5 w-[480px] max-w-[480px] gap-4"
        >
          <DialogHeader className="gap-1">
            <DialogTitle className="text-base font-semibold text-text-primary">
              Delete Session
            </DialogTitle>
            <p className="text-sm text-text-secondary">
              Are you sure you want to delete this session? This action cannot be undone.
            </p>
          </DialogHeader>

          <DialogFooter className="gap-3 pt-2">
            <Button
              variant="nav"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Sidebar>
  )
}
