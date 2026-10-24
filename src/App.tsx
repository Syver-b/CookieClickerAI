import { useEffect, useRef, useState } from 'react'
import { ArrowUpRight, Cookie, Flame, Hand, RotateCcw, Sparkles, Wheat } from 'lucide-react'

type BuildingId = 'cursor' | 'grandma' | 'farm' | 'bakery'
type Building = { id: BuildingId; name: string; description: string; icon: string; baseCost: number; cps: number }
type SaveData = { cookies: number; lifetime: number; clicks: number; clickPower: number; buildings: Record<BuildingId, number>; lastSaved: number }

const SAVE_KEY = 'cookie-club-save'
const buildingList: Building[] = [
  { id: 'cursor', name: 'Helpful cursor', description: 'Clicks for you, very politely.', icon: '👆', baseCost: 15, cps: 0.1 },
  { id: 'grandma', name: 'Grandma', description: 'Bakes the old-fashioned way.', icon: '👵', baseCost: 100, cps: 1 },
  { id: 'farm', name: 'Cookie garden', description: 'Fresh chocolate-chip harvests.', icon: '🌱', baseCost: 1100, cps: 8 },
  { id: 'bakery', name: 'Little bakery', description: 'The ovens never take a day off.', icon: '🥐', baseCost: 12000, cps: 47 },
]
const emptyBuildings: Record<BuildingId, number> = { cursor: 0, grandma: 0, farm: 0, bakery: 0 }

function loadSave(): SaveData {
  const fallback: SaveData = { cookies: 0, lifetime: 0, clicks: 0, clickPower: 1, buildings: emptyBuildings, lastSaved: Date.now() }
  try {
    const stored = localStorage.getItem(SAVE_KEY)
    if (!stored) return fallback
    const parsed = JSON.parse(stored) as Partial<SaveData>
    const buildings = { ...emptyBuildings, ...parsed.buildings }
    const earnedPerSecond = buildingList.reduce((sum, building) => sum + buildings[building.id] * building.cps, 0)
    const elapsed = Math.max(0, Date.now() - (parsed.lastSaved ?? Date.now())) / 1000
    const offlineCookies = Math.min(earnedPerSecond * elapsed, earnedPerSecond * 60 * 60 * 8)
    return {
      ...fallback,
      ...parsed,
      buildings,
      cookies: Math.max(0, (parsed.cookies ?? 0) + offlineCookies),
      lifetime: Math.max(0, parsed.lifetime ?? 0) + offlineCookies,
      lastSaved: Date.now(),
    }
  } catch {
    return fallback
  }
}

function formatNumber(value: number) {
  if (value < 1000) return value.toLocaleString('en-US', { maximumFractionDigits: value < 10 ? 1 : 0 })
  const units = ['K', 'M', 'B', 'T']
  let scaled = value
  let unitIndex = -1
  while (scaled >= 1000 && unitIndex < units.length - 1) { scaled /= 1000; unitIndex += 1 }
  return `${scaled.toLocaleString('en-US', { maximumFractionDigits: 1 })}${units[unitIndex]}`
}

function costFor(building: Building, amount: number) { return Math.floor(building.baseCost * Math.pow(1.15, amount)) }

