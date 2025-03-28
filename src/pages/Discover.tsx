
import React, { useState, useEffect } from 'react';
import { useQuery } from "@tanstack/react-query";
import { getMoviesByGenre, searchMovies, getPopularMovies } from "@/services/tmdb";
import { Header } from "@/components/Header";
import { MovieCard } from "@/components/MovieCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';
import { Search, ChevronLeft, ChevronRight, Film } from "lucide-react";
import { toast } from 'sonner';

const genres = [
  { id: 28, name: 'Ação' },
  { id: 12, name: 'Aventura' },
  { id: 16, name: 'Animação' },
  { id: 35, name: 'Comédia' },
  { id: 80, name: 'Crime' },
  { id: 99, name: 'Documentário' },
  { id: 18, name: 'Drama' },
  { id: 10751, name: 'Família' },
  { id: 14, name: 'Fantasia' },
  { id: 36, name: 'História' },
  { id: 27, name: 'Terror' },
  { id: 10402, name: 'Música' },
  { id: 9648, name: 'Mistério' },
  { id: 10749, name: 'Romance' },
  { id: 878, name: 'Ficção Científica' },
  { id: 53, name: 'Thriller' },
  { id: 10752, name: 'Guerra' },
  { id: 37, name: 'Faroeste' }
];

const Discover = () => {
  const navigate = useNavigate();
  const [selectedGenre, setSelectedGenre] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Redefine a página ao mudar o gênero ou fazer uma nova busca
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedGenre, isSearching, searchQuery]);

  const { 
    data: moviesData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['discoverMovies', selectedGenre, isSearching ? searchQuery : null, currentPage],
    queryFn: async () => {
      if (isSearching && searchQuery) {
        return searchMovies(searchQuery, currentPage);
      } else if (selectedGenre) {
        return getMoviesByGenre(selectedGenre, currentPage);
      } else {
        // Por padrão, buscar filmes populares
        return getPopularMovies(currentPage);
      }
    }
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsSearching(true);
      setSelectedGenre(null);
      refetch();
    }
  };

  const handleGenreSelect = (genreId: number) => {
    setSelectedGenre(genreId);
    setIsSearching(false);
    setSearchQuery('');
  };

  const handleMovieClick = (movieId: number) => {
    navigate(`/movie/${movieId}`);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow container px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Descubra Filmes</h1>
        
        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="relative">
            <Input
              type="text"
              placeholder="Buscar por filmes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
            <Button 
              type="submit" 
              size="icon" 
              variant="ghost" 
              className="absolute right-0 top-0 h-full"
            >
              <Search className="h-5 w-5" />
            </Button>
          </div>
        </form>
        
        {/* Genre Selection */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Gêneros</h2>
          <div className="flex flex-wrap gap-2">
            {genres.map((genre) => (
              <Button
                key={genre.id}
                variant={selectedGenre === genre.id ? "default" : "outline"}
                size="sm"
                onClick={() => handleGenreSelect(genre.id)}
              >
                {genre.name}
              </Button>
            ))}
          </div>
        </div>
        
        {/* Results */}
        <div>
          {isLoading && (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-couple-purple"></div>
            </div>
          )}
          
          {error && (
            <div className="bg-red-50 text-red-500 rounded-lg p-4 mb-4">
              Erro ao carregar filmes. Tente novamente mais tarde.
            </div>
          )}
          
          {!isLoading && !error && moviesData?.results && (
            <>
              {moviesData.results.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  Nenhum resultado encontrado
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {moviesData.results.map((movie) => (
                      <MovieCard
                        key={movie.id}
                        id={movie.id}
                        title={movie.title}
                        posterPath={movie.poster_path}
                        releaseDate={movie.release_date}
                        rating={movie.vote_average / 2}
                        onClick={() => handleMovieClick(movie.id)}
                      />
                    ))}
                  </div>
                  
                  {/* Pagination */}
                  {moviesData.total_pages > 1 && (
                    <div className="flex justify-center mt-8 gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="w-4 h-4 mr-1" /> Anterior
                      </Button>
                      <span className="flex items-center px-4">
                        Página {currentPage} de {Math.min(moviesData.total_pages, 500)}
                      </span>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.min(Math.min(moviesData.total_pages, 500), p + 1))}
                        disabled={currentPage === Math.min(moviesData.total_pages, 500)}
                      >
                        Próxima <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default Discover;
