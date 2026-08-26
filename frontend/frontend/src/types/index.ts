export interface User {
  username: string;
  role: 'Admin' | 'Inspector' | 'Sub Inspector' | 'Constable';
  token: string;
  badgeNumber: string;
}

export interface Message {
  id: string;
  role: 'user' | 'ai';
  text: string;
  timestamp: string;
  cardType?: 'text' | 'table' | 'heatmap' | 'network' | 'stats';
  cardData?: any;
}

export interface ChatSession {
  id: string;
  title: string;
  pinned: boolean;
}