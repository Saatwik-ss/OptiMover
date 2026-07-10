const API_URL = import.meta.env.VITE_API_URL || "https://optimover-ai.onrender.com/";

export interface ApiUser {
  id: string;
  username: string;
  email: string;
}

export interface ApiGame {
  id: string;
  gameType: string;
  status: string;
  result: string | null;
  player1Id: string;
  player2Id: string | null;
  isAgainstAI: boolean;
  createdAt: string;
}

export interface ApiUserStats {
  gamesPlayed: number;
  gamesWon: number;
  gamesLost: number;
  gamesDraw: number;
  winRate: number;
  eloRating: number;
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${response.status})`);
  }

  return response.json();
}

export function loginUser(username: string, password: string) {
  return apiFetch<ApiUser>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export function registerUser(username: string, email: string, password: string) {
  return apiFetch<ApiUser>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ username, email, password }),
  });
}

export function fetchGameHistory(userId: string) {
  return apiFetch<ApiGame[]>(`/api/games/user/${userId}`);
}

export function fetchUserStats(userId: string, gameType: string) {
  return apiFetch<ApiUserStats>(`/api/stats/${userId}/${gameType}`);
}
