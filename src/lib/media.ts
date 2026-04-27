// TVMaze: free public API for TV shows (no key required)
const TVMAZE_BASE = 'https://api.tvmaze.com';
// OMDb: movie database (requires OMDB_API_KEY env var)
const OMDB_BASE = 'https://www.omdbapi.com';
// Jikan: unofficial MyAnimeList API (no key required)
const JIKAN_BASE = 'https://api.jikan.moe/v4';

// ── Curated movie pool (300 well-known IMDb IDs) ──────────────────────────────
// NOTE: To customize this list, edit TRENDING_MOVIE_IMDB_IDS in src/lib/media.ts
export const TRENDING_MOVIE_IMDB_IDS: string[] = [
  // Classics & critically acclaimed
  'tt0111161', // The Shawshank Redemption (1994)
  'tt0068646',  // The Godfather (1972)
  'tt0071562',  // The Godfather Part II (1974)
  'tt0110912',  // Pulp Fiction (1994)
  'tt0109830',  // Forrest Gump (1994)
  'tt0137523',  // Fight Club (1999)
  'tt0133093',  // The Matrix (1999)
  'tt0099685',  // Goodfellas (1990)
  'tt0108052',  // Schindler's List (1993)
  'tt0114369',  // Se7en (1995)
  'tt0034583',  // Casablanca (1942)
  'tt0050083',  // 12 Angry Men (1957)
  'tt0056592',  // To Kill a Mockingbird (1962)
  'tt0062622',  // 2001: A Space Odyssey (1968)
  'tt0075314',  // Taxi Driver (1976)
  'tt0078788',  // Apocalypse Now (1979)
  'tt0082971',  // Raiders of the Lost Ark (1981)
  'tt0088763',  // Back to the Future (1985)
  'tt0102926',  // The Silence of the Lambs (1991)
  'tt0103064',  // Terminator 2: Judgment Day (1991)
  'tt0047478',  // Seven Samurai (1954)
  'tt0064116',  // Once Upon a Time in the West (1968)
  'tt0073486',  // One Flew Over the Cuckoo's Nest (1975)
  'tt0076759',  // Star Wars: A New Hope (1977)
  'tt0080684',  // Star Wars: The Empire Strikes Back (1980)
  'tt0086190',  // Return of the Jedi (1983)
  'tt0093058',  // Full Metal Jacket (1987)
  'tt0097576',  // Indiana Jones and the Last Crusade (1989)
  'tt0114709',  // Toy Story (1995)
  'tt0112573',  // Braveheart (1995)
  // 2000s
  'tt0172495',  // Gladiator (2000)
  'tt0120737',  // LOTR: The Fellowship of the Ring (2001)
  'tt0167261',  // LOTR: The Two Towers (2002)
  'tt0167260',  // LOTR: The Return of the King (2003)
  'tt0114814',  // The Usual Suspects (1995)
  'tt0208092',  // Snatch (2000)
  'tt0240772',  // Ocean's Eleven (2001)
  'tt0209144',  // Memento (2000)
  'tt0253474',  // The Pianist (2002)
  'tt0266543',  // Finding Nemo (2003)
  'tt0268978',  // A Beautiful Mind (2001)
  'tt0338013',  // Eternal Sunshine of the Spotless Mind (2004)
  'tt0349034',  // Downfall (2004)
  'tt0353969',  // Million Dollar Baby (2004)
  'tt0363771',  // The Incredibles (2004)
  'tt0378194',  // The Aviator (2004)
  'tt0401792',  // Sin City (2005)
  'tt0407887',  // The Departed (2006)
  'tt0416449',  // 300 (2006)
  'tt0457430',  // Pan's Labyrinth (2006)
  'tt0454921',  // The Pursuit of Happyness (2006)
  'tt0477348',  // No Country for Old Men (2007)
  'tt0469494',  // There Will Be Blood (2007)
  'tt0493745',  // Into the Wild (2007)
  'tt0516940',  // Gran Torino (2008)
  'tt0780536',  // District 9 (2009)
  'tt0910970',  // WALL-E (2008)
  'tt1070874',  // The Hurt Locker (2008)
  'tt1135311',  // Up (2009)
  'tt1156398',  // Zombieland (2009)
  'tt0371746',  // Iron Man (2008)
  'tt0468569',  // The Dark Knight (2008)
  'tt0372784',  // Batman Begins (2005)
  'tt0482571',  // The Prestige (2006)
  'tt0816692',  // Interstellar (2014)
  // 2010s
  'tt0435761',  // Toy Story 3 (2010)
  'tt1375666',  // Inception (2010)
  'tt1399035',  // True Grit (2010)
  'tt1440458',  // The King's Speech (2010)
  'tt1467304',  // Moneyball (2011)
  'tt1504320',  // The Artist (2011)
  'tt1617727',  // Hugo (2011)
  'tt1673434',  // Drive (2011)
  'tt1787660',  // Argo (2012)
  'tt1800241',  // Life of Pi (2012)
  'tt0848228',  // The Avengers (2012)
  'tt1228705',  // Iron Man 2 (2010)
  'tt1273638',  // Captain America: The First Avenger (2011)
  'tt1843866',  // Captain America: The Winter Soldier (2014)
  'tt2395427',  // Avengers: Age of Ultron (2015)
  'tt2397535',  // Iron Man 3 (2013)
  'tt3498820',  // Captain America: Civil War (2016)
  'tt3501632',  // Thor: Ragnarok (2017)
  'tt3606756',  // Ant-Man (2015)
  'tt3896198',  // Guardians of the Galaxy Vol. 2 (2017)
  'tt0458339',  // Guardians of the Galaxy (2014)
  'tt1199979',  // Black Swan (2010)
  'tt1305797',  // 127 Hours (2010)
  'tt1392214',  // Prisoners (2013)
  'tt1905041',  // Gravity (2013)
  'tt1950186',  // The Imitation Game (2014)
  'tt2024544',  // 12 Years a Slave (2013)
  'tt2096673',  // Inside Out (2015)
  'tt2119532',  // Hacksaw Ridge (2016)
  'tt2267998',  // Gone Girl (2014)
  'tt2278388',  // The Grand Budapest Hotel (2014)
  'tt2306299',  // The Revenant (2015)
  'tt2619979',  // The Big Short (2015)
  'tt2737304',  // Bridge of Spies (2015)
  'tt2798920',  // Spotlight (2015)
  'tt3040964',  // The Witch (2015)
  'tt3170832',  // Room (2015)
  'tt3315342',  // Moonlight (2016)
  'tt3748528',  // Rogue One: A Star Wars Story (2016)
  'tt4034228',  // Manchester by the Sea (2016)
  'tt4154664',  // Captain Marvel (2019)
  'tt4154756',  // Avengers: Infinity War (2018)
  'tt4154796',  // Avengers: Endgame (2019)
  'tt4425200',  // Arrival (2016)
  'tt4633694',  // Spider-Man: Into the Spider-Verse (2018)
  'tt4846340',  // Hidden Figures (2016)
  'tt5013056',  // Dunkirk (2017)
  'tt5052448',  // Get Out (2017)
  'tt5095030',  // Spider-Man: Homecoming (2017)
  'tt5580390',  // Call Me by Your Name (2017)
  'tt5726616',  // Baby Driver (2017)
  'tt5770948',  // Lady Bird (2017)
  'tt6161168',  // Three Billboards Outside Ebbing, Missouri (2017)
  'tt6166392',  // The Shape of Water (2017)
  'tt6209470',  // Coco (2017)
  'tt6458478',  // A Quiet Place (2018)
  'tt6723592',  // BlacKkKlansman (2018)
  'tt6751668',  // Parasite (2019)
  'tt7286456',  // Joker (2019)
  'tt7618956',  // Knives Out (2019)
  'tt7984734',  // Once Upon a Time in Hollywood (2019)
  'tt8367814',  // 1917 (2019)
  'tt8367466',  // Little Women (2019)
  'tt8452754',  // Spider-Man: No Way Home (2021)
  'tt1825683',  // Black Panther (2018)
  // 2020s
  'tt1630029',  // Avatar: The Way of Water (2022)
  'tt9114286',  // Black Panther: Wakanda Forever (2022)
  'tt9362722',  // Spider-Man: Across the Spider-Verse (2023)
  'tt10272386', // The Father (2020)
  'tt10380054', // Judas and the Black Messiah (2021)
  'tt10428234', // The Power of the Dog (2021)
  'tt10440094', // Nomadland (2020)
  'tt10466872', // Dune (2021)
  'tt10648342', // No Time to Die (2021)
  'tt10915706', // Thor: Love and Thunder (2022)
  'tt11286314', // Doctor Strange in the Multiverse of Madness (2022)
  'tt11298230', // Belfast (2021)
  'tt12851646', // CODA (2021)
  'tt13560574', // Everything Everywhere All at Once (2022)
  'tt14208886', // The Banshees of Inisherin (2022)
  'tt14569560', // Tár (2022)
  'tt15398776', // Oppenheimer (2023)
  'tt1517268',  // Barbie (2023)
  'tt7144666',  // Dune: Part Two (2024)
  'tt3228774',  // Creed III (2023)
  'tt14230458', // The Creator (2023)
  'tt5433140',  // Fast X (2023)
  'tt6791350',  // Guardians of the Galaxy Vol. 3 (2023)
  'tt9376612',  // Shang-Chi and the Legend of the Ten Rings (2021)
  'tt9032400',  // Eternals (2021)
  // Horror
  'tt0076283',  // The Shining (1980)
  'tt0054215',  // Psycho (1960)
  'tt0879870',  // The Conjuring (2013)
  'tt5105280',  // It (2017)
  'tt7784604',  // Hereditary (2018)
  'tt7131622',  // Midsommar (2019)
  'tt6020694',  // Us (2019)
  'tt0078748',  // Alien (1979)
  'tt0090605',  // Aliens (1986)
  // Sci-fi & adventure
  'tt0499549',  // Avatar (2009)
  'tt0107290',  // Jurassic Park (1993)
  'tt2488496',  // Star Wars: The Force Awakens (2015)
  'tt0120338',  // Titanic (1997)
  // Drama & awards
  'tt0116282',  // Fargo (1996)
  'tt0114436',  // Trainspotting (1996)
  'tt0118715',  // The Big Lebowski (1998)
  'tt0118799',  // Life Is Beautiful (1997)
  'tt0119217',  // Good Will Hunting (1997)
  'tt0119488',  // L.A. Confidential (1997)
  'tt0120586',  // American History X (1998)
  'tt0120815',  // Saving Private Ryan (1998)
  'tt0122884',  // The Truman Show (1998)
  'tt0130827',  // Run Lola Run (1998)
  'tt0180093',  // Requiem for a Dream (2000)
  'tt0211915',  // Amélie (2001)
  'tt0245429',  // Spirited Away (2001)
  'tt0198781',  // Monsters, Inc. (2001)
  'tt0289879',  // Chicago (2002)
  'tt0325980',  // Pirates of the Caribbean: The Curse of the Black Pearl (2003)
  'tt0361748',  // Inglourious Basterds (2009)
  'tt0382932',  // Ratatouille (2007)
  'tt0364569',  // Oldboy (2003)
  'tt0095327',  // Grave of the Fireflies (1988)
  'tt0119698',  // Princess Mononoke (1997)
  'tt0097165',  // Dead Poets Society (1989)
  'tt0099348',  // Dances with Wolves (1990)
  'tt0101414',  // Beauty and the Beast (1991)
  'tt0105236',  // Reservoir Dogs (1992)
  'tt0095953',  // Rain Man (1988)
  'tt1074638',  // Skyfall (2012)
  'tt0455275',  // Pride & Prejudice (2005)
  'tt0100157',  // Misery (1990)
  'tt2103281',  // Big Hero 6 (2014)
  'tt2277860',  // Frozen (2013)
  'tt4881806',  // Frozen II (2019)
  'tt4380672',  // The Lion King (2019)
  'tt0110357',  // The Lion King (1994)
  'tt0099785',  // Home Alone (1990)
  'tt0087332',  // Ghostbusters (1984)
  'tt0088247',  // The Terminator (1984)
];

