'use client'

/**
 * Gmail-style live preview panel.
 * Shows both the inbox row and the open email view.
 */
export default function EmailInboxPreview({ fromName, fromEmail, replyTo }) {
  const displayName  = fromName  || 'Your Name'
  const displayEmail = fromEmail || 'you@yourdomain.com'
  const initials     = displayName.charAt(0).toUpperCase()

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
      <div className="px-4 py-3.5 border-b border-slate-800">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
          Live Preview
        </p>
      </div>
      <div className="flex flex-col gap-3 p-4 flex-1 overflow-y-auto">

      {/* ── Inbox row ── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Gmail-style top bar */}
        <div className="bg-gray-50 border-b border-gray-200 px-3 py-2 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-400" />
          <div className="w-2 h-2 rounded-full bg-yellow-400" />
          <div className="w-2 h-2 rounded-full bg-green-400" />
          <span className="ml-2 text-[11px] text-gray-400 font-medium">Inbox</span>
        </div>

        {/* Inbox list row */}
        <div className="flex items-center gap-3 px-3 py-2.5 bg-white border-b border-gray-100">
          {/* Avatar */}
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)' }}>
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-semibold text-gray-800 truncate">{displayName}</span>
              <span className="text-[10px] text-gray-400 flex-shrink-0 ml-2">just now</span>
            </div>
            <p className="text-xs text-gray-500 truncate">
              <span className="font-medium text-gray-700">Quick question </span>
              – Hi there, I came across your profile…
            </p>
          </div>
        </div>
      </div>

      {/* ── Open email view ── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Subject header */}
        <div className="px-4 pt-4 pb-3 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-900">Quick question</h3>
        </div>

        {/* Sender row */}
        <div className="flex items-start gap-3 px-4 py-3 border-b border-gray-100">
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)' }}>
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-semibold text-gray-800">{displayName}</span>
              <span className="text-[11px] text-gray-400">just now</span>
            </div>
            <p className="text-[11px] text-gray-500">
              <span className="text-gray-400">from </span>
              <span className="text-blue-600">{displayEmail}</span>
            </p>
            <p className="text-[11px] text-gray-500">
              <span className="text-gray-400">to </span>
              <span className="text-blue-600">john@example.com</span>
            </p>
            {replyTo && (
              <p className="text-[11px] text-gray-500">
                <span className="text-gray-400">reply-to </span>
                <span className="text-blue-600">{replyTo}</span>
              </p>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="px-4 py-4 text-sm text-gray-700 leading-relaxed space-y-3">
          <p>Hi John,</p>
          <p>I came across your profile and wanted to reach out. I think there's a great opportunity for us to work together.</p>
          <p>Would you be open to a quick 15-minute call this week?</p>
          <p>
            Best,<br />
            <span className="font-medium">{displayName}</span>
          </p>
        </div>
      </div>
      </div>
    </div>
  )
}
