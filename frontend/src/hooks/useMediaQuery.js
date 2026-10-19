import { useEffect, useState } from 'react';

const getMatch = (query) => (typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(query).matches : false);

// Tracks a CSS media query, e.g. useMediaQuery('(max-width: 767px)').
export default function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => getMatch(query));

  useEffect(() => {
    if (!window.matchMedia) return undefined;
    const media = window.matchMedia(query);
    const update = () => setMatches(media.matches);
    update();
    media.addEventListener?.('change', update);
    return () => media.removeEventListener?.('change', update);
  }, [query]);

  return matches;
}

export const MOBILE_QUERY = '(max-width: 767px)';
