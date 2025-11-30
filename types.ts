export enum GameStatus {
  LOBBY = 'LOBBY',
  WAITING = 'WAITING',
  PLAYING = 'PLAYING',
  VOTING = 'VOTING',
  SCORING = 'SCORING',
  GAME_OVER = 'GAME_OVER'
}

export interface Player {
  id: string;
  name: string;
  avatar: string;
  isHost: boolean;
  score: number;
  isReady?: boolean;
}

export interface RoomSettings {
  roundDuration: number; // seconds
  totalRounds: number;
  isHiddenMode: boolean; // YENİ: Gizli Kelime Modu
}

export interface Room {
  id: string;
  code: string;
  currentRound: number;
  currentLetter: string;
  status: GameStatus;
  players: Player[];
  settings: RoomSettings;
  createdAt: string;
  votingCategoryIndex?: number;
  revealedPlayers: string[];
  roundStartTime?: string;
}

export interface RoundAnswers {
  [playerId: string]: {
    [category: string]: string;
  };
}

export interface Vote {
  voterId: string;
  targetPlayerId: string;
  category: string;
  isVeto: boolean; // true = rejected, false = accepted
}