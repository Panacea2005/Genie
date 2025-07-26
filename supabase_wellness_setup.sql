-- =============================================================================
-- WELLNESS SYSTEM SETUP
-- =============================================================================
-- This script sets up the complete wellness system for tracking exercises and user completions

-- Drop existing tables if they exist (for clean reinstall)
DROP TABLE IF EXISTS wellness_completions CASCADE;
DROP TABLE IF EXISTS wellness_exercises CASCADE;

-- =============================================================================
-- WELLNESS EXERCISES TABLE
-- =============================================================================
-- Stores the available wellness exercises/activities

CREATE TABLE wellness_exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    duration_seconds INTEGER NOT NULL,
    category VARCHAR(50) NOT NULL,
    difficulty VARCHAR(20) NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    color VARCHAR(7) NOT NULL, -- Hex color code
    icon_name VARCHAR(50) NOT NULL, -- Icon identifier for frontend mapping
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_wellness_exercises_category ON wellness_exercises(category);
CREATE INDEX idx_wellness_exercises_difficulty ON wellness_exercises(difficulty);
CREATE INDEX idx_wellness_exercises_active ON wellness_exercises(is_active);

-- =============================================================================
-- WELLNESS COMPLETIONS TABLE
-- =============================================================================
-- Tracks when users complete wellness exercises

CREATE TABLE wellness_completions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    exercise_id UUID NOT NULL REFERENCES wellness_exercises(id) ON DELETE CASCADE,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    actual_duration_seconds INTEGER, -- Actual time spent (may differ from exercise duration)
    notes TEXT,
    mood_before VARCHAR(50),
    mood_after VARCHAR(50),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5), -- User rating of the session
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_wellness_completions_user_id ON wellness_completions(user_id);
CREATE INDEX idx_wellness_completions_exercise_id ON wellness_completions(exercise_id);
CREATE INDEX idx_wellness_completions_completed_at ON wellness_completions(completed_at);
CREATE INDEX idx_wellness_completions_user_date ON wellness_completions(user_id, completed_at);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

-- Enable RLS on wellness_completions (users can only see their own completions)
ALTER TABLE wellness_completions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own completions
CREATE POLICY "Users can view their own wellness completions"
    ON wellness_completions FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can insert their own completions
CREATE POLICY "Users can insert their own wellness completions"
    ON wellness_completions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own completions
CREATE POLICY "Users can update their own wellness completions"
    ON wellness_completions FOR UPDATE
    USING (auth.uid() = user_id);

-- Policy: Users can delete their own completions
CREATE POLICY "Users can delete their own wellness completions"
    ON wellness_completions FOR DELETE
    USING (auth.uid() = user_id);

-- Wellness exercises are public (read-only for all authenticated users)
ALTER TABLE wellness_exercises ENABLE ROW LEVEL SECURITY;

-- Policy: All authenticated users can view wellness exercises
CREATE POLICY "Authenticated users can view wellness exercises"
    ON wellness_exercises FOR SELECT
    USING (auth.role() = 'authenticated');

-- =============================================================================
-- SEED DATA - WELLNESS EXERCISES
-- =============================================================================

INSERT INTO wellness_exercises (name, description, duration_seconds, category, difficulty, color, icon_name) VALUES
-- Breathing Exercises
('Box Breathing', 'A calming technique to reduce stress and anxiety', 240, 'breathing', 'beginner', '#3b82f6', 'Wind'),
('4-7-8 Breathing', 'Natural tranquilizer for the nervous system', 180, 'breathing', 'intermediate', '#8b5cf6', 'Waves'),
('Coherent Breathing', 'Balanced breathing for emotional regulation', 300, 'breathing', 'beginner', '#06b6d4', 'Wind'),

-- Meditation Exercises
('Quick Body Scan', 'Release tension and increase body awareness', 300, 'meditation', 'beginner', '#ec4899', 'Activity'),
('Loving Kindness', 'Cultivate compassion for yourself and others', 300, 'meditation', 'intermediate', '#f43f5e', 'Heart'),
('Progressive Muscle Relaxation', 'Systematic tension and relaxation of muscle groups', 600, 'meditation', 'intermediate', '#a855f7', 'Activity'),

-- Grounding Exercises
('5 Senses Grounding', 'Ground yourself in the present moment', 120, 'grounding', 'beginner', '#10b981', 'Flower2'),
('54321 Technique', 'A quick grounding technique using your senses', 180, 'grounding', 'beginner', '#059669', 'Flower2'),
('Body Awareness', 'Connect with your physical presence', 240, 'grounding', 'beginner', '#047857', 'Activity'),