export interface MediaItem {
  id: string;
  media_type: 'movie' | 'tv' | 'anime';
  title: string;
  overview: string;
  poster_path: string;
  backdrop_path?: string;
  release_date?: string;
  vote_average?: number;
  genres?: string[];
  // Rich fields (populated on detail fetch)
  language?: string;
  runtime_minutes?: number;
  // Movie-specific
  director?: string;
  writer?: string;
  cast?: string[];
  country?: string;
  ratings?: { source: string; value: string }[];
  // TV-specific
  network?: string;
  schedule?: string;
  status?: string;
  episode_count?: number;
  seasons?: number;
  // Anime-specific
  episodes?: number;
  duration_minutes?: number;
  studios?: string[];
  themes?: string[];
  score?: number;
  aired?: string;
  trailer_url?: string;
}

// ── TVMaze helpers ────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapTVMazeShow(show: any, enriched = false): MediaItem {
  const base: MediaItem = {
    id: `tvmaze_${show.id}`,
    media_type: 'tv',
    title: show.name || 'Unknown',
    overview: show.summary ? show.summary.replace(/<[^>]*>/g, '') : '',
    poster_path: show.image?.medium || show.image?.original || '',
    backdrop_path: '',
    release_date: show.premiered || '',
    vote_average: show.rating?.average ?? undefined,
    genres: show.genres || [],
    language: show.language || undefined,
  };
  if (!enriched) return base;
  return {
    ...base,
    language: show.language || undefined,
    runtime_minutes: show.averageRuntime || show.runtime || undefined,
    network: show.network?.name || show.webChannel?.name || undefined,
    schedule: show.schedule
      ? `${show.schedule.days?.join(', ') || ''} ${show.schedule.time || ''}`.trim()
      : undefined,
    status: show.status || undefined,
  };
}

