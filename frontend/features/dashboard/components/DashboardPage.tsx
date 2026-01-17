"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { PitchPractice } from "@/components/pitch-practice";
import { UploadModal } from "@/components/upload-modal";
import { ModeSelectionModal } from "@/components/mode-selection-modal";
import { RecordedSession } from "@/components/recorded-session";
import { ResultsPage } from "@/components/results-page";
import { SettingsModal } from "@/components/settings-modal";
import { ChatTranscriptView } from "@/components/chat-transcript-view";
import { useUser } from "@clerk/nextjs";

import { useDashboardState } from "../hooks";
import { DashboardHeader } from "./DashboardHeader";
import { DashboardLanding } from "./DashboardLanding";
import { Loader } from "@/components/ui/loader";

export function DashboardPage() {
    const { state, actions, userData, isLoading, currentSession } =
        useDashboardState();
    const { user } = useUser();

    // Get normalized user ID
    const getUserId = () => {
        if (!user?.id) return '';
        return user.id.startsWith('user_') ? user.id : `user_${user.id}`;
    };

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[var(--bg-dark-grey)]">
                <Loader size="xl" />
            </div>
        );
    }

    // Determine header styling based on active view
    const isLandingView = state.activeView === 'dashboard' && !state.showPractice && !state.showResults;

    // Render content based on activeView
    const renderContent = () => {
        switch (state.activeView) {
            case 'results':
                if (state.resultsData) {
                    return (
                        <ResultsPage
                            transcript={state.resultsData.transcript}
                            analysis={state.resultsData.analysis}
                        />
                    );
                }
                return <DashboardLanding onStartPitching={actions.handleStartPitching} />;

            case 'transcript':
                if (state.selectedSessionForView) {
                    return (
                        <ChatTranscriptView
                            sessionId={state.selectedSessionForView.id}
                            chatHistory={state.selectedSessionForView.chat_history || []}
                            metadata={{
                                title: state.selectedSessionForView.title,
                                mode: state.selectedSessionForView.mode,
                                created_at: state.selectedSessionForView.created_at,
                                completed_at: state.selectedSessionForView.completed_at,
                            }}
                            onBack={actions.handleBackToSessions}
                            userAvatar={userData.avatar}
                        />
                    );
                }
                return <DashboardLanding onStartPitching={actions.handleStartPitching} />;

            case 'practice':
                if (state.selectedMode === "recorded") {
                    return (
                        <RecordedSession
                            uploadedFiles={state.contextFiles}
                            onEndSession={actions.handleEndRecordedSession}
                            onShowResults={actions.handleShowResults}
                            sessionId={currentSession?.id || ""}
                            userId={getUserId()}
                        />
                    );
                }
                return (
                    <PitchPractice
                        uploadedFiles={state.contextFiles}
                        onBack={actions.handleBackToSessions}
                        onDeleteFile={actions.handleDeleteFile}
                        initialSession={currentSession}
                        onComplete={actions.handleSessionComplete}
                    />
                );

            case 'dashboard':
            default:
                return <DashboardLanding onStartPitching={actions.handleStartPitching} />;
        }
    };

    return (
        <SidebarProvider>
            <AppSidebar
                user={userData}
                onNewSession={actions.handleNewSession}
                onSelectSession={actions.handleSelectSession}
            />
            <SidebarInset className="bg-[var(--bg-dark-grey)] relative overflow-hidden">
                <DashboardHeader
                    userData={userData}
                    onSettingsClick={() => actions.setShowSettings(true)}
                    onSignOut={actions.handleSignOut}
                    className={isLandingView ? "absolute top-0 left-0 right-0 z-50 bg-transparent border-transparent" : ""}
                />

                <div className={`flex-1 overflow-y-auto ${isLandingView ? "h-screen p-0" : ""}`}>
                    {renderContent()}
                </div>
            </SidebarInset>

            {/* Upload Modal */}
            {state.showUploadModal && (
                <UploadModal
                    onClose={() => actions.setShowUploadModal(false)}
                    onNext={actions.handleUploadComplete}
                />
            )}

            {/* Mode Selection Modal */}
            {state.showModeSelection && (
                <ModeSelectionModal
                    onClose={() => actions.setShowModeSelection(false)}
                    onContinue={actions.handleModeSelection}
                />
            )}

            {/* Settings Modal */}
            <SettingsModal
                open={state.showSettings}
                onClose={() => actions.setShowSettings(false)}
            />
        </SidebarProvider>
    );
}
