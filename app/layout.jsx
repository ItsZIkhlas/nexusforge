import './globals.css'

export const metadata = {
  title: 'NexusForge — The Ultimate AI Business Platform',
  description: 'Find leads, close deals, send emails, generate content, and automate your business — all in one place. Cancel 6 subscriptions. Get one.',
  icons: {
    icon: '/logo.svg',
    shortcut: '/logo.svg',
    apple: '/logo.svg',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}
