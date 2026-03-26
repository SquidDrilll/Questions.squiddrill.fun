/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  chapter: string;
  subject: string;
  year: number;
  difficulty: Difficulty;
}

export interface UserProgress {
  completedQuestions: string[]; // IDs
  accuracy: number;
  streak: number;
  lastAttemptDate: string | null;
  totalCorrect: number;
  totalAttempted: number;
  badges: string[];
}

export interface AppState {
  questions: Question[];
  progress: UserProgress;
  isDarkMode: boolean;
  currentView: 'login' | 'dashboard' | 'browser' | 'practice';
  isAuthenticated: boolean;
  currentQuestionIndex: number;
  showPrank: boolean;
  searchQuery: string;
  activeSubject: string;
  activeYear: string;
  selectedChapter: string | null;
  selectedSubject: string | null;
  selectedOption: number | null;
  showSolution: boolean;
  showCalculator: boolean;
  isExplanationExpanded: boolean;
}