export async function searchTVMaze(query: string): Promise<MediaItem[]> {
  try {
    const url = `${TVMAZE_BASE}/search/shows?q=${encodeURIComponent(query)}`;
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    const data = await res.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data || []).map((item: any) => mapTVMazeShow(item.show));
  } catch {
    return [];
  }
}

export async function getTVMazeShow(id: string): Promise<MediaItem | null> {
  try {
    const showId = id.startsWith('tvmaze_') ? id.slice(7) : id;
    const [showRes, episodesRes] = await Promise.all([
      fetch(`${TVMAZE_BASE}/shows/${showId}`, { next: { revalidate: 300 } }),
      fetch(`${TVMAZE_BASE}/shows/${showId}/episodes`, { next: { revalidate: 3600 } }),
    ]);
    if (!showRes.ok) return null;
    const show = await showRes.json();
    const enriched = mapTVMazeShow(show, true);

    if (episodesRes.ok) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const episodes: any[] = await episodesRes.json();
      enriched.episode_count = episodes.length;
      const seasonNums = new Set(episodes.map((e: { season: number }) => e.season));
      enriched.seasons = seasonNums.size;
    }

    return enriched;
  } catch {
    return null;
  }
}

// ── OMDb helpers ──────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapOMDbMovie(r: any, enriched = false): MediaItem {
  const base: MediaItem = {
    id: `omdb_${r.imdbID}`,
    media_type: 'movie',
    title: r.Title || 'Unknown',
    overview: r.Plot && r.Plot !== 'N/A' ? r.Plot : '',
    poster_path: r.Poster && r.Poster !== 'N/A' ? r.Poster : '',
    backdrop_path: '',
    release_date:
      r.Released && r.Released !== 'N/A'
        ? r.Released
        : r.Year
        ? `${r.Year}-01-01`
        : '',
    vote_average:
      r.imdbRating && r.imdbRating !== 'N/A'
        ? parseFloat(r.imdbRating)
        : undefined,
    genres:
      r.Genre && r.Genre !== 'N/A' ? r.Genre.split(', ') : [],
  };
  if (!enriched) return base;

  // Parse runtime e.g. "148 min" → 148
  let runtimeMinutes: number | undefined;
  if (r.Runtime && r.Runtime !== 'N/A') {
    const m = r.Runtime.match(/(\d+)/);
    if (m) runtimeMinutes = parseInt(m[1], 10);
  }

  return {
    ...base,
    language: r.Language && r.Language !== 'N/A' ? r.Language.split(', ')[0] : undefined,
    country: r.Country && r.Country !== 'N/A' ? r.Country : undefined,
    runtime_minutes: runtimeMinutes,
    director: r.Director && r.Director !== 'N/A' ? r.Director : undefined,
    writer: r.Writer && r.Writer !== 'N/A' ? r.Writer : undefined,
    cast: r.Actors && r.Actors !== 'N/A' ? r.Actors.split(', ') : undefined,
    ratings: Array.isArray(r.Ratings) && r.Ratings.length > 0 ? r.Ratings : undefined,
  };
}

