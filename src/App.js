import React, { useState, useEffect, useCallback } from 'react'

const SUPABASE_URL = 'https://tbzjxcdaxmvgjjlukncw.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRiemp4Y2RheG12Z2pqbHVrbmN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1ODE3MjksImV4cCI6MjA5NDE1NzcyOX0.27Jj18oqizAa3Hq24dh5Qxh5imy1ceUJQg-oSLzeA-I'

const H = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'Prefer': 'return=representation',
  'Accept-Profile': 'public',
  'Content-Profile': 'public'
}

async function dbGet(table, query = '') {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, { method: 'GET', headers: H })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

async function dbPost(table, body) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, { method: 'POST', headers: H, body: JSON.stringify(body) })
  if (!res.ok) throw new Error(await res.text())
  const text = await res.text()
  return text ? JSON.parse(text) : []
}

async function dbPatch(table, query, body) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, { method: 'PATCH', headers: H, body: JSON.stringify(body) })
  if (!res.ok) throw new Error(await res.text())
  return true
}

// Configurações da quadra
const OPEN_H = 7, CLOSE_H = 22, SLOT_MIN = 90
const SLOTS = []
for (let m = OPEN_H * 60; m + SLOT_MIN <= CLOSE_H * 60; m += 30) SLOTS.push(m)

const pad = n => String(n).padStart(2, '0')
const minToStr = m => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`
const todayStr = () => new Date().toISOString().slice(0, 10)
const initials = name => name.trim().split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
const addDays = (dateStr, d) => {
  const dt = new Date(dateStr + 'T12:00:00')
  dt.setDate(dt.getDate() + d)
  return dt.toISOString().slice(0, 10)
}
const sanitizeUsername = str => str.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9_]/g, '')

const css = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg: #f5f4f0; --surface: #ffffff; --border: #e2e0d8;
    --text: #1a1916; --muted: #6b6960; --hint: #a09d94;
    --green: #2d6a4f; --green-bg: #d8f3dc;
    --red: #9b2226; --red-bg: #fde8e8;
    --blue: #1d4e89; --blue-bg: #dbeafe;
    --amber: #92400e; --amber-bg: #fef3c7;
    --radius: 10px; --radius-sm: 6px;
  }
  body { font-family: 'DM Sans', sans-serif; background: var(--bg); color: var(--text); min-height: 100vh; }
  .app { max-width: 520px; margin: 0 auto; padding: 1.5rem 1rem 4rem; }
  .logo { text-align: center; margin-bottom: 2rem; }
  .logo h1 { font-size: 22px; font-weight: 600; letter-spacing: -0.5px; }
  .logo p { font-size: 13px; color: var(--muted); margin-top: 2px; }
  .card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 1.25rem; margin-bottom: .75rem; }
  .card-title { font-size: 15px; font-weight: 600; margin-bottom: 1rem; }
  label { font-size: 12px; color: var(--muted); font-weight: 500; display: block; margin-bottom: 4px; text-transform: uppercase; letter-spacing: .4px; }
  input, select { width: 100%; padding: 9px 12px; border: 1px solid var(--border); border-radius: var(--radius-sm); font-family: inherit; font-size: 14px; color: var(--text); background: var(--bg); margin-bottom: .75rem; outline: none; transition: border-color .15s; }
  input:focus, select:focus { border-color: var(--text); }
  input[type=date] { width: auto; }
  .input-hint { font-size: 11px; color: var(--hint); margin-top: -10px; margin-bottom: .75rem; }
  .btn { display: inline-flex; align-items: center; gap: 6px; padding: 9px 16px; border: 1px solid var(--border); border-radius: var(--radius-sm); background: var(--surface); color: var(--text); font-family: inherit; font-size: 13px; font-weight: 500; cursor: pointer; transition: all .15s; white-space: nowrap; }
  .btn:hover { background: var(--bg); }
  .btn:active { transform: scale(.98); }
  .btn:disabled { opacity: .5; cursor: not-allowed; }
  .btn-primary { background: var(--text); color: var(--surface); border-color: var(--text); }
  .btn-primary:hover { opacity: .85; background: var(--text); }
  .btn-danger { background: var(--red-bg); color: var(--red); border-color: transparent; }
  .btn-success { background: var(--green-bg); color: var(--green); border-color: transparent; }
  .btn-full { width: 100%; justify-content: center; }
  .badge { display: inline-flex; align-items: center; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .4px; }
  .badge-free { background: var(--green-bg); color: var(--green); }
  .badge-busy { background: var(--red-bg); color: var(--red); }
  .badge-mine { background: var(--blue-bg); color: var(--blue); }
  .badge-past { background: var(--bg); color: var(--hint); }
  .alert { padding: 10px 14px; border-radius: var(--radius-sm); font-size: 13px; margin-bottom: .75rem; }
  .alert-err { background: var(--red-bg); color: var(--red); }
  .alert-ok { background: var(--green-bg); color: var(--green); }
  .alert-warn { background: var(--amber-bg); color: var(--amber); }
  .nav { display: flex; gap: .375rem; margin-bottom: 1.25rem; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: .375rem; }
  .nav-btn { flex: 1; padding: 7px 4px; border: none; border-radius: var(--radius-sm); background: transparent; font-family: inherit; font-size: 12px; font-weight: 500; color: var(--muted); cursor: pointer; transition: all .15s; }
  .nav-btn.active { background: var(--text); color: var(--surface); }
  .user-bar { display: flex; align-items: center; justify-content: space-between; padding: .75rem 1rem; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); margin-bottom: 1rem; }
  .avatar { width: 34px; height: 34px; border-radius: 50%; background: var(--blue-bg); display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; color: var(--blue); flex-shrink: 0; }
  .slot-row { display: flex; align-items: center; gap: .75rem; padding: 10px 14px; border: 1px solid var(--border); border-radius: var(--radius-sm); margin-bottom: .5rem; background: var(--surface); flex-wrap: wrap; }
  .slot-time { font-size: 15px; font-weight: 600; min-width: 52px; font-family: monospace; }
  .slot-info { flex: 1; font-size: 13px; color: var(--muted); }
  .daterow { display: flex; align-items: center; gap: .5rem; margin-bottom: 1rem; flex-wrap: wrap; }
  .daterow label { margin: 0; }
  .row { display: flex; gap: .5rem; margin-bottom: .75rem; }
  .sep { height: 1px; background: var(--border); margin: 1rem 0; }
  .center { text-align: center; padding: 2rem 0; color: var(--muted); font-size: 13px; }
  .link-btn { background: none; border: none; color: var(--blue); font-family: inherit; font-size: 13px; cursor: pointer; padding: 0; }
  .link-btn:hover { text-decoration: underline; }
  @media (max-width: 480px) { .app { padding: 1rem .75rem 4rem; } }
`

