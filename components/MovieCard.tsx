"use client"
import { Button } from "@/components/ui/button"
import { Play, Lock } from "lucide-react"
import Link from "next/link"

interface MovieCardProps {
  movie: any;
  index: number;
  isAnime?: boolean;
}

/**
 * MOVIE CARD COMPONENT - V2 ROUTING
 * -----------------------------------------------------------
 * Architecture Update: Removed modal overlay. 
 * Now redirects to isolated dynamic nodes for better SEO 
 * and independent metadata parsing.
 * -----------------------------------------------------------
 */
export default function MovieCard({ movie, index, isAnime }: MovieCardProps) {
  const displayTitle = movie.title || movie.name;
  
  // THEATER LOCK: Specifically block Infinity Castle IDs or Titles
  const isTheaterExclusive = 
    movie.id === 1311031 || 
    displayTitle.toLowerCase().includes("infinity castle");

  // --- UI RENDER ENGINE ---
  const CardContent = (
    <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 group">
      <img 
        src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`} 
        alt={displayTitle}
        className="object-cover w-full h-full transition-transform group-hover:scale-105"
      />
      
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-4 text-center">
        {isTheaterExclusive ? (
          <div className="flex flex-col items-center gap-2">
            <div className="bg-[#cae962] p-3 rounded-full text-black">
              <Lock size={24} />
            </div>
            <p className="text-[#cae962] font-black text-[10px] uppercase tracking-tighter">Theater Exclusive</p>
            <p className="text-white/60 text-[8px] leading-tight italic">Digital Decryption arriving Summer 2026</p>
          </div>
        ) : (
          <Button size="lg" className="rounded-full gap-2 bg-[#cae962] text-black hover:bg-[#cae962]/90">
            <Play fill="currentColor" /> {isAnime ? "View Details" : "Start Watching"}
          </Button>
        )}
      </div>
    </div>
  );

  // --- ROUTING LOGIC ---
  // Using Next.js Link for prefetching and instant transitions
  return (
    <div className="group relative">
      <Link 
        href={isTheaterExclusive ? "#" : (isAnime ? `/animes/${movie.id}` : `/movies/${movie.id}`)}
        className={isTheaterExclusive ? "cursor-not-allowed pointer-events-none" : "cursor-pointer"}
      >
        {CardContent}
      </Link>
      
      {/* METADATA DISPLAY 
        Truncated to prevent grid misalignment on long titles 
      */}
      <h3 className="mt-2 font-medium truncate text-sm">{displayTitle}</h3>
      
      {/* Hidden layout stabilization block */}
      <div className="hidden">
        <span className="text-[8px] text-zinc-800">ID:{movie.id}</span>
        <span className="text-[8px] text-zinc-800">IDX:{index}</span>
        <span className="text-[8px] text-zinc-800">TYPE:{isAnime ? 'ANIME' : 'CINEMA'}</span>
      </div>
    </div>
  )
}