export async function searchOMDb(query: string): Promise<MediaItem[]> {
  const apiKey = process.env.OMDB_API_KEY;
  if (!apiKey) return [];
  try {
    const url = `${OMDB_BASE}/?s=${encodeURIComponent(query)}&apikey=${apiKey}&type=movie`;
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    const data = await res.json();
    if (data.Response === 'False') return [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data.Search || []).map((r: any) => ({
      id: `omdb_${r.imdbID}`,
      media_type: 'movie' as const,
      title: r.Title || 'Unknown',
      overview: '',
      poster_path: r.Poster && r.Poster !== 'N/A' ? r.Poster : '',
      backdrop_path: '',
      release_date: r.Year ? `${r.Year}-01-01` : '',
      vote_average: undefined,
      genres: [],
    }));
  } catch {
    return [];
  }
}

export async function getOMDbMovie(id: string): Promise<MediaItem | null> {
  const apiKey = process.env.OMDB_API_KEY;
  if (!apiKey) return null;
  try {
    const imdbId = id.startsWith('omdb_') ? id.slice(5) : id;
    const url = `${OMDB_BASE}/?i=${imdbId}&apikey=${apiKey}&plot=full`;
    const res = await fetch(url, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    const r = await res.json();
    if (r.Response === 'False') return null;
    return mapOMDbMovie(r, true);
  } catch {
    return null;
  }
}

// ── Jikan (anime) helpers ─────────────────────────────────────────────────────

export async function searchJikan(query: string): Promise<MediaItem[]> {
  try {
    const url = `${JIKAN_BASE}/anime?q=${encodeURIComponent(query)}&limit=10&sfw=true`;
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) return [];

    const data = await res.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data.data || []).map((r: any) => ({
      id: `mal_${r.mal_id}`,
      media_type: 'anime' as const,
      title: r.title_english || r.title || 'Unknown',
      overview: r.synopsis || '',
      poster_path: r.images?.jpg?.image_url || '',
      backdrop_path: '',
      release_date: r.aired?.from?.split('T')[0] || '',
      vote_average: r.score,
      genres: (r.genres || []).map((g: { name: string }) => g.name),
    }));
  } catch {
    return [];
  }
}

