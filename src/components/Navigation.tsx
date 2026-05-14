import { ViewType } from '../types';
import { auth } from '../lib/firebase';
import { 
  LayoutDashboard, 
  BookOpen, 
  CheckSquare, 
  Calendar, 
  Timer, 
  LogOut,
  GraduationCap
} from 'lucide-react';
import { cn } from '../lib/utils';

interface NavigationProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
}

export default function Navigation({ currentView, onViewChange }: NavigationProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'courses', label: 'Courses', icon: BookOpen },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'focus', label: 'Focus', icon: Timer },
  ];

  return (
    <div className="w-64 border-r border-slate-100 h-screen flex flex-col bg-white overflow-hidden shrink-0">
      <div className="p-8 flex items-center gap-3 mb-4">
        <div className="bg-slate-900 p-2 rounded-lg">
          <GraduationCap className="text-white w-5 h-5" />
        </div>
        <span className="font-bold text-xl tracking-tight text-slate-900">ScholarFlow</span>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id as ViewType)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 group relative",
              currentView === item.id 
                ? "bg-slate-900 text-white shadow-md shadow-slate-200" 
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
            )}
            id={`nav-${item.id}`}
          >
            <item.icon className={cn(
              "w-5 h-5",
              currentView === item.id ? "text-white" : "text-slate-400 group-hover:text-slate-900"
            )} />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-50">
        <button
          onClick={() => auth.signOut()}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all group"
          id="logout-button"
        >
          <LogOut className="w-5 h-5 group-hover:text-red-500" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
