import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

export function getStatusColor(status: string) {
  switch (status) {
    case 'todo': return 'bg-slate-100 text-slate-700';
    case 'in_progress': return 'bg-blue-100 text-blue-700';
    case 'completed': return 'bg-green-100 text-green-700';
    default: return 'bg-slate-100 text-slate-700';
  }
}

export function getPriorityColor(priority: string) {
  switch (priority) {
    case 'low': return 'text-slate-400';
    case 'medium': return 'text-amber-500';
    case 'high': return 'text-red-500';
    default: return 'text-slate-400';
  }
}
