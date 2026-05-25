

export const CATEGORIES = [
  'İsim',
  'Şehir',
  'Hayvan',
  'Bitki',
  'Eşya',
  'Ünlü',
  'Ülke',
  'Meslek',
  'Yemek',
  'Dizi/Film'
];

// Removed 'Ğ' as words don't start with it. Length is 28.
export const ALPHABET = "ABCÇDEFGHIİJKLMNOÖPRSŞTUÜVYZ";

export const AVATARS = [
  "🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯", "🦁", "🐮",
  "🐬", "🐵", "🦄", "🐸", "🐧", "🦒", "🐙", "🐝", "🦋", "🦖", "🦉", "🦩",
  "🦓", "🦔", "🦦", "🦥"
];

export const DEFAULT_SETTINGS = {
  roundDuration: 60,
  totalRounds: 5,
  isHiddenMode: false
};

// Oda başına maksimum oyuncu sayısı. SQL tarafıyla (join_room_secure /
// join_random_room_secure) senkron tutulmalıdır.
export const MAX_PLAYERS = 16;