-- Mindfulness Exercises
('Mindful Moment', 'A brief pause to center yourself', 60, 'mindfulness', 'beginner', '#f59e0b', 'Sun'),
('Mindful Walking', 'Walking meditation for clarity and focus', 600, 'mindfulness', 'beginner', '#d97706', 'Activity'),
('Present Moment Awareness', 'Cultivate awareness of the here and now', 480, 'mindfulness', 'intermediate', '#b45309', 'Sun'),

-- Stress Relief
('Quick Stress Relief', 'Immediate techniques for stress reduction', 120, 'stress-relief', 'beginner', '#ef4444', 'Zap'),
('Anxiety Reset', 'Calming exercises specifically for anxiety', 360, 'stress-relief', 'intermediate', '#dc2626', 'Heart'),
('Emergency Calm', 'Ultra-quick calming technique for panic', 30, 'stress-relief', 'beginner', '#b91c1c', 'Zap'),

-- Focus & Concentration
('Focus Builder', 'Improve concentration and mental clarity', 420, 'focus', 'intermediate', '#7c3aed', 'Star'),
('Single-Point Focus', 'Train sustained attention', 360, 'focus', 'advanced', '#6d28d9', 'Star'),
('Clarity Meditation', 'Clear mental fog and enhance focus', 300, 'focus', 'intermediate', '#5b21b6', 'Sun');

-- =============================================================================
-- ANALYTICS VIEWS
-- =============================================================================

-- View for daily completion statistics
CREATE OR REPLACE VIEW wellness_daily_stats AS
SELECT 
    user_id,
    DATE(completed_at) as completion_date,
    COUNT(*) as exercises_completed,
    SUM(COALESCE(actual_duration_seconds, duration_seconds)) as total_practice_time,
    AVG(rating) as avg_rating,
    ARRAY_AGG(DISTINCT category ORDER BY category) as categories_practiced
FROM wellness_completions wc
JOIN wellness_exercises we ON wc.exercise_id = we.id
GROUP BY user_id, DATE(completed_at);

-- View for weekly trends
CREATE OR REPLACE VIEW wellness_weekly_trends AS
SELECT 
    user_id,
    DATE_TRUNC('week', completed_at) as week_start,
    COUNT(*) as exercises_completed,
    SUM(COALESCE(actual_duration_seconds, duration_seconds)) as total_practice_time,
    COUNT(DISTINCT exercise_id) as unique_exercises,
    AVG(rating) as avg_rating
FROM wellness_completions wc
JOIN wellness_exercises we ON wc.exercise_id = we.id
GROUP BY user_id, DATE_TRUNC('week', completed_at);

-- View for exercise popularity
CREATE OR REPLACE VIEW wellness_exercise_popularity AS
SELECT 
    we.id,
    we.name,
    we.category,
    COUNT(wc.id) as completion_count,
    AVG(wc.rating) as avg_rating,
    AVG(COALESCE(wc.actual_duration_seconds, we.duration_seconds)) as avg_duration
FROM wellness_exercises we
LEFT JOIN wellness_completions wc ON we.id = wc.exercise_id
GROUP BY we.id, we.name, we.category
ORDER BY completion_count DESC;

-- =============================================================================
-- FUNCTIONS
-- =============================================================================