function App() {
  const [game, setGame] = useState<SaveData>(loadSave)
  const gameRef = useRef(game)
  gameRef.current = game
  const [tab, setTab] = useState<'bakery' | 'upgrades'>('bakery')
  const [cookieWiggle, setCookieWiggle] = useState(false)
  const cookiesPerSecond = buildingList.reduce((sum, building) => sum + game.buildings[building.id] * building.cps, 0)
  const nextMilestone = [10, 25, 50, 100, 250, 500, 1000].find((milestone) => milestone > game.lifetime) ?? Math.ceil(game.lifetime / 1000) * 1000
  const progress = Math.min((game.lifetime / nextMilestone) * 100, 100)

  useEffect(() => {
    const timer = window.setInterval(() => {
      setGame((current) => {
        const earned = cookiesPerSecond / 10
        return { ...current, cookies: current.cookies + earned, lifetime: current.lifetime + earned }
      })
    }, 100)
    return () => window.clearInterval(timer)
  }, [cookiesPerSecond])

  useEffect(() => {
    const save = () => localStorage.setItem(SAVE_KEY, JSON.stringify({ ...gameRef.current, lastSaved: Date.now() }))
    const timer = window.setInterval(save, 2000)
    window.addEventListener('beforeunload', save)
    return () => { window.clearInterval(timer); window.removeEventListener('beforeunload', save) }
  }, [])

  function bakeCookie() {
    setGame((current) => ({ ...current, cookies: current.cookies + current.clickPower, lifetime: current.lifetime + current.clickPower, clicks: current.clicks + 1 }))
    setCookieWiggle(true)
    window.setTimeout(() => setCookieWiggle(false), 140)
  }

  function buyBuilding(building: Building) {
    const cost = costFor(building, game.buildings[building.id])
    if (game.cookies < cost) return
    setGame((current) => ({ ...current, cookies: current.cookies - cost, buildings: { ...current.buildings, [building.id]: current.buildings[building.id] + 1 } }))
  }

  function buyUpgrade() {
    if (game.cookies < 100 || game.clickPower > 1) return
    setGame((current) => ({ ...current, cookies: current.cookies - 100, clickPower: 2 }))
  }

  function resetGame() {
    if (!window.confirm('Start a fresh bakery? Your saved cookies will be cleared.')) return
    localStorage.removeItem(SAVE_KEY)
    setGame({ cookies: 0, lifetime: 0, clicks: 0, clickPower: 1, buildings: { ...emptyBuildings }, lastSaved: Date.now() })
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#home" aria-label="Cookie Club home"><span className="brand-mark"><Cookie size={23} strokeWidth={2.3} /></span><span>cookie<span className="brand-light">club</span></span></a>
        <div className="topbar-right"><span className="open-status"><i /> OVEN IS ON</span><button className="icon-button reset-button" onClick={resetGame} aria-label="Reset game" title="Reset game"><RotateCcw size={17} /></button></div>
      </header>

      <section className="game-layout" id="home">
        <section className="bakery-floor" aria-label="Your bakery">
          <div className="welcome-row"><div><p className="eyebrow">YOUR LITTLE BAKERY</p><h1>It starts with<br /><span>one good cookie.</span></h1></div><div className="day-stamp"><span>DAY</span><strong>{Math.max(1, Math.floor(game.lifetime / 100) + 1)}</strong></div></div>
          <div className="cookie-stage"><div className="stage-note"><Sparkles size={14} /> FRESH FROM THE OVEN</div><div className="cookie-halo" aria-hidden="true" /><button className={`big-cookie${cookieWiggle ? ' cookie-wiggle' : ''}`} onClick={bakeCookie} aria-label={`Bake a cookie. ${formatNumber(game.cookies)} cookies available.`}><img src="/cookie.svg" alt="" draggable="false" /></button><p className="click-hint"><Hand size={14} /> give it a little tap</p></div>
          <div className="cookie-total"><div className="total-icon"><Cookie size={19} /></div><div className="total-copy"><strong>{formatNumber(game.cookies)}</strong><span>cookies in the jar</span></div><div className="cps-readout"><span><Flame size={14} /> BAKING</span><strong>{formatNumber(cookiesPerSecond)}<small> / sec</small></strong></div></div>
          <div className="progress-block"><div className="progress-label"><span>NEXT BIG BATCH</span><span>{formatNumber(game.lifetime)} / {formatNumber(nextMilestone)}</span></div><div className="progress-track"><span style={{ width: `${progress}%` }} /></div></div>
        </section>

        <aside className="shop-panel" aria-label="Bakery shop">
          <div className="shop-heading"><div><p className="eyebrow">THE GOOD STUFF</p><h2>Make more.</h2></div><span className="shop-cookie"><Wheat size={19} /></span></div>
          <div className="shop-tabs" role="tablist" aria-label="Shop category"><button role="tab" aria-selected={tab === 'bakery'} className={tab === 'bakery' ? 'active' : ''} onClick={() => setTab('bakery')}>Bakery</button><button role="tab" aria-selected={tab === 'upgrades'} className={tab === 'upgrades' ? 'active' : ''} onClick={() => setTab('upgrades')}>Upgrades <span className="upgrade-dot" /></button></div>
          {tab === 'bakery' ? <div className="shop-list">{buildingList.map((building, index) => {
            const cost = costFor(building, game.buildings[building.id])
            const canAfford = game.cookies >= cost
            return <button key={building.id} className={`shop-item${canAfford ? ' can-afford' : ''}`} onClick={() => buyBuilding(building)} disabled={!canAfford}><span className={`building-art art-${index}`}>{building.icon}</span><span className="building-info"><strong>{building.name}</strong><small>{building.description}</small><span className="building-rate">+{formatNumber(building.cps)} cookies / sec</span></span><span className="building-buy"><strong>{formatNumber(cost)}</strong><small>cookies</small><span className="owned-count">{game.buildings[building.id]}</span></span></button>
          })}</div> : <div className="upgrade-list"><article className={`upgrade-card${game.clickPower > 1 ? ' purchased' : ''}`}><div className="upgrade-card-top"><span className="upgrade-icon"><Hand size={20} /></span><span className="upgrade-tag">CLICK POWER</span></div><h3>Double-baked fingers</h3><p>Your clicks make twice as many cookies. A little extra wrist.</p><button onClick={buyUpgrade} disabled={game.clickPower > 1 || game.cookies < 100}>{game.clickPower > 1 ? 'Already yours' : <><span>100 cookies</span><ArrowUpRight size={15} /></>}</button></article><p className="coming-soon"><Sparkles size={14} /> More recipes are in the oven.</p></div>}
          <div className="shop-footer"><span>YOUR BAKERY AT A GLANCE</span><div><span>Lifetime cookies</span><strong>{formatNumber(game.lifetime)}</strong></div><div><span>Cookies clicked</span><strong>{formatNumber(game.clicks)}</strong></div><div><span>Click strength</span><strong>+{game.clickPower}</strong></div></div>
        </aside>
      </section>
      <footer className="page-footer"><span>MADE WITH BUTTER &amp; A LITTLE PATIENCE</span><span>COOKIE CLUB <b>·</b> EST. TODAY</span></footer>
    </main>
  )
}

export default App