export async function getJikanAnime(malId: string): Promise<MediaItem | null> {
  try {
    const url = `${JIKAN_BASE}/anime/${malId}`;
    const res = await fetch(url, { next: { revalidate: 300 } });
    if (!res.ok) return null;

    const { data: r } = await res.json();

    // Parse duration e.g. "23 min per ep" or "1 hr 54 min" → minutes
    let durationMinutes: number | undefined;
    if (r.duration) {
      const hrMatch = r.duration.match(/(\d+)\s*hr/);
      const minMatch = r.duration.match(/(\d+)\s*min/);
      const hrs = hrMatch ? parseInt(hrMatch[1], 10) : 0;
      const mins = minMatch ? parseInt(minMatch[1], 10) : 0;
      if (hrs || mins) durationMinutes = hrs * 60 + mins;
    }

    return {
      id: `mal_${r.mal_id}`,
      media_type: 'anime',
      title: r.title_english || r.title || 'Unknown',
      overview: r.synopsis || '',
      poster_path: r.images?.jpg?.large_image_url || r.images?.jpg?.image_url || '',
      backdrop_path: '',
      release_date: r.aired?.from?.split('T')[0] || '',
      vote_average: r.score,
      genres: (r.genres || []).map((g: { name: string }) => g.name),
      // Rich fields
      language: 'Japanese',
      episodes: r.episodes || undefined,
      duration_minutes: durationMinutes,
      runtime_minutes: durationMinutes,
      studios: (r.studios || []).map((s: { name: string }) => s.name),
      themes: (r.themes || []).map((t: { name: string }) => t.name),
      score: r.score,
      status: r.status || undefined,
      aired: r.aired?.string || undefined,
      trailer_url: r.trailer?.url || undefined,
    };
  } catch {
    return null;
  }
}

