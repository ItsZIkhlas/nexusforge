export default function LegalLayout({ children }) {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-100 px-6 py-4">
        <a href="/" className="text-[15px] font-bold text-gray-900 tracking-tight">NexusForge</a>
      </header>
      <main>{children}</main>
      <footer className="border-t border-gray-100 px-6 py-6 mt-16 text-center">
        <p className="text-xs text-gray-400">
          © {new Date().getFullYear()} NexusForge. All rights reserved. ·{' '}
          <a href="/privacy" className="hover:text-gray-600 underline">Privacy Policy</a> ·{' '}
          <a href="/terms" className="hover:text-gray-600 underline">Terms of Service</a>
        </p>
      </footer>
    </div>
  )
}
