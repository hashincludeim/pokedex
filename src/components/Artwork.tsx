import { useState } from 'react';
import { Pokeball } from './Icons';

interface ArtworkProps {
  src: string;
  alt: string;
  className?: string;
  eager?: boolean;
}

/** Official artwork with a lazy load, fade-in, and a Poké Ball placeholder when the image is missing. */
export function Artwork({ src, alt, className = '', eager = false }: ArtworkProps) {
  const [status, setStatus] = useState<{ src: string; state: 'loading' | 'loaded' | 'error' }>({
    src,
    state: 'loading',
  });
  const state = status.src === src ? status.state : 'loading';

  if (state === 'error') {
    return (
      <div className={`artwork artwork--missing ${className}`} role="img" aria-label={alt}>
        <Pokeball size={48} />
      </div>
    );
  }

  return (
    <img
      className={`artwork ${state === 'loaded' ? 'is-loaded' : ''} ${className}`}
      src={src}
      alt={alt}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      draggable={false}
      onLoad={() => setStatus({ src, state: 'loaded' })}
      onError={() => setStatus({ src, state: 'error' })}
    />
  );
}
