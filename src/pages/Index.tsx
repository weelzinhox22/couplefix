
import React from 'react';
import { useQuery } from "@tanstack/react-query";
import { getPopularMovies, getPopularTVShows } from "@/services/tmdb";
import { Header } from "@/components/Header";
import { MovieCard } from "@/components/MovieCard";
import { Button } from "@/components/ui/button";

const Index = () => {
  const { 
    data: moviesData,
    isLoading: isLoadingMovies,
    error: moviesError 
  } = useQuery({
    queryKey: ['popularMovies'],
    queryFn: () => getPopularMovies(),
  });

  const { 
    data: tvShowsData,
    isLoading: isLoadingTVShows, 
    error: tvShowsError 
  } = useQuery({
    queryKey: ['popularTVShows'],
    queryFn: () => getPopularTVShows(),
  });

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow container px-4 py-8">
        {/* Hero Section */}
        <section className="relative overflow-hidden rounded-xl mb-12">
          <div className="bg-gradient-to-r from-couple-purple to-couple-pink p-8 md:p-12 rounded-xl text-white">
            <div className="max-w-2xl">
              <h1 className="text-3xl md:text-4xl font-bold mb-4">
                Descubra e compartilhe filmes juntos
              </h1>
              <p className="text-lg mb-6">
                O lugar perfeito para casais encontrarem, avaliarem e compartilharem suas experiências cinematográficas favoritas.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button size="lg" className="bg-white text-couple-purple hover:bg-gray-100">
                  Começar agora
                </Button>
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/20">
                  Saiba mais
                </Button>
              </div>
            </div>
          </div>
        </section>
        
        {/* Popular Movies Section */}
        <section className="mb-12">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Filmes Populares</h2>
            <Button variant="ghost" className="text-couple-purple">
              Ver todos
            </Button>
          </div>
          
          {isLoadingMovies && (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-couple-purple"></div>
            </div>
          )}
          
          {moviesError && (
            <div className="bg-red-50 text-red-500 rounded-lg p-4 mb-4">
              Erro ao carregar filmes populares. Tente novamente mais tarde.
            </div>
          )}
          
          {moviesData && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {moviesData.results.slice(0, 6).map((movie) => (
                <MovieCard
                  key={movie.id}
                  id={movie.id}
                  title={movie.title}
                  posterPath={movie.poster_path}
                  releaseDate={movie.release_date}
                  rating={movie.vote_average / 2}
                  onClick={() => console.log(`Clicked on movie: ${movie.title}`)}
                />
              ))}
            </div>
          )}
        </section>
        
        {/* Popular TV Shows Section */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Séries Populares</h2>
            <Button variant="ghost" className="text-couple-purple">
              Ver todas
            </Button>
          </div>
          
          {isLoadingTVShows && (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-couple-purple"></div>
            </div>
          )}
          
          {tvShowsError && (
            <div className="bg-red-50 text-red-500 rounded-lg p-4 mb-4">
              Erro ao carregar séries populares. Tente novamente mais tarde.
            </div>
          )}
          
          {tvShowsData && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {tvShowsData.results.slice(0, 6).map((show) => (
                <MovieCard
                  key={show.id}
                  id={show.id}
                  title={show.title}
                  posterPath={show.poster_path}
                  releaseDate={show.release_date}
                  rating={show.vote_average / 2}
                  onClick={() => console.log(`Clicked on show: ${show.title}`)}
                />
              ))}
            </div>
          )}
        </section>
      </main>
      
      <footer className="bg-gray-50 py-6">
        <div className="container mx-auto px-4 text-center text-gray-500">
          <p>© {new Date().getFullYear()} CouplesFlix. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
