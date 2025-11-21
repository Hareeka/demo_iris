export enum MoodType {
  NEUTRAL = 'Neutral',
  HAPPY = 'Happy',
  SAD = 'Sad',
  ANGRY = 'Angry',
  STRESSED = 'Stressed',
  EXCITED = 'Excited',
  CALM = 'Calm'
}

export enum InterestType {
  GAMING = 'Gaming',
  NATURE = 'Nature',
  MINIMALISM = 'Minimalism',
  ART = 'Art',
  TECH = 'Technology'
}

export interface User {
  username: string;
  email: string;
  interests: InterestType[];
  points: number;
  unlockedThemes: string[];
}

export interface JournalEntry {
  id: string;
  date: string;
  content: string;
  mood: MoodType;
  stickers: string[];
}

export interface HealthTip {
  title: string;
  description: string;
  actionItem: string;
}

export interface ThemeConfig {
  name: string;
  type: 'gaming' | 'nature' | 'minimal' | 'default';
  bgGradient: string;
  cardBg: string;
  textColor: string;
  accentColor: string;
  buttonPrimary: string;
  borderColor: string;
  animation: string;
}