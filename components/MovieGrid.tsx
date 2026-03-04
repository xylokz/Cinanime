"use client"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

export default function MovieGrid({ setMovies }: { setMovies: any }) {
  const handleSearch = async (query: string) => {
    if (query.length < 2) return;

    const res = await fetch(
      `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(query)}`,
      { headers: { Authorization: `Bearer ${process.env.NEXT_PUBLIC_TMDB_TOKEN}` } }
    );
    const data = await res.json();
    setMovies(data.results); // This updates the main list in page.tsx!
  };

  return (
    <div className="relative max-w-xl mx-auto -mt-0 z-20">
      <Search className="absolute left-4 top-6  -translate-y-1/2 text-muted-foreground" />
      <Input 
        onChange={(e) => handleSearch(e.target.value)}
        placeholder="Search 200,000+ movies..." 
        className="h-16 pl-12 -mt-2 mb-5 rounded-2xl bg-card border-none shadow-2xl text-lg"
      />
    </div>
  );
}