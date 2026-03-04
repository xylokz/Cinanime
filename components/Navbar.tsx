"use client"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Search, X, MonitorPlay, Film, User, Shuffle } from "lucide-react"
import { ThemeToggle } from "./ThemeToggle"
import ProfileTab from "./ProfileTab"

interface NavbarProps {
  searchQuery?: string;
  setSearchQuery?: (val: string) => void;
  onShuffle?: () => void;
}

export default function Navbar({ searchQuery, setSearchQuery, onShuffle }: NavbarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const isAnimePage = pathname === "/animes"

  const links = [
    { name: "Movies", href: "/", icon: <Film size={14} /> },
    { name: "Animes", href: "/animes", icon: <MonitorPlay size={14} /> },
  ]

  return (
    <header className="fixed top-0 w-full z-[100] border-b border-white/5 bg-background/90 backdrop-blur-xl h-20">
      <div className="container mx-auto h-full flex items-center justify-between px-6 gap-10">
        <ProfileTab user/>
        {/* LOGO & NAVIGATION */}
        <div className="flex items-center gap-12 shrink-0">
          <Link href="/" className="text-2xl font-black italic tracking-tighter text-foreground uppercase">
            Cin<span className="text-[#cae962]">Anime</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {links.map((link) => {
              const isActive = pathname === link.href
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] transition-all hover:text-[#cae962] ${
                    isActive ? "text-[#cae962]" : "text-zinc-500"
                  }`}
                >
                  {isActive && <motion.div layoutId="nav-dot" className="h-1.5 w-1.5 rounded-full bg-[#cae962] animate-pulse" />}
                  {link.name}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* INTEGRATED SEARCH (ONLY SHOWS ON ANIME PAGE OR PASS PROPS) */}
        <div className="flex-1 flex justify-center max-w-xl">
          <AnimatePresence>
            {setSearchQuery && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="relative w-full group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-[#cae962] transition-all" size={16} />
                <input 
                  type="text"
                  placeholder="DECRYPT VAULT DATA..."
                  value={searchQuery?.toUpperCase() || ""}
                  onChange={(e) => setSearchQuery(e.target.value.toUpperCase())}
                  className="w-full bg-secondary/30 border border-white/5 rounded-full py-3 pl-12 pr-10 text-[10px] font-black uppercase tracking-[0.2em] outline-none focus:ring-1 focus:ring-[#cae962]/30 transition-all placeholder:text-zinc-700"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500">
                    <X size={14} />
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ACTIONS */}
        <div className="flex items-center gap-6 shrink-0">
          <ThemeToggle />
          
          {onShuffle && (
            <button onClick={onShuffle} className="text-zinc-500 hover:text-[#cae962] transition-transform active:rotate-180 duration-500">
              <Shuffle size={20} />
            </button>
          )}

        </div>
      </div>
    </header>
  )
}