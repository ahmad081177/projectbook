export type BadgeStatus = 'success' | 'warning' | 'error' | 'idle' | 'info';

interface BadgeProps {
  status?: BadgeStatus;
  children: React.ReactNode;
  className?: string;
}

const statusClasses: Record<BadgeStatus, string> = {
  success: 'bg-green-100 text-green-800',
  warning: 'bg-amber-100 text-amber-800',
  error: 'bg-red-100 text-red-800',
  idle: 'bg-gray-100 text-gray-600',
  info: 'bg-blue-100 text-blue-800',
};

export default function Badge({ status = 'idle', children, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusClasses[status]} ${className}`}
    >
      {children}
    </span>
  );
}
