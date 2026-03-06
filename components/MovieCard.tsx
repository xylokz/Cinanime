"use client"
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Play, Lock } from "lucide-react"
import Link from "next/link"

interface MovieCardProps {
  movie: any;
  index: number;
  isAnime?: boolean;
}

export default function MovieCard({ movie, index, isAnime }: MovieCardProps) {
  const displayTitle = movie.title || movie.name;
  
  // THEATER LOCK: Specifically block Infinity Castle IDs or Titles
  const isTheaterExclusive = 
    movie.id === 1311031 || 
    displayTitle.toLowerCase().includes("infinity castle");

  const watchUrl = `https://vidsrc.icu/embed/movie/${movie.id}`;

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
            <Play fill="currentColor" /> {isAnime ? "View Details" : "Watch Now"}
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <div className="group relative">
      {isAnime ? (
        <Link href={`/animes/${movie.id}`}>
          {CardContent}
        </Link>
      ) : (
        <Dialog>
          <DialogTrigger asChild>
            <div className={`${isTheaterExclusive ? "cursor-not-allowed" : "cursor-pointer"}`}>
              {CardContent}
            </div>
          </DialogTrigger>
          
          {/* Only render content if it's NOT a theater exclusive to prevent "Wrong Movie" glitch */}
          {!isTheaterExclusive && (
            <DialogContent className="max-w-[90vw] w-full aspect-video p-0 bg-black border-none overflow-hidden">
              <DialogTitle className="sr-only">Watching {displayTitle}</DialogTitle>
              <DialogDescription className="sr-only">Player for {displayTitle}</DialogDescription>
              <div className="w-full h-full"> 
                <iframe src={watchUrl} className="w-full h-full border-0" allowFullScreen />
              </div>
            </DialogContent>
          )}
        </Dialog>
      )}
      <h3 className="mt-2 font-medium truncate text-sm">{displayTitle}</h3>
    </div>
  )
}