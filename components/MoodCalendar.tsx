import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { MoodType, ThemeConfig } from '../types';

interface MoodData {
  day: string;
  moodValue: number; // Mapped from MoodType for chart
  moodLabel: string;
}

interface MoodCalendarProps {
  history: { date: string; mood: MoodType }[];
  currentTheme: ThemeConfig;
}

const moodToValue = (mood: MoodType): number => {
  switch (mood) {
    case MoodType.HAPPY: return 10;
    case MoodType.EXCITED: return 9;
    case MoodType.CALM: return 7;
    case MoodType.NEUTRAL: return 5;
    case MoodType.STRESSED: return 3;
    case MoodType.SAD: return 2;
    case MoodType.ANGRY: return 1;
    default: return 5;
  }
};

const getColorForMood = (value: number) => {
  if (value >= 9) return '#FBBF24'; // Amber (Excited)
  if (value >= 7) return '#34D399'; // Emerald (Happy/Calm)
  if (value >= 5) return '#9CA3AF'; // Gray (Neutral)
  if (value >= 3) return '#60A5FA'; // Blue (Stressed)
  return '#F87171'; // Red (Sad/Angry)
};

const MoodCalendar: React.FC<MoodCalendarProps> = ({ history, currentTheme }) => {
  // Process last 7 days for the chart
  const chartData: MoodData[] = history.slice(-7).map(h => ({
    day: new Date(h.date).toLocaleDateString('en-US', { weekday: 'short' }),
    moodValue: moodToValue(h.mood),
    moodLabel: h.mood
  }));

  return (
    <div className={`p-6 rounded-2xl backdrop-blur-md border shadow-lg ${currentTheme.cardBg} ${currentTheme.borderColor} transition-all duration-500`}>
      <h3 className={`text-xl font-display font-bold mb-4 ${currentTheme.textColor}`}>Mood Trends</h3>
      <div className="h-48 w-full">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis 
                dataKey="day" 
                stroke={currentTheme.textColor} 
                opacity={0.7} 
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis hide domain={[0, 12]} />
              <Tooltip 
                cursor={{ fill: 'rgba(255,255,255,0.1)' }}
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                  borderRadius: '8px',
                  border: 'none',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Bar dataKey="moodValue" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getColorForMood(entry.moodValue)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className={`h-full flex items-center justify-center opacity-50 ${currentTheme.textColor}`}>
            No mood data yet. Scan your face!
          </div>
        )}
      </div>
      <div className="mt-4 flex justify-between items-center text-xs opacity-70">
        <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-400"></div> Low Energy</span>
        <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-gray-400"></div> Balanced</span>
        <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-400"></div> High Energy</span>
      </div>
    </div>
  );
};

export default MoodCalendar;