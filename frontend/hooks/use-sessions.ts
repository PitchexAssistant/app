/**
 * Hook for managing pitch practice sessions
 * Inspired by ChatGPT/Gemini session management
 */

import { useState, useEffect, useCallback } from 'react';
import { sessionsAPI, Session } from '@/lib/api/client';
import { useUser } from '@clerk/nextjs';

export function useSessions() {
  const { user } = useUser();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Normalize user ID to always have user_ prefix
  const getUserId = useCallback(() => {
    if (!user?.id) return null;
    return user.id.startsWith('user_') ? user.id : `user_${user.id}`;
  }, [user?.id]);

  /**
   * Load all sessions for the current user
   */
  const loadSessions = useCallback(async () => {
    const userId = getUserId();
    console.log('[useSessions] Loading sessions for user:', userId);
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      const data = await sessionsAPI.list(userId, 50);
      console.log('[useSessions] Loaded sessions:', data.length, 'sessions');
      setSessions(data);
    } catch (err: any) {
      console.error('[useSessions] Failed to load sessions:', err);
      setError(err.message || 'Failed to load sessions');
    } finally {
      setLoading(false);
    }
  }, [getUserId]);

  // Load sessions on mount and when user changes
  useEffect(() => {
    if (getUserId()) {
      loadSessions();
    }
  }, [getUserId, loadSessions]);

  /**
   * Create a new session
   */
  const createSession = useCallback(async (
    title: string,
    mode: string
  ): Promise<Session | null> => {
    const userId = getUserId();
    if (!userId) {
      setError('User not authenticated');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const newSession = await sessionsAPI.create({
        title,
        mode,
        user_id: userId,
      });

      setSessions(prev => [newSession, ...prev]);
      setCurrentSession(newSession);
      return newSession;
    } catch (err: any) {
      console.error('Failed to create session:', err);
      setError(err.message || 'Failed to create session');
      return null;
    } finally {
      setLoading(false);
    }
  }, [getUserId]);

  /**
   * Update an existing session
   */
  const updateSession = useCallback(async (
    sessionId: string,
    updates: {
      title?: string;
      transcript?: string;
      analysis?: any;
      summary?: string;
      duration?: number;
    }
  ): Promise<Session | null> => {
    const userId = getUserId();
    if (!userId) {
      setError('User not authenticated');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const updated = await sessionsAPI.update(sessionId, userId, updates);

      setSessions(prev =>
        prev.map(s => (s.id === sessionId ? updated : s))
      );

      if (currentSession?.id === sessionId) {
        setCurrentSession(updated);
      }

      return updated;
    } catch (err: any) {
      console.error('Failed to update session:', err);
      setError(err.message || 'Failed to update session');
      return null;
    } finally {
      setLoading(false);
    }
  }, [getUserId, currentSession]);

  /**
   * Delete a session
   */
  const deleteSession = useCallback(async (sessionId: string): Promise<boolean> => {
    const userId = getUserId();
    if (!userId) {
      setError('User not authenticated');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      await sessionsAPI.delete(sessionId, userId);

      setSessions(prev => prev.filter(s => s.id !== sessionId));

      if (currentSession?.id === sessionId) {
        setCurrentSession(null);
      }

      return true;
    } catch (err: any) {
      console.error('Failed to delete session:', err);
      setError(err.message || 'Failed to delete session');
      return false;
    } finally {
      setLoading(false);
    }
  }, [getUserId, currentSession]);

  /**
   * Complete a session
   */
  const completeSession = useCallback(async (sessionId: string): Promise<Session | null> => {
    const userId = getUserId();
    if (!userId) {
      setError('User not authenticated');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const completed = await sessionsAPI.complete(sessionId, userId);

      setSessions(prev =>
        prev.map(s => (s.id === sessionId ? completed : s))
      );

      if (currentSession?.id === sessionId) {
        setCurrentSession(completed);
      }

      return completed;
    } catch (err: any) {
      console.error('Failed to complete session:', err);
      setError(err.message || 'Failed to complete session');
      return null;
    } finally {
      setLoading(false);
    }
  }, [getUserId, currentSession]);

  /**
   * Load a specific session
   */
  const loadSession = useCallback(async (sessionId: string): Promise<Session | null> => {
    const userId = getUserId();
    if (!userId) {
      setError('User not authenticated');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const session = await sessionsAPI.get(sessionId, userId);
      setCurrentSession(session);
      return session;
    } catch (err: any) {
      console.error('Failed to load session:', err);
      setError(err.message || 'Failed to load session');
      return null;
    } finally {
      setLoading(false);
    }
  }, [getUserId]);

  /**
   * Clear current session
   */
  const clearCurrentSession = useCallback(() => {
    setCurrentSession(null);
  }, []);

  return {
    sessions,
    currentSession,
    loading,
    error,
    loadSessions,
    createSession,
    updateSession,
    deleteSession,
    completeSession,
    loadSession,
    clearCurrentSession,
    setCurrentSession,
  };
}
