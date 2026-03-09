"use client"

/**
 * movies/[id]/page.tsx
 * Complete file — HLS audio switching + iframe fallback
 *
 * NOTE:
 * - For audio switching to actually work you MUST use a provider that serves a
 *   multi-audio HLS manifest (master .m3u8) with AUDIO entries.
 * - Providers like vidsrc.cc/vidlink.pro usually embed their own player and
 *   WILL NOT allow JS on your page to switch audio tracks inside the iframe.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import Hls from "hls.js"
import {
  ArrowLeft, Play, Server, TerminalSquare, ScanSearch, Volume2, Ghost,
  ChevronDown, Mic2, Waves, Headphones, Info, Users, LayoutGrid, Network, FileCode,
  ActivitySquare, Boxes, ArrowUpRight
} from "lucide-react"
import { Button } from "@/components/ui/button"

// -------------------- Types --------------------
interface MovieData {
  id: number
  title?: string
  name?: string
  poster_path?: string
  backdrop_path?: string
  overview?: string
  vote_average?: number
  release_date?: string
  first_air_date?: string
  tagline?: string
  runtime?: number
  genres?: Array<{ id: number; name: string }>
  status?: string
  translations?: { translations: Translation[] }
  number_of_seasons?: number
}

interface Translation {
  iso_639_1: string
  iso_3166_1?: string
  name: string
  english_name: string
  data?: { title?: string; overview?: string; homepage?: string }
}

type Provider = {
  id: string
  label: string
  host: string
  color?: string
  // optional HLS template - placeholders allowed: {type}, {id}, {s}, {e}, {lang}
  hls?: string
  // optional iframe embed base for fallback
  embedBase?: string
}

// -------------------- Config --------------------
const PROVIDERS: Provider[] = [
  // Example HLS provider (replace with your real HLS manifest host)
  { id: "local-hls", label: "HLS CDN Example", host: "cdn.example.com", color: "#7c3aed", hls: "https://cdn.example.com/{type}/{id}/master.m3u8" },

  // classic embed providers — these will render in an iframe (audio switching rarely works)
  { id: "cc", label: "vidsrc.cc (embed)", host: "vidsrc.cc", color: "#cae962", embedBase: "https://vidsrc.cc/v2/embed" },
  { id: "pro", label: "vidlink.pro (embed)", host: "vidlink.pro", color: "#ef4444", embedBase: "https://vidlink.pro/embed" },
  { id: "to", label: "vidsrc.to (embed)", host: "vidsrc.to", color: "#3b82f6", embedBase: "https://vidsrc.to/v2/embed" },
  { id: "me", label: "vidsrc.me (embed)", host: "vidsrc.me", color: "#f59e0b", embedBase: "https://vidsrc.me/v2/embed" },
]

const SYSTEM_MANIFEST = {
  VERSION: "13.6.5",
  BUILD: "VOID_SHIELD_RESONANCE",
  ENGINE: "Kestrel_v7.8_Audio",
  UI_MODE: "CENTERED_COMPACT",
  LOG_CAP: 300,
  IFRAME_SHIELD: "allow-forms allow-scripts allow-same-origin allow-presentation",
}

// -------------------- Small UI bits --------------------
const SpecItem = ({ label, value, color = "white" }: { label: string; value: string | number; color?: string }) => (
  <div className="bg-white/[0.02] border border-white/5 p-3 rounded-sm transition-all hover:border-white/20 group">
    <span className="block text-[7px] text-zinc-600 uppercase font-black mb-1 tracking-widest group-hover:text-zinc-400 transition-colors">{label}</span>
    <span className="text-[10px] font-mono font-bold" style={{ color }}>{value}</span>
  </div>
)

const SectionHeader = ({ icon: Icon, title }: { icon: any; title: string }) => (
  <div className="flex items-center gap-2 mb-6 text-zinc-500">
    <Icon size={14} className="text-[#cae962]" />
    <span className="text-[9px] font-black uppercase tracking-[0.3em]">{title}</span>
    <div className="h-[1px] flex-grow bg-white/5" />
  </div>
)

// -------------------- HLS PLAYER --------------------
function HLSPlayer({
  manifestUrl,
  selectedLang,
  onTracksDetected,
}: {
  manifestUrl: string
  selectedLang?: string | null
  onTracksDetected?: (langs: string[]) => void
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const hlsRef = useRef<Hls | null>(null)

  // Initialize/destroy player when manifest changes
  useEffect(() => {
    const video = videoRef.current
    if (!video || !manifestUrl) return

    // clean up previous
    hlsRef.current?.destroy()
    hlsRef.current = null

    if (Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true, maxBufferLength: 30 })
      hlsRef.current = hls

      hls.on(Hls.Events.ERROR, (_, data) => {
        // non-intrusive logging; you can extend with onTracksDetected to signal errors
        // console.warn("HLS error:", data)
      })

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        // manifest parsed; user can play
      })

      hls.on(Hls.Events.AUDIO_TRACKS_UPDATED, () => {
        const tracks = hls.audioTracks || []
        // normalize languages like 'en', 'hi', etc.
        const langs = tracks.map(t => (t.lang || t.name || "").slice(0, 2).toLowerCase()).filter(Boolean)
        const uniq = Array.from(new Set(langs))
        onTracksDetected?.(uniq)
        // try auto-select requested language
        if (selectedLang) {
          const want = selectedLang.slice(0, 2).toLowerCase()
          const idx = tracks.findIndex(t => ((t.lang || t.name) || "").slice(0, 2).toLowerCase() === want)
          if (idx >= 0) {
            hls.audioTrack = idx
          }
        }
      })

      // attach
      hls.loadSource(manifestUrl)
      hls.attachMedia(video)
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // native HLS on Safari
      video.src = manifestUrl
    }

    return () => {
      try { hlsRef.current?.destroy() } catch (e) {}
      hlsRef.current = null
    }
  }, [manifestUrl])

  // react to changes in selectedLang (switch audio track)
  useEffect(() => {
    const hls = hlsRef.current
    if (!hls || !selectedLang) return
    const tracks = hls.audioTracks || []
    if (!tracks.length) return
    const want = selectedLang.slice(0, 2).toLowerCase()
    const idx = tracks.findIndex(t => ((t.lang || t.name) || "").slice(0, 2).toLowerCase() === want)
    if (idx >= 0) hls.audioTrack = idx
  }, [selectedLang])

  return <video ref={videoRef} controls className="w-full h-full rounded-sm shadow-[0_0_100px_rgba(202,233,98,0.1)] border border-white/5 bg-black" />
}

// -------------------- Main Page --------------------
export default function ObsidianVoidShield() {
  const { id } = useParams()
  const router = useRouter()

  // states
  const [data, setData] = useState<MovieData | null>(null)
  const [credits, setCredits] = useState<any>(null)
  const [recs, setRecs] = useState<any[]>([])
  const [langs, setLangs] = useState<Translation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isPlaying, setIsPlaying] = useState(false)
  const [activeTab, setActiveTab] = useState<"ENTRY" | "CAST" | "RELATED" | "SYSTEM" | "NETWORK" | "AUDIO">("ENTRY")

  // HUD / controls
  const [providerIndex, setProviderIndex] = useState(0)
  const provider = PROVIDERS[providerIndex]
  const [audio, setAudio] = useState<Translation | null>(null)
  const [menus, setMenus] = useState({ provider: false, audio: false })
  const [tv, setTv] = useState({ s: 1, e: 1 })
  const [logs, setLogs] = useState<string[]>([])
  const [showLogs, setShowLogs] = useState(false)

  // HLS-detected audio languages (lowercase iso codes)
  const [hlsDetectedLangs, setHlsDetectedLangs] = useState<string[] | null>(null)

  // iframe control (to force reload)
  const [iframeKey, setIframeKey] = useState<string>("")

  // small logger
  const addLog = useCallback((msg: string, level: string = "INFO") => {
    const time = new Date().toLocaleTimeString("en-GB", { hour12: false })
    setLogs(prev => [`[${time}] [${level}] ${msg}`, ...prev].slice(0, SYSTEM_MANIFEST.LOG_CAP))
  }, [])

  // -------------------- TMDB fetch --------------------
  const fetchArchive = useCallback(async (loc: string = "en-US") => {
    if (!id) return
    setIsLoading(true)
    addLog(`INITIALIZING_VOID_SYNC: ${id} | LOCALE: ${loc}`, "SYS")
    try {
      const auth = { Authorization: `Bearer ${process.env.NEXT_PUBLIC_TMDB_TOKEN}`, accept: "application/json" }
      let type = "movie"
      let res = await fetch(`https://api.themoviedb.org/3/movie/${id}?language=${loc}&append_to_response=translations`, { headers: auth })
      let movieData = await res.json()

      if (!res.ok || movieData.success === false) {
        type = "tv"
        res = await fetch(`https://api.themoviedb.org/3/tv/${id}?language=${loc}&append_to_response=translations`, { headers: auth })
        movieData = await res.json()
      }

      setData(movieData)
      addLog(`LINK_STABLE: ${movieData.title || movieData.name}`, "INFO")

      const [castRes, recsRes] = await Promise.all([
        fetch(`https://api.themoviedb.org/3/${type}/${id}/credits?language=${loc}`, { headers: auth }),
        fetch(`https://api.themoviedb.org/3/${type}/${id}/recommendations?language=${loc}`, { headers: auth }),
      ])
      const [castData, recsData] = await Promise.all([castRes.json(), recsRes.json()])
      setCredits(castData)
      setRecs(recsData.results?.slice(0, 12) || [])

      if (movieData.translations?.translations) {
        const sorted = movieData.translations.translations.sort((a: Translation, b: Translation) => a.english_name.localeCompare(b.english_name))
        setLangs(sorted)
        if (!audio) {
          const defaultLang = sorted.find(t => t.iso_639_1 === "en") || sorted[0]
          setAudio(defaultLang)
          addLog(`AUDIO_CODEC_LOCK: ${defaultLang?.english_name?.toUpperCase() || "AUTO"}`, "SYS")
        }
      }
    } catch (e: any) {
      addLog(`CRITICAL_LINK_ERROR: ${e?.message || String(e)}`, "ERR")
    } finally {
      setIsLoading(false)
    }
  }, [id, addLog, audio])

  useEffect(() => {
    fetchArchive()
  }, [fetchArchive])

  // -------------------- build stream URLs --------------------
  const buildStreamUrl = useCallback((prov: Provider, selectedLang?: string | null) => {
    if (!prov || !id) return ""
    const isTV = !!(data?.first_air_date)
    const type = isTV ? "tv" : "movie"
    const pathId = String(id)

    if (prov.hls) {
      let url = prov.hls
      url = url.replace(/\{type\}/g, type).replace(/\{id\}/g, pathId).replace(/\{s\}/g, String(tv.s)).replace(/\{e\}/g, String(tv.e))
      if (selectedLang) {
        url = url.replace(/\{lang\}/g, selectedLang)
        if (!/\{lang\}/.test(prov.hls)) {
          const sep = url.includes("?") ? "&" : "?"
          url = `${url}${sep}lang=${selectedLang}`
        }
      } else {
        url = url.replace(/\{lang\}/g, "")
      }
      return url.replace(/([^:]\/)\/+/g, "$1")
    }

    if (prov.embedBase) {
      const base = prov.embedBase
      const baseType = isTV ? "tv" : "movie"
      const path = isTV ? `${pathId}/${tv.s}/${tv.e}` : `${pathId}`
      let url = `${base}/${baseType}/${path}`
      if (selectedLang) {
        const sep = url.includes("?") ? "&" : "?"
        url += `${sep}lang=${selectedLang}`
      }
      return url
    }

    return `https://${prov.host}/v2/embed/${isTV ? `tv/${pathId}/${tv.s}/${tv.e}` : `movie/${pathId}`}${selectedLang ? `?lang=${selectedLang}` : ""}`
  }, [data, id, tv.s, tv.e])

  // computed URLs
  const currentHlsManifest = useMemo(() => (provider.hls ? buildStreamUrl(provider, audio?.iso_639_1 || null) : ""), [provider, audio, buildStreamUrl])
  const currentIframeUrl = useMemo(() => buildStreamUrl(provider, audio?.iso_639_1 || null), [provider, audio, buildStreamUrl])

  // available languages to show (intersection HLS detected vs TMDB translations if HLS available)
  const availableLangs = useMemo(() => {
    if (!langs?.length) return []
    if (hlsDetectedLangs && hlsDetectedLangs.length) {
      return langs.filter(l => hlsDetectedLangs.includes(l.iso_639_1.toLowerCase()))
    }
    // no HLS detection yet or provider non-HLS -> show all TMDB translations (best-effort)
    return langs
  }, [langs, hlsDetectedLangs])

  // -------------------- on HLS tracks discovered --------------------
  const handleHlsTracks = useCallback((tracks: string[]) => {
    setHlsDetectedLangs(tracks.map(t => t.toLowerCase()))
    addLog(`HLS_TRACKS_DETECTED: ${tracks.join(",")}`, "INFO")
  }, [addLog])

  // -------------------- user actions --------------------
  const handleSelectAudio = (t: Translation) => {
    setAudio(t)
    setMenus(m => ({ ...m, audio: false }))
    addLog(`RECONFIGURING_AUDIO: ${t.iso_639_1.toUpperCase()}`, "SYS")
    // update iframe key to force iframe reload for embed providers (best-effort)
    setIframeKey(buildStreamUrl(provider, t.iso_639_1) || String(Date.now()))
    // refresh metadata for selected locale (optional)
    fetchArchive(t.iso_639_1)
  }

  const handleStartPlay = () => {
    addLog("INITIATING_SECURE_TRANSMISSION", "WARN")
    setHlsDetectedLangs(null)
    setIsPlaying(true)
    // ensure iframe reload if embed fallback
    setIframeKey(buildStreamUrl(provider, audio?.iso_639_1) || String(Date.now()))
  }

  const handleTestProvider = () => {
    const url = buildStreamUrl(provider, audio?.iso_639_1 || null)
    if (url) {
      window.open(url, "_blank")
      addLog(`TEST_OPEN: ${provider.label}`, "INFO")
    }
  }

  const handleExternalGateway = () => {
    if (!data) return
    const isTV = !!(data.first_air_date)
    const target = provider.embedBase ? buildStreamUrl(provider, null) : buildStreamUrl(provider, audio?.iso_639_1 || null)
    window.open(target, "_blank")
    addLog("OPEN_EXTERNAL_GATEWAY", "INFO")
  }

  // -------------------- UI render --------------------
  if (isLoading) {
    return (
      <div className="h-screen bg-black flex flex-col items-center justify-center p-10 font-mono">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-24 h-24 border-t-2 border-[#cae962] rounded-full mb-10 shadow-[0_0_50px_-10px_#cae962]" />
        <span className="text-[#cae962] text-[10px] tracking-[1em] uppercase animate-pulse italic">Deploying_Void_Shield_v{SYSTEM_MANIFEST.VERSION}</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#010101] text-zinc-400 selection:bg-[#cae962] selection:text-black font-sans text-[11px] overflow-x-hidden relative">
      {/* backdrop */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.15]">
        <img src={`https://image.tmdb.org/t/p/original${data?.backdrop_path || ""}`} className="w-full h-full object-cover blur-[180px] scale-150" alt="" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#010101] via-transparent to-[#010101]" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
      </div>

      {/* nav */}
      <nav className="fixed top-0 w-full z-[100] border-b border-white/5 bg-black/40 backdrop-blur-3xl px-8 py-6">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-10">
            <button onClick={() => isPlaying ? setIsPlaying(false) : router.back()} className="h-10 px-6 border border-white/10 hover:bg-[#cae962] hover:text-black transition-all flex items-center gap-3 uppercase font-black text-[10px] tracking-[0.2em] italic group">
              <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> {isPlaying ? "TERMINATE" : "EXIT"}
            </button>

            <div className="hidden md:flex flex-col">
              <h2 className="text-white font-black uppercase text-[14px] tracking-tight truncate max-w-[350px] italic">{data?.title || data?.name}</h2>
              <div className="flex items-center gap-3 text-zinc-600 text-[8px] font-mono mt-1">
                <span className="text-[#cae962]">SHIELD_V{SYSTEM_MANIFEST.VERSION}</span>
                <span className="opacity-30">/</span>
                <span className="flex items-center gap-1"><Volume2 size={8} /> {audio?.english_name || "AUTO"}</span>
                <span className="opacity-30">/</span>
                <span className="flex items-center gap-1"><Ghost size={8} /> CLOAKED</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-5">
            <button onClick={() => setShowLogs(!showLogs)} className="h-10 w-10 flex items-center justify-center border border-white/10 hover:bg-white/5 transition-all text-zinc-500 hover:text-[#cae962]">
              <TerminalSquare size={16} />
            </button>
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-[#cae962] animate-ping" />
              <span className="text-[8px] font-black uppercase tracking-widest text-white">Live_Sync</span>
            </div>
          </div>
        </div>
      </nav>

      <AnimatePresence mode="wait">
        {!isPlaying ? (
          <motion.main key="dashboard" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.02 }} className="relative z-10 pt-36 pb-48 px-8">
            <div className="max-w-6xl mx-auto space-y-24">
              {/* primary */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-20 items-start">
                <div className="md:col-span-5 lg:col-span-4 space-y-10">
                  <motion.div layoutId="poster" className="aspect-[2/3] bg-zinc-900 border border-white/5 overflow-hidden group relative shadow-2xl">
                    <img src={`https://image.tmdb.org/t/p/w780${data?.poster_path || ""}`} className="w-full h-full object-cover grayscale-[0.6] group-hover:grayscale-0 transition-all duration-1000 group-hover:scale-105" alt="" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
                    <div className="absolute bottom-5 left-5 right-5">
                      <div className="flex items-center gap-3">
                        <div className="px-3 py-1 bg-[#cae962] text-black text-[9px] font-black uppercase">Archive_Node</div>
                        <div className="px-3 py-1 bg-white/10 backdrop-blur-md text-white text-[9px] font-black uppercase border border-white/20">#{id}</div>
                      </div>
                    </div>
                  </motion.div>

                  <div className="grid grid-cols-2 gap-5">
                    <SpecItem label="User_Index" value={`${(data?.vote_average || 0).toFixed(1)}/10`} color="#cae962" />
                    <SpecItem label="Temporal_Origin" value={data?.release_date?.split("-")[0] || data?.first_air_date?.split("-")[0] || "???"} />
                    <SpecItem label="Lifecycle" value={(data?.status || "N/A").toUpperCase()} />
                    <SpecItem label="Stream_Mass" value={`${data?.runtime || 0}m`} />
                  </div>
                </div>

                <div className="md:col-span-7 lg:col-span-8 space-y-16">
                  <div className="space-y-8">
                    <div className="flex items-center gap-4">
                      <ScanSearch size={14} className="text-[#cae962]" />
                      <span className="text-[9px] font-black bg-white/5 px-4 py-1.5 border border-white/10 uppercase tracking-[0.4em] text-[#cae962]">Encrypted_Node_77</span>
                      <div className="h-[1px] flex-grow bg-white/5" />
                    </div>

                    <h1 className="text-6xl sm:text-8xl lg:text-9xl font-black uppercase tracking-tighter text-white leading-[0.8] italic">{data?.title || data?.name}</h1>
                    <p className="text-[#cae962] text-[12px] md:text-[16px] font-mono uppercase tracking-[0.6em] opacity-50 italic">{data?.tagline || "MANIFEST_TAGLINE_NULL"}</p>
                  </div>

                  {/* COMMAND STRIP */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    <div className="relative group">
                      <span className="text-[8px] font-black text-zinc-600 uppercase mb-4 block tracking-[0.3em] group-hover:text-[#cae962] transition-colors">Uplink_Relay</span>
                      <button onClick={() => setMenus({ audio: false, provider: !menus.provider })} className="h-16 w-full bg-white/[0.02] border border-white/10 px-6 flex justify-between items-center text-[11px] font-black uppercase hover:border-[#cae962]/60 transition-all hover:bg-white/[0.04]">
                        <span className="flex items-center gap-5">
                          <Server size={18} style={{ color: provider.color }} /> {provider.label}
                        </span>
                        <ChevronDown size={16} className={`transition-transform duration-500 ${menus.provider ? "rotate-180" : ""}`} />
                      </button>

                      <AnimatePresence>
                        {menus.provider && (
                          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="absolute top-full left-0 right-0 mt-4 bg-[#0a0a0a] border border-white/10 p-2 z-[120] shadow-3xl backdrop-blur-2xl">
                            {PROVIDERS.map((p, idx) => (
                              <button key={p.id} onClick={() => { setProviderIndex(idx); setMenus({ ...menus, provider: false }); addLog(`SWITCHING_TO_${p.label.toUpperCase()}`, "SYS"); setHlsDetectedLangs(null); setIframeKey("") }} className="w-full p-5 text-left text-[10px] font-black uppercase flex items-center gap-5 hover:bg-[#cae962] hover:text-black transition-all group">
                                <Server size={16} className="group-hover:animate-pulse" /> {p.label} <span className="opacity-40 text-[7px] ml-auto font-mono">{p.host}</span>
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <div className="relative group">
                      <span className="text-[8px] font-black text-zinc-600 uppercase mb-4 block tracking-[0.3em] group-hover:text-[#cae962] transition-colors">Signal_Language</span>
                      <button onClick={() => setMenus({ provider: false, audio: !menus.audio })} className="h-16 w-full bg-white/[0.02] border border-white/10 px-6 flex justify-between items-center text-[11px] font-black uppercase hover:border-[#cae962]/60 transition-all hover:bg-white/[0.04]">
                        <span className="flex items-center gap-5">
                          <Waves size={18} className="text-[#cae962]" /> {audio?.english_name || "DETECTING..."}
                        </span>
                        <ChevronDown size={16} className={`transition-transform duration-500 ${menus.audio ? "rotate-180" : ""}`} />
                      </button>

                      <AnimatePresence>
                        {menus.audio && (
                          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="absolute top-full left-0 right-0 mt-4 bg-[#0a0a0a] border border-white/10 p-2 z-[120] shadow-3xl max-h-80 overflow-y-auto no-scrollbar backdrop-blur-3xl">
                            {availableLangs.map((l, i) => (
                              <button key={`${l.iso_639_1}-${i}`} onClick={() => handleSelectAudio(l)} className={`w-full p-5 text-left text-[10px] font-black uppercase flex items-center gap-5 transition-all ${audio?.iso_639_1 === l.iso_639_1 ? "bg-[#cae962] text-black" : "hover:bg-white/5 hover:text-white"}`}>
                                <Mic2 size={14} /> {l.english_name} <span className="opacity-40 text-[8px] ml-auto font-mono">{l.iso_639_1}</span>
                              </button>
                            ))}
                            {availableLangs.length === 0 && <div className="p-4 text-[10px] text-zinc-500">No audio translations detected for this stream yet.</div>}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-6">
                    <Button onClick={handleStartPlay} className="flex-grow h-24 bg-[#cae962] text-black rounded-none font-black uppercase tracking-[0.6em] text-[15px] hover:bg-white transition-all shadow-[0_25px_50px_-20px_rgba(202,233,98,0.4)] italic group">
                      <Play size={24} fill="currentColor" className="mr-5 group-hover:scale-125 transition-transform" /> Start_Translink
                    </Button>

                    <div className="flex gap-3">
                      <Button onClick={handleTestProvider} variant="outline" className="h-24 px-6 border-white/10 text-white rounded-none font-black uppercase tracking-[0.3em] text-[11px] hover:bg-white/5 hover:border-[#cae962]/50 transition-all">
                        Test Provider
                      </Button>

                      <Button onClick={handleExternalGateway} variant="outline" className="h-24 px-6 border-white/10 text-white rounded-none font-black uppercase tracking-[0.3em] text-[11px] hover:bg-white/5 transition-all">
                        <ArrowUpRight size={18} /> Gateway
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="space-y-16">
                <div className="flex gap-16 border-b border-white/5 pb-6 overflow-x-auto no-scrollbar">
                  {[
                    { id: "ENTRY", icon: Info },
                    { id: "CAST", icon: Users },
                    { id: "AUDIO", icon: Headphones },
                    { id: "RELATED", icon: LayoutGrid },
                    { id: "NETWORK", icon: Network },
                    { id: "SYSTEM", icon: FileCode },
                  ].map(t => (
                    <button key={t.id} onClick={() => setActiveTab(t.id as any)} className={`flex items-center gap-4 text-[12px] font-black uppercase tracking-[0.3em] pb-6 relative transition-all ${activeTab === t.id ? "text-white" : "text-zinc-600 hover:text-zinc-300"}`}>
                      <t.icon size={18} className={activeTab === t.id ? "text-[#cae962]" : ""} /> {t.id}
                      {activeTab === t.id && <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-[4px] bg-[#cae962]" />}
                    </button>
                  ))}
                </div>

                <div className="min-h-[600px]">
                  {activeTab === "ENTRY" && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 lg:grid-cols-3 gap-20">
                      <div className="lg:col-span-2 space-y-12">
                        <SectionHeader icon={ActivitySquare} title="Neural_Data_Stream" />
                        <p className="text-[18px] leading-[1.8] text-zinc-300 italic font-medium max-w-6xl border-l-[4px] border-[#cae962]/40 pl-12 py-4">
                          {data?.overview || "ARCHIVE_DESCRIPTION_MISSING"}
                        </p>
                        <div className="flex flex-wrap gap-4 pt-6">
                          {(data?.genres || []).map(g => <span key={g.id} className="text-[10px] font-black uppercase px-5 py-3 bg-white/5 border border-white/10 text-zinc-500 hover:border-[#cae962]/50 hover:text-white transition-all cursor-crosshair">{g.name}</span>)}
                        </div>
                      </div>

                      <div className="space-y-10 bg-white/[0.01] border border-white/5 p-10 backdrop-blur-md">
                        <div className="space-y-6">
                          {[
                            { l: "Stream_Codec", v: "X265_HEVC_VOID" },
                            { l: "Audio_Profile", v: audio?.iso_639_1?.toUpperCase() || "STEREO" },
                            { l: "Shield_Status", v: "SANDBOX_V2_ACTIVE", c: "#cae962" },
                            { l: "Relay_Hop", v: "DIRECT_LINK_01" },
                            { l: "Buffer_State", v: "PRE_LOADED_8K" },
                          ].map((s, idx) => (
                            <div key={idx} className="flex justify-between border-b border-white/5 pb-4">
                              <span className="text-[10px] uppercase font-black text-zinc-600 tracking-tighter">{s.l}</span>
                              <span className="text-[11px] font-mono font-bold" style={{ color: s.c || "white" }}>{s.v}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === "AUDIO" && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
                      <SectionHeader icon={Headphones} title="Available_Audio_Frequencies" />
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {availableLangs.map((l, i) => (
                          <div key={i} onClick={() => handleSelectAudio(l)} className={`p-8 border transition-all cursor-pointer group relative overflow-hidden ${audio?.iso_639_1 === l.iso_639_1 ? "bg-[#cae962] border-[#cae962] text-black" : "bg-white/5 border-white/10 hover:border-white/30"}`}>
                            <div className="relative z-10 flex flex-col gap-4">
                              <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${audio?.iso_639_1 === l.iso_639_1 ? "text-black/60" : "text-zinc-600"}`}>Frequency_{i + 1}</span>
                              <span className="text-[18px] font-black uppercase italic leading-none">{l.english_name}</span>
                              <div className="flex items-center gap-2 mt-2">
                                <div className={`h-1 flex-grow ${audio?.iso_639_1 === l.iso_639_1 ? "bg-black/20" : "bg-white/5"}`} />
                                <span className="font-mono text-[9px]">{l.iso_639_1.toUpperCase()}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                        {availableLangs.length === 0 && <div className="p-6 text-sm text-zinc-500">No audio translations found for this stream (yet).</div>}
                      </div>

                      {hlsDetectedLangs && (
                        <div className="text-[10px] text-zinc-500 mt-6">Detected HLS audio tracks: {hlsDetectedLangs.join(", ")}</div>
                      )}
                    </motion.div>
                  )}

                  {activeTab === "CAST" && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-10">
                      {(credits?.cast || []).slice(0, 18).map((c: any, i: number) => (
                        <div key={`${c.id}-${i}`} className="space-y-5 group">
                          <div className="aspect-square bg-zinc-900 border border-white/5 overflow-hidden grayscale group-hover:grayscale-0 transition-all duration-1000 relative shadow-2xl">
                            <img src={c.profile_path ? `https://image.tmdb.org/t/p/w185${c.profile_path}` : "https://via.placeholder.com/185"} className="w-full h-full object-cover group-hover:scale-125 transition-all duration-1000" alt="" />
                          </div>
                          <div>
                            <span className="block text-white text-[12px] font-black uppercase truncate italic tracking-tighter">{c.name}</span>
                            <span className="block text-zinc-600 text-[9px] uppercase tracking-widest truncate font-mono mt-2">{c.character}</span>
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </div>
              </div>

              {/* TV sequence */}
              {Boolean(data?.first_air_date) && (
                <div className="border-t border-white/5 pt-24 space-y-12">
                  <SectionHeader icon={Boxes} title="Node_Sequence" />
                  <div className="flex flex-wrap gap-4">
                    {[...Array(data?.number_of_seasons || 1)].map((_, i) => (
                      <button key={i} onClick={() => setTv({ s: i + 1, e: 1 })} className={`px-6 py-3 text-[10px] font-black border transition-all ${tv.s === i + 1 ? "bg-[#cae962] text-black border-[#cae962]" : "bg-white/5 border-white/10 text-zinc-500 hover:text-white"}`}>
                        SEASON_{String(i + 1).padStart(2, "0")}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.main>
        ) : (
          /* PLAYER */
          <motion.div key="player" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center">
            <div className="relative w-full h-full flex items-center justify-center p-4">
              {provider.hls && currentHlsManifest ? (
                <HLSPlayer manifestUrl={currentHlsManifest} selectedLang={audio?.iso_639_1} onTracksDetected={handleHlsTracks} />
              ) : (
                <iframe
                  key={iframeKey || currentIframeUrl}
                  src={currentIframeUrl}
                  className="w-full h-full rounded-sm shadow-[0_0_100px_rgba(202,233,98,0.1)] border border-white/5"
                  allowFullScreen
                  sandbox={SYSTEM_MANIFEST.IFRAME_SHIELD}
                />
              )}

              {/* HUD overlay */}
              <div className="absolute top-10 left-10 right-10 flex justify-between pointer-events-none">
                <div className="bg-black/60 backdrop-blur-md border border-white/10 p-4 flex flex-col gap-2">
                  <span className="text-[10px] font-black text-[#cae962] tracking-widest">ENCRYPTED_STREAM_V3</span>
                  <span className="text-[8px] font-mono text-zinc-500">RELAY: {provider.host}</span>
                </div>
                <div className="bg-black/60 backdrop-blur-md border border-white/10 p-4 flex flex-col gap-2 items-end">
                  <span className="text-[10px] font-black text-white tracking-widest uppercase">{audio?.english_name || "DETECTING"}</span>
                  <span className="text-[8px] font-mono text-zinc-500">CODEC: X265_VOICE</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Logs */}
      <AnimatePresence>
        {showLogs && (
          <motion.div initial={{ x: 400 }} animate={{ x: 0 }} exit={{ x: 400 }} className="fixed top-0 right-0 bottom-0 w-[400px] bg-black/95 border-l border-white/10 z-[300] p-10 font-mono text-[9px] flex flex-col">
            <div className="flex justify-between items-center mb-10 border-b border-white/5 pb-5">
              <span className="text-[#cae962] font-black tracking-widest uppercase flex items-center gap-3"><TerminalSquare size={14} /> System_Log_Node</span>
              <button onClick={() => setShowLogs(false)} className="text-zinc-600 hover:text-white">CLOSE</button>
            </div>
            <div className="flex-grow overflow-y-auto no-scrollbar space-y-2">
              {logs.map((log, i) => (
                <div key={i} className="flex gap-4 group">
                  <span className="text-zinc-800 group-hover:text-zinc-600 transition-colors shrink-0">#{logs.length - i}</span>
                  <span className={log.includes("[ERR]") ? "text-red-500" : log.includes("[WARN]") ? "text-yellow-500" : "text-zinc-500"}>{log}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}