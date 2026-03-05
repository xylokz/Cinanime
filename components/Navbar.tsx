"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Search, X, MonitorPlay, Film, Shuffle, Menu } from "lucide-react"
import { ThemeToggle } from "./ThemeToggle"
import ProfileTab from "./ProfileTab"
import { auth } from "@/lib/firebase" // <--- ADJUST THIS TO YOUR FIREBASE PATH
import { onAuthStateChanged } from "firebase/auth"

interface NavbarProps {
  searchQuery?: string;
  setSearchQuery?: (val: string) => void;
  onShuffle?: () => void;
}

export default function Navbar({ searchQuery, setSearchQuery, onShuffle }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const pathname = usePathname()

  // 1. AUTH LISTENER: This makes the Navbar "wake up" when you login
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setAuthLoading(false)
    })
    return () => unsubscribe()
  }, [])

  // Auto-close menu on navigation
  useEffect(() => {
    setIsMenuOpen(false)
  }, [pathname])

  // 2. DON'T SHOW ON LOGIN/SIGNUP PAGES
  const isAuthPage = pathname === "/signin" || pathname === "/signup"
  if (isAuthPage || (!user && !authLoading)) return null

  return (
    <>
      {/* 3. CLICK-ANYWHERE BACKDROP */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMenuOpen(false)} // Closes when clicking background
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90] lg:hidden"
          />
        )}
      </AnimatePresence>

      <header className="fixed top-0 w-full z-[100] border-b border-white/5 bg-background/90 backdrop-blur-xl h-20">
        <div className="container mx-auto h-full flex items-center justify-between px-6 gap-4 md:gap-10">
          
          <div className="flex items-center gap-4 md:gap-12 shrink-0">
            <div className="hidden sm:block">
               {/* Pass the actual user state here */}
               <ProfileTab user={user} />
            </div>
            <Link href="/" className="text-xl md:text-2xl font-black italic tracking-tighter text-foreground uppercase">
              Cin<span className="text-[#cae962]">Anime</span>
            </Link>
          </div>

          <nav className="hidden lg:flex items-center gap-8 ml-8 mr-auto">
            {[{ name: "Movies", href: "/" }, { name: "Animes", href: "/animes" }].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`relative flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] transition-all hover:text-[#cae962] ${
                  pathname === link.href ? "text-[#cae962]" : "text-zinc-500"
                }`}
              >
                {pathname === link.href && <motion.div layoutId="nav-dot" className="h-1.5 w-1.5 rounded-full bg-[#cae962] animate-pulse" />}
                {link.name}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex flex-1 justify-center max-w-xl">
            {setSearchQuery && (
              <div className="relative w-full group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-[#cae962]" size={16} />
                <input 
                  type="text"
                  placeholder="DECRYPT VAULT DATA..."
                  value={searchQuery?.toUpperCase() || ""}
                  onChange={(e) => setSearchQuery(e.target.value.toUpperCase())}
                  className="w-full bg-secondary/30 border border-white/5 rounded-full py-3 pl-12 pr-10 text-[10px] font-black uppercase tracking-[0.2em] outline-none"
                />
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 md:gap-6 shrink-0">
            <div className="hidden sm:flex items-center gap-4">
               <ThemeToggle />
               {onShuffle && (
                  <button onClick={onShuffle} className="text-zinc-500 hover:text-[#cae962] active:rotate-180 transition-transform">
                    <Shuffle size={20} />
                  </button>
                )}
            </div>

            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 text-zinc-400 hover:text-[#cae962] z-[110]"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* MOBILE MENU */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-20 left-0 w-full lg:hidden bg-background border-b border-white/5 z-[100] p-6 space-y-6 shadow-2xl"
            >
              {/* Menu Content */}
              <div className="flex flex-col gap-4 text-xs font-black uppercase tracking-[0.3em]">
                 <Link href="/" onClick={() => setIsMenuOpen(false)}>Movies</Link>
                 <Link href="/animes" onClick={() => setIsMenuOpen(false)}>Animes</Link>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <ThemeToggle />
                <ProfileTab user={user} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  )
}