;(function () {
  'use strict'

  const script = document.currentScript
  const BOT_ID = script.getAttribute('data-bot-id')
  const BASE_URL = script.src.replace('/widget.js', '')
  const Z = 2147483647

  if (!BOT_ID) {
    console.error('[NexusWidget] Missing data-bot-id="your-bot-id" on the script tag.')
    return
  }

  let isOpen = false
  let btn, container

  function injectStyles() {
    const s = document.createElement('style')
    s.textContent = `
      #__bw_btn {
        position: fixed; bottom: 24px; right: 24px;
        width: 60px; height: 60px; border-radius: 50%;
        border: none; cursor: pointer; z-index: ${Z};
        box-shadow: 0 4px 24px rgba(0,0,0,.25);
        display: flex; align-items: center; justify-content: center;
        transition: transform .2s, box-shadow .2s;
        outline: none;
      }
      #__bw_btn:hover { transform: scale(1.08); box-shadow: 0 6px 32px rgba(0,0,0,.3); }
      #__bw_btn:focus-visible { outline: 3px solid white; outline-offset: 2px; }

      #__bw_wrap {
        position: fixed; bottom: 100px; right: 24px;
        width: 380px; height: 580px;
        z-index: ${Z - 1}; border-radius: 16px; overflow: hidden;
        box-shadow: 0 12px 48px rgba(0,0,0,.22);
        transition: opacity .25s ease, transform .25s ease;
        opacity: 0; transform: translateY(16px) scale(.97); pointer-events: none;
      }
      #__bw_wrap.bw-open { opacity: 1; transform: translateY(0) scale(1); pointer-events: all; }
      #__bw_iframe { width: 100%; height: 100%; border: none; display: block; }

      @media (max-width: 440px) {
        #__bw_wrap { width: calc(100vw - 24px); right: 12px; bottom: 90px; }
      }
    `
    document.head.appendChild(s)
  }

  function chatIcon() {
    return `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white"
      stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>`
  }

  function closeIcon() {
    return `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white"
      stroke-width="2.5" stroke-linecap="round" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>`
  }

  function toggle() {
    isOpen = !isOpen
    container.classList.toggle('bw-open', isOpen)
    btn.innerHTML = isOpen ? closeIcon() : chatIcon()
    btn.setAttribute('aria-expanded', isOpen)
    btn.setAttribute('aria-label', isOpen ? 'Close chat' : 'Open chat')
  }

  function buildWidget(color) {
    injectStyles()

    btn = document.createElement('button')
    btn.id = '__bw_btn'
    btn.style.background = color
    btn.innerHTML = chatIcon()
    btn.setAttribute('aria-label', 'Open chat')
    btn.setAttribute('aria-expanded', 'false')
    btn.addEventListener('click', toggle)
    document.body.appendChild(btn)

    container = document.createElement('div')
    container.id = '__bw_wrap'
    container.setAttribute('role', 'dialog')
    container.setAttribute('aria-label', 'Chat')

    const iframe = document.createElement('iframe')
    iframe.id = '__bw_iframe'
    iframe.src = `${BASE_URL}/embed/${BOT_ID}`
    iframe.setAttribute('allow', 'microphone')
    iframe.setAttribute('title', 'Chat')
    container.appendChild(iframe)
    document.body.appendChild(container)
  }

  fetch(`${BASE_URL}/api/bots/${BOT_ID}/public`)
    .then(r => (r.ok ? r.json() : { color: '#6366f1' }))
    .then(cfg => buildWidget(cfg.color || '#6366f1'))
    .catch(() => buildWidget('#6366f1'))
})()
