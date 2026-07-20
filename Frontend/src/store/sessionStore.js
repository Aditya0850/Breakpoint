import { create } from 'zustand'

/**
 * Holds the active interview session: setup choices, message history,
 * live streaming buffer, and the current (hidden) mood — mirrors what
 * POST /api/start and the /api/chat SSE stream produce.
 */
export const useSessionStore = create((set, get) => ({
  sessionId: null,
  setup: null,          // { scenario, personality, context, brutal }
  messages: [],         // [{ role: 'user' | 'ai', content: string }]
  currentMood: 5,        // confirmed: 1-10 int (1 = coldest/hostile, 10 = warmest/impressed)
  moodHistory: [],       // [{ turnIndex, mood, fillerAnalysis }] — for the Report mood timeline
  isStreaming: false,
  streamingText: '',

  startSession({ sessionId, setup }) {
    set({ sessionId, setup, messages: [], currentMood: 5, moodHistory: [] })
  },

  addUserMessage(content) {
    set((s) => ({ messages: [...s.messages, { role: 'user', content }] }))
  },

  beginAiStream() {
    set({ isStreaming: true, streamingText: '' })
  },

  appendAiToken(token) {
    set((s) => ({ streamingText: s.streamingText + token }))
  },

  /** Called on the SSE "metadata" frame: { full_text, filler_analysis, new_mood } */
  applyMoodUpdate({ new_mood, filler_analysis }) {
    set((s) => ({
      currentMood: new_mood,
      moodHistory: [
        ...s.moodHistory,
        { turnIndex: s.messages.length, mood: new_mood, fillerAnalysis: filler_analysis },
      ],
    }))
  },

  finishAiStream() {
    const { streamingText, messages } = get()
    set({
      messages: [...messages, { role: 'ai', content: streamingText }],
      isStreaming: false,
      streamingText: '',
    })
  },

  reset() {
    set({
      sessionId: null,
      setup: null,
      messages: [],
      currentMood: 5,
      moodHistory: [],
      isStreaming: false,
      streamingText: '',
    })
  },
}))
