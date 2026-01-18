"use client"

import { useState, useEffect, useRef } from "react"
import { X, Settings, Users, CreditCard, LayoutDashboard, HelpCircle, MessageCircle, Search, Download, Plus, MoreVertical, ChevronDown, Camera, Loader2, Mail, ExternalLink } from "lucide-react"
import { useUser, useClerk } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"

type SettingsTab = 'general' | 'people' | 'billing' | 'integrations' | 'help' | 'support'

interface SettingsModalProps {
  open: boolean
  onClose: () => void
}

interface TeamMember {
  id: string
  name: string
  email: string
  status: 'active' | 'pending' | 'inactive'
  role: string
  project: string
}

// Mock data for team members - set to empty array for empty state
const mockTeamMembers: TeamMember[] = []

// Support email addresses
const SUPPORT_EMAILS = [
  'bscs22115@itu.edu.pk',
  'bscs22071@itu.edu.pk',
  'bscs22025@itu.edu.pk'
]

export function SettingsModal({ open, onClose }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [teamMembers] = useState<TeamMember[]>(mockTeamMembers)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [showSupportForm, setShowSupportForm] = useState(false)

  const { user } = useUser()
  const { signOut } = useClerk()
  const router = useRouter()

  // Initialize user data
  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || '')
      setLastName(user.lastName || '')
    }
  }, [user])

  const handleLogout = async () => {
    onClose()
    await signOut({ redirectUrl: "/" })
  }

  const handleDeleteAccount = async () => {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      onClose()
      await signOut({ redirectUrl: "/" })
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await user?.update({
        firstName,
        lastName,
      })
      // Show success toast/notification
      alert('Profile updated successfully!')
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Failed to update profile. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleProfileImageUpload = async (file: File) => {
    if (!user) return

    setIsUploadingImage(true)
    try {
      await user.setProfileImage({ file })
      // Image will automatically update via Clerk's reactivity
    } catch (error) {
      console.error('Error uploading profile image:', error)
      alert('Failed to upload profile image. Please try again.')
    } finally {
      setIsUploadingImage(false)
    }
  }

  const handleHelpNavigation = (section?: string) => {
    onClose()
    if (section) {
      router.push(`/help#${section}`)
    } else {
      router.push('/help')
    }
  }

  const handleStartConversation = () => {
    // Open email client with support email
    const email = SUPPORT_EMAILS[0]
    const subject = encodeURIComponent('Pitchex Support Request')
    const body = encodeURIComponent('Hi Pitchex Team,\n\nI need help with:\n\n[Please describe your issue here]\n\nThank you!')
    window.open(`mailto:${email}?subject=${subject}&body=${body}`)
  }

  if (!open) return null

  const userData = {
    name: user?.fullName || "User",
    email: user?.emailAddresses[0]?.emailAddress || "",
    avatar: user?.imageUrl || "",
    initials: user?.fullName?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'
  }

  const sidebarItems = [
    { id: 'general' as SettingsTab, label: 'General', icon: Settings },
    { id: 'people' as SettingsTab, label: 'People', icon: Users },
    { id: 'billing' as SettingsTab, label: 'Billing & Plans', icon: CreditCard },
    { id: 'integrations' as SettingsTab, label: 'Integrations', icon: LayoutDashboard },
  ]

  const helpItems = [
    { id: 'help' as SettingsTab, label: 'Help Center', icon: HelpCircle },
    { id: 'support' as SettingsTab, label: 'Talk to support', icon: MessageCircle },
  ]

  const renderContent = () => {
    switch (activeTab) {
      case 'general':
        return <GeneralContent
          firstName={firstName}
          lastName={lastName}
          email={userData.email}
          avatar={userData.avatar}
          initials={userData.initials}
          onFirstNameChange={setFirstName}
          onLastNameChange={setLastName}
          onSave={handleSave}
          onLogout={handleLogout}
          onDeleteAccount={handleDeleteAccount}
          onProfileImageUpload={handleProfileImageUpload}
          isSaving={isSaving}
          isUploadingImage={isUploadingImage}
        />
      case 'people':
        return <PeopleContent
          teamMembers={teamMembers}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onInviteClick={() => setShowInviteModal(true)}
          onLearnMoreClick={() => handleHelpNavigation()}
        />
      case 'billing':
        return <BillingContent />
      case 'integrations':
        return <IntegrationsContent />
      case 'help':
        return <HelpCenterContent onNavigate={handleHelpNavigation} />
      case 'support':
        return <SupportContent
          onStartConversation={handleStartConversation}
          onShowForm={() => setShowSupportForm(true)}
        />
      default:
        return null
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
        <div className="bg-[var(--surface-1)] border border-[var(--border-gray)] rounded-xl w-[75vw] h-[75vh] shadow-[0px_20px_24px_-4px_rgba(10,13,18,0.08),0px_8px_8px_-4px_rgba(10,13,18,0.03)] flex overflow-hidden">
          {/* Sidebar */}
          <div className="w-[240px] bg-[var(--surface-1)] px-4 py-6 flex flex-col gap-3">
            {/* User Info */}
            <div className="flex items-center gap-2 mb-2">
              <div className="w-10 h-10 bg-[var(--accent-lime)] rounded-full flex items-center justify-center overflow-hidden shadow-[0px_0.8px_1.6px_0px_rgba(10,13,18,0.05)]">
                {userData.avatar ? (
                  <Image src={userData.avatar} alt={userData.name} width={40} height={40} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[var(--surface-0)] text-sm font-semibold">{userData.initials}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[var(--text-primary)] text-sm font-semibold truncate">{userData.name}</p>
              </div>
            </div>

            {/* Settings Section */}
            <div className="flex flex-col">
              <div className="px-4 py-2">
                <p className="text-[var(--text-secondary)] text-xs font-normal">SETTINGS</p>
              </div>
              {sidebarItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`group flex items-center gap-3 px-4 py-2.5 rounded-md transition-colors ${activeTab === item.id
                    ? 'bg-[var(--surface-2)]'
                    : 'hover:bg-[var(--surface-2)]'
                    }`}
                >
                  <item.icon className={`w-4 h-4 transition-colors ${activeTab === item.id ? 'text-[var(--accent-lime)]' : 'text-[var(--text-primary)] group-hover:text-[var(--accent-lime)]'}`} />
                  <span className="text-[var(--text-primary)] text-sm font-medium">{item.label}</span>
                </button>
              ))}
            </div>

            {/* Help Section */}
            <div className="flex flex-col">
              <div className="px-4 py-2">
                <p className="text-[var(--text-secondary)] text-xs font-normal">HELP</p>
              </div>
              {helpItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`group flex items-center gap-3 px-4 py-2.5 rounded-md transition-colors ${activeTab === item.id
                    ? 'bg-[var(--surface-2)]'
                    : 'hover:bg-[var(--surface-2)]'
                    }`}
                >
                  <item.icon className={`w-4 h-4 transition-colors ${activeTab === item.id ? 'text-[var(--accent-lime)]' : 'text-[var(--text-primary)] group-hover:text-[var(--accent-lime)]'}`} />
                  <span className="text-[var(--text-primary)] text-sm font-medium">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 bg-[var(--surface-0)] border-l border-[var(--border-gray)] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4">
              <h2 className="text-[var(--text-primary)] text-base font-semibold capitalize">
                {activeTab === 'billing' ? 'Billing & Plans' : activeTab}
              </h2>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--surface-2)] transition-colors"
              >
                <X className="w-[13px] h-[13px] text-[var(--text-primary)]" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 px-6 pb-6 overflow-y-auto scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {renderContent()}
            </div>
          </div>
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <InviteMemberModal
          onClose={() => setShowInviteModal(false)}
        />
      )}

      {/* Support Form Modal */}
      {showSupportForm && (
        <SupportFormModal
          onClose={() => setShowSupportForm(false)}
        />
      )}
    </>
  )
}

