'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Mic, MicOff, X, Loader2, Linkedin, Video, Check } from 'lucide-react'

// ─────────────────────────────────────────────────────────────────────────────
// VoiceToPost — modal that transcribes speech and turns it into a post
// Props: { brand, onClose, onCreated }
// ─────────────────────────────────────────────────────────────────────────────

const PLATFORMS = [
  { id: 'linkedin',  label: 'LinkedIn',  Icon: Linkedin },
  { id: 'tiktok',    label: 'TikTok',    Icon: Video    },
]

export default function VoiceToPost({ brand, onClose, onCreated }) {
  const [isRecording,    setIsRecording]    = useState(false)
  const [finalText,      setFinalText]      = useState('')
  const [interimText,    setInterimText]    = useState('')
  const [statusLabel,    setStatusLabel]    = useState('Tap to speak')
  const [platform,       setPlatform]       = useState('tiktok')
  const [generating,     setGenerating]     = useState(false)
  const [error,          setError]          = useState(null)
  const [done,           setDone]           = useState(false)
  const recognitionRef   = useRef(null)
  const isSupportedRef   = useRef(false)

  // ── Setup speech recognition ──────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) {
      setStatusLabel('Speech recognition not supported in this browser')
      return
    }
    isSupportedRef.current = true

    const recognition = new SR()
    recognition.continuous     = true
    recognition.interimResults = true
    recognition.lang           = 'en-US'

    recognition.onresult = (event) => {
      let final  = ''
      let interim = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          final += transcript + ' '
        } else {
          interim += transcript
        }
      }
      if (final) {
        setFinalText(prev => prev + final)
      }
      setInterimText(interim)
    }

    recognition.onend = () => {
      setIsRecording(false)
      setInterimText('')
      setStatusLabel(prev =>
        prev === 'Transcribing...' ? 'Transcribing...' : 'Tap to speak'
      )
    }

    recognition.onerror = (event) => {
      console.error('[VoiceToPost] speech error', event.error)
      setIsRecording(false)
      setInterimText('')
      if (event.error === 'no-speech') {
        setStatusLabel('No speech detected — tap to try again')
      } else if (event.error === 'not-allowed') {
        setError('Microphone access denied. Please allow microphone permissions.')
        setStatusLabel('Tap to speak')
      } else {
        setStatusLabel(`Error: ${event.error} — tap to retry`)
      }
    }

    recognitionRef.current = recognition
    return () => {
      try { recognition.stop() } catch (_) {}
    }
  }, [])

  // ── Toggle recording ──────────────────────────────────────────────────────
  const toggleRecording = useCallback(() => {
    if (!isSupportedRef.current) return
    const recognition = recognitionRef.current
    if (!recognition) return
    setError(null)

    if (isRecording) {
      recognition.stop()
      setIsRecording(false)
      setStatusLabel('Tap to speak')
    } else {
      try {
        recognition.start()
        setIsRecording(true)
        setStatusLabel('Recording… tap to stop')
      } catch (err) {
        console.error('[VoiceToPost] start error', err)
        setStatusLabel('Tap to speak')
      }
    }
  }, [isRecording])

  // ── Clear transcript ──────────────────────────────────────────────────────
  const clearTranscript = () => {
    setFinalText('')
    setInterimText('')
    setError(null)
    setDone(false)
  }

  // ── Generate post ─────────────────────────────────────────────────────────
  const generatePost = async () => {
    const topic = (finalText + ' ' + interimText).trim()
    if (!topic) return
    setGenerating(true)
    setError(null)

    try {
      const res = await fetch('/api/content/from-topic', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ topic, platform }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed to generate post')
      setDone(true)
      if (onCreated) onCreated(json.post)
    } catch (err) {
      setError(err.message)
    } finally {
      setGenerating(false)
    }
  }

  const hasTranscript = (finalText + interimText).trim().length > 0

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-[#0d1117] border border-slate-800/60 rounded-2xl w-full max-w-md overflow-hidden">

        {/* ── Header ── */}
        <div className="flex items-start justify-between p-5 pb-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-pink-600/20 flex items-center justify-center">
              <Mic className="w-4 h-4 text-pink-400" />
            </div>
            <div>
              <h2 className="text-white font-semibold text-base leading-tight">Voice to Post</h2>
              <p className="text-slate-500 text-xs mt-0.5">Speak your idea — AI turns it into a post</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">

          {/* ── Mic button + status ── */}
          <div className="flex flex-col items-center gap-3 py-2">
            <div className="relative">
              {/* Pulsing ring when recording */}
              {isRecording && (
                <span className="absolute inset-0 rounded-full bg-pink-600/30 animate-ping" />
              )}
              <button
                onClick={toggleRecording}
                disabled={!isSupportedRef.current && statusLabel.includes('not supported')}
                className={[
                  'relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200',
                  isRecording
                    ? 'bg-pink-600/80 text-white shadow-lg shadow-pink-900/40 scale-105'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-300',
                ].join(' ')}
              >
                {isRecording
                  ? <MicOff className="w-7 h-7" />
                  : <Mic className="w-7 h-7" />
                }
              </button>
            </div>
            <span className={[
              'text-sm font-medium',
              isRecording ? 'text-pink-400' : 'text-slate-500',
            ].join(' ')}>
              {statusLabel}
            </span>
          </div>

          {/* ── Transcript display ── */}
          {hasTranscript && (
            <div className="bg-slate-900/60 border border-slate-800/60 rounded-xl p-4 min-h-[80px] max-h-40 overflow-y-auto">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm leading-relaxed flex-1">
                  {finalText && (
                    <span className="text-slate-200">{finalText}</span>
                  )}
                  {interimText && (
                    <span className="text-slate-500 italic">{interimText}</span>
                  )}
                </p>
                <button
                  onClick={clearTranscript}
                  className="text-slate-600 hover:text-slate-400 flex-shrink-0 mt-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {!hasTranscript && (
            <div className="bg-slate-900/40 border border-slate-800/40 rounded-xl p-4 min-h-[80px] flex items-center justify-center">
              <p className="text-slate-600 text-sm italic text-center">
                Your transcript will appear here…
              </p>
            </div>
          )}

          {/* ── Platform selector ── */}
          <div>
            <p className="text-slate-500 text-xs font-medium mb-2 uppercase tracking-wider">Platform</p>
            <div className="flex gap-2">
              {PLATFORMS.map(({ id, label, Icon }) => (
                <button
                  key={id}
                  onClick={() => setPlatform(id)}
                  className={[
                    'flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-150 border',
                    platform === id
                      ? id === 'linkedin'
                        ? 'bg-sky-500/15 text-sky-300 border-sky-500/40'
                        : 'bg-pink-500/15 text-pink-300 border-pink-500/40'
                      : 'bg-slate-800/60 text-slate-500 border-slate-700/60 hover:text-slate-300',
                  ].join(' ')}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Error ── */}
          {error && (
            <div className="bg-red-900/20 border border-red-800/40 rounded-lg px-3.5 py-2.5 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* ── Success state ── */}
          {done && (
            <div className="bg-emerald-900/20 border border-emerald-800/40 rounded-lg px-3.5 py-2.5 flex items-center gap-2 text-emerald-400 text-sm">
              <Check className="w-4 h-4 flex-shrink-0" />
              Post added to drafts!
            </div>
          )}

          {/* ── Generate button ── */}
          <button
            onClick={done ? onClose : generatePost}
            disabled={!hasTranscript || generating}
            className={[
              'w-full py-3 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2',
              done
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                : hasTranscript && !generating
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                  : 'bg-slate-800 text-slate-600 cursor-not-allowed',
            ].join(' ')}
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating…
              </>
            ) : done ? (
              <>
                <Check className="w-4 h-4" />
                Done
              </>
            ) : (
              'Generate Post'
            )}
          </button>

        </div>
      </div>
    </div>
  )
}
