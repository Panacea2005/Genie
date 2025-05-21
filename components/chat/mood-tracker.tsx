// components/MoodTracker.tsx
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, ChevronLeft, ChevronRight, BarChart2, List } from 'lucide-react';
import { MoodEntry } from '@/lib/services/chatStore';

interface MoodData {
  date: string;
  moods: MoodEntry[];
}

interface MoodTrackerProps {
  moodData: MoodData[];
  onNewEntry?: (mood: string, intensity: number, notes?: string) => void;
  className?: string;
}

export default function MoodTracker({
  moodData = [],
  onNewEntry,
  className = ''
}: MoodTrackerProps) {
  const [view, setView] = useState<'calendar' | 'chart' | 'list'>('calendar');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [moodStats, setMoodStats] = useState<{[key: string]: number}>({});
  
  // Calculate mood statistics
  useEffect(() => {
    const stats: {[key: string]: number} = {};
    
    moodData.forEach(data => {
      data.moods.forEach(mood => {
        if (!stats[mood.mood]) {
          stats[mood.mood] = 0;
        }
        stats[mood.mood]++;
      });
    });
    
    setMoodStats(stats);
  }, [moodData]);
  
  // Generate days for the calendar view
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    // Get the first day of the month
    const firstDay = new Date(year, month, 1);
    const firstDayOfWeek = firstDay.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // Get the number of days in the month
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Create an array for the days
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push({ day: null, date: null });
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateString = date.toISOString().split('T')[0];
      
      // Find moods for this date
      const dayMoods = moodData.find(d => d.date === dateString)?.moods || [];
      
      days.push({
        day,
        date,
        moods: dayMoods
      });
    }
    
    return days;
  };
  
  const getDayColor = (moods: MoodEntry[]) => {
    if (!moods || moods.length === 0) return 'bg-gray-100';
    
    // Get the average intensity
    const avgIntensity = moods.reduce((sum, mood) => sum + mood.intensity, 0) / moods.length;
    
    // Map common moods to colors
    const moodColors: {[key: string]: string} = {
      'Happy': 'bg-yellow-200',
      'Calm': 'bg-green-200',
      'Sad': 'bg-blue-200',
      'Anxious': 'bg-purple-200',
      'Angry': 'bg-red-200',
      'Overwhelmed': 'bg-indigo-200',
      'Tired': 'bg-gray-200',
      'Hopeful': 'bg-teal-200'
    };
    
    // Just use the most recent mood for color
    const latestMood = moods[moods.length - 1];
    
    return moodColors[latestMood.mood] || 'bg-gray-100';
  };
  
  const getMonthName = (date: Date) => {
    return date.toLocaleString('default', { month: 'long' });
  };
  
  const getPreviousMonth = () => {
    const prevMonth = new Date(currentMonth);
    prevMonth.setMonth(prevMonth.getMonth() - 1);
    setCurrentMonth(prevMonth);
  };
  
  const getNextMonth = () => {
    const nextMonth = new Date(currentMonth);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    setCurrentMonth(nextMonth);
  };
  
  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
  };
  
  const renderCalendarView = () => {
    const days = generateCalendarDays();
    
    return (
      <div>
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={getPreviousMonth}
            className="p-1 rounded-full hover:bg-gray-100"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <h3 className="text-base font-medium">
            {getMonthName(currentMonth)} {currentMonth.getFullYear()}
          </h3>
          
          <button
            onClick={getNextMonth}
            className="p-1 rounded-full hover:bg-gray-100"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-xs text-center text-gray-500 font-medium">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, i) => (
            <div key={i} className="aspect-square">
              {day.day ? (
                <button
                  className={`w-full h-full rounded-lg flex flex-col items-center justify-center text-xs relative ${
                    day.moods?.length 
                      ? getDayColor(day.moods) 
                      : 'bg-gray-100 text-gray-800'
                  } ${
                    selectedDate && selectedDate.toDateString() === day.date?.toDateString()
                      ? 'ring-2 ring-blue-500'
                      : ''
                  }`}
                  onClick={() => day.date && handleDateClick(day.date)}
                >
                  <span>{day.day}</span>
                  
                  {day.moods && day.moods.length > 0 && (
                    <div className="absolute bottom-1 flex space-x-0.5">
                      {day.moods.length > 3 
                        ? <span className="text-[8px]">+{day.moods.length}</span>
                        : day.moods.slice(0, 3).map((m, i) => (
                            <div key={i} className="w-1 h-1 rounded-full bg-gray-800/30" />
                          ))
                      }
                    </div>
                  )}
                </button>
              ) : (
                <div className="w-full h-full"></div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  const renderChartView = () => {
    const sortedStats = Object.entries(moodStats)
      .sort((a, b) => b[1] - a[1]);
    
    const maxCount = Math.max(...Object.values(moodStats));
    
    return (
      <div>
        <h3 className="text-base font-medium mb-4">Mood Distribution</h3>
        
        <div className="space-y-2">
          {sortedStats.map(([mood, count]) => (
            <div key={mood} className="flex items-center">
              <div className="w-20 text-sm">{mood}</div>
              <div className="flex-grow">
                <div className="h-5 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(count / maxCount) * 100}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className={`h-full ${getMoodColor(mood)}`}
                  />
                </div>
              </div>
              <div className="w-8 text-right text-sm">{count}</div>
            </div>
          ))}
        </div>
        
        {Object.keys(moodStats).length === 0 && (
          <div className="text-center py-4 text-gray-500">
            No mood data available yet.
          </div>
        )}
      </div>
    );
  };
  
  const renderListView = () => {
    // Flatten and sort mood entries by date (newest first)
    const allEntries = moodData
      .flatMap(data => data.moods.map(mood => ({
        ...mood,
        date: data.date
      })))
      .sort((a, b) => {
        const dateA = new Date(a.timestamp || a.date).getTime();
        const dateB = new Date(b.timestamp || b.date).getTime();
        return dateB - dateA;
      });
    
    return (
      <div>
        <h3 className="text-base font-medium mb-4">Mood History</h3>
        
        {allEntries.length > 0 ? (
          <div className="space-y-3">
            {allEntries.map((entry, i) => (
              <div 
                key={i} 
                className="border border-gray-100 rounded-lg p-3 bg-white"
              >
                <div className="flex justify-between items-start">
                  <div className={`px-2 py-1 rounded-full text-xs ${getMoodColor(entry.mood)}`}>
                    {entry.mood}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatDate(entry.timestamp || new Date(entry.date))}
                  </div>
                </div>
                
                <div className="mt-2 flex items-center">
                  <div className="text-sm mr-2">Intensity:</div>
                  <div className="h-2 bg-gray-200 rounded-full flex-grow overflow-hidden">
                    <div 
                      className={`h-full ${getMoodColor(entry.mood)}`}
                      style={{ width: `${(entry.intensity / 10) * 100}%` }}
                    />
                  </div>
                  <div className="text-xs ml-2">{entry.intensity}/10</div>
                </div>
                
                {entry.notes && (
                  <div className="mt-2 text-sm text-gray-600 border-t border-gray-100 pt-2">
                    {entry.notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500">
            No mood entries recorded yet.
          </div>
        )}
      </div>
    );
  };
  
  const getMoodColor = (mood: string): string => {
    const moodColors: {[key: string]: string} = {
      'Happy': 'bg-yellow-200',
      'Calm': 'bg-green-200',
      'Sad': 'bg-blue-200',
      'Anxious': 'bg-purple-200',
      'Angry': 'bg-red-200',
      'Overwhelmed': 'bg-indigo-200',
      'Tired': 'bg-gray-200',
      'Hopeful': 'bg-teal-200'
    };
    
    return moodColors[mood] || 'bg-gray-200';
  };
  
  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    }).format(date);
  };
  
  return (
    <div className={`bg-white/80 backdrop-blur-sm rounded-lg border border-gray-100 p-4 ${className}`}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium text-gray-800">Mood Tracker</h2>
        
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-0.5">
          <button
            onClick={() => setView('calendar')}
            className={`p-1.5 rounded-md text-xs flex items-center ${
              view === 'calendar' ? 'bg-white shadow-sm' : 'text-gray-500'
            }`}
          >
            <Calendar className="w-3 h-3 mr-1" />
            Calendar
          </button>
          <button
            onClick={() => setView('chart')}
            className={`p-1.5 rounded-md text-xs flex items-center ${
              view === 'chart' ? 'bg-white shadow-sm' : 'text-gray-500'
            }`}
          >
            <BarChart2 className="w-3 h-3 mr-1" />
            Chart
          </button>
          <button
            onClick={() => setView('list')}
            className={`p-1.5 rounded-md text-xs flex items-center ${
              view === 'list' ? 'bg-white shadow-sm' : 'text-gray-500'
            }`}
          >
            <List className="w-3 h-3 mr-1" />
            List
          </button>
        </div>
      </div>
      
      <div className="mb-4">
        {view === 'calendar' && renderCalendarView()}
        {view === 'chart' && renderChartView()}
        {view === 'list' && renderListView()}
      </div>
      
      {selectedDate && view === 'calendar' && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-medium">
              {selectedDate.toLocaleDateString('en-US', { 
                weekday: 'long',
                month: 'long', 
                day: 'numeric' 
              })}
            </h3>
            <button
              onClick={() => setSelectedDate(null)}
              className="text-xs text-gray-500"
            >
              Close
            </button>
          </div>
          
          {/* Show moods for selected date */}
          {(() => {
            const dateString = selectedDate.toISOString().split('T')[0];
            const dayData = moodData.find(d => d.date === dateString);
            
            if (!dayData || dayData.moods.length === 0) {
              return (
                <div className="text-sm text-gray-500">
                  No mood entries for this date.
                </div>
              );
            }
            
            return (
              <div className="space-y-2">
                {dayData.moods.map((mood, i) => (
                  <div 
                    key={i}
                    className="bg-gray-50 rounded-lg p-2 text-sm"
                  >
                    <div className="flex justify-between">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${getMoodColor(mood.mood)}`}>
                        {mood.mood}
                      </span>
                      <span className="text-xs text-gray-500">
                        {mood.timestamp 
                          ? new Date(mood.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                          : ''}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center">
                      <span className="text-xs mr-1">Intensity:</span>
                      <div className="h-1.5 bg-gray-200 rounded-full flex-grow">
                        <div 
                          className={getMoodColor(mood.mood)}
                          style={{ width: `${(mood.intensity / 10) * 100}%`, height: '100%' }}
                        />
                      </div>
                      <span className="text-xs ml-1">{mood.intensity}/10</span>
                    </div>
                    {mood.notes && (
                      <div className="mt-1 text-xs">{mood.notes}</div>
                    )}
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}