function Alert({ msg, type }) {
  if (!msg) return null
  return <div className={`alert alert-${type}`}>{msg}</div>
}

export default function App() {
  const [screen, setScreen] = useState('login')
  const [tab, setTab] = useState('agenda')
  const [currentUser, setCurrentUser] = useState(null)
  const [users, setUsers] = useState([])
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState({ text: '', type: 'err' })

  // Login
  const [loginUsername, setLoginUsername] = useState('')
  const [loginPin, setLoginPin] = useState('')

  // Cadastro
  const [regName, setRegName] = useState('')
  const [regUsername, setRegUsername] = useState('')
  const [regPhone, setRegPhone] = useState('')
  const [regPin, setRegPin] = useState('')
  const [regPin2, setRegPin2] = useState('')
  const [showReg, setShowReg] = useState(false)

  // Agenda / Agendamento
  const [viewDate, setViewDate] = useState(todayStr())
  const [novoDate, setNovoDate] = useState(todayStr())
  const [novoSlot, setNovoSlot] = useState('')
  const [novoOponent, setNovoOponent] = useState('')

  const showMsg = (text, type = 'err') => {
    setMsg({ text, type })
    setTimeout(() => setMsg({ text: '', type: 'err' }), 4000)
  }

  const loadData = useCallback(async () => {
    try {
      const [u, b] = await Promise.all([
        dbGet('users', 'select=*&order=name.asc'),
        dbGet('bookings', 'select=*&cancelled=eq.false')
      ])
      setUsers(Array.isArray(u) ? u : [])
      setBookings(Array.isArray(b) ? b : [])
    } catch (e) {
      console.error('loadData:', e.message)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  // Auto-preenche username ao digitar nome completo
  useEffect(() => {
    if (regName && !regUsername) {
      setRegUsername(sanitizeUsername(regName))
    }
  }, [regName])

  const getActiveBooking = (userId) => {
    if (!userId) return null
    const now = new Date()
    return bookings.find(bk => {
      if (bk.player1_id !== userId && bk.player2_id !== userId) return false
      const [y, mo, d] = bk.date.split('-').map(Number)
      const endH = Math.floor((bk.slot + SLOT_MIN) / 60)
      const endMn = (bk.slot + SLOT_MIN) % 60
      return new Date(y, mo - 1, d, endH, endMn) > now
    })
  }

  const isSlotAvailable = (dateStr, slotMin) =>
  !bookings.some(bk => bk.date === dateStr && Math.abs(parseInt(bk.slot) - parseInt(slotMin)) < SLOT_MIN)

  const getSlotBooking = (dateStr, slotMin) =>
  bookings.find(bk => bk.date === dateStr && parseInt(bk.slot) === parseInt(slotMin)) || null

  // ── CADASTRO ──────────────────────────────────────────
  const doRegister = async () => {
    if (!regName || !regUsername || !regPhone || !regPin) return showMsg('Preencha todos os campos.')
    if (!/^\d{4}$/.test(regPin)) return showMsg('PIN deve ter exatamente 4 números.')
    if (regPin !== regPin2) return showMsg('PINs não conferem.')
    const phone = regPhone.replace(/\D/g, '')
    if (phone.length < 10) return showMsg('Telefone inválido. Inclua o DDD.')
    const uname = sanitizeUsername(regUsername)
    if (!uname || uname.length < 3) return showMsg('Username deve ter ao menos 3 caracteres (letras e números).')
    const existsUsername = users.find(u => u.username === uname)
    if (existsUsername) return showMsg('Username já em uso. Escolha outro.')
    setLoading(true)
    try {
      await dbPost('users', { name: regName.trim(), username: uname, phone, pin: regPin })
      await loadData()
      showMsg('Cadastrado com sucesso! Faça login.', 'ok')
      setShowReg(false)
      setRegName(''); setRegUsername(''); setRegPhone(''); setRegPin(''); setRegPin2('')
    } catch (e) {
      showMsg('Erro ao cadastrar: ' + e.message)
    }
    setLoading(false)
  }

  // ── LOGIN ──────────────────────────────────────────────
  const doLogin = async () => {
    const uname = sanitizeUsername(loginUsername)
    const user = users.find(u => u.username === uname)
    if (!user) return showMsg('Usuário não encontrado.')
    if (user.pin !== loginPin) return showMsg('PIN incorreto.')
    setCurrentUser(user)
    setScreen('main')
    setTab('agenda')
    setViewDate(todayStr())
    setLoginUsername(''); setLoginPin('')
  }

  const doLogout = () => { setCurrentUser(null); setScreen('login') }

  // ── AGENDAR ────────────────────────────────────────────
  const doBook = async () => {
    if (!novoDate || !novoSlot || !novoOponent) return showMsg('Preencha todos os campos.')
    if (getActiveBooking(currentUser?.id)) return showMsg('Você já tem um jogo agendado.')
    const oponentUser = users.find(u => u.id === novoOponent)
    if (getActiveBooking(novoOponent)) return showMsg(`${oponentUser?.name} já tem jogo agendado.`)
    if (!isSlotAvailable(novoDate, parseInt(novoSlot))) return showMsg('Horário não disponível.')
    setLoading(true)
    try {
      await dbPost('bookings', {
        date: novoDate, slot: parseInt(novoSlot),
        player1_id: currentUser.id, player2_id: novoOponent, cancelled: false
      })
      await loadData()
      showMsg('Agendamento confirmado!', 'ok')
      const waMsg = encodeURIComponent(`Olá ${oponentUser?.name}! ${currentUser.name} te desafiou para um jogo de tênis em ${novoDate} às ${minToStr(parseInt(novoSlot))}. Confirme sua presença! 🎾`)
      setTimeout(() => {
        if (window.confirm(`Notificar ${oponentUser?.name} pelo WhatsApp?`))
          window.open(`https://wa.me/55${oponentUser?.phone}?text=${waMsg}`, '_blank')
      }, 400)
      setNovoSlot(''); setNovoOponent('')
    } catch (e) {
      showMsg('Erro ao agendar: ' + e.message)
    }
    setLoading(false)
  }

  // ── CANCELAR ───────────────────────────────────────────
  const doCancel = async (id) => {
    if (!window.confirm('Cancelar este agendamento?')) return
    setLoading(true)
    try {
      await dbPatch('bookings', `id=eq.${id}`, { cancelled: true })
      await loadData()
    } catch (e) { showMsg('Erro ao cancelar.') }
    setLoading(false)
  }

  // ── EDITAR ─────────────────────────────────────────────
  const doEdit = async (bk) => {
    const newDate = window.prompt('Nova data (AAAA-MM-DD):', bk.date)
    if (!newDate) return
    const timeStr = window.prompt(`Novo horário (ex: 15:00)\nHorários válidos: 07:00 até 21:00 em intervalos de 30min`, minToStr(bk.slot))
    if (!timeStr) return
    const [hh, mm] = timeStr.split(':').map(Number)
    const newSlot = hh * 60 + (mm || 0)
    if (!SLOTS.includes(newSlot)) return window.alert('Horário inválido. Use intervalos de 30 minutos entre 07:00 e 21:00.')
    const conflict = bookings.some(b => b.id !== bk.id && b.date === newDate && Math.abs(b.slot - newSlot) < SLOT_MIN)
    if (conflict) return window.alert('Horário não disponível. Conflito com outro jogo.')
    setLoading(true)
    try {
      await dbPatch('bookings', `id=eq.${bk.id}`, { date: newDate, slot: newSlot })
      await loadData()
      const p2 = users.find(u => u.id === bk.player2_id)
      const waMsg = encodeURIComponent(`Olá ${p2?.name}! ${currentUser.name} alterou o jogo para ${newDate} às ${minToStr(newSlot)}. 🎾`)
      if (window.confirm(`Notificar ${p2?.name} sobre a alteração pelo WhatsApp?`))
        window.open(`https://wa.me/55${p2?.phone}?text=${waMsg}`, '_blank')
    } catch (e) { showMsg('Erro ao alterar.') }
    setLoading(false)
  }

  // ── RENDER SLOTS ───────────────────────────────────────
  const renderSlots = (dateStr, isMain) => {
    const now = new Date()
    return SLOTS.map(slotMin => {
      const [y, mo, d] = dateStr.split('-').map(Number)
      const slotDate = new Date(y, mo - 1, d, Math.floor(slotMin / 60), slotMin % 60)
      const isPast = slotDate < now
      const bk = getSlotBooking(dateStr, slotMin)
      const isMine = isMain && bk && (bk.player1_id === currentUser?.id || bk.player2_id === currentUser?.id)
      const p1 = bk ? users.find(u => u.id === bk.player1_id)?.name : null
      const p2 = bk ? users.find(u => u.id === bk.player2_id)?.name : null
      return (
        <div className="slot-row" key={slotMin}>
          <span className="slot-time">{minToStr(slotMin)}</span>
          <span className="slot-info">{bk ? `${p1} vs ${p2}` : isPast ? '—' : 'Disponível'}</span>
          {bk && isMine && <span className="badge badge-mine">Meu jogo</span>}
          {bk && !isMine && <span className="badge badge-busy">Ocupado</span>}
          {!bk && isPast && <span className="badge badge-past">Passado</span>}
          {!bk && !isPast && <span className="badge badge-free">Livre</span>}
        </div>
      )
    })
  }

  const myBookings = bookings.filter(b => currentUser && (b.player1_id === currentUser.id || b.player2_id === currentUser.id))
  const activeBooking = getActiveBooking(currentUser?.id)
  const availableSlots = SLOTS.filter(s => {
    const now = new Date()
    const [y, mo, d] = novoDate.split('-').map(Number)
    const slotDate = new Date(y, mo - 1, d, Math.floor(s / 60), s % 60)
    return slotDate > now && isSlotAvailable(novoDate, s)
  })
  const availableOpponents = users.filter(u => u.id !== currentUser?.id && !getActiveBooking(u.id))

  // ── RENDER ─────────────────────────────────────────────
  return (
    <>
      <style>{css}</style>
      <div className="app">
        <div className="logo">
          <h1>🎾 Quadra de Tênis</h1>
          <p>Sistema de agendamento</p>
        </div>

        {/* ── TELA LOGIN ── */}
        {screen === 'login' && (
          <div className="card">
            <Alert msg={msg.text} type={msg.type} />
            {!showReg ? (
              <>
                <p className="card-title">Entrar</p>
                <label>Username</label>
                <input
                  value={loginUsername}
                  onChange={e => setLoginUsername(e.target.value)}
                  placeholder="Ex: joaosilva"
                  autoCapitalize="none"
                  onKeyDown={e => e.key === 'Enter' && doLogin()}
                />
                <label>PIN de 4 dígitos</label>
                <input
                  type="password"
                  maxLength={4}
                  value={loginPin}
                  onChange={e => setLoginPin(e.target.value)}
                  placeholder="••••"
                  inputMode="numeric"
                  onKeyDown={e => e.key === 'Enter' && doLogin()}
                />
                <div className="row">
                  <button className="btn btn-primary" style={{ flex: 1 }} onClick={doLogin} disabled={loading}>
                    {loading ? '...' : 'Entrar'}
                  </button>
                  <button className="btn" style={{ flex: 1 }} onClick={() => setShowReg(true)}>Cadastrar</button>
                </div>
                <p style={{ textAlign: 'center', marginTop: '.75rem', fontSize: 13, color: 'var(--muted)' }}>
                  <button className="link-btn" onClick={() => { setScreen('view'); setViewDate(todayStr()) }}>
                    Ver agenda sem login →
                  </button>
                </p>
              </>
            ) : (
              <>
                <p className="card-title">Novo cadastro</p>
                <label>Nome completo</label>
                <input
                  value={regName}
                  onChange={e => {
                    setRegName(e.target.value)
                    setRegUsername(sanitizeUsername(e.target.value))
                  }}
                  placeholder="Ex: João Silva"
                />
                <label>Username (para login)</label>
                <input
                  value={regUsername}
                  onChange={e => setRegUsername(sanitizeUsername(e.target.value))}
                  placeholder="Ex: joaosilva"
                  autoCapitalize="none"
                />
                <p className="input-hint">Apenas letras minúsculas e números, sem espaços.</p>
                <label>Telefone WhatsApp (com DDD)</label>
                <input
                  value={regPhone}
                  onChange={e => setRegPhone(e.target.value)}
                  placeholder="11999999999"
                  inputMode="numeric"
                />
                <label>PIN de 4 dígitos</label>
                <input
                  type="password"
                  maxLength={4}
                  value={regPin}
                  onChange={e => setRegPin(e.target.value)}
                  placeholder="••••"
                  inputMode="numeric"
                />
                <label>Confirmar PIN</label>
                <input
                  type="password"
                  maxLength={4}
                  value={regPin2}
                  onChange={e => setRegPin2(e.target.value)}
                  placeholder="••••"
                  inputMode="numeric"
                />
                <div className="row">
                  <button className="btn btn-success" style={{ flex: 1 }} onClick={doRegister} disabled={loading}>
                    {loading ? '...' : 'Cadastrar'}
                  </button>
                  <button className="btn" onClick={() => setShowReg(false)}>Cancelar</button>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── TELA VIEW ONLY ── */}
        {screen === 'view' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '1rem' }}>
              <button className="btn" onClick={() => setScreen('login')}>← Voltar</button>
              <span style={{ fontSize: 13, color: 'var(--muted)' }}>Visualizando sem login</span>
            </div>
            <div className="daterow">
              <label>Data:</label>
              <input type="date" value={viewDate} onChange={e => setViewDate(e.target.value)} />
              <button className="btn" onClick={() => setViewDate(addDays(viewDate, -1))}>‹</button>
              <button className="btn" onClick={() => setViewDate(addDays(viewDate, 1))}>›</button>
            </div>
            {renderSlots(viewDate, false)}
          </>
        )}

        {/* ── TELA PRINCIPAL ── */}
        {screen === 'main' && currentUser && (
          <>
            <div className="user-bar">
              <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                <div className="avatar">{initials(currentUser.name)}</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{currentUser.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                    @{currentUser.username} · {activeBooking ? `Jogo: ${activeBooking.date} ${minToStr(activeBooking.slot)}` : 'Sem jogo agendado'}
                  </div>
                </div>
              </div>
              <button className="btn" onClick={doLogout}>Sair</button>
            </div>

            <nav className="nav">
              {[['agenda', '📅 Agenda'], ['novo', '➕ Marcar jogo'], ['meus', '📋 Meus jogos']].map(([id, label]) => (
                <button key={id} className={`nav-btn ${tab === id ? 'active' : ''}`} onClick={() => setTab(id)}>
                  {label}
                </button>
              ))}
            </nav>

            <Alert msg={msg.text} type={msg.type} />

            {/* TAB AGENDA */}
            {tab === 'agenda' && (
              <>
                <div className="daterow">
                  <label>Data:</label>
                  <input type="date" value={viewDate} onChange={e => setViewDate(e.target.value)} />
                  <button className="btn" onClick={() => setViewDate(addDays(viewDate, -1))}>‹</button>
                  <button className="btn" onClick={() => setViewDate(addDays(viewDate, 1))}>›</button>
                </div>
                {renderSlots(viewDate, true)}
              </>
            )}

            {/* TAB NOVO AGENDAMENTO */}
            {tab === 'novo' && (
              <div className="card">
                <p className="card-title">Novo agendamento</p>
                {activeBooking && (
                  <div className="alert alert-warn">
                    Você já tem um jogo em {activeBooking.date} às {minToStr(activeBooking.slot)}. Novos agendamentos só serão liberados após o término.
                  </div>
                )}
                <label>Data</label>
                <input
                  type="date"
                  value={novoDate}
                  onChange={e => setNovoDate(e.target.value)}
                  disabled={!!activeBooking}
                  min={todayStr()}
                />
                <label>Horário disponível</label>
                <select value={novoSlot} onChange={e => setNovoSlot(e.target.value)} disabled={!!activeBooking}>
                  <option value="">— selecione —</option>
                  {availableSlots.map(s => <option key={s} value={s}>{minToStr(s)}</option>)}
                </select>
                <label>Adversário</label>
                <select value={novoOponent} onChange={e => setNovoOponent(e.target.value)} disabled={!!activeBooking}>
                  <option value="">— selecione —</option>
                  {availableOpponents.map(u => (
                    <option key={u.id} value={u.id}>{u.name} (@{u.username})</option>
                  ))}
                </select>
                <button
                  className="btn btn-primary btn-full"
                  onClick={doBook}
                  disabled={!!activeBooking || loading}
                >
                  {loading ? '...' : '✅ Confirmar agendamento'}
                </button>
              </div>
            )}

            {/* TAB MEUS JOGOS */}
            {tab === 'meus' && (
              <>
                <p style={{ fontSize: 15, fontWeight: 600, marginBottom: '.75rem' }}>Meus agendamentos</p>
                {myBookings.length === 0 && <div className="center">Nenhum jogo agendado.</div>}
                {myBookings
                  .sort((a, b) => a.date.localeCompare(b.date) || a.slot - b.slot)
                  .map(bk => {
                    const now = new Date()
                    const [y, mo, d] = bk.date.split('-').map(Number)
                    const endH = Math.floor((bk.slot + SLOT_MIN) / 60)
                    const endMn = (bk.slot + SLOT_MIN) % 60
                    const isPast = new Date(y, mo - 1, d, endH, endMn) < now
                    const isOwner = bk.player1_id === currentUser.id
                    const p1 = users.find(u => u.id === bk.player1_id)?.name || '?'
                    const p2 = users.find(u => u.id === bk.player2_id)?.name || '?'
                    return (
                      <div className="card" key={bk.id}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '.5rem' }}>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 15 }}>{p1} vs {p2}</div>
                            <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>
                              {bk.date} · {minToStr(bk.slot)} – {minToStr(bk.slot + SLOT_MIN)}
                            </div>
                          </div>
                          <span className={`badge ${isPast ? 'badge-past' : 'badge-mine'}`}>
                            {isPast ? 'Concluído' : 'Confirmado'}
                          </span>
                        </div>
                        {isOwner && !isPast && (
                          <div style={{ display: 'flex', gap: '.5rem', marginTop: '.75rem', flexWrap: 'wrap' }}>
                            <button className="btn" onClick={() => doEdit(bk)} disabled={loading}>✏️ Alterar</button>
                            <button className="btn btn-danger" onClick={() => doCancel(bk.id)} disabled={loading}>🗑 Cancelar</button>
                          </div>
                        )}
                      </div>
                    )
                  })}
              </>
            )}
          </>
        )}
      </div>
    </>
  )
}
