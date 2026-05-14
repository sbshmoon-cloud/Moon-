import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { useEffect, useState } from 'react';
import { Task, Course } from '../types';
import { motion } from 'motion/react';
import { CheckCircle2, Clock, Calendar as CalendarIcon, ArrowRight } from 'lucide-react';
import { formatDate, getStatusColor, getPriorityColor } from '../lib/utils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) return;

    const tasksQuery = query(
      collection(db, 'tasks'),
      where('userId', '==', auth.currentUser.uid),
      orderBy('dueDate', 'asc'),
      limit(5)
    );

    const unsubscribeTasks = onSnapshot(tasksQuery, (snapshot) => {
      setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task)));
      setLoading(false);
    });

    const coursesQuery = query(
      collection(db, 'courses'),
      where('userId', '==', auth.currentUser.uid)
    );

    const unsubscribeCourses = onSnapshot(coursesQuery, (snapshot) => {
      setCourses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course)));
    });

    return () => {
      unsubscribeTasks();
      unsubscribeCourses();
    };
  }, []);

  const stats = [
    { label: 'Upcoming Tasks', value: tasks.filter(t => t.status !== 'completed').length, icon: Clock, color: 'text-blue-600' },
    { label: 'Completed', value: tasks.filter(t => t.status === 'completed').length, icon: CheckCircle2, color: 'text-green-600' },
    { label: 'Active Courses', value: courses.length, icon: CalendarIcon, color: 'text-indigo-600' },
  ];

  // Dummy data for activity chart
  const activityData = [
    { day: 'Mon', focus: 120 },
    { day: 'Tue', focus: 180 },
    { day: 'Wed', focus: 90 },
    { day: 'Thu', focus: 240 },
    { day: 'Fri', focus: 150 },
    { day: 'Sat', focus: 60 },
    { day: 'Sun', focus: 30 },
  ];

  return (
    <div className="flex-1 overflow-auto bg-[#FBFBFA] p-12">
      <header className="mb-12">
        <h1 className="text-4xl font-bold text-slate-900 tracking-tight mb-2 italic serif font-serif">Welcome back, {auth.currentUser?.displayName?.split(' ')[0]}</h1>
        <p className="text-slate-500 font-medium">Here's your academic agenda for today.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-8 rounded-[24px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-100 flex items-center justify-between"
          >
            <div>
              <p className="text-slate-400 text-sm uppercase tracking-widest font-bold mb-1">{stat.label}</p>
              <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
            </div>
            <div className={cn("p-4 rounded-2xl bg-slate-50", stat.color)}>
              <stat.icon className="w-6 h-6" />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Activity Chart */}
        <section className="bg-white p-10 rounded-[32px] shadow-[0_4px_25px_rgba(0,0,0,0.02)] border border-slate-100">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold text-slate-900">Focus Intensity</h2>
            <select className="bg-slate-50 border-none text-sm font-bold text-slate-500 rounded-lg px-3 py-1 outline-none">
              <option>Last 7 Days</option>
            </select>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 600}} />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}}
                />
                <Line type="monotone" dataKey="focus" stroke="#0f172a" strokeWidth={3} dot={{r: 6, fill: '#0f172a', strokeWidth: 0}} activeDot={{r: 8}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Priority Tasks */}
        <section className="bg-white p-10 rounded-[32px] shadow-[0_4px_25px_rgba(0,0,0,0.02)] border border-slate-100">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold text-slate-900 leading-none">Critical Deadlines</h2>
            <button className="text-slate-400 hover:text-slate-900 transition-colors">
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-4">
            {tasks.length === 0 ? (
              <p className="text-slate-400 text-center py-12 italic">Clear skies ahead. No critical tasks.</p>
            ) : (
              tasks.map((task) => (
                <div key={task.id} className="group flex items-center gap-6 p-4 rounded-2xl hover:bg-slate-50 transition-all cursor-pointer border border-transparent hover:border-slate-100">
                  <div className={cn("w-1 h-12 rounded-full", task.priority === 'high' ? 'bg-red-400' : 'bg-slate-200')} />
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-900 mb-0.5">{task.title}</h3>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-tight">{formatDate(task.dueDate.toDate())}</p>
                  </div>
                  <span className={cn("px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider", getStatusColor(task.status))}>
                    {task.status.replace('_', ' ')}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
