import { useState, useEffect } from 'react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addDays, 
  eachDayOfInterval 
} from 'date-fns';
import { ChevronLeft, ChevronRight, GraduationCap } from 'lucide-react';
import { cn } from '../lib/utils';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Task } from '../types';

export default function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(collection(db, 'tasks'), where('userId', '==', auth.currentUser.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task)));
    });
    return () => unsubscribe();
  }, []);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  return (
    <div className="flex-1 overflow-auto bg-[#FBFBFA] p-12">
      <header className="flex items-center justify-between mb-12">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{format(currentDate, 'MMMM yyyy')}</h1>
          <p className="text-slate-500 font-medium">Your temporal roadmap for academic success.</p>
        </div>
        <div className="flex items-center gap-2 bg-white p-1 rounded-2xl border border-slate-100 shadow-sm">
          <button onClick={prevMonth} className="p-3 hover:bg-slate-50 rounded-xl transition-colors">
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </button>
          <button onClick={nextMonth} className="p-3 hover:bg-slate-50 rounded-xl transition-colors">
            <ChevronRight className="w-5 h-5 text-slate-600" />
          </button>
        </div>
      </header>

      <div className="bg-white rounded-[32px] border border-slate-100 shadow-[0_4px_30px_rgba(0,0,0,0.02)] overflow-hidden">
        <div className="grid grid-cols-7 border-bottom border-slate-100 bg-slate-50/50">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="py-4 text-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 border-slate-100">
          {days.map((day, i) => {
            const dayTasks = tasks.filter(task => isSameDay(task.dueDate.toDate(), day));
            return (
              <div 
                key={day.toString()} 
                className={cn(
                  "min-h-[140px] p-4 border-r border-b border-slate-100 group transition-all",
                  !isSameMonth(day, monthStart) && "bg-slate-50/30 opacity-40"
                )}
              >
                <span className={cn(
                  "inline-flex items-center justify-center w-8 h-8 text-sm font-bold rounded-xl mb-3",
                  isSameDay(day, new Date()) ? "bg-slate-900 text-white shadow-lg" : "text-slate-900"
                )}>
                  {format(day, 'd')}
                </span>
                
                <div className="space-y-1.5">
                  {dayTasks.map(task => (
                    <div 
                      key={task.id} 
                      className={cn(
                        "px-2 py-1.5 rounded-lg text-[9px] font-bold truncate transition-all cursor-pointer",
                        task.status === 'completed' ? "bg-slate-50 text-slate-400 line-through" : "bg-slate-900 text-white shadow-sm"
                      )}
                    >
                      {task.title}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
