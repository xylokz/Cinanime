"use client"
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Play } from "lucide-react"
import Link from "next/link"

interface MovieCardProps {
  movie: any;
  index: number;
  isAnime?: boolean; // New prop to differentiate
}

export default function MovieCard({ movie, index, isAnime }: MovieCardProps) {
  // Movies use .title, Anime use .name in TMDB
  const displayTitle = movie.title || movie.name;
  const watchUrl = `https://vidsrc.icu/embed/movie/${movie.id}`;

  const CardContent = (
    <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
      <img 
        src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`} 
        alt={displayTitle}
        className="object-cover w-full h-full transition-transform group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <Button size="lg" className="rounded-full gap-2 bg-[#cae962] text-black hover:bg-[#cae962]/90">
          <Play fill="currentColor" /> {isAnime ? "View Details" : "Watch Now"}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="group relative">
      {isAnime ? (
        // For Anime, we navigate to the details page
        <Link href={`/animes/${movie.id}`}>
          {CardContent}
        </Link>
      ) : (
        // For Movies, we keep your Dialog behavior
        <Dialog>
          <DialogTrigger asChild>
            <div className="cursor-pointer">{CardContent}</div>
          </DialogTrigger>
          <DialogContent className="max-w-[90vw] w-full aspect-video p-0 bg-black border-none">
            <DialogTitle className="sr-only">Watching {displayTitle}</DialogTitle>
            <DialogDescription className="sr-only">Player for {displayTitle}</DialogDescription>
            <div className="w-full h-full overflow-hidden rounded-lg"> 
              <iframe src={watchUrl} className="w-full h-full" allowFullScreen />
            </div>
          </DialogContent>
        </Dialog>
      )}
      <h3 className="mt-2 font-medium truncate text-sm">{displayTitle}</h3>
    </div>
  )
}