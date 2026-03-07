"use client"
import { useState, useEffect } from "react"
import { useParams, useSearchParams, useRouter } from "next/navigation"
import { 
  Play, Star, Calendar, Info, Loader2, 
  ChevronLeft, PlayCircle, Zap, ShieldCheck
} from "lucide-react"
import { Button } from "@/components/ui/button"
import Navbar from "@/components/Navbar"
import { motion } from "framer-motion"

// --- UPDATED PROVIDER LOGIC WITH ENHANCED PERMISSIONS ---
const PROVIDERS = [
  { 
    id: "vidsrc_cc", 
    label: "Cinanime (Server 1)", 
    useSandbox: false, 
    // Added ?sub_lang=en to help trigger English subtitles
    url: (id: string, s: string, e: string) => 
      `https://vidsrc.cc/v2/embed/tv/${id}/${s}/${e}?sub_lang=en` 
  },
  { 
    id: "vidlink", 
    label: "Customizable (Server 2)", 
    useSandbox: false, 
    url: (id: string, s: string, e: string) => 
      `https://vidlink.pro/tv/${id}/${s}/${e}` 
  },  
  { 
    id: "vidsrc_pro", 
    label: "AnimePro (Server 3)", 
    useSandbox: false, 
    url: (id: string, s: string, e: string) => 
      `https://vidsrc.me/embed/tv/${id}/${s}/${e}` 
  }
];

export default function AnimeFirePage() {
  const { id } = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const isWatching = searchParams.get("watch") === "true"
  const currentEp = searchParams.get("ep") || "1"
  const currentSeason = searchParams.get("season") || "1"
  const [activeProvider, setActiveProvider] = useState(PROVIDERS[0])

  const [anime, setAnime] = useState<any>(null)
  const [episodes, setEpisodes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [epLoading, setEpLoading] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    async function getDetails() {
      if (!id) return;
      try {
        setLoading(true)
        const res = await fetch(`https://api.themoviedb.org/3/tv/${id}?append_to_response=credits`, {
          headers: { 
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_TMDB_TOKEN}`,
            Accept: 'application/json'
          }
        })
        if (!res.ok) throw new Error("Failed to fetch")
        const data = await res.json()
        setAnime(data)
      } catch (err) { 
        setError(true)
      } finally { setLoading(false) }
    }
    getDetails()
  }, [id])

  useEffect(() => {
  async function getAllEpisodes() {
    if (!id || !currentSeason) return;
    setEpLoading(true);
    try {
      // If you want to force One Piece to show everything, 
      // you'd technically need to loop through all season numbers.
      // For now, let's keep it efficient but fix the display.
      const res = await fetch(`https://api.themoviedb.org/3/tv/${id}/season/${currentSeason}`, {
        headers: { 
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_TMDB_TOKEN}`,
          Accept: 'application/json'
        }
      });
      const data = await res.json();
      setEpisodes(data.episodes || []);
    } catch (err) { 
      console.error(err); 
    } finally { 
      setEpLoading(false); 
    }
  }
  getAllEpisodes();
}, [id, currentSeason]);

  if (loading) return (
    <div className="h-screen bg-background flex flex-col items-center justify-center gap-4">
      <Loader2 className="animate-spin text-primary w-12 h-12" />
      <span className="text-[10px] font-black uppercase tracking-[0.5em] text-muted-foreground animate-pulse">Initializing_Node</span>
    </div>
  )

  if (error || !anime) return (
    <div className="h-screen bg-background flex flex-col items-center justify-center gap-4">
      <h2 className="text-primary font-black uppercase">Signal_Lost</h2>
      <Button onClick={() => window.location.reload()}>Re-establish Connection</Button>
    </div>
  )

  return (
    <>
    <div className="min-h-screen bg-background text-foreground transition-colors duration-500 selection:bg-primary selection:text-primary-foreground">
      <Navbar />
      
      <section className="relative w-full min-h-[65vh] flex items-end pt-20">
        {!isWatching ? (
          <>
            <div className="absolute inset-0">
              <img src={`https://image.tmdb.org/t/p/original${anime.backdrop_path}`} className="w-full h-full object-cover opacity-30 grayscale-[0.5]" alt="" />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
            </div>
            <div className="container mx-auto px-6 relative z-10 pb-12">
              <div className="flex flex-col md:flex-row gap-10 items-center md:items-end">
                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="w-52 h-72 shrink-0 rounded-none overflow-hidden border-2 border-primary/20 shadow-2xl hidden md:block">
                  <img src={`https://image.tmdb.org/t/p/w500${anime.poster_path}`} className="w-full h-full object-cover" alt="" />
                </motion.div>
                <div className="flex-1 space-y-6 text-center md:text-left">
                  <div className="flex items-center justify-center md:justify-start gap-4 text-[10px] font-black uppercase text-primary tracking-widest">
                    <div className="flex items-center gap-1 bg-primary/10 px-2 py-1 rounded-sm border border-primary/20">
                      <Star size={14} fill="currentColor" /> {anime.vote_average?.toFixed(1)}
                    </div>
                    <span className="text-muted-foreground">|</span> 
                    <div className="flex items-center gap-1">
                      <Calendar size={14} /> {anime.first_air_date?.split('-')[0]}
                    </div>
                    <span className="text-muted-foreground">|</span> 
                    <div className="bg-secondary px-2 py-1">TV-14</div>
                  </div>
                  <h1 className="text-6xl md:text-9xl font-black italic uppercase tracking-tighter leading-[0.75]">{anime.name}</h1>
                  <div className="pt-6">
                    <Button 
                      onClick={() => router.push(`/animes/${id}?watch=true&season=1&ep=1`)}
                      className="bg-primary text-primary-foreground hover:scale-105 transition-transform rounded-none px-16 h-16 font-black uppercase text-xs tracking-[0.2em]"
                    >
                      <Play size={20} fill="currentColor" className="mr-2" /> Start_Transmission
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="container mx-auto px-6 w-full mb-12 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
                <Button onClick={() => router.push(`/animes/${id}`)} variant="outline" className="text-[10px] font-black uppercase tracking-widest border-primary/20 rounded-none h-10 px-6">
                  <ChevronLeft size={14} className="mr-2" /> Return_To_Archive
                </Button>
                
                <div className="flex items-center gap-2 bg-secondary/50 p-1 border border-border">
                  {PROVIDERS.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setActiveProvider(p)}
                      className={`px-4 py-2 text-[9px] font-black uppercase transition-all ${activeProvider.id === p.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
            </div>

            {/* PLAYER CORE */}
            <div className="relative aspect-video w-full bg-black rounded-none overflow-hidden border-4 border-secondary shadow-[0_0_50px_rgba(0,0,0,0.5)] group">
              <iframe 
                key={`${activeProvider.id}-${currentSeason}-${currentEp}`}
                src={activeProvider.url(id as string, currentSeason, currentEp)}
                className="absolute inset-0 w-full h-full"
                allowFullScreen
                referrerPolicy="no-referrer"
                allow="autoplay; fullscreen"
                // UPDATED SANDBOX: Added allow-modals, allow-popups, and allow-popups-to-escape-sandbox
                // This is required to show the subtitle/CC selection menu.
                sandbox={activeProvider.useSandbox 
                  ? "allow-forms allow-pointer-lock allow-same-origin allow-scripts allow-presentation allow-modals allow-popups allow-popups-to-escape-sandbox" 
                  : undefined
                }
              />
              <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-primary/40 pointer-events-none" />
              <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-primary/40 pointer-events-none" />
            </div>
            
            {/* Warning for un-sandboxed servers */}
            {!activeProvider.useSandbox && (
              <p className="text-[9px] font-mono text-primary/60 mt-2 uppercase tracking-tighter">
                Note: Server bypasses local security protocol. Ad-blocker recommended.
              </p>
            )}
          </div>
        )}
      </section>

      <section className="container mx-auto px-6 py-20 grid grid-cols-1 lg:grid-cols-4 gap-16">
        <div className="lg:col-span-3 space-y-16">
          <div className="space-y-8">
            <div className="flex items-center justify-between border-b border-border pb-6">
              <div className="flex items-center gap-4">
                <div className="h-8 w-1.5 bg-primary" />
                <div>
                  <h2 className="text-2xl font-black uppercase tracking-tighter italic">Sector_Episodes</h2>
                  <p className="text-[9px] text-muted-foreground font-mono">Status: Available_For_Streaming</p>
                </div>
              </div>
              <select 
                className="bg-card border border-border rounded-none text-[10px] font-black uppercase px-6 py-3 outline-none focus:border-primary transition-colors cursor-pointer"
                value={currentSeason}
                onChange={(e) => router.push(`/animes/${id}?watch=${isWatching}&season=${e.target.value}&ep=1`)}
              >
                {anime.seasons
                  ?.filter((s: any) => s.season_number > 0)
                  .map((s: any) => (
                    <option key={s.season_number} value={s.season_number} className="bg-background">
                      {/* This will show "Season 21 (76 Episodes)" */}
                      {s.name} ({s.episode_count} EP)
                    </option>
                  ))}
              </select>
            </div>

            {epLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="animate-spin text-primary" />
                <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Decoding_Node_Signals...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto pr-4 no-scrollbar scroll-smooth">
                {episodes.map((ep) => (
                  <div 
                    key={ep.id}
                    onClick={() => {
                        router.push(`/animes/${id}?watch=true&season=${currentSeason}&ep=${ep.episode_number}`);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className={`flex items-center gap-4 p-4 border transition-all duration-300 cursor-pointer group ${
                      currentEp == ep.episode_number 
                      ? "bg-primary border-primary text-primary-foreground" 
                      : "bg-card border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="relative w-32 h-20 shrink-0 overflow-hidden bg-black border border-white/10">
                      <img src={`https://image.tmdb.org/t/p/w300${ep.still_path || anime.backdrop_path}`} className="w-full h-full object-cover opacity-50 group-hover:scale-110 transition-transform duration-700" alt="" />
                      <div className={`absolute inset-0 flex items-center justify-center ${currentEp == ep.episode_number ? "bg-primary/20" : "bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"}`}>
                        <PlayCircle size={24} className={currentEp == ep.episode_number ? "text-primary-foreground" : "text-white"} />
                      </div>
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <h4 className="text-[12px] font-black uppercase tracking-tight truncate">
                        {ep.episode_number}. {ep.name}
                      </h4>
                      <p className={`text-[10px] font-bold uppercase mt-1 opacity-60`}>
                        {ep.air_date} • {ep.runtime || '24'}m
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6 bg-secondary/20 p-8 border-l-4 border-primary">
            <div className="flex items-center gap-3 text-muted-foreground">
              <Info size={18} />
              <h2 className="text-sm font-black uppercase tracking-widest">Database_Overview</h2>
            </div>
            <p className="text-foreground/80 text-lg leading-relaxed font-medium italic">
              {anime.overview || "No data signal available for this entry."}
            </p>
          </div>
        </div>

        <aside className="space-y-8">
          <div className="p-8 bg-card border border-border space-y-8 shadow-xl">
              <div className="flex items-center gap-3 border-b border-border pb-4">
                <Zap size={18} className="text-primary" />
                <h2 className="text-xs font-black uppercase tracking-[0.2em]">Hardware_Intel</h2>
              </div>
              <div className="space-y-6">
                 <DetailItem label="Signal_Status" value={anime.status} color="text-green-500" />
                 <DetailItem label="Production_Lab" value={anime.production_companies?.[0]?.name || "UNKNOWN"} />
                 <DetailItem label="Relay_Network" value={anime.networks?.[0]?.name || "UNKNOWN"} />
                 <DetailItem label="Season_Count" value={`${anime.number_of_seasons} Units`} />
                 <DetailItem label="Last_Air" value={anime.last_air_date} />
              </div>
          </div>

          <div className="p-6 bg-primary/5 border border-primary/10 rounded-none space-y-4">
            <div className="flex items-center justify-between text-[9px] font-black uppercase text-primary">
              <span>Security_Protocol</span>
              <ShieldCheck size={14} />
            </div>
            <div className="h-1 w-full bg-secondary overflow-hidden">
               <motion.div 
                initial={{ x: "-100%" }} 
                animate={{ x: "100%" }} 
                transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                className="h-full w-1/3 bg-primary" 
               />
            </div>
            <p className="text-[8px] font-mono text-muted-foreground leading-tight">
              ENCRYPTED_STREAMING_ACTIVE: High-speed relay nodes connected.
            </p>
          </div>
        </aside>
      </section>
      
      <div className="fixed inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] z-[500] bg-[length:100%_2px,3px_100%] opacity-20" />
    </div>
    </>
  )
}

function DetailItem({ label, value, color }: { label: string, value: string, color?: string }) {
  return (
    <div className="space-y-1">
      <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{label}</p>
      <p className={`text-xs font-black uppercase italic ${color || "text-foreground"}`}>{value}</p>
    </div>
  )
}