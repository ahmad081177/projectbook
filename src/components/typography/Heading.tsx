type HeadingLevel = 1 | 2 | 3 | 4;

interface HeadingProps {
  level?: HeadingLevel;
  children: React.ReactNode;
  className?: string;
}

const levelClasses: Record<HeadingLevel, string> = {
  1: 'text-2xl font-bold text-gray-900',
  2: 'text-xl font-semibold text-gray-900',
  3: 'text-lg font-semibold text-gray-800',
  4: 'text-base font-semibold text-gray-800',
};

export default function Heading({ level = 2, children, className = '' }: HeadingProps) {
  const Tag = `h${level}` as 'h1' | 'h2' | 'h3' | 'h4';
  return (
    <Tag className={`${levelClasses[level]} ${className}`}>{children}</Tag>
  );
}