-- Function to get user's wellness streak
CREATE OR REPLACE FUNCTION get_wellness_streak(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    streak_count INTEGER := 0;
    check_date DATE := CURRENT_DATE;
    has_completion BOOLEAN;
BEGIN
    -- Check each day going backwards until we find a day without completions
    LOOP
        SELECT EXISTS(
            SELECT 1 FROM wellness_completions 
            WHERE user_id = p_user_id 
            AND DATE(completed_at) = check_date
        ) INTO has_completion;
        
        IF has_completion THEN
            streak_count := streak_count + 1;
            check_date := check_date - INTERVAL '1 day';
        ELSE
            EXIT;
        END IF;
        
        -- Safety limit to prevent infinite loops
        IF streak_count > 365 THEN
            EXIT;
        END IF;
    END LOOP;
    
    RETURN streak_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get today's completions for a user
CREATE OR REPLACE FUNCTION get_todays_wellness_completions(p_user_id UUID)
RETURNS TABLE(
    exercise_id UUID,
    exercise_name VARCHAR(100),
    category VARCHAR(50),
    completed_at TIMESTAMP WITH TIME ZONE,
    actual_duration_seconds INTEGER,
    rating INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        wc.exercise_id,
        we.name as exercise_name,
        we.category,
        wc.completed_at,
        wc.actual_duration_seconds,
        wc.rating
    FROM wellness_completions wc
    JOIN wellness_exercises we ON wc.exercise_id = we.id
    WHERE wc.user_id = p_user_id
    AND DATE(wc.completed_at) = CURRENT_DATE
    ORDER BY wc.completed_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to complete an exercise
CREATE OR REPLACE FUNCTION complete_wellness_exercise(
    p_user_id UUID,
    p_exercise_id UUID,
    p_actual_duration_seconds INTEGER DEFAULT NULL,
    p_notes TEXT DEFAULT NULL,
    p_mood_before VARCHAR(50) DEFAULT NULL,
    p_mood_after VARCHAR(50) DEFAULT NULL,
    p_rating INTEGER DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    completion_id UUID;
BEGIN
    INSERT INTO wellness_completions (
        user_id,
        exercise_id,
        actual_duration_seconds,
        notes,
        mood_before,
        mood_after,
        rating
    ) VALUES (
        p_user_id,
        p_exercise_id,
        p_actual_duration_seconds,
        p_notes,
        p_mood_before,
        p_mood_after,
        p_rating
    ) RETURNING id INTO completion_id;
    
    RETURN completion_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- SAMPLE DATA CREATION FUNCTION
-- =============================================================================

CREATE OR REPLACE FUNCTION create_sample_wellness_data(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
    exercise_record RECORD;
    days_back INTEGER;
    completion_time TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Create sample completions for the last 7 days
    FOR days_back IN 0..6 LOOP
        completion_time := CURRENT_DATE - INTERVAL '1 day' * days_back + INTERVAL '10 hours';
        
        -- Complete 1-3 random exercises each day
        FOR exercise_record IN (
            SELECT id FROM wellness_exercises 
            WHERE is_active = true 
            ORDER BY RANDOM() 
            LIMIT floor(random() * 3 + 1)::INTEGER
        ) LOOP
            INSERT INTO wellness_completions (
                user_id,
                exercise_id,
                completed_at,
                actual_duration_seconds,
                rating,
                mood_before,
                mood_after
            ) VALUES (
                p_user_id,
                exercise_record.id,
                completion_time + INTERVAL '1 hour' * floor(random() * 10),
                NULL, -- Use exercise default duration
                floor(random() * 5 + 1)::INTEGER, -- Random rating 1-5
                (ARRAY['stressed', 'anxious', 'tired', 'neutral', 'calm'])[floor(random() * 5 + 1)],
                (ARRAY['calm', 'peaceful', 'refreshed', 'centered', 'relaxed'])[floor(random() * 5 + 1)]
            );
        END LOOP;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- SETUP COMPLETE MESSAGE
-- =============================================================================

DO $$
BEGIN
    RAISE NOTICE '=============================================================================';
    RAISE NOTICE 'WELLNESS SYSTEM SETUP COMPLETED SUCCESSFULLY!';
    RAISE NOTICE '=============================================================================';
    RAISE NOTICE 'Tables created:';
    RAISE NOTICE '  - wellness_exercises (% exercises)', (SELECT COUNT(*) FROM wellness_exercises);
    RAISE NOTICE '  - wellness_completions (ready for user data)';
    RAISE NOTICE '';
    RAISE NOTICE 'Views created:';
    RAISE NOTICE '  - wellness_daily_stats';
    RAISE NOTICE '  - wellness_weekly_trends';
    RAISE NOTICE '  - wellness_exercise_popularity';
    RAISE NOTICE '';
    RAISE NOTICE 'Functions created:';
    RAISE NOTICE '  - get_wellness_streak(user_id)';
    RAISE NOTICE '  - get_todays_wellness_completions(user_id)';
    RAISE NOTICE '  - complete_wellness_exercise(...)';
    RAISE NOTICE '  - create_sample_wellness_data(user_id)';
    RAISE NOTICE '';
    RAISE NOTICE 'To create sample data for testing, run:';
    RAISE NOTICE '  SELECT create_sample_wellness_data(''your-user-id-here'');';
    RAISE NOTICE '';
    RAISE NOTICE 'Row Level Security (RLS) is enabled - users can only see their own data.';
    RAISE NOTICE '=============================================================================';
END $$; 