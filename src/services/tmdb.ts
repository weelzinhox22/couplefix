const API_BASE_URL = 'https://api.themoviedb.org/3';
const API_KEY = 'e54ca549c9588e94765b63995955a653';

export const getMoviesByGenre = async (genreId: number, page: number = 1) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/discover/movie?api_key=${API_KEY}&language=pt-BR&with_genres=${genreId}&page=${page}&include_adult=false&sort_by=popularity.desc`,
    );
    
    if (!response.ok) throw new Error('Falha ao buscar filmes por gênero');
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching movies by genre:', error);
    throw error;
  }
};

export const searchMovies = async (query: string, page: number = 1) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/search/movie?api_key=${API_KEY}&language=pt-BR&query=${encodeURIComponent(query)}&page=${page}&include_adult=false`,
    );
    
    if (!response.ok) throw new Error('Falha na busca');
    
    return await response.json();
  } catch (error) {
    console.error('Error searching movies:', error);
    throw error;
  }
};

// Função para buscar filmes populares
export const getPopularMovies = async (page: number = 1) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/movie/popular?api_key=${API_KEY}&language=pt-BR&page=${page}`,
    );
    
    if (!response.ok) throw new Error('Falha ao buscar filmes populares');
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching popular movies:', error);
    throw error;
  }
};

// Função para buscar detalhes do filme
export const getMovieDetails = async (movieId: number) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/movie/${movieId}?api_key=${API_KEY}&language=pt-BR`,
    );
    
    if (!response.ok) throw new Error('Falha ao buscar detalhes do filme');
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching movie details:', error);
    throw error;
  }
};
