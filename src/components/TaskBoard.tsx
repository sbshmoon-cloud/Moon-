import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { Task, TaskStatus, Priority, Course } from '../types';
import { Plus, Sparkles, Trash2, Calendar, Layout, ListTodo, MoreVertical, X } from 'lucide-react';
import { cn, formatDate } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { breakdownTask } from '../lib/ai';

export default function TaskBoard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  
  // Form state
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [newPriority, setNewPriority] = useState<Priority>('medium');
  const [newCourse, setNewCourse] = useState('');

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(collection(db, 'tasks'), where('userId', '==', auth.currentUser.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'tasks'));

    const cq = query(collection(db, 'courses'), where('userId', '==', auth.currentUser.uid));
    const unsubscribeCourses = onSnapshot(cq, (snapshot) => {
      setCourses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course)));
    });

    return () => {
      unsubscribe();
      unsubscribeCourses();
    };
  }, []);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !newTitle || !newDueDate) return;

    try {
      await addDoc(collection(db, 'tasks'), {
        userId: auth.currentUser.uid,
        title: newTitle,
        description: newDesc,
        dueDate: Timestamp.fromDate(new Date(newDueDate)),
        status: 'todo',
        priority: newPriority,
        courseId: newCourse || null,
        subTasks: [],
        createdAt: serverTimestamp(),
      });
      resetForm();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'tasks');
    }
  };

  const resetForm = () => {
    setNewTitle('');
    setNewDesc('');
    setNewDueDate('');
    setNewPriority('medium');
    setNewCourse('');
    setIsModalOpen(false);
  };

  const handleStatusChange = async (taskId: string, status: TaskStatus) => {
    try {
      await updateDoc(doc(db, 'tasks', taskId), { status, updatedAt: serverTimestamp() });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `tasks/${taskId}`);
    }
  };

  const handleAiBreakdown = async (task: Task) => {
    if (task.subTasks.length > 0) return;
    setIsAiLoading(true);
    const subTasks = await breakdownTask(task.title, task.description);
    if (subTasks.length > 0) {
      try {
        await updateDoc(doc(db, 'tasks', task.id), { subTasks, updatedAt: serverTimestamp() });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `tasks/${task.id}`);
      }
    }
    setIsAiLoading(false);
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteDoc(doc(db, 'tasks', taskId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `tasks/${taskId}`);
    }
  };

  const toggleSubTask = async (task: Task, subTaskId: string) => {
    const updatedSubTasks = task.subTasks.map(st => 
      st.id === subTaskId ? { ...st, completed: !st.completed } : st
    );
    try {
      await updateDoc(doc(db, 'tasks', task.id), { subTasks: updatedSubTasks, updatedAt: serverTimestamp() });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `tasks/${task.id}`);
    }
  };

  return (
    <div className="flex-1 overflow-auto bg-[#FBFBFA] p-12">
      <header className="flex items-center justify-between mb-12">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Academic Tasks</h1>
          <p className="text-slate-500 font-medium">Coordinate your study load and track milestones.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-slate-910 bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-xl shadow-slate-200 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          Add Entry
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {(['todo', 'in_progress', 'completed'] as TaskStatus[]).map((status) => (
          <div key={status} className="flex flex-col gap-4">
            <div className="flex items-center justify-between px-2 mb-2">
              <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                <div className={cn("w-2 h-2 rounded-full", 
                  status === 'todo' ? "bg-slate-300" : status === 'in_progress' ? "bg-blue-400" : "bg-green-400"
                )} />
                {status.replace('_', ' ')}
              </h2>
              <span className="text-xs font-bold text-slate-300 bg-white px-2 py-0.5 rounded-full border border-slate-100 shadow-sm">
                {tasks.filter(t => t.status === status).length}
              </span>
            </div>

            <div className="space-y-4">
              {tasks.filter(t => t.status === status).map((task) => (
                <motion.div
                  layoutId={task.id}
                  key={task.id}
                  className="bg-white p-6 rounded-[24px] shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-slate-100 group relative"
                >
                  <div className="flex items-start justify-between mb-4">
                    <span className={cn("px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-tighter", 
                      task.priority === 'high' ? 'bg-red-50 text-red-500' : 
                      task.priority === 'medium' ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-400'
                    )}>
                      {task.priority}
                    </span>
                    <button onClick={() => handleDeleteTask(task.id)} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-50 rounded-lg">
                      <Trash2 className="w-4 h-4 text-slate-300 hover:text-red-500" />
                    </button>
                  </div>
                  
                  <h3 className="font-bold text-slate-900 mb-2 leading-snug">{task.title}</h3>
                  
                  {task.courseId && (
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: courses.find(c => c.id === task.courseId)?.color || '#e2e8f0' }} />
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                        {courses.find(c => c.id === task.courseId)?.title}
                      </span>
                    </div>
                  )}

                  {task.subTasks.length > 0 && (
                    <div className="mb-4 space-y-2 border-t border-slate-50 pt-4">
                      {task.subTasks.map(st => (
                        <div key={st.id} className="flex items-center gap-2 group/sub">
                          <button 
                            onClick={() => toggleSubTask(task, st.id)}
                            className={cn("w-4 h-4 rounded border transition-colors", 
                              st.completed ? "bg-slate-900 border-slate-900 flex items-center justify-center" : "border-slate-200"
                            )}
                          >
                            {st.completed && <CheckSquare className="w-3 h-3 text-white" />}
                          </button>
                          <span className={cn("text-xs transition-all", st.completed ? "text-slate-300 line-through" : "text-slate-600 font-medium")}>
                            {st.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-50">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Calendar className="w-3 h-3" />
                      <span className="text-[10px] font-bold tracking-tight">{formatDate(task.dueDate.toDate())}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                       {task.subTasks.length === 0 && (
                        <button 
                          onClick={() => handleAiBreakdown(task)}
                          disabled={isAiLoading}
                          className="p-1.5 hover:bg-indigo-50 rounded-lg transition-colors group/ai"
                          title="Generate AI Roadmap"
                        >
                          <Sparkles className={cn("w-4 h-4", isAiLoading ? "animate-pulse text-indigo-400" : "text-slate-300 group-hover:text-indigo-500")} />
                        </button>
                      )}
                      <select 
                        value={task.status}
                        onChange={(e) => handleStatusChange(task.id, e.target.value as TaskStatus)}
                        className="bg-slate-50 border-none text-[10px] font-black uppercase text-slate-400 rounded-lg px-2 py-0.5 outline-none cursor-pointer hover:bg-slate-100 transition-colors"
                      >
                        <option value="todo">Todo</option>
                        <option value="in_progress">Doing</option>
                        <option value="completed">Done</option>
                      </select>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-lg rounded-[32px] shadow-2xl p-8 overflow-hidden"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">New Assessment</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-50 rounded-xl">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <form onSubmit={handleCreateTask} className="space-y-6">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Subject Title</label>
                  <input 
                    required 
                    value={newTitle} 
                    onChange={e => setNewTitle(e.target.value)}
                    placeholder="e.g. Molecular Biology Quiz"
                    className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 text-slate-900 font-semibold focus:border-slate-900 focus:bg-white transition-all outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Reference Date</label>
                    <input 
                      required 
                      type="date"
                      value={newDueDate} 
                      onChange={e => setNewDueDate(e.target.value)}
                      className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 text-slate-900 font-semibold focus:border-slate-900 transition-all outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Associated Course</label>
                    <select 
                      value={newCourse}
                      onChange={e => setNewCourse(e.target.value)}
                      className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 text-slate-900 font-semibold focus:border-slate-900 transition-all outline-none appearance-none"
                    >
                      <option value="">No Course</option>
                      {courses.map(course => (
                        <option key={course.id} value={course.id}>{course.title}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Urgency Level</label>
                  <div className="flex gap-2">
                    {(['low', 'medium', 'high'] as Priority[]).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setNewPriority(p)}
                        className={cn(
                          "flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all",
                          newPriority === p ? "bg-slate-900 text-white shadow-lg" : "bg-slate-50 text-slate-400 hover:bg-slate-100"
                        )}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full bg-slate-900 text-white font-bold py-5 rounded-2xl mt-4 shadow-xl shadow-slate-200 active:scale-[0.99] transition-all"
                >
                  Confirm Entry
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CheckSquare({ className }: { className?: string }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="3" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  );
}
