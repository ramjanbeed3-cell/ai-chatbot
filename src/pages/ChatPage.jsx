import { useState, useRef, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'

function formatTime(d) {
  return new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
function getInitials(name) {
  return name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'U'
}
function makeId() { return Date.now() + Math.random() }

// ✅ REAL Groq AI — paste your key below
const GROQ_API_KEY = 'PASTE_YOUR_GROQ_KEY_HERE'

async function callGroqAI(messages) {
  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful AI assistant like ChatGPT. Answer ANY question clearly and in detail with examples. When a user uploads a file or document, analyze it thoroughly and answer their question about it. Use emojis and formatting to make responses easy to read.'
          },
          ...messages
        ],
        max_tokens: 2048,
        temperature: 0.7
      })
    })
    const data = await res.json()
    if (data.error) return `❌ Error: ${data.error.message}`
    return data.choices?.[0]?.message?.content || 'No response received.'
  } catch(e) {
    return `❌ Network error: ${e.message}`
  }
}

const SUGGESTIONS = [
  '🎯 I have a frontend interview tomorrow',
  '⚛️ Explain React hooks with examples',
  '🤔 Why do we use CSS?',
  '📎 Upload a file and ask me to analyze it',
]

let convCounter = 1

export default function ChatPage() {
  const { user, handleLogout } = useAuth()
  const [conversations, setConversations] = useState([])
  const [activeConvId,  setActiveConvId]  = useState(null)
  const [allMessages,   setAllMessages]   = useState({})
  const [input,         setInput]         = useState('')
  const [sending,       setSending]       = useState(false)
  const [uploadedFile,  setUploadedFile]  = useState(null)
  const messagesEndRef = useRef(null)
  const textareaRef    = useRef(null)
  const fileInputRef   = useRef(null)

  const scrollToBottom = () => setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
  const messages = activeConvId ? (allMessages[activeConvId] || []) : []

  // ✅ File Upload Handler
  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Image files
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (ev) => {
        setUploadedFile({ name: file.name, type: 'image', content: ev.target.result })
      }
      reader.readAsDataURL(file)
      return
    }

    // Text/code/document files
    const reader = new FileReader()
    reader.onload = (ev) => {
      setUploadedFile({ name: file.name, type: 'text', content: ev.target.result })
    }
    reader.readAsText(file)

    // Reset input so same file can be uploaded again
    e.target.value = ''
  }

  const startNewConversation = () => {
    const id = convCounter++
    setConversations(prev => [{ id, title: 'New Conversation', created_at: new Date().toISOString() }, ...prev])
    setActiveConvId(id)
    setUploadedFile(null)
  }

  const handleDeleteConversation = (e, id) => {
    e.stopPropagation()
    setConversations(prev => prev.filter(c => c.id !== id))
    setAllMessages(prev => { const n = {...prev}; delete n[id]; return n })
    if (activeConvId === id) { setActiveConvId(null); setUploadedFile(null) }
  }

  const handleSend = useCallback(async (text) => {
    const msg = (text || input).trim()
    if ((!msg && !uploadedFile) || sending) return

    let convId = activeConvId
    if (!convId) {
      const id = convCounter++
      const title = msg ? msg.slice(0, 55) : `📎 ${uploadedFile?.name}`
      setConversations(prev => [{ id, title, created_at: new Date().toISOString() }, ...prev])
      setActiveConvId(id)
      convId = id
    } else {
      setConversations(prev => prev.map(c =>
        c.id === convId && c.title === 'New Conversation'
          ? { ...c, title: msg ? msg.slice(0, 55) : `📎 ${uploadedFile?.name}` }
          : c
      ))
    }

    // Build display message
    let displayContent = msg
    if (uploadedFile) {
      displayContent = `📎 Uploaded: ${uploadedFile.name}${msg ? `\n\n${msg}` : '\n\nPlease analyze this file.'}`
    }

    const userMsg = { id: makeId(), role: 'user', content: displayContent, created_at: new Date().toISOString() }
    const currentMsgs = allMessages[convId] || []
    setAllMessages(prev => ({ ...prev, [convId]: [...(prev[convId] || []), userMsg] }))

    // Build AI message — include file content
    let aiUserContent = msg || 'Please analyze this file and summarize it.'
    if (uploadedFile && uploadedFile.type === 'text') {
      aiUserContent = `The user uploaded a file named "${uploadedFile.name}". Here is the file content:\n\n${uploadedFile.content.slice(0, 4000)}\n\nUser question: ${msg || 'Please analyze and summarize this file.'}`
    } else if (uploadedFile && uploadedFile.type === 'image') {
      aiUserContent = `The user uploaded an image named "${uploadedFile.name}". ${msg || 'Please describe what you can analyze about this.'}`
    }

    const currentFile = uploadedFile
    setInput('')
    setUploadedFile(null)
    setSending(true)
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
    scrollToBottom()

    // Build history
    const history = [
      ...currentMsgs.map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content
      })),
      { role: 'user', content: aiUserContent }
    ]

    const aiText = await callGroqAI(history)

    const aiMsg = { id: makeId(), role: 'assistant', content: aiText, created_at: new Date().toISOString() }
    setAllMessages(prev => ({ ...prev, [convId]: [...(prev[convId] || []), aiMsg] }))
    setSending(false)
    scrollToBottom()
  }, [input, sending, activeConvId, allMessages, uploadedFile])

  const onKeyDown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }
  const onTextareaChange = (e) => {
    setInput(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
  }

  const activeConv = conversations.find(c => c.id === activeConvId)

  return (
    <div className="chat-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2><span className="ai-dot"></span> AI Assistant</h2>
          <button className="new-chat-btn" onClick={startNewConversation}>+ New chat</button>
        </div>
        <div className="conversations-list">
          {conversations.length === 0 && (
            <p style={{padding:'.75rem',fontSize:'.8rem',color:'var(--text-muted)'}}>No conversations yet!</p>
          )}
          {conversations.map(conv => (
            <div key={conv.id} className={`conv-item ${activeConvId === conv.id ? 'active' : ''}`} onClick={() => setActiveConvId(conv.id)}>
              <span className="conv-title">{conv.title}</span>
              <button className="conv-delete" onClick={(e) => handleDeleteConversation(e, conv.id)}>✕</button>
            </div>
          ))}
        </div>
        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">{getInitials(user?.name)}</div>
            <span className="user-name">{user?.name}</span>
            <button className="logout-btn" onClick={handleLogout} title="Sign out">↩</button>
          </div>
        </div>
      </aside>

      <main className="chat-main">
        <div className="mock-banner">
          ✅ Powered by Groq AI (Llama 3) — Ask ANYTHING + Upload files! · Built by D. Ramjanbee
        </div>
        <div className="chat-header">
          <span style={{fontSize:'1.25rem'}}>🤖</span>
          <div>
            <h3>{activeConv?.title || 'AI Assistant'}</h3>
            <span className="status">{sending ? 'Thinking…' : '● Online'}</span>
          </div>
        </div>

        <div className="chat-messages">
          {!activeConvId || messages.length === 0 ? (
            <div className="empty-state">
              <div className="big-icon">🤖</div>
              <h3>Ask me anything!</h3>
              <p>Real AI — ask any question or upload a file 📎</p>
              <div className="suggestion-chips">
                {SUGGESTIONS.map(s => (
                  <button key={s} className="chip" onClick={() => s.includes('Upload') ? fileInputRef.current?.click() : handleSend(s)}>{s}</button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map(msg => (
                <div key={msg.id} className={`message ${msg.role}`}>
                  <div className="msg-avatar">{msg.role === 'user' ? getInitials(user?.name) : '🤖'}</div>
                  <div>
                    <div className="msg-bubble" style={{whiteSpace:'pre-line'}}>{msg.content}</div>
                    <div className="msg-time">{formatTime(msg.created_at)}</div>
                  </div>
                </div>
              ))}
              {sending && (
                <div className="typing">
                  <div className="msg-avatar" style={{width:30,height:30,borderRadius:'50%',background:'var(--bg-tertiary)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13}}>🤖</div>
                  <div className="typing-bubble">
                    <div className="typing-dot"></div><div className="typing-dot"></div><div className="typing-dot"></div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* ✅ File preview bar */}
        {uploadedFile && (
          <div style={{
            padding:'.6rem 1.5rem',
            background:'var(--bg-tertiary)',
            borderTop:'1px solid var(--border)',
            display:'flex',alignItems:'center',gap:'10px'
          }}>
            <span style={{fontSize:'1.2rem'}}>{uploadedFile.type === 'image' ? '🖼️' : '📄'}</span>
            <span style={{fontSize:'.8125rem',color:'var(--text-secondary)',flex:1}}>
              <strong>{uploadedFile.name}</strong> — ready to send
            </span>
            <button
              onClick={() => setUploadedFile(null)}
              style={{background:'transparent',border:'none',color:'var(--text-muted)',cursor:'pointer',fontSize:'16px'}}
            >✕</button>
          </div>
        )}

        <div className="chat-input-area">
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            style={{display:'none'}}
            onChange={handleFileUpload}
            accept=".txt,.pdf,.js,.jsx,.php,.cs,.sql,.html,.css,.json,.md,.csv,.py,.ts,.tsx,image/*"
          />

          <div className="input-wrapper">
            {/* 📎 Upload button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              title="Upload file or image"
              style={{
                background:'transparent',border:'none',
                color: uploadedFile ? 'var(--accent)' : 'var(--text-muted)',
                cursor:'pointer',fontSize:'20px',padding:'2px 6px',flexShrink:0
              }}
            >📎</button>

            <textarea
              ref={textareaRef}
              className="chat-textarea"
              value={input}
              onChange={onTextareaChange}
              onKeyDown={onKeyDown}
              placeholder={uploadedFile ? `Ask about ${uploadedFile.name}...` : "Ask anything — like ChatGPT! Or click 📎 to upload a file"}
              rows={1}
              disabled={sending}
            />
            <button
              className="send-btn"
              onClick={() => handleSend()}
              disabled={(!input.trim() && !uploadedFile) || sending}
            >
              {sending ? <div className="spinner" style={{width:16,height:16}}></div> : '↑'}
            </button>
          </div>
          <p className="input-hint">📎 Upload any file · Ask anything · Real AI by Groq · Built by D. Ramjanbee</p>
        </div>
      </main>
    </div>
  )
}
