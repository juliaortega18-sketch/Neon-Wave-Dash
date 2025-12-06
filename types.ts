export enum GameState {
  START = 'START',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER',
  VICTORY = 'VICTORY'
}

export enum Difficulty {
  NORMAL = 'NORMAL',
  MYTHIC = 'MYTHIC',
  DEMON = 'DEMON',
  INSANE_DEMON = 'INSANE_DEMON'
}

export enum ObstacleType {
  BLOCK = 'BLOCK',
  SPIKE = 'SPIKE',
  FLOOR = 'FLOOR',
  CEILING = 'CEILING'
}

export enum TriggerType {
  SPEED_1 = 'SPEED_1',
  SPEED_2 = 'SPEED_2',
  SPEED_3 = 'SPEED_3',
  DUAL_MODE = 'DUAL_MODE',
  NORMAL_MODE = 'NORMAL_MODE'
}

export interface Point {
  x: number;
  y: number;
}

export interface Player {
  x: number;
  y: number;
  color: string;
  inverted: boolean; // For dual mode (gravity flip)
  dead: boolean;
  trail: Point[];
}

export interface GameObject {
  x: number;
  y: number;
  w: number;
  h: number;
  type: ObstacleType | TriggerType;
  active?: boolean; // For one-time triggers
}

export interface Camera {
  x: number;
}