import { useState, useEffect } from 'react';

interface AvatarProps {
  src?: string | File | null;
  name: string;
  size?: number;
  status?: string;
  style?: React.CSSProperties;
}

export default function Avatar({ src, name, size = 32, status = 'Active', style }: AvatarProps) {
  const [error, setError] = useState(false);

  useEffect(() => {
    setError(false);
  }, [src]);

  const initials = name
    ? name
        .trim()
        .split(/\s+/)
        .map((x) => x[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()
    : 'CU';

  const color = status === 'Active' ? '#14b8a6' : '#64748b';

  // Determine the image source URL
  let imgUrl: string | null = null;
  if (src) {
    if (src instanceof File) {
      imgUrl = URL.createObjectURL(src);
    } else if (typeof src === 'string' && src.trim().length > 0) {
      // Sometimes backend returns "null" as string
      if (src !== 'null') {
        imgUrl = src;
      }
    }
  }

  if (imgUrl && !error) {
    return (
      <img
        src={imgUrl}
        alt={name}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          objectFit: 'cover',
          flexShrink: 0,
          ...style,
        }}
        onError={() => setError(true)}
      />
    );
  }

  // Fallback avatar with User icon or Initials
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: color,
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: `${size * 0.375}px`,
        fontWeight: 600,
        flexShrink: 0,
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        ...style,
      }}
    >
      {initials}
    </div>
  );
}
