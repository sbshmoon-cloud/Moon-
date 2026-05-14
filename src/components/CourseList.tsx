import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { Course } from '../types';
import { Plus, X, GraduationCap, MapPin, User, Trash2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export default function CourseList() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form state
  const [newTitle, setNewTitle] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newInstructor, setNewInstructor] = useState('');
  const [newSchedule, setNewSchedule] = useState('');
  const [newColor, setNewColor] = useState('#6366f1');

  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(collection(db, 'courses'), where('userId', '==', auth.currentUser.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setCourses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'courses'));
    return () => unsubscribe();
  }, []);

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !newTitle) return;

    try {
      await addDoc(collection(db, 'courses'), {
        userId: auth.currentUser.uid,
        title: newTitle,
        code: newCode,
        instructor: newInstructor,
        schedule: newSchedule,
        color: newColor,
        createdAt: serverTimestamp(),
      });
      resetForm();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'courses');
    }
  };

  const resetForm = () => {
    setNewTitle('');
    setNewCode('');
    setNewInstructor('');
    setNewSchedule('');
    setNewColor('#6366f1');
    setIsModalOpen(false);
  };

  const handleDeleteCourse = async (courseId: string) => {
    try {
      await deleteDoc(doc(db, 'courses', courseId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `courses/${courseId}`);
    }
  };

  const colors = [
    '#6366f1', '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#d946ef', '#f43f5e'
  ];

  return (
    <div className="flex-1 overflow-auto bg-[#FBFBFA] p-12">
      <header className="flex items-center justify-between mb-12">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Curriculum</h1>
          <p className="text-slate-500 font-medium">Your academic architecture for this semester.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-xl shadow-slate-200 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          Add Course
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {courses.map((course) => (
          <motion.div
            layoutId={course.id}
            key={course.id}
             className="bg-white rounded-[32px] overflow-hidden shadow-[0_4px_25px_rgba(0,0,0,0.02)] border border-slate-100 group"
          >
            <div className="h-4" style={{ backgroundColor: course.color }} />
            <div className="p-8">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-1">{course.title}</h3>
                  <span className="text-xs font-black uppercase tracking-widest text-slate-300">{course.code}</span>
                </div>
                <button onClick={() => handleDeleteCourse(course.id)} className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-red-50 rounded-xl">
                  <Trash2 className="w-4 h-4 text-slate-300 hover:text-red-500" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-4 text-slate-500">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center">
                    <User className="w-4 h-4 text-slate-400" />
                  </div>
                  <span className="text-sm font-semibold">{course.instructor || 'Unassigned'}</span>
                </div>
                <div className="flex items-center gap-4 text-slate-500">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-slate-400" />
                  </div>
                  <span className="text-sm font-semibold">{course.schedule || 'No schedule set'}</span>
                </div>
              </div>
            </div>
            
            <div className="bg-slate-50 px-8 py-4 flex items-center justify-between">
               <div className="flex items-center gap-2">
                 <GraduationCap className="w-4 h-4 text-slate-300" />
                 <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Enrolled</span>
               </div>
               <button className="text-[10px] font-black uppercase tracking-wider text-slate-900 hover:underline">View Syllabus</button>
            </div>
          </motion.div>
        ))}

        {courses.length === 0 && (
          <div className="col-span-full border-2 border-dashed border-slate-200 rounded-[32px] p-24 text-center">
            <GraduationCap className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-400 mb-2">No Courses Enrolled</h3>
            <p className="text-slate-400 max-w-xs mx-auto">Build your curriculum by adding your current semester courses.</p>
          </div>
        )}
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
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Enroll New Course</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-50 rounded-xl">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <form onSubmit={handleCreateCourse} className="space-y-6">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Course Title</label>
                  <input 
                    required 
                    value={newTitle} 
                    onChange={e => setNewTitle(e.target.value)}
                    placeholder="e.g. Advanced Calculus"
                    className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 text-slate-900 font-semibold focus:border-slate-900 focus:bg-white transition-all outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Course Code</label>
                    <input 
                      value={newCode} 
                      onChange={e => setNewCode(e.target.value)}
                      placeholder="MATH201"
                      className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 text-slate-900 font-semibold focus:border-slate-900 transition-all outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Instructor</label>
                    <input 
                      value={newInstructor} 
                      onChange={e => setNewInstructor(e.target.value)}
                      placeholder="Dr. Smith"
                      className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 text-slate-900 font-semibold focus:border-slate-900 transition-all outline-none"
                    />
                  </div>
                </div>

                <div>
                   <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Weekly Schedule</label>
                   <input 
                      value={newSchedule} 
                      onChange={e => setNewSchedule(e.target.value)}
                      placeholder="Mon/Wed 10:00 AM - Room 402"
                      className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 text-slate-900 font-semibold focus:border-slate-900 transition-all outline-none"
                    />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">System Theme</label>
                  <div className="flex flex-wrap gap-3">
                    {colors.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setNewColor(c)}
                        className={cn(
                          "w-8 h-8 rounded-full transition-all ring-offset-2",
                          newColor === c ? "ring-2 ring-slate-900 scale-110 shadow-lg" : "hover:scale-105"
                        )}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full bg-slate-900 text-white font-bold py-5 rounded-2xl mt-4 shadow-xl shadow-slate-200 active:scale-[0.99] transition-all"
                >
                  Create Enrollment
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