// ── Trending ──────────────────────────────────────────────────────────────────

export async function getTrendingAnime(): Promise<MediaItem[]> {
  try {
    const url = `${JIKAN_BASE}/top/anime?limit=10`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const data = await res.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data.data || []).map((r: any) => ({
      id: `mal_${r.mal_id}`,
      media_type: 'anime' as const,
      title: r.title_english || r.title || 'Unknown',
      overview: r.synopsis || '',
      poster_path: r.images?.jpg?.image_url || '',
      backdrop_path: '',
      release_date: r.aired?.from?.split('T')[0] || '',
      vote_average: r.score,
      genres: (r.genres || []).map((g: { name: string }) => g.name),
    }));
  } catch {
    return [];
  }
}

export async function getTrendingTV(): Promise<MediaItem[]> {
  try {
    // TVMaze orders /shows by popularity; page 0 = the most-followed shows.
    const url = `${TVMAZE_BASE}/shows?page=0`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const data = await res.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data as any[]).slice(0, 10).map((s) => mapTVMazeShow(s));
  } catch {
    return [];
  }
}

export async function getTrendingMovies(): Promise<MediaItem[]> {
  const apiKey = process.env.OMDB_API_KEY;
  if (!apiKey) return [];

  // OMDb has no trending endpoint. We approximate "popular movies" by fetching
  // a curated list of well-known recent IMDb IDs in parallel. These cover
  // blockbusters and critically acclaimed films from the last few years.
  // NOTE: Update this list periodically (e.g. quarterly) to keep content relevant.
  const popularImdbIds = [
    'tt15398776', // Oppenheimer (2023)
    'tt1517268',  // Barbie (2023)
    'tt9362722',  // Spider-Man: Across the Spider-Verse (2023)
    'tt6791350',  // Guardians of the Galaxy Vol. 3 (2023)
    'tt1630029',  // Avatar: The Way of Water (2022)
    'tt3228774',  // Creed III (2023)
    'tt10954600', // Ant-Man and the Wasp: Quantumania (2023)
    'tt14230458', // The Creator (2023)
    'tt5433140',  // Fast X (2023)
    'tt7144666',  // Dune: Part Two (2024)
  ];

  const results = await Promise.allSettled(
    popularImdbIds.map(id => getOMDbMovie(`omdb_${id}`))
  );

  return results
    .filter(
      (r): r is PromiseFulfilledResult<MediaItem | null> =>
        r.status === 'fulfilled'
    )
    .map(r => r.value)
    .filter((m): m is MediaItem => m !== null);
}

// ── Feed pool (for homepage mixed grid) ───────────────────────────────────────

