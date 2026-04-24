import { MediaItem } from './media';

const STOPWORDS = new Set([
  'a','an','the','and','or','but','in','on','at','to','for','of','with',
  'is','are','was','were','be','been','being','have','has','had','do',
  'does','did','will','would','could','should','may','might','shall',
  'that','this','these','those','it','its','he','she','they','we','you',
  'his','her','their','our','your','i','my','me','him','us','them',
  'from','by','as','into','through','during','before','after','above',
  'below','between','each','more','most','other','some','such','than',
  'then','there','when','where','which','who','how','what','no','not',
  'only','same','so','if','while','about','up','out','very','just',
  'both','all','also','any','even','still','well','back','over','new',
  'own','say','go','get','make','know','take','see','come','think',
  'look','want','give','use','find','tell','ask','try','seem','feel',
  'leave','call','keep','let','begin','show','hear','play','run','move',
  'live','believe','hold','bring','happen','write','provide','sit',
  'stand','lose','pay','meet','include','continue','set','learn',
  'change','lead','understand','watch','follow','stop','create','speak',
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 2 && !STOPWORDS.has(t));
}

export interface UserProfile {
  topGenres: string[];        // top genres by frequency
  keywordWeights: Map<string, number>;  // keyword → score
}

interface WatchlistEntry {
  media_type: 'movie' | 'tv' | 'anime';
  genres?: string[];
  overview?: string;
}

export function buildUserProfile(watchlist: WatchlistEntry[]): UserProfile {
  const genreCount = new Map<string, number>();
  const keywordCount = new Map<string, number>();

  for (const item of watchlist) {
    // Genre counts
    for (const g of item.genres ?? []) {
      genreCount.set(g, (genreCount.get(g) ?? 0) + 1);
    }
    // Keyword counts from overview/synopsis
    for (const tok of tokenize(item.overview ?? '')) {
      keywordCount.set(tok, (keywordCount.get(tok) ?? 0) + 1);
    }
  }

  // Top genres sorted by count (at most 5)
  const topGenres = [...genreCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([g]) => g);

  // Keyword weights (normalised by max)
  const maxKw = Math.max(...keywordCount.values(), 1);
  const keywordWeights = new Map<string, number>();
  for (const [k, v] of keywordCount.entries()) {
    keywordWeights.set(k, v / maxKw);
  }

  return { topGenres, keywordWeights };
}

export interface ScoredItem {
  item: MediaItem;
  score: number;
  personalised: boolean;
}

const PERSONALISED_THRESHOLD = 0.25;

export function scoreItems(items: MediaItem[], profile: UserProfile): ScoredItem[] {
  const { topGenres, keywordWeights } = profile;
  if (topGenres.length === 0 && keywordWeights.size === 0) {
    return items.map(item => ({ item, score: 0, personalised: false }));
  }

  return items.map(item => {
    const itemGenres = item.genres ?? [];
    const itemText = tokenize(item.overview ?? '');

    // Genre score: strong weighting
    // Require matching top 2–3 genres for full score; partial overlap for partial
    const topN = Math.min(3, topGenres.length);
    const topSlice = topGenres.slice(0, topN);
    const matchCount = topSlice.filter(g =>
      itemGenres.some(ig => ig.toLowerCase() === g.toLowerCase())
    ).length;
    const genreScore = topN > 0 ? matchCount / topN : 0;

    // Text keyword score: secondary
    let textScore = 0;
    if (itemText.length > 0 && keywordWeights.size > 0) {
      let weightSum = 0;
      for (const tok of itemText) {
        weightSum += keywordWeights.get(tok) ?? 0;
      }
      // Normalise by text length to avoid penalising short overviews
      textScore = Math.min(1, weightSum / Math.max(itemText.length, 1) * 10);
    }

    const score = genreScore * 0.7 + textScore * 0.3;
    return { item, score, personalised: score >= PERSONALISED_THRESHOLD };
  });
}
