import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Wind,
  Activity,
  Flower2,
  Sun,
  Clock,
  Star,
  TrendingUp,
  Heart,
  Waves,
  ChevronRight,
} from "lucide-react";

interface Exercise {
  id: string;
  name: string;
  description: string;
  duration: number; // in seconds
  category: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  color: string;
  icon: React.ComponentType<{
    className?: string;
    style?: React.CSSProperties;
  }>;
}

export default function WellnessTab() {
  const router = useRouter();
  const [completedToday, setCompletedToday] = useState<string[]>([
    "box-breathing",
    "mindful-moment",
  ]);

  const exercises: Exercise[] = [
    {
      id: "box-breathing",
      name: "Box Breathing",
      description: "A calming technique to reduce stress and anxiety",
      duration: 240, // 4 minutes
      category: "breathing",
      difficulty: "beginner",
      color: "#3b82f6", // blue-500
      icon: Wind,
    },
    {
      id: "478-breathing",
      name: "4-7-8 Breathing",
      description: "Natural tranquilizer for the nervous system",
      duration: 180, // 3 minutes
      category: "breathing",
      difficulty: "intermediate",
      color: "#8b5cf6", // violet-500
      icon: Waves,
    },
    {
      id: "body-scan",
      name: "Quick Body Scan",
      description: "Release tension and increase body awareness",
      duration: 300, // 5 minutes
      category: "meditation",
      difficulty: "beginner",
      color: "#ec4899", // pink-500
      icon: Activity,
    },
    {
      id: "5-senses",
      name: "5 Senses Grounding",
      description: "Ground yourself in the present moment",
      duration: 120, // 2 minutes
      category: "grounding",
      difficulty: "beginner",
      color: "#10b981", // emerald-500
      icon: Flower2,
    },
    {
      id: "loving-kindness",
      name: "Loving Kindness",
      description: "Cultivate compassion for yourself and others",
      duration: 300, // 5 minutes
      category: "meditation",
      difficulty: "intermediate",
      color: "#f43f5e", // rose-500
      icon: Heart,
    },
    {
      id: "mindful-moment",
      name: "Mindful Moment",
      description: "A brief pause to center yourself",
      duration: 60, // 1 minute
      category: "mindfulness",
      difficulty: "beginner",
      color: "#f59e0b", // amber-500
      icon: Sun,
    },
  ];

  const handleExerciseClick = (exerciseId: string) => {
    // Navigate to the exercise page
    router.push(`/dashboard/wellness/${exerciseId}`);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const totalPracticeTime = completedToday.reduce((acc, id) => {
    const exercise = exercises.find((e) => e.id === id);
    return acc + (exercise?.duration || 0);
  }, 0);

  return (
    <div className="max-w-6xl mx-auto">
      {/* Stats Cards - Minimal design */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
        <motion.div
          className="bg-white/30 backdrop-blur-sm rounded-2xl border border-white/40 p-5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-purple-500" />
            <div>
              <div className="text-2xl font-light text-gray-900">
                {completedToday.length}
              </div>
              <div className="text-xs text-gray-500 font-light">Completed</div>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="bg-white/30 backdrop-blur-sm rounded-2xl border border-white/40 p-5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-blue-500" />
            <div>
              <div className="text-2xl font-light text-gray-900">
                {Math.floor(totalPracticeTime / 60)}m
              </div>
              <div className="text-xs text-gray-500 font-light">
                Practice Time
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="bg-white/30 backdrop-blur-sm rounded-2xl border border-white/40 p-5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center gap-3">
            <Star className="w-5 h-5 text-amber-500" />
            <div>
              <div className="text-2xl font-light text-gray-900">7</div>
              <div className="text-xs text-gray-500 font-light">Day Streak</div>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="bg-white/30 backdrop-blur-sm rounded-2xl border border-white/40 p-5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center gap-3">
            <Activity className="w-5 h-5 text-emerald-500" />
            <div>
              <div className="text-2xl font-light text-gray-900">Calm</div>
              <div className="text-xs text-gray-500 font-light">
                Current Mood
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Exercise Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {exercises.map((exercise, index) => {
          const Icon = exercise.icon;
          const isCompleted = completedToday.includes(exercise.id);

          return (
            <motion.button
              key={exercise.id}
              onClick={() => handleExerciseClick(exercise.id)}
              className="bg-white/30 backdrop-blur-sm rounded-3xl border border-white/40 p-6 text-left hover:bg-white/50 hover:border-white/60 transition-all group"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ y: -5 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-start justify-between mb-4">
                <Icon
                  className="w-8 h-8 transition-colors duration-300"
                  style={{ color: exercise.color }}
                />

                {isCompleted && (
                  <motion.div
                    className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50/50 backdrop-blur-sm px-2 py-1 rounded-full"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                  >
                    <Star className="w-3 h-3" />
                    Done
                  </motion.div>
                )}
              </div>

              <h3 className="text-lg font-medium text-gray-800 mb-2">
                {exercise.name}
              </h3>
              <p className="text-sm text-gray-600 font-light mb-4">
                {exercise.description}
              </p>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatTime(exercise.duration)}
                  </span>
                  <span>•</span>
                  <span className="capitalize">{exercise.difficulty}</span>
                </div>

                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-all group-hover:translate-x-1" />
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Recent Activity */}
      <motion.div
        className="mt-12 bg-gradient-to-br from-indigo-50/30 to-purple-50/30 backdrop-blur-sm rounded-3xl border border-white/40 p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <h3 className="text-base font-medium text-gray-800 mb-4">
          Recent Activity
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-3">
              <Wind className="w-4 h-4 text-blue-500" />
              <span className="text-gray-700">Box Breathing</span>
            </div>
            <span className="text-gray-500 font-light">2 hours ago</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-3">
              <Sun className="w-4 h-4 text-amber-500" />
              <span className="text-gray-700">Mindful Moment</span>
            </div>
            <span className="text-gray-500 font-light">5 hours ago</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-3">
              <Heart className="w-4 h-4 text-rose-500" />
              <span className="text-gray-700">Loving Kindness</span>
            </div>
            <span className="text-gray-500 font-light">Yesterday</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