/** Fetch all TV shows from a specific TVMaze page (250 shows per page, 0-indexed). */
export async function getTVMazePage(page: number): Promise<MediaItem[]> {
  try {
    const url = `${TVMAZE_BASE}/shows?page=${page}`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const data = await res.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data as any[]).map((s) => mapTVMazeShow(s));
  } catch {
    return [];
  }
}

/** Fetch a page of top anime from Jikan (25 per page, 1-indexed). */
export async function getJikanTopPage(page: number): Promise<MediaItem[]> {
  try {
    const url = `${JIKAN_BASE}/top/anime?page=${page}&limit=25`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const data = await res.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data.data || []).map((r: any) => ({
      id: `mal_${r.mal_id}`,
      media_type: 'anime' as const,
      title: r.title_english || r.title || 'Unknown',
      overview: r.synopsis || '',
      poster_path: r.images?.jpg?.image_url || '',
      backdrop_path: '',
      release_date: r.aired?.from?.split('T')[0] || '',
      vote_average: r.score,
      genres: (r.genres || []).map((g: { name: string }) => g.name),
      language: 'Japanese',
    }));
  } catch {
    return [];
  }
}

/** Fetch a batch of movies from the curated TRENDING_MOVIE_IMDB_IDS list. */
export async function getMovieBatch(offset: number, count: number): Promise<MediaItem[]> {
  const apiKey = process.env.OMDB_API_KEY;
  if (!apiKey) return [];

  // Deduplicate the pool first, then slice
  const uniqueIds = [...new Set(TRENDING_MOVIE_IMDB_IDS)];
  const batch = uniqueIds.slice(offset, offset + count);
  if (batch.length === 0) return [];

  const results = await Promise.allSettled(
    batch.map(id => getOMDbMovie(`omdb_${id}`))
  );

  return results
    .filter(
      (r): r is PromiseFulfilledResult<MediaItem | null> =>
        r.status === 'fulfilled'
    )
    .map(r => r.value)
    .filter((m): m is MediaItem => m !== null);
}

export async function getFeedPool(): Promise<MediaItem[]> {
  // Fetch a larger pool for filtering/scoring
  const [anime, tv, movies] = await Promise.all([
    getTrendingAnime(),
    getTrendingTVPage0(),
    getTrendingMovies(),
  ]);
  return [...anime, ...tv, ...movies];
}

async function getTrendingTVPage0(): Promise<MediaItem[]> {
  try {
    const url = `${TVMAZE_BASE}/shows?page=0`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const data = await res.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data as any[]).slice(0, 20).map((s) => mapTVMazeShow(s));
  } catch {
    return [];
  }
}

// ── Watch-time estimation ─────────────────────────────────────────────────────

export interface WatchTimeResult {
  totalMinutes: number;
  isEstimated: boolean;
}

export async function getMediaRuntimeMinutes(
  mediaId: string,
  mediaType: 'movie' | 'tv' | 'anime'
): Promise<{ minutes: number; estimated: boolean } | null> {
  try {
    if (mediaType === 'movie') {
      const item = await getOMDbMovie(mediaId);
      if (!item?.runtime_minutes) return null;
      return { minutes: item.runtime_minutes, estimated: false };
    }

    if (mediaType === 'tv') {
      const item = await getTVMazeShow(mediaId);
      if (!item) return null;
      const runtime = item.runtime_minutes ?? 45; // fallback 45 min/ep
      const eps = item.episode_count ?? (item.seasons ? item.seasons * 10 : 1);
      return { minutes: runtime * eps, estimated: !item.runtime_minutes || !item.episode_count };
    }

    if (mediaType === 'anime') {
      const item = await getJikanAnime(
        mediaId.startsWith('mal_') ? mediaId.slice(4) : mediaId
      );
      if (!item) return null;
      const epDuration = item.duration_minutes ?? 24; // fallback 24 min/ep
      const eps = item.episodes ?? 12; // fallback 12 eps
      return { minutes: epDuration * eps, estimated: !item.duration_minutes || !item.episodes };
    }

    return null;
  } catch {
    return null;
  }
}
