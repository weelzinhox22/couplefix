
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getMovieDetails } from '@/services/tmdb';
import { StarRating } from '@/components/StarRating';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Heart, Clock, Share2, Play, Info, Calendar, Star } from 'lucide-react';
import { toast } from 'sonner';

const MovieDetail = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [userComment, setUserComment] = useState('');
  const [userRating, setUserRating] = useState(0);

  const { data: session } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
  });

  const { data: movie, isLoading: isLoadingMovie } = useQuery({
    queryKey: ['movie', id],
    queryFn: async () => {
      if (!id) throw new Error('Movie ID is required');
      return getMovieDetails(parseInt(id));
    },
    enabled: !!id,
  });

  const { data: watchlistItem, isLoading: isLoadingWatchlist } = useQuery({
    queryKey: ['watchlistItem', id],
    queryFn: async () => {
      if (!session?.user) throw new Error('Not authenticated');
      
      const { data } = await supabase
        .from('watchlist')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('tmdb_id', id)
        .single();
      
      return data;
    },
    enabled: !!session?.user && !!id,
  });

  // Efeito para carregar os dados do item da watchlist
  React.useEffect(() => {
    if (watchlistItem) {
      setUserComment(watchlistItem.user_comment || '');
      setUserRating(watchlistItem.user_rating || 0);
    }
  }, [watchlistItem]);

  const addToWatchlistMutation = useMutation({
    mutationFn: async ({ isWatched = false }: { isWatched?: boolean }) => {
      if (!session?.user || !movie) throw new Error('Not authenticated or movie data is missing');
      
      // Prepare watchlist item data
      const watchlistData = {
        user_id: session.user.id,
        tmdb_id: id,
        title: movie.title,
        poster_url: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null,
        backdrop_url: movie.backdrop_path ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}` : null,
        overview: movie.overview,
        year: movie.release_date ? movie.release_date.substring(0, 4) : null,
        genres: movie.genres,
        runtime: movie.runtime,
        is_watched: isWatched,
        // Convertendo Date para string ISO
        date_watched: isWatched ? new Date().toISOString() : null,
        user_comment: userComment,
        user_rating: userRating > 0 ? userRating : null,
      };

      if (watchlistItem) {
        // Update existing item
        const { error } = await supabase
          .from('watchlist')
          .update(watchlistData)
          .eq('id', watchlistItem.id);
          
        if (error) throw error;
        return { ...watchlistItem, ...watchlistData };
      } else {
        // Insert new item
        const { data, error } = await supabase
          .from('watchlist')
          .insert([watchlistData])
          .select()
          .single();
          
        if (error) throw error;
        return data;
      }
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['watchlistItem', id] });
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
      
      toast.success(
        variables.isWatched 
          ? 'Filme marcado como assistido!' 
          : watchlistItem 
            ? 'Lista atualizada!'
            : 'Filme adicionado à sua lista!'
      );
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  const removeFromWatchlistMutation = useMutation({
    mutationFn: async () => {
      if (!session?.user || !watchlistItem) {
        throw new Error('Not authenticated or item not in watchlist');
      }
      
      const { error } = await supabase
        .from('watchlist')
        .delete()
        .eq('id', watchlistItem.id);
        
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlistItem', id] });
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
      setUserComment('');
      setUserRating(0);
      toast.success('Filme removido da sua lista!');
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  const handleShareMovie = () => {
    if (!movie) return;
    
    const text = `Acabei de ${watchlistItem?.is_watched ? 'assistir' : 'adicionar à minha lista'} "${movie.title}" ${watchlistItem?.user_rating ? `e dei ${watchlistItem.user_rating}/5 estrelas!` : ''} ${watchlistItem?.user_comment ? `"${watchlistItem.user_comment}"` : ''} #CouplesFlix`;
    
    if (navigator.share) {
      navigator.share({
        title: movie.title,
        text: text,
        url: window.location.href,
      }).catch(() => {
        // Fallback if sharing fails
        navigator.clipboard.writeText(`${text} ${window.location.href}`);
        toast.success('Link copiado para compartilhar!');
      });
    } else {
      navigator.clipboard.writeText(`${text} ${window.location.href}`);
      toast.success('Link copiado para compartilhar!');
    }
  };

  if (!session) {
    navigate('/auth');
    return null;
  }

  if (isLoadingMovie) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-grow flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-couple-purple"></div>
        </div>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-grow flex justify-center items-center flex-col p-8">
          <h1 className="text-2xl font-bold mb-4">Filme não encontrado</h1>
          <Button onClick={() => navigate('/')}>Voltar para página inicial</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      {/* Hero section with backdrop image */}
      <div 
        className="relative w-full h-[50vh] md:h-[60vh] bg-gray-900 bg-cover bg-center"
        style={{
          backgroundImage: movie.backdrop_path 
            ? `linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.8)), url(https://image.tmdb.org/t/p/original${movie.backdrop_path})` 
            : undefined
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
        <div className="container mx-auto h-full flex items-end pb-8">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-end z-10">
            {/* Poster */}
            <div className="w-32 md:w-48 rounded-lg overflow-hidden shadow-xl -mt-16 md:mt-0">
              <img 
                src={movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : 'https://via.placeholder.com/500x750?text=No+Image'}
                alt={movie.title}
                className="w-full h-auto"
              />
            </div>
            
            {/* Movie info */}
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                {movie.title}
              </h1>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {movie.release_date && (
                  <div className="flex items-center text-sm text-gray-300">
                    <Calendar className="w-4 h-4 mr-1" />
                    {new Date(movie.release_date).getFullYear()}
                  </div>
                )}
                {movie.runtime && (
                  <div className="flex items-center text-sm text-gray-300">
                    <Clock className="w-4 h-4 mr-1" />
                    {Math.floor(movie.runtime / 60)}h {movie.runtime % 60}m
                  </div>
                )}
                {movie.vote_average > 0 && (
                  <div className="flex items-center text-sm text-yellow-400">
                    <Star className="w-4 h-4 mr-1 fill-yellow-400" />
                    {(movie.vote_average / 2).toFixed(1)}/5
                  </div>
                )}
              </div>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {movie.genres?.map((genre) => (
                  <span 
                    key={genre.id}
                    className="px-2 py-1 bg-gray-800 rounded-full text-xs text-gray-200"
                  >
                    {genre.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <main className="container mx-auto px-4 py-8 flex flex-col md:flex-row gap-8">
        <div className="flex-1">
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4">Sinopse</h2>
            <p className="text-gray-600 dark:text-gray-300">
              {movie.overview || "Sem sinopse disponível."}
            </p>
          </div>
          
          {/* User rating and comments section */}
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4">Sua Avaliação</h2>
            
            <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-lg">
              <div className="mb-4">
                <label className="block mb-2 font-medium">Classificação</label>
                <StarRating 
                  initialRating={userRating} 
                  onChange={setUserRating} 
                  readonly={isLoadingWatchlist} 
                  size="lg"
                />
              </div>
              
              <div className="mb-4">
                <label className="block mb-2 font-medium">Comentário</label>
                <Textarea 
                  placeholder="Escreva o que você achou..."
                  value={userComment}
                  onChange={(e) => setUserComment(e.target.value)}
                  disabled={isLoadingWatchlist}
                  className="min-h-24"
                />
              </div>
              
              <div className="flex gap-4">
                <Button 
                  className="flex-1"
                  onClick={() => addToWatchlistMutation.mutate({ isWatched: true })}
                  disabled={addToWatchlistMutation.isPending}
                >
                  {watchlistItem?.is_watched ? 'Atualizar Avaliação' : 'Marcar como Assistido'}
                </Button>
                
                <Button 
                  variant={watchlistItem ? "destructive" : "outline"}
                  onClick={watchlistItem 
                    ? () => removeFromWatchlistMutation.mutate()
                    : () => addToWatchlistMutation.mutate({ isWatched: false })
                  }
                  disabled={removeFromWatchlistMutation.isPending || addToWatchlistMutation.isPending}
                >
                  {watchlistItem 
                    ? 'Remover da Lista' 
                    : 'Adicionar para Assistir'
                  }
                </Button>
                
                <Button
                  variant="outline"
                  onClick={handleShareMovie}
                  disabled={!movie}
                >
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MovieDetail;
