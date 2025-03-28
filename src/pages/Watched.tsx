
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { MovieCard } from "@/components/MovieCard";
import { StarRating } from "@/components/StarRating";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Film, Heart, X, Filter, Star, Calendar } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const Watched = () => {
  const navigate = useNavigate();
  const [filterWatched, setFilterWatched] = useState<boolean | null>(null);
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>("date_added");

  const { data: session } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
  });

  const { data: watchlist, isLoading, refetch } = useQuery({
    queryKey: ['watchlist', filterWatched, selectedGenre, sortBy],
    queryFn: async () => {
      if (!session?.user) throw new Error('Not authenticated');
      
      let query = supabase
        .from('watchlist')
        .select('*')
        .eq('user_id', session.user.id);
        
      if (filterWatched !== null) {
        query = query.eq('is_watched', filterWatched);
      }
      
      // Add genre filter if selected
      if (selectedGenre) {
        query = query.contains('genres', [{"id": parseInt(selectedGenre)}]);
      }
      
      // Add sorting
      switch (sortBy) {
        case "title":
          query = query.order('title');
          break;
        case "rating":
          query = query.order('user_rating', { ascending: false, nullsLast: true });
          break;
        case "date_watched":
          query = query.order('date_watched', { ascending: false, nullsLast: true });
          break;
        case "date_added":
        default:
          query = query.order('date_added', { ascending: false });
          break;
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!session?.user,
  });

  // Extract unique genres from watchlist items
  const allGenres = React.useMemo(() => {
    if (!watchlist) return [];
    
    const genres = new Set();
    watchlist.forEach(item => {
      if (item.genres && Array.isArray(item.genres)) {
        item.genres.forEach(genre => {
          if (genre && genre.id && genre.name) {
            genres.add(JSON.stringify(genre));
          }
        });
      }
    });
    
    return Array.from(genres).map(g => JSON.parse(g as string));
  }, [watchlist]);

  const toggleWatchedStatus = async (item) => {
    try {
      const { error } = await supabase
        .from('watchlist')
        .update({ 
          is_watched: !item.is_watched,
          date_watched: !item.is_watched ? new Date().toISOString() : null 
        })
        .eq('id', item.id);
        
      if (error) throw error;
      
      toast.success(
        item.is_watched 
          ? 'Filme marcado para assistir' 
          : 'Filme marcado como assistido'
      );
      
      refetch();
    } catch (error) {
      toast.error(`Erro: ${error.message}`);
    }
  };

  if (!session) {
    navigate('/auth');
    return null;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow container px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <h1 className="text-3xl font-bold">Sua Lista</h1>
          
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant={filterWatched === true ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterWatched(filterWatched === true ? null : true)}
            >
              <Heart className="w-4 h-4 mr-2" />
              Assistidos
            </Button>
            <Button
              variant={filterWatched === false ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterWatched(filterWatched === false ? null : false)}
            >
              <Film className="w-4 h-4 mr-2" />
              Para assistir
            </Button>
            {filterWatched !== null && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setFilterWatched(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
        
        {/* Filters and sorting */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="w-full sm:w-1/2 lg:w-1/4">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date_added">Mais recentes</SelectItem>
                <SelectItem value="title">Título (A-Z)</SelectItem>
                <SelectItem value="rating">Melhor avaliação</SelectItem>
                <SelectItem value="date_watched">Data assistido</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {allGenres.length > 0 && (
            <div className="w-full sm:w-1/2 lg:w-1/4">
              <Select 
                value={selectedGenre || ""} 
                onValueChange={(value) => setSelectedGenre(value || null)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Filtrar por gênero" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os gêneros</SelectItem>
                  {allGenres.map((genre) => (
                    <SelectItem key={genre.id} value={genre.id.toString()}>
                      {genre.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-couple-purple"></div>
          </div>
        ) : watchlist && watchlist.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {watchlist.map((item) => (
              <div key={item.id} className="flex flex-col">
                <div className="relative">
                  <MovieCard
                    id={parseInt(item.tmdb_id)}
                    title={item.title}
                    posterPath={item.poster_url || ''}
                    releaseDate={item.year || ''}
                    onClick={() => navigate(`/movie/${item.tmdb_id}`)}
                  />
                  <Button 
                    className="absolute top-2 right-2 rounded-full w-8 h-8 p-0 bg-black bg-opacity-50 hover:bg-opacity-70"
                    variant="ghost"
                    onClick={() => toggleWatchedStatus(item)}
                  >
                    {item.is_watched ? (
                      <Heart className="w-4 h-4 text-red-500 fill-red-500" />
                    ) : (
                      <Heart className="w-4 h-4 text-white" />
                    )}
                  </Button>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <StarRating 
                    initialRating={item.user_rating || 0} 
                    readonly 
                    size="sm" 
                  />
                  {item.is_watched ? (
                    <span className="text-xs text-green-600 font-medium flex items-center">
                      <Heart className="w-3 h-3 mr-1" /> Assistido
                    </span>
                  ) : (
                    <span className="text-xs text-purple-600 font-medium flex items-center">
                      <Calendar className="w-3 h-3 mr-1" /> Para assistir
                    </span>
                  )}
                </div>
                {item.user_comment && (
                  <p className="text-sm mt-1 text-gray-600 line-clamp-2">
                    "{item.user_comment}"
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Film className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">Sua lista está vazia</h3>
            <p className="text-gray-500 mb-4">
              Você ainda não adicionou nenhum filme à sua lista.
            </p>
            <Button onClick={() => navigate('/discover')}>
              Descobrir filmes
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default Watched;
