type TextSize = 'sm' | 'md' | 'lg';

interface BodyTextProps {
  size?: TextSize;
  children: React.ReactNode;
  className?: string;
  muted?: boolean;
}

const sizeClasses: Record<TextSize, string> = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
};

export default function BodyText({ size = 'md', children, className = '', muted = false }: BodyTextProps) {
  return (
    <p className={`${sizeClasses[size]} ${muted ? 'text-gray-500' : 'text-gray-700'} ${className}`}>
      {children}
    </p>
  );
}
