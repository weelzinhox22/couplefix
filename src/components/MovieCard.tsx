
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Star, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface MovieCardProps {
  id: number;
  title: string;
  posterPath: string;
  releaseDate?: string;
  rating?: number;
  onClick?: () => void;
  compact?: boolean;
}

export function MovieCard({ 
  id, 
  title, 
  posterPath, 
  releaseDate,
  rating,
  onClick,
  compact = false 
}: MovieCardProps) {
  const [isHovering, setIsHovering] = useState(false);
  const imageUrl = posterPath.startsWith('http') 
    ? posterPath 
    : `https://image.tmdb.org/t/p/w500${posterPath}`;
  
  const year = releaseDate ? new Date(releaseDate).getFullYear() : '';

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    toast.success("Link copiado para compartilhar!");
    // Implementation for sharing will come with Supabase integration
  };

  return (
    <Card 
      className={`group overflow-hidden relative transition-all duration-300 bg-transparent border-0 shadow-lg ${compact ? 'w-36' : 'w-full max-w-xs'}`}
      onClick={onClick}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div className="aspect-[2/3] relative overflow-hidden rounded-md">
        <div className={`absolute inset-0 bg-black/30 transition-opacity ${isHovering ? 'opacity-60' : 'opacity-0'}`} />
        
        <img 
          src={imageUrl} 
          alt={title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/500x750?text=No+Image';
          }}
        />
        
        <div className="absolute bottom-0 left-0 right-0 p-3 gradient-overlay flex flex-col">
          <h3 className={`font-medium line-clamp-1 text-shadow text-white ${compact ? 'text-sm' : 'text-base'}`}>{title}</h3>
          {year && <span className="text-xs text-gray-300">{year}</span>}
        </div>
        
        {rating && (
          <div className="absolute top-2 right-2 bg-black/70 text-yellow-400 rounded-full flex items-center px-2 py-1">
            <Star className="w-3 h-3 mr-1 fill-yellow-400 text-yellow-400" />
            <span className="text-xs font-medium">{rating}</span>
          </div>
        )}
        
        {isHovering && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={(e) => {
                  e.stopPropagation();
                  handleShare(e);
                }}
                className="bg-white/80 hover:bg-white/100 text-gray-800"
              >
                <Share2 className="w-3.5 h-3.5 mr-1" />
                Compartilhar
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
