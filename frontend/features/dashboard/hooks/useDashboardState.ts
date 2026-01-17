"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { useSessions } from "@/hooks/use-sessions";
import { Session } from "@/lib/api/client";
import { AnalysisData, ContextFile, ResultsData, UserData, DashboardState, DashboardActions } from "../types";
import { API_ENDPOINTS } from "../constants";

interface UseDashboardStateReturn {
    state: DashboardState;
    actions: DashboardActions;
    userData: UserData;
    isLoading: boolean;
    currentSession: Session | null;
}

export function useDashboardState(): UseDashboardStateReturn {
    const { user, isLoaded } = useUser();
    const { signOut } = useClerk();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { createSession, currentSession, setCurrentSession } = useSessions();

    const [mounted, setMounted] = useState(false);
    const [showPractice, setShowPractice] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showModeSelection, setShowModeSelection] = useState(false);
    const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
    const [contextFiles, setContextFiles] = useState<ContextFile[]>([]);
    const [selectedMode, setSelectedMode] = useState<"live" | "recorded" | null>(null);
    const [showResults, setShowResults] = useState(false);
    const [resultsData, setResultsData] = useState<ResultsData | null>(null);
    const [showSettings, setShowSettings] = useState(false);

    useEffect(() => {
        setMounted(true);

        const newSession = searchParams?.get("newSession");
        if (newSession === "true") {
            router.replace("/dashboard");
            setShowUploadModal(true);
        }
    }, [searchParams, router]);

    const userData: UserData = {
        name: user?.fullName || "User",
        email: user?.emailAddresses[0]?.emailAddress || "",
        avatar: user?.imageUrl || "",
    };

    const handleDeleteFile = useCallback((index: number) => {
        setContextFiles((prev) => {
            const newFiles = [...prev];
            if (newFiles[index]?.local_url) {
                URL.revokeObjectURL(newFiles[index].local_url);
            }
            newFiles.splice(index, 1);
            return newFiles;
        });
    }, []);

    const handleNewSession = useCallback(() => {
        setCurrentSession(null);
        setShowUploadModal(true);
    }, [setCurrentSession]);

    const handleSelectSession = useCallback(
        (session: Session) => {
            setCurrentSession(session);
            setShowPractice(true);
        },
        [setCurrentSession]
    );

    const handleBackToSessions = useCallback(() => {
        setCurrentSession(null);
        setShowPractice(false);
    }, [setCurrentSession]);

    const handleSignOut = useCallback(async () => {
        await signOut();
        router.push("/");
    }, [signOut, router]);

    const handleStartPitching = useCallback(() => {
        setShowUploadModal(true);
    }, []);

    const handleUploadComplete = useCallback(async (files: File[]) => {
        setUploadedFiles(files);
        setShowUploadModal(false);

        if (!files || files.length === 0) {
            setShowModeSelection(true);
            return;
        }

        setShowModeSelection(true);
    }, []);

    const handleModeSelection = useCallback(
        async (mode: "live" | "recorded") => {
            setSelectedMode(mode);
            setShowModeSelection(false);

            const sessionTitle = `${mode === "live" ? "Live" : "Recorded"} Session - ${new Date().toLocaleString()}`;

            try {
                const newSession = await createSession(sessionTitle, mode);

                if (!newSession) {
                    throw new Error("Failed to create session");
                }

                const uploadedFileData: ContextFile[] = [];

                for (let i = 0; i < uploadedFiles.length; i++) {
                    const file = uploadedFiles[i];
                    const formData = new FormData();
                    formData.append("file", file);
                    formData.append("session_id", newSession.id);
                    formData.append("file_index", i.toString());

                    const response = await fetch(API_ENDPOINTS.documentUpload, {
                        method: "POST",
                        body: formData,
                    });

                    if (!response.ok) {
                        throw new Error(`Failed to upload ${file.name}`);
                    }

                    const data = await response.json();

                    if (data.success) {
                        uploadedFileData.push({
                            filename: data.data.filename,
                            file_id: data.data.file_id,
                            file_index: data.data.file_index,
                            text_length: data.data.text_length,
                            local_url: URL.createObjectURL(file),
                            file: file,
                        });
                    }
                }

                setContextFiles(uploadedFileData);
                setShowPractice(true);
            } catch (error) {
                console.error("Error uploading files:", error);
                alert("Failed to upload files. Please try again.");
                setShowModeSelection(true);
            }
        },
        [createSession, uploadedFiles]
    );

    const handleEndRecordedSession = useCallback(() => {
        setShowPractice(false);
        setSelectedMode(null);
        setContextFiles([]);
        setUploadedFiles([]);
        setShowResults(false);
        setResultsData(null);
    }, []);

    const handleShowResults = useCallback(
        (audioBlob: Blob, transcript: string, analysis: AnalysisData) => {
            setResultsData({
                audioBlob,
                transcript,
                analysis,
            });
            setShowResults(true);
        },
        []
    );

    const state: DashboardState = {
        mounted,
        showPractice,
        showUploadModal,
        showModeSelection,
        uploadedFiles,
        contextFiles,
        selectedMode,
        showResults,
        resultsData,
        showSettings,
    };

    const actions: DashboardActions = {
        handleDeleteFile,
        handleNewSession,
        handleSelectSession,
        handleBackToSessions,
        handleSignOut,
        handleStartPitching,
        handleUploadComplete,
        handleModeSelection,
        handleEndRecordedSession,
        handleShowResults,
        setShowUploadModal,
        setShowModeSelection,
        setShowSettings,
    };

    return {
        state,
        actions,
        userData,
        isLoading: !mounted || !isLoaded,
        currentSession,
    };
}
