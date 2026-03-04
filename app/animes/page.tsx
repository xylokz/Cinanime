"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { useRouter } from "next/navigation"
import { onAuthStateChanged } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { motion, AnimatePresence, useScroll, useSpring } from "framer-motion"
import { 
  Play, Star, Calendar, Zap, ArrowRight, 
  Cpu, Globe, Database, TrendingUp, 
  Layers, Radio, Info, ChevronRight, Share2,
  ChevronLeft, ShieldCheck, HardDrive, Command,
  Network, Code, Github, Activity, Terminal, 
  Settings, Lock, Unlock, Eye, Download, Flame,
  RefreshCcw, AlertCircle, Filter, MousePointer2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import Navbar from "@/components/Navbar"

/** * ARCHIVE CONFIGURATION 
 */
const ANIME_GENRE_ID = 16;
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/original";
const SYSTEM_VERSION = "2.1.0-STABLE";

/** * ELITE SHONEN DATABASE 
 */
const SHONEN_LEGENDS = [
  37854, 46261, 95057, 85931, 30984, 100088, 
  63926, 60625, 65930, 110316, 215070, 114410
];

type ShonenMetadata = {
  id: number;
  name: string;
  overview?: string;
  popularity: number;
  vote_average: number;
  backdrop_path: string;
  poster_path: string;
  first_air_date: string;
};

export default function ShonenVaultMega() {
  const router = useRouter()
  
  // --- CORE DATA ARCHITECTURE ---
  const [animes, setAnimes] = useState<ShonenMetadata[]>([])
  const [displayList, setDisplayList] = useState<ShonenMetadata[]>([])
  const [trending, setTrending] = useState<ShonenMetadata[]>([])
  const [user, setUser] = useState<any>(null)
  
  // --- CONTROL STATE ---
  const [spotlightIndex, setSpotlightIndex] = useState(0)
  const [page, setPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState("")
  const [isMoviesLoading, setIsMoviesLoading] = useState(false)
  const [isAuthLoading, setIsAuthLoading] = useState(true)
  
  // --- TELEMETRY & LOGIC ---
  const [systemLogs, setSystemLogs] = useState<string[]>([])
  const [cpuLoad, setCpuLoad] = useState(0)
  const [isSystemStable, setIsSystemStable] = useState(true)
  const [networkLatency, setNetworkLatency] = useState("12ms")

  // Scroll Progress Engine
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });

  /** * 1. MEMOIZED SHUFFLE (Fisher-Yates)
   */
  const deepShuffle = useCallback((array: any[]) => {
    let currentIndex = array.length, randomIndex;
    const newArray = [...array];
    while (currentIndex !== 0) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
      [newArray[currentIndex], newArray[randomIndex]] = [newArray[randomIndex], newArray[currentIndex]];
    }
    return newArray;
  }, []);

  /** * 2. ANALYTICS LOGGING SYSTEM
   */
  const pushLog = useCallback((msg: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setSystemLogs(prev => [`[${timestamp}] ${msg}`, ...prev].slice(0, 10));
  }, []);

  /** * 3. HARDWARE EMULATION ENGINE
   */
  useEffect(() => {
    const interval = setInterval(() => {
      setCpuLoad(Math.floor(Math.random() * 15 + 2));
      setNetworkLatency(`${Math.floor(Math.random() * 20 + 5)}ms`);
      setIsSystemStable(Math.random() > 0.05);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  /** * 4. SECURITY PROTOCOL (Content Filtering)
   */
  const filterVaultData = useCallback((results: any[]) => {
    const forbidden = ["hentai", "sexy", "erotic", "nude", "porn", "ecchi", "adult"];
    return results.filter(item => {
      const metadata = ((item.name || "") + (item.overview || "")).toLowerCase();
      return !forbidden.some(word => metadata.includes(word));
    });
  }, []);

  /** * 5. ASYNC DATA FETCH ENGINE
   */
  const fetchSectorData = useCallback(async (targetPage: number) => {
    const url = `https://api.themoviedb.org/3/discover/tv?with_genres=${ANIME_GENRE_ID}&with_original_language=ja&page=${targetPage}&sort_by=popularity.desc`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${process.env.NEXT_PUBLIC_TMDB_TOKEN}` }
    });
    if (!res.ok) throw new Error("API_REJECTED");
    return res.json();
  }, []);

  /** * 6. INITIALIZATION SEQUENCE
   */
  const initializeVault = useCallback(async (targetPage: number, isInitial = false) => {
    setIsMoviesLoading(true);
    pushLog(`Accessing Archive Sector: 0x${targetPage}...`);
    
    try {
      const data = await fetchSectorData(targetPage);
      const safeData = filterVaultData(data.results || []);

      if (isInitial) {
        const randomizedGrid = deepShuffle(safeData);
        setAnimes(randomizedGrid);
        setDisplayList(randomizedGrid);
        
        pushLog("Shuffling High-Tier Shonen...");
        const legendData = await Promise.all(
          deepShuffle(SHONEN_LEGENDS).slice(0, 6).map(async (id) => {
            const lRes = await fetch(`https://api.themoviedb.org/3/tv/${id}`, {
              headers: { Authorization: `Bearer ${process.env.NEXT_PUBLIC_TMDB_TOKEN}` }
            });
            return lRes.json();
          })
        );
        setTrending(legendData);
        pushLog("Handshake Successful. Vault Live.");
      } else {
        setAnimes(prev => [...prev, ...safeData]);
        setDisplayList(prev => [...prev, ...safeData]);
        pushLog(`Node Expansion: +${safeData.length} records.`);
      }
    } catch (err) {
      pushLog("FATAL: DATA RELAY CORRUPTED.");
    } finally {
      setIsMoviesLoading(false);
    }
  }, [fetchSectorData, filterVaultData, deepShuffle, pushLog]);

  /** * 7. AUTHENTICATION HANDSHAKE
   */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.push("/signin");
      } else {
        setUser(currentUser);
        setIsAuthLoading(false);
        pushLog(`Session Verified: ${currentUser.email?.split('@')[0]}`);
      }
    });
    return () => unsubscribe();
  }, [router, pushLog]);

  /** * 8. AUTOMATED ROTATION (7s)
   */
  useEffect(() => {
    if (trending.length === 0 || searchQuery) return;
    const interval = setInterval(() => {
      setSpotlightIndex((prev) => (prev + 1) % trending.length);
      pushLog("Cycling Hero Archive.");
    }, 7000);
    return () => clearInterval(interval);
  }, [trending, searchQuery, pushLog]);

  /** * 9. GLOBAL SEARCH PROTOCOL
   */
  useEffect(() => {
    const handleSearch = async () => {
      if (!searchQuery.trim()) {
        initializeVault(1, true);
        return;
      }
      setIsMoviesLoading(true);
      pushLog(`Querying Relays: ${searchQuery}`);
      try {
        const res = await fetch(
          `https://api.themoviedb.org/3/search/tv?query=${encodeURIComponent(searchQuery)}&include_adult=false`, 
          { headers: { Authorization: `Bearer ${process.env.NEXT_PUBLIC_TMDB_TOKEN}` } }
        );
        const data = await res.json();
        const filtered = filterVaultData(data.results || []);
        setDisplayList(filtered);
        pushLog(`Parsed ${filtered.length} matching nodes.`);
      } catch (err) {
        pushLog("SEARCH_ERROR: RELAY TIMEOUT");
      } finally {
        setIsMoviesLoading(false);
      }
    };

    const timer = setTimeout(handleSearch, 600);
    return () => clearTimeout(timer);
  }, [searchQuery, initializeVault, filterVaultData, pushLog]);

  if (isAuthLoading) return (
    <div className="h-screen bg-black flex flex-col items-center justify-center space-y-6">
      <div className="relative">
        <motion.div 
          animate={{ rotate: 360 }} 
          transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
          className="h-12 w-12 border-2 border-[#cae962]/20 border-t-[#cae962] rounded-full"
        />
        <div className="absolute inset-0 flex items-center justify-center">
           <Zap size={16} className="text-[#cae962] animate-pulse" />
        </div>
      </div>
      <span className="text-[10px] font-black uppercase tracking-[1em] text-[#cae962]">Initializing_StreamX</span>
    </div>
  );

  const hero = trending[spotlightIndex];

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 selection:bg-[#cae962] selection:text-black font-sans antialiased">
      
      {/* KINETIC HUD ELEMENTS */}
      <motion.div className="fixed top-0 left-0 right-0 h-[1px] bg-[#cae962] z-[200] origin-left shadow-[0_0_10px_#cae962]" style={{ scaleX }} />

      <Navbar 
        searchQuery={searchQuery} 
        setSearchQuery={setSearchQuery} 
      />

      {/* --- REFINED HERO CAROUSEL --- */}
      <AnimatePresence mode="wait">
        {!searchQuery && hero && (
          <motion.section 
            key={hero.id}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="relative w-full h-[65vh] flex items-center overflow-hidden border-b border-white/5"
          >
            <div className="absolute inset-0">
              <motion.img 
                initial={{ scale: 1.1 }} animate={{ scale: 1 }} transition={{ duration: 7 }}
                src={`${TMDB_IMAGE_BASE}${hero.backdrop_path}`} 
                className="w-full h-full object-cover opacity-20" alt="" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent" />
            </div>
            
            <div className="container mx-auto px-10 relative z-10 pt-10">
              <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
                
                <div className="flex items-center gap-4 mb-6">
                   <div className="bg-[#cae962] text-black px-3 py-1 font-black text-[9px] uppercase tracking-widest">
                     Legend_Archive
                   </div>
                   <div className="flex gap-1.5">
                      {trending.map((_, i) => (
                        <div key={i} className={`h-1 transition-all duration-700 ${i === spotlightIndex ? "w-8 bg-[#cae962]" : "w-2 bg-white/10"}`} />
                      ))}
                   </div>
                </div>

                <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter uppercase mb-6 leading-none max-w-4xl">
                  {hero.name}
                </h1>

                <div className="flex flex-wrap items-center gap-8 mb-10 text-zinc-500 font-black text-[11px] uppercase tracking-[0.3em]">
                  <span className="flex items-center gap-2 text-[#cae962]">
                    <Star size={16} fill="currentColor" /> {hero.vote_average?.toFixed(1)}
                  </span>
                  <span className="flex items-center gap-2"><Calendar size={16} /> {hero.first_air_date?.split('-')[0]}</span>
                  <span className="px-3 py-1 border border-white/10 bg-white/5 text-[9px]">ID_{hero.id}</span>
                </div>

                <div className="flex gap-4">
                  <Button 
                    onClick={() => router.push(`/animes/${hero.id}`)} 
                    className="bg-[#cae962] text-black hover:bg-white rounded-none h-14 px-12 font-black uppercase text-[11px] tracking-widest transition-all shadow-[0_0_20px_rgba(202,233,98,0.2)]"
                  >
                    <Play fill="currentColor" size={16} className="mr-3" /> Initialize
                  </Button>
                  <Button onClick={() => setSpotlightIndex((prev) => (prev + 1) % trending.length)} variant="outline" className="h-14 w-14 rounded-none border-white/10 hover:bg-white/5">
                     <ChevronRight size={20} />
                  </Button>
                </div>
              </motion.div>
            </div>

            <div className="absolute right-10 bottom-16 hidden xl:block text-right">
               <div className="space-y-1">
                  <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Popularity_Index</p>
                  <p className="text-3xl font-black italic text-[#cae962] uppercase tracking-tighter">{Math.floor(hero.popularity || 0)}</p>
               </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* --- VAULT INTERFACE --- */}
      <main className="container mx-auto px-10 py-20">
        
        <div className="flex flex-col lg:flex-row justify-between gap-10 mb-20 items-end">
          <div className="space-y-6">
             <div className="flex items-center gap-4">
                <div className="h-12 w-1.5 bg-[#cae962]" />
                <h2 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter">
                  {searchQuery ? "Search_Nodes" : "The_Vault"}
                </h2>
             </div>
             <div className="flex flex-wrap gap-8 text-zinc-600 text-[9px] font-black uppercase tracking-[0.4em]">
                <span className="flex items-center gap-2"><Cpu size={14} className="text-[#cae962]" /> CPU: {cpuLoad}%</span>
                <span className="flex items-center gap-2"><Activity size={14} /> Latency: {networkLatency}</span>
                <span className="flex items-center gap-2"><ShieldCheck size={14} /> Status: Secure</span>
             </div>
          </div>

          <div className="hidden lg:block w-72 bg-white/[0.02] border border-white/5 p-4 font-mono">
             <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-2">
                <span className="text-[9px] text-zinc-500 font-black uppercase flex items-center gap-2">
                   <Terminal size={10} /> Live_Logs
                </span>
                <div className="h-1.5 w-1.5 rounded-full bg-[#cae962] animate-pulse" />
             </div>
             <div className="h-20 overflow-hidden space-y-1">
                {systemLogs.slice(0, 5).map((log, i) => (
                  <div key={i} className="text-[8px] text-zinc-500 truncate">{`> ${log}`}</div>
                ))}
             </div>
          </div>
        </div>

        <div className="flex flex-col xl:flex-row gap-16">
          <div className="flex-1">
            <motion.div layout className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
              <AnimatePresence mode="popLayout">
                {displayList.map((anime, i) => (
                  <motion.div 
                    key={anime.id} layout
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: (i % 8) * 0.04 }}
                    onClick={() => router.push(`/animes/${anime.id}`)}
                    className="group cursor-pointer relative"
                  >
                    <div className="relative aspect-[2/3] overflow-hidden bg-zinc-900 border border-white/5 group-hover:border-[#cae962]/40 transition-all duration-500">
                      <img src={`https://image.tmdb.org/t/p/w500${anime.poster_path}`} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700" alt="" />
                      <div className="absolute top-3 right-3 z-20">
                        <div className="bg-black/80 backdrop-blur-md border border-white/10 px-2 py-1 text-[10px] font-black text-[#cae962]">
                          {anime.vote_average?.toFixed(1)}
                        </div>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                        <div className="bg-[#cae962] text-black h-12 w-12 flex items-center justify-center rounded-full shadow-[0_0_30px_#cae962]">
                          <Play size={20} fill="currentColor" />
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 space-y-1">
                       <h3 className="font-black text-[12px] uppercase tracking-wider line-clamp-1 group-hover:text-[#cae962] transition-colors">
                         {anime.name}
                       </h3>
                       <div className="flex items-center justify-between text-zinc-600 text-[9px] font-black uppercase tracking-widest">
                         <span>JPN_{anime.first_air_date?.split('-')[0]}</span>
                         <ArrowRight size={14} className="group-hover:translate-x-2 transition-transform text-[#cae962]" />
                       </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>

            {!searchQuery && (
              <div className="mt-32 flex flex-col items-center">
                <Button 
                  onClick={() => { setPage(p => p + 1); initializeVault(page + 1, false); }} 
                  disabled={isMoviesLoading}
                  className="bg-transparent border border-white/10 text-white hover:bg-[#cae962] hover:text-black rounded-none h-16 px-16 font-black uppercase text-[10px] tracking-[0.5em] transition-all"
                >
                  {isMoviesLoading ? <RefreshCcw className="animate-spin mr-3" /> : "Expand Sector"}
                </Button>
                <span className="mt-8 text-[9px] text-zinc-800 font-black uppercase tracking-[1.5em]">Sector_Node_0{page}</span>
              </div>
            )}
          </div>

          {!searchQuery && (
            <aside className="w-full xl:w-72 space-y-12 shrink-0">
              <div className="sticky top-32 space-y-12">
                <div>
                  <div className="flex items-center gap-3 mb-8 border-b border-white/5 pb-2">
                    <TrendingUp size={16} className="text-[#cae962]" />
                    <h4 className="text-[11px] font-black uppercase tracking-widest">Trending_Nodes</h4>
                  </div>
                  <div className="space-y-6">
                    {trending.slice(0, 5).map((item, idx) => (
                      <div 
                        key={item.id}
                        onClick={() => router.push(`/animes/${item.id}`)}
                        className="group flex gap-4 cursor-pointer items-center"
                      >
                         <span className="text-zinc-800 font-black italic text-2xl group-hover:text-[#cae962] transition-colors">
                           0{idx + 1}
                         </span>
                         <div className="flex-1 truncate">
                            <h5 className="text-[10px] font-black uppercase tracking-wider truncate group-hover:text-white transition-colors">
                              {item.name}
                            </h5>
                            <div className="flex items-center gap-2 text-[8px] text-zinc-600 font-bold uppercase">
                               <Flame size={10} className="text-orange-500" /> POP: {Math.floor(item.popularity)}
                            </div>
                         </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="p-6 bg-white/[0.02] border border-white/5 space-y-4">
                   <div className="flex items-center gap-2 text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                     <Lock size={12} className="text-[#cae962]" /> Encrypted_Relay
                   </div>
                   <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest leading-relaxed">
                     All Shonen metadata is retrieved via secure TLS/SSL nodes. StreamX does not store raw user content.
                   </p>
                </div>
              </div>
            </aside>
          )}
        </div>
      </main>

      <footer className="bg-black border-t border-white/5 pt-32 pb-12 px-10 relative overflow-hidden">
        <div className="container mx-auto relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-20 mb-24">
            <div className="md:col-span-2 space-y-8">
               <h4 className="text-3xl font-black italic uppercase tracking-tighter text-[#cae962]">CINANIME</h4>
               <p className="text-zinc-500 text-[11px] font-bold uppercase tracking-[0.2em] leading-loose max-w-sm">
                 The world's fastest decentralized Shonen archive. Secure nodes. High-fidelity streams. Legendary content.
               </p>
               <div className="flex gap-4">
                 {[Github, Share2, Globe, Radio, Database].map((Icon, idx) => (
                   <div key={idx} className="h-10 w-10 border border-white/5 flex items-center justify-center hover:bg-[#cae962] hover:text-black transition-all cursor-pointer"><Icon size={16} /></div>
                 ))}
               </div>
            </div>
            <div className="space-y-6">
               <h5 className="text-white text-[11px] font-black uppercase tracking-widest">Directory</h5>
               <ul className="space-y-4 text-zinc-600 text-[10px] font-black uppercase tracking-widest">
                 <li className="hover:text-[#cae962] cursor-pointer">Archive_Main</li>
                 <li className="hover:text-[#cae962] cursor-pointer">Seasonal_Relay</li>
                 <li className="hover:text-[#cae962] cursor-pointer">Historical_Vault</li>
               </ul>
            </div>
            <div className="space-y-6">
               <h5 className="text-white text-[11px] font-black uppercase tracking-widest">Legal</h5>
               <ul className="space-y-4 text-zinc-600 text-[10px] font-black uppercase tracking-widest">
                 <li className="hover:text-[#cae962] cursor-pointer">Encryption_Terms</li>
                 <li className="hover:text-[#cae962] cursor-pointer">Privacy_Core</li>
                 <li className="hover:text-[#cae962] cursor-pointer">Node_Policy</li>
               </ul>
            </div>
          </div>
          <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 text-[9px] font-black uppercase tracking-[1em] text-zinc-800">
             <span>STREAMX_ARCHIVE_2026</span>
             <div className="flex gap-10">
                <span className="hover:text-zinc-600 transition-colors">v{SYSTEM_VERSION}</span>
                <span className="hover:text-zinc-600 transition-colors">NODE_W_JP</span>
             </div>
          </div>
        </div>
      </footer>
    </div>
  );
}