// Invite Member Modal
function InviteMemberModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState('')
  const [isSending, setIsSending] = useState(false)

  const handleSendInvite = () => {
    if (!email || !email.includes('@')) {
      alert('Please enter a valid email address')
      return
    }

    setIsSending(true)

    // Create mailto link with invitation template
    const subject = encodeURIComponent('Invitation to join Pitchex')
    const body = encodeURIComponent(
      `Hi,\n\nYou've been invited to join our team on Pitchex - the AI-powered pitch coaching platform.\n\nPitchex helps entrepreneurs and founders practice and perfect their investor pitches with advanced AI feedback.\n\nJoin us here: ${typeof window !== 'undefined' ? window.location.origin : 'https://pitchex.app'}\n\nLooking forward to collaborating with you!\n\nBest regards`
    )

    window.open(`mailto:${email}?subject=${subject}&body=${body}`)

    setIsSending(false)
    setEmail('')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-[var(--surface-1)] border border-[var(--border-gray)] rounded-xl w-full max-w-[440px] p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-[var(--text-primary)] text-lg font-semibold">Invite Team Member</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--surface-2)] transition-colors"
          >
            <X className="w-4 h-4 text-[var(--text-primary)]" />
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <label className="text-[var(--text-primary)] text-sm font-medium mb-2 block">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colleague@company.com"
              className="w-full h-11 px-4 py-3 bg-[var(--surface-2)] border border-[var(--border-gray)] rounded-xl text-[var(--text-primary)] text-base placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent-lime)]"
            />
          </div>

          <p className="text-[var(--text-secondary)] text-sm">
            An invitation email will be sent to this address to join your team on Pitchex.
          </p>

          <div className="flex items-center gap-3 mt-2">
            <Button
              variant="secondary"
              size="default"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="default"
              size="default"
              onClick={handleSendInvite}
              disabled={isSending || !email}
              className="flex-1"
            >
              {isSending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Mail className="w-4 h-4" />
                  Send Invite
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Support Form Modal
function SupportFormModal({ onClose }: { onClose: () => void }) {
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')

  const handleSubmit = () => {
    const email = SUPPORT_EMAILS[0]
    const emailSubject = encodeURIComponent(subject || 'Pitchex Support Request')
    const emailBody = encodeURIComponent(message || 'Hi, I need help with Pitchex.')
    window.open(`mailto:${email}?subject=${emailSubject}&body=${emailBody}`)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-[var(--surface-1)] border border-[var(--border-gray)] rounded-lg w-full max-w-[500px] p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-[var(--text-primary)] text-lg font-semibold">Contact Support</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--surface-2)] transition-colors"
          >
            <X className="w-4 h-4 text-[var(--text-primary)]" />
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <label className="text-[var(--text-primary)] text-sm font-medium mb-2 block">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="What do you need help with?"
              className="w-full h-11 px-4 py-3 bg-[var(--surface-2)] border border-[var(--border-gray)] rounded-md text-[var(--text-primary)] text-base placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent-lime)]"
            />
          </div>

          <div>
            <label className="text-[var(--text-primary)] text-sm font-medium mb-2 block">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe your issue or question..."
              rows={4}
              className="w-full px-4 py-3 bg-[var(--surface-2)] border border-[var(--border-gray)] rounded-md text-[var(--text-primary)] text-base placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent-lime)] resize-none"
            />
          </div>

          <div className="flex items-center gap-3 mt-2">
            <Button
              variant="secondary"
              size="default"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="default"
              size="default"
              onClick={handleSubmit}
              className="flex-1"
            >
              <Mail className="w-4 h-4" />
              Send Message
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// General Settings Content
interface GeneralContentProps {
  firstName: string
  lastName: string
  email: string
  avatar: string
  initials: string
  onFirstNameChange: (value: string) => void
  onLastNameChange: (value: string) => void
  onSave: () => void
  onLogout: () => void
  onDeleteAccount: () => void
  onProfileImageUpload: (file: File) => void
  isSaving: boolean
  isUploadingImage: boolean
}

function GeneralContent({
  firstName,
  lastName,
  email,
  avatar,
  initials,
  onFirstNameChange,
  onLastNameChange,
  onSave,
  onLogout,
  onDeleteAccount,
  onProfileImageUpload,
  isSaving,
  isUploadingImage
}: GeneralContentProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file')
        return
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB')
        return
      }
      onProfileImageUpload(file)
    }
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Free Plan Banner */}
      <div className="bg-accent-lime/10 border border-accent-lime/30 rounded-lg px-5 py-4">
        <div className="flex flex-col gap-0.5">
          <p className="text-[var(--text-primary)] text-base font-semibold">Free</p>
          <p className="text-[var(--text-primary)] text-sm font-normal">
            You&apos;re on the Free plan.{' '}
            <span className="underline font-medium cursor-pointer hover:text-[var(--accent-lime)]">Upgrade your plan</span>
            {' '}for more scans and reports.
          </p>
        </div>
      </div>

      {/* Profile Settings */}
      <div className="flex flex-col gap-4 items-end">
        <div className="w-full bg-[var(--surface-2)] border border-[var(--border-gray)] rounded-lg px-5 py-4 flex flex-col gap-4">
          {/* First Name */}
          <div className="flex items-center justify-between">
            <span className="text-[var(--text-primary)] text-sm font-medium">First Name</span>
            <input
              type="text"
              value={firstName}
              onChange={(e) => onFirstNameChange(e.target.value)}
              className="w-[180px] h-10 px-3.5 py-2.5 bg-[var(--surface-1)] border border-[var(--border-gray)] rounded-md text-[var(--text-primary)] text-base font-normal shadow-[0px_1px_2px_0px_rgba(10,13,18,0.05)] focus:outline-none focus:border-[var(--accent-lime)]"
            />
          </div>

          <div className="w-full h-px bg-[var(--border-gray)]" />

          {/* Last Name */}
          <div className="flex items-center justify-between">
            <span className="text-[var(--text-primary)] text-sm font-medium">Last Name</span>
            <input
              type="text"
              value={lastName}
              onChange={(e) => onLastNameChange(e.target.value)}
              className="w-[180px] h-10 px-3.5 py-2.5 bg-[var(--surface-1)] border border-[var(--border-gray)] rounded-md text-[var(--text-primary)] text-base font-normal shadow-[0px_1px_2px_0px_rgba(10,13,18,0.05)] focus:outline-none focus:border-[var(--accent-lime)]"
            />
          </div>

          <div className="w-full h-px bg-[var(--border-gray)]" />

          {/* Email */}
          <div className="flex items-center justify-between">
            <span className="text-[var(--text-primary)] text-sm font-medium">Email</span>
            <span className="text-[var(--text-secondary)] text-base font-normal">{email}</span>
          </div>

          <div className="w-full h-px bg-[var(--border-gray)]" />

          {/* Profile Picture */}
          <div className="flex items-center justify-between">
            <span className="text-[var(--text-primary)] text-sm font-medium">Profile Picture</span>
            <div className="relative">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                onClick={handleImageClick}
                disabled={isUploadingImage}
                className="w-10 h-10 bg-[var(--accent-lime)] rounded-full flex items-center justify-center overflow-hidden shadow-[0px_0.8px_1.6px_0px_rgba(10,13,18,0.05)] relative group cursor-pointer hover:ring-2 hover:ring-[rgba(251,255,80,0.5)] transition-all"
              >
                {isUploadingImage ? (
                  <Loader2 className="w-5 h-5 text-[var(--surface-0)] animate-spin" />
                ) : avatar ? (
                  <>
                    <Image src={avatar} alt="Profile" width={40} height={40} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="w-4 h-4 text-white" />
                    </div>
                  </>
                ) : (
                  <>
                    <span className="text-[var(--surface-0)] text-sm font-semibold">{initials}</span>
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="w-4 h-4 text-white" />
                    </div>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <Button
          variant="secondary"
          size="sm"
          onClick={onSave}
          disabled={isSaving}
        >
          {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
          Save
        </Button>
      </div>

      {/* Account Actions */}
      <div className="w-full bg-[var(--surface-2)] border border-[var(--border-gray)] rounded-lg px-5 py-4 flex flex-col gap-4">
        {/* Logout */}
        <div className="flex items-center justify-between">
          <span className="text-[var(--text-primary)] text-sm font-medium">Log out your account</span>
          <Button
            variant="secondary"
            size="sm"
            onClick={onLogout}
          >
            Logout
          </Button>
        </div>

        <div className="w-full h-px bg-[var(--border-gray)]" />

        {/* Delete Account */}
        <div className="flex items-center justify-between">
          <span className="text-[var(--text-primary)] text-sm font-medium">Delete account</span>
          <Button
            variant="destructive"
            size="sm"
            onClick={onDeleteAccount}
          >
            Delete
          </Button>
        </div>
      </div>
    </div>
  )
}

// People Content
interface PeopleContentProps {
  teamMembers: TeamMember[]
  searchQuery: string
  onSearchChange: (value: string) => void
  onInviteClick: () => void
  onLearnMoreClick: () => void
}

function PeopleContent({ teamMembers, searchQuery, onSearchChange, onInviteClick, onLearnMoreClick }: PeopleContentProps) {
  const filteredMembers = teamMembers.filter(member =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const hasMembers = filteredMembers.length > 0

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Header */}
      <div className="flex items-center">
        <h3 className="text-[var(--text-primary)] text-lg font-semibold">Team members</h3>
      </div>

      {hasMembers ? (
        <>
          {/* Search and Actions Bar */}
          <div className="flex items-center justify-between">
            <div className="w-[250px] flex items-center gap-2 px-3.5 py-2.5 bg-[var(--surface-2)] border border-[var(--border-gray)] rounded-xl shadow-[0px_1px_2px_0px_rgba(10,13,18,0.05)]">
              <Search className="w-5 h-5 text-[var(--text-secondary)]" />
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="flex-1 bg-transparent text-[var(--text-secondary)] text-base font-normal placeholder:text-[var(--text-secondary)] focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-3">
              <Button variant="secondary" size="sm">
                <Download className="w-4 h-4" />
                Export
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={onInviteClick}
              >
                <Plus className="w-4 h-4" />
                Invite members
              </Button>
            </div>
          </div>

          {/* Team Members Table */}
          <div className="flex-1 bg-[var(--surface-2)] border border-[var(--border-gray)] rounded-lg overflow-hidden shadow-[0px_1px_3px_0px_rgba(10,13,18,0.1),0px_1px_2px_0px_rgba(10,13,18,0.06)]">
            <div className="flex items-center border-b border-[var(--border-gray)] h-11">
              <div className="flex-1 px-6 py-3">
                <span className="text-[var(--text-secondary)] text-xs font-medium">Name</span>
              </div>
              <div className="w-[120px] px-6 py-3 flex items-center gap-1">
                <span className="text-[var(--text-secondary)] text-xs font-medium">Status</span>
                <ChevronDown className="w-[10.67px] h-[10.67px] text-[var(--text-secondary)]" />
              </div>
              <div className="w-[176px] px-6 py-3">
                <span className="text-[var(--text-secondary)] text-xs font-medium">Role</span>
              </div>
              <div className="px-6 py-3">
                <span className="text-[var(--text-secondary)] text-xs font-medium">Project</span>
              </div>
              <div className="w-[68px]" />
            </div>

            {filteredMembers.map((member) => (
              <div key={member.id} className="flex items-center h-[72px] hover:bg-[var(--surface-1)] transition-colors">
                <div className="flex-1 px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-[var(--text-primary)] text-sm font-medium">{member.name}</span>
                    <span className="text-[var(--text-primary)] text-sm font-normal">{member.email}</span>
                  </div>
                </div>
                <div className="w-[120px] px-6 py-4">
                  <StatusBadge status={member.status} />
                </div>
                <div className="w-[176px] px-6 py-4 flex items-center gap-3">
                  <span className="text-[var(--text-primary)] text-sm font-normal">{member.role}</span>
                  <ChevronDown className="w-[10.67px] h-[10.67px] text-[var(--text-primary)]" />
                </div>
                <div className="px-6 py-4">
                  <span className="text-[var(--text-primary)] text-sm font-normal">{member.project}</span>
                </div>
                <div className="w-[68px] px-6 py-4">
                  <button className="hover:bg-[var(--surface-2)] rounded p-1 transition-colors">
                    <MoreVertical className="w-5 h-5 text-[var(--text-secondary)]" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        /* Empty State */
        <div className="flex-1 bg-[var(--surface-2)] border border-[var(--border-gray)] rounded-lg flex items-center justify-center shadow-[0px_1px_3px_0px_rgba(10,13,18,0.1),0px_1px_2px_0px_rgba(10,13,18,0.06)]">
          <div className="flex flex-col items-center gap-6 max-w-[352px]">
            {/* Illustration */}
            <div className="relative w-[120px] h-[130px]">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative">
                  <div className="w-[80px] h-[50px] bg-gradient-to-br from-[#666] to-[#333] rounded-lg transform rotate-[-5deg]" />
                  <div className="absolute -top-2 -right-4 w-6 h-6 bg-[var(--accent-lime)] rounded-full flex items-center justify-center">
                    <Users className="w-3 h-3 text-[var(--surface-0)]" />
                  </div>
                  <div className="absolute -bottom-2 -left-4 w-6 h-6 bg-[rgba(251,255,80,0.6)] rounded-full flex items-center justify-center">
                    <Users className="w-3 h-3 text-white" />
                  </div>
                </div>
              </div>
            </div>

            {/* Text */}
            <div className="flex flex-col gap-1 text-center">
              <h4 className="text-[var(--text-primary)] text-base font-semibold">Invite your team</h4>
              <p className="text-[var(--text-primary)] text-sm font-normal">
                Invite teammates to start collaborating on projects.
              </p>
            </div>

            {/* Buttons */}
            <div className="flex flex-col gap-1.5">
              <Button
                variant="default"
                size="default"
                onClick={onInviteClick}
              >
                <Plus className="w-4 h-4" />
                Invite members
              </Button>
              <Button
                variant="ghost"
                size="default"
                onClick={onLearnMoreClick}
              >
                Learn more
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Status Badge Component
function StatusBadge({ status }: { status: 'active' | 'pending' | 'inactive' }) {
  const styles = {
    active: 'bg-[rgba(34,197,94,0.1)] text-[#22c55e]',
    pending: 'bg-[rgba(245,158,11,0.1)] text-[#f59e0b]',
    inactive: 'bg-[rgba(107,114,128,0.1)] text-[#6b7280]',
  }

  return (
    <div className={`inline-flex items-center gap-1.5 pl-1.5 pr-2 py-0.5 rounded-full ${styles[status]}`}>
      <div className="w-2 h-2 rounded-full bg-current" />
      <span className="text-xs font-medium capitalize">{status === 'active' ? 'Active' : status}</span>
    </div>
  )
}

// Billing Content
function BillingContent() {
  return (
    <div className="flex flex-col gap-4">
      <div className="bg-[var(--surface-2)] border border-[var(--border-gray)] rounded-lg p-6">
        <h3 className="text-[var(--text-primary)] text-lg font-semibold mb-4">Current Plan</h3>
        <div className="flex items-center justify-between p-4 bg-[var(--surface-1)] rounded-lg">
          <div>
            <p className="text-[var(--text-primary)] text-base font-medium">Free Plan</p>
            <p className="text-[var(--text-secondary)] text-sm">Basic features for getting started</p>
          </div>
          <Button variant="default" size="sm">
            Upgrade
          </Button>
        </div>
      </div>
    </div>
  )
}

// Integrations Content
function IntegrationsContent() {
  return (
    <div className="flex flex-col gap-4">
      <div className="bg-[var(--surface-2)] border border-[var(--border-gray)] rounded-lg p-6">
        <h3 className="text-[var(--text-primary)] text-lg font-semibold mb-4">Connected Apps</h3>
        <p className="text-[var(--text-secondary)] text-sm">No integrations connected yet.</p>
      </div>
    </div>
  )
}

// Help Center Content
interface HelpCenterContentProps {
  onNavigate: (section?: string) => void
}

function HelpCenterContent({ onNavigate }: HelpCenterContentProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="bg-[var(--surface-2)] border border-[var(--border-gray)] rounded-lg p-6">
        <h3 className="text-[var(--text-primary)] text-lg font-semibold mb-4">Help Center</h3>
        <p className="text-[var(--text-secondary)] text-sm mb-4">Find answers to common questions and learn how to get the most out of Pitchex.</p>
        <div className="flex flex-col gap-3">
          <button
            onClick={() => onNavigate()}
            className="text-[var(--accent-lime)] text-sm font-medium hover:underline text-left flex items-center gap-2"
          >
            Getting Started Guide
            <ExternalLink className="w-3 h-3" />
          </button>
          <button
            onClick={() => onNavigate('faq')}
            className="text-[var(--accent-lime)] text-sm font-medium hover:underline text-left flex items-center gap-2"
          >
            FAQ
            <ExternalLink className="w-3 h-3" />
          </button>
          <button
            onClick={() => onNavigate()}
            className="text-[var(--accent-lime)] text-sm font-medium hover:underline text-left flex items-center gap-2"
          >
            Video Tutorials
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  )
}

// Support Content
interface SupportContentProps {
  onStartConversation: () => void
  onShowForm: () => void
}

function SupportContent({ onStartConversation, onShowForm }: SupportContentProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="bg-[var(--surface-2)] border border-[var(--border-gray)] rounded-lg p-6">
        <h3 className="text-[var(--text-primary)] text-lg font-semibold mb-4">Contact Support</h3>
        <p className="text-[var(--text-secondary)] text-sm mb-4">Need help? Our support team is here for you.</p>
        <div className="flex items-center gap-3">
          <Button
            variant="default"
            size="sm"
            onClick={onStartConversation}
          >
            Start a conversation
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={onShowForm}
          >
            Write a message
          </Button>
        </div>
      </div>

      {/* Support Emails */}
      <div className="bg-[var(--surface-2)] border border-[var(--border-gray)] rounded-lg p-6">
        <h3 className="text-[var(--text-primary)] text-lg font-semibold mb-4">Contact Our Team</h3>
        <p className="text-[var(--text-secondary)] text-sm mb-4">Reach out directly to our team via email:</p>
        <div className="flex flex-col gap-2">
          {SUPPORT_EMAILS.map((email) => (
            <a
              key={email}
              href={`mailto:${email}`}
              className="text-[var(--accent-lime)] text-sm font-medium hover:underline"
            >
              {email}
            </a>
          ))}
        </div>
        <p className="text-[var(--text-secondary)] text-xs mt-4">
          <strong className="text-[var(--text-primary)]">Response Time:</strong> We typically respond within 24 hours on business days
        </p>
      </div>
    </div>
  )
}
