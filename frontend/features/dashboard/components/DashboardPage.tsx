"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { PitchPractice } from "@/components/pitch-practice";
import { UploadModal } from "@/components/upload-modal";
import { ModeSelectionModal } from "@/components/mode-selection-modal";
import { RecordedSession } from "@/components/recorded-session";
import { ResultsPage } from "@/components/results-page";
import { SettingsModal } from "@/components/settings-modal";

import { useDashboardState } from "../hooks";
import { DashboardHeader } from "./DashboardHeader";
import { DashboardLanding } from "./DashboardLanding";
import { Loader } from "@/components/ui/loader";

// ...

export function DashboardPage() {
    const { state, actions, userData, isLoading, currentSession } =
        useDashboardState();

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[var(--bg-dark-grey)]">
                <Loader size="xl" />
            </div>
        );
    }

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
                    className={!state.showResults && !state.showPractice ? "absolute top-0 left-0 right-0 z-50 bg-transparent border-transparent" : ""}
                />

                <div className={`flex-1 overflow-y-auto ${!state.showResults && !state.showPractice ? "h-screen p-0" : ""}`}>
                    {state.showResults && state.resultsData ? (
                        <ResultsPage
                            transcript={state.resultsData.transcript}
                            analysis={state.resultsData.analysis}
                        />
                    ) : state.showPractice ? (
                        state.selectedMode === "recorded" ? (
                            <RecordedSession
                                uploadedFiles={state.contextFiles}
                                onEndSession={actions.handleEndRecordedSession}
                                onShowResults={actions.handleShowResults}
                                sessionId={currentSession?.id || ""}
                            />
                        ) : (
                            <PitchPractice
                                uploadedFiles={state.contextFiles}
                                onBack={actions.handleBackToSessions}
                                onDeleteFile={actions.handleDeleteFile}
                                initialSession={currentSession}
                            />
                        )
                    ) : (
                        <DashboardLanding onStartPitching={actions.handleStartPitching} />
                    )}
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
