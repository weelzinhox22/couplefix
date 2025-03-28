
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Film, Play } from "lucide-react";
import { Movie } from "@/services/tmdb";

interface HeroSectionProps {
  featuredMovie?: Movie;
  isLoading?: boolean;
}

export function HeroSection({ featuredMovie, isLoading = false }: HeroSectionProps) {
  const navigate = useNavigate();
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    if (featuredMovie?.backdrop_path) {
      const img = new Image();
      img.src = `https://image.tmdb.org/t/p/original${featuredMovie.backdrop_path}`;
      img.onload = () => setImageLoaded(true);
    }
  }, [featuredMovie]);

  if (isLoading || !featuredMovie) {
    return (
      <div className="w-full h-[50vh] bg-gradient-to-r from-couple-purple/20 to-couple-pink/20 animate-pulse-slow flex items-center justify-center">
        <Film className="w-16 h-16 text-couple-purple opacity-30" />
      </div>
    );
  }

  const backdropUrl = featuredMovie.backdrop_path
    ? `https://image.tmdb.org/t/p/original${featuredMovie.backdrop_path}`
    : null;

  return (
    <div className="relative w-full h-[60vh] overflow-hidden">
      {/* Background image */}
      <div
        className={`absolute inset-0 bg-gradient-to-r from-couple-purple/20 to-couple-pink/20 ${
          backdropUrl && imageLoaded ? "" : "animate-pulse-slow"
        }`}
      >
        {backdropUrl && (
          <div
            className="absolute inset-0 bg-cover bg-center transition-opacity duration-500"
            style={{
              backgroundImage: `url(${backdropUrl})`,
              opacity: imageLoaded ? 1 : 0,
            }}
          />
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/10" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/70 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative container h-full flex flex-col justify-end pb-16 pt-20">
        <div className="max-w-2xl">
          <h1 className="text-4xl md:text-5xl font-bold mb-2 text-shadow">
            {featuredMovie.title}
          </h1>
          <p className="text-base md:text-lg opacity-90 mb-6 line-clamp-3">
            {featuredMovie.overview || "Sem descrição disponível."}
          </p>
          <div className="flex flex-wrap gap-3">
            <Button 
              onClick={() => navigate(`/movie/${featuredMovie.id}`)}
              className="bg-couple-purple hover:bg-couple-purple/90"
            >
              <Play className="mr-2 w-4 h-4" /> Ver Detalhes
            </Button>
            <Button 
              variant="outline"
              onClick={() => navigate('/discover')}
            >
              Descobrir Mais
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
