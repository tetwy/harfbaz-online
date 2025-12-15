import { supabase } from './supabase';
import { Player, RoomSettings, RoundAnswers, Vote } from '../types';
import { ALPHABET, CATEGORIES } from '../constants';

const mapDbPlayer = (dbPlayer: any): Player => ({
  id: dbPlayer.id,
  name: dbPlayer.name,
  avatar: dbPlayer.avatar,
  isHost: dbPlayer.is_host,
  score: dbPlayer.score,
  isReady: dbPlayer.is_ready,
  joinedAt: dbPlayer.created_at
});

// YARDIMCI: Kriptografik Güvenli Rastgele Index
const getSecureRandomIndex = (max: number): number => {
  const array = new Uint32Array(1);
  window.crypto.getRandomValues(array);
  return array[0] % max;
};

// YARDIMCI: Kullanılmamış Harf Seç
const getUniqueRandomLetter = (usedLetters: string[]): string => {
  let availableLetters = ALPHABET.split('').filter(letter => !usedLetters.includes(letter));
  if (availableLetters.length === 0) {
    availableLetters = ALPHABET.split('');
  }
  const randomIndex = getSecureRandomIndex(availableLetters.length);
  return availableLetters[randomIndex];
};

// YARDIMCI: Anonim Auth Kontrolü
const ensureAuth = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) return session.user.id;

  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) throw error;
  if (!data.user) throw new Error("Kullanıcı oluşturulamadı");

  return data.user.id;
};

export const gameService = {
  // --- ODA YÖNETİMİ ---
  createRoom: async (hostName: string, avatar: string, settings: RoomSettings) => {
    const userId = await ensureAuth();

    await gameService.leaveRoom(userId);

    const roomCode = Math.random().toString(36).substring(2, 6).toUpperCase();
    const initialSettings = {
      ...settings,
      isHiddenMode: settings.isHiddenMode || false,
      categories: CATEGORIES
    };

    const { data: roomData, error: roomError } = await supabase
      .from('rooms')
      .insert({
        code: roomCode,
        status: 'LOBBY',
        settings: initialSettings,
        voting_category_index: 0,
        used_letters: [],
        revealed_players: []
      })
      .select().single();

    if (roomError) throw roomError;

    const { data: playerData, error: playerError } = await supabase
      .from('players')
      .insert({
        id: userId,
        room_id: roomData.id,
        name: hostName,
        avatar,
        is_host: true,
        is_ready: true
      })
      .select().single();

    if (playerError) throw playerError;

    const mappedRoom = {
      ...roomData,
      currentLetter: roomData.current_letter,
      currentRound: roomData.current_round,
      currentGameId: roomData.current_game_id, // Yeni: Game ID
      votingCategoryIndex: roomData.voting_category_index,
      revealedPlayers: roomData.revealed_players || [],
      roundStartTime: roomData.round_start_time,
      players: [mapDbPlayer(playerData)]
    };

    return { room: mappedRoom, player: mapDbPlayer(playerData) };
  },

  joinRoom: async (roomCode: string, playerName: string, avatar: string) => {
    const userId = await ensureAuth();

    await gameService.leaveRoom(userId);

    const { data: roomData, error: roomFetchError } = await supabase.from('rooms').select('*').eq('code', roomCode).maybeSingle();
    if (roomFetchError || !roomData) throw new Error("Oda bulunamadı!");

    const { data: playerData, error: playerError } = await supabase
      .from('players')
      .insert({
        id: userId,
        room_id: roomData.id,
        name: playerName,
        avatar,
        is_host: false,
        is_ready: true
      })
      .select().single();

    if (playerError) throw playerError;

    const { data: allPlayers } = await supabase.from('players').select('*').eq('room_id', roomData.id);

    const mappedRoom = {
      ...roomData,
      currentLetter: roomData.current_letter,
      currentRound: roomData.current_round,
      currentGameId: roomData.current_game_id, // Yeni: Game ID
      votingCategoryIndex: roomData.voting_category_index,
      revealedPlayers: roomData.revealed_players || [],
      roundStartTime: roomData.round_start_time,
      players: (allPlayers || []).map(mapDbPlayer)
    };

    return { room: mappedRoom, player: mapDbPlayer(playerData) };
  },

  reconnect: async (roomId: string, playerId: string) => {
    await ensureAuth(); // Session kontrolü

    const { data: roomData } = await supabase.from('rooms').select('*').eq('id', roomId).maybeSingle();
    if (!roomData) return null;
    const { data: playerData } = await supabase.from('players').select('*').eq('id', playerId).maybeSingle();
    if (!playerData) return null;
    const { data: allPlayers } = await supabase.from('players').select('*').eq('room_id', roomId);

    const mappedRoom = {
      ...roomData,
      currentLetter: roomData.current_letter,
      currentRound: roomData.current_round,
      currentGameId: roomData.current_game_id, // Yeni: Game ID
      votingCategoryIndex: roomData.voting_category_index,
      revealedPlayers: roomData.revealed_players || [],
      roundStartTime: roomData.round_start_time,
      players: (allPlayers || []).map(mapDbPlayer)
    };

    return { room: mappedRoom, player: mapDbPlayer(playerData) };
  },

  leaveRoom: async (playerId: string) => {
    try {
      const { error } = await supabase.from('players').delete().eq('id', playerId);

      if (error) {
        console.error("Odadan ayrılırken hata oluştu:", error);
      }

    } catch (err) {
      console.error("Odadan ayrılma hatası:", err);
    }
  },

  kickPlayer: async (playerId: string) => {
    await supabase.from('players').delete().eq('id', playerId);
  },

  getPlayers: async (roomId: string): Promise<Player[]> => {
    const { data } = await supabase.from('players').select('*').eq('room_id', roomId);
    return (data || []).map(mapDbPlayer);
  },

  startGame: async (roomId: string) => {
    const letter = getUniqueRandomLetter([]);
    const now = new Date().toISOString();
    const newGameId = crypto.randomUUID();

    // Önceki oyunun verilerini temizle (tam temizlik)
    await supabase.from('answers').delete().eq('room_id', roomId);
    await supabase.from('votes').delete().eq('room_id', roomId);

    // Oyuncu puanlarını sıfırla - TEK SORGU İLE (daha güvenilir)
    const { error: resetError } = await supabase
      .from('players')
      .update({ score: 0 })
      .eq('room_id', roomId);

    if (resetError) {
      console.error('Puan sıfırlama hatası:', resetError);
    }

    // Yeni oyun başlat - YENİ game_id ile
    await supabase.from('rooms').update({
      status: 'PLAYING',
      current_letter: letter,
      current_round: 1,
      current_game_id: newGameId,
      voting_category_index: 0,
      used_letters: [letter],
      revealed_players: [],
      round_start_time: now,
      last_scored_round: 0
    }).eq('id', roomId);

    return newGameId;
  },

  nextRound: async (roomId: string, currentRound: number, totalRounds: number) => {
    if (currentRound >= totalRounds) {
      await supabase.from('rooms').update({ status: 'GAME_OVER' }).eq('id', roomId);
    } else {
      const { data: roomData } = await supabase.from('rooms').select('used_letters').eq('id', roomId).maybeSingle();
      const usedLetters = roomData?.used_letters || [];
      const letter = getUniqueRandomLetter(usedLetters);
      const now = new Date().toISOString();

      await supabase.from('rooms').update({
        status: 'PLAYING',
        current_letter: letter,
        current_round: currentRound + 1,
        voting_category_index: 0,
        used_letters: [...usedLetters, letter],
        revealed_players: [],
        round_start_time: now
      }).eq('id', roomId);
    }
  },

  revealCard: async (roomId: string, playerId: string) => {
    // Atomic RPC kullanarak race condition önlenir
    const { error } = await supabase.rpc('reveal_player_card', {
      p_room_id: roomId,
      p_player_id: playerId
    });

    if (error) {
      console.error('Reveal card hatası:', error);
      throw error;
    }
  },

  updateStatus: async (roomId: string, status: string) => {
    const updateData: any = { status };
    if (status === 'VOTING') {
      updateData.voting_category_index = 0;
      updateData.revealed_players = [];
    }
    await supabase.from('rooms').update(updateData).eq('id', roomId);
  },

  updateSettings: async (roomId: string, newSettings: RoomSettings) => {
    await supabase.from('rooms').update({ settings: newSettings }).eq('id', roomId);
  },

  updateVotingIndex: async (roomId: string, index: number) => {
    await supabase.from('rooms').update({
      voting_category_index: index,
      revealed_players: []
    }).eq('id', roomId);
  },

  resetGame: async (roomId: string) => {
    const { data: currentRoom } = await supabase.from('rooms').select('settings').eq('id', roomId).maybeSingle();
    const newSettings = {
      ...(currentRoom?.settings || {}),
      categories: CATEGORIES
    };

    await supabase.from('answers').delete().eq('room_id', roomId);
    await supabase.from('votes').delete().eq('room_id', roomId);
    await supabase.from('players').update({ score: 0, is_ready: true }).eq('room_id', roomId);

    await supabase.from('rooms').update({
      status: 'LOBBY',
      current_round: 1,
      current_letter: null,
      voting_category_index: 0,
      used_letters: [],
      revealed_players: [],
      round_start_time: null,
      settings: newSettings
    }).eq('id', roomId);
  },

  submitAnswers: async (roomId: string, playerId: string, roundNumber: number, answers: Record<string, string>, gameId: string) => {
    // game_id ile cevap kaydet - oyun oturumu izolasyonu
    const { error } = await supabase.from('answers').upsert({
      room_id: roomId,
      player_id: playerId,
      round_number: roundNumber,
      game_id: gameId,
      answers_json: answers
    }, {
      onConflict: 'room_id, player_id, round_number'
    });

    if (error) {
      console.error("Cevap gönderme hatası:", error);
      throw error;
    }
  },

  checkAllAnswersSubmitted: async (roomId: string, roundNumber: number, playerCount: number, gameId: string): Promise<boolean> => {
    // Sadece mevcut oyunun cevaplarını say
    const { count } = await supabase
      .from('answers')
      .select('*', { count: 'exact', head: true })
      .eq('room_id', roomId)
      .eq('round_number', roundNumber)
      .eq('game_id', gameId);
    return (count || 0) >= playerCount;
  },

  getRoundAnswers: async (roomId: string, roundNumber: number, gameId: string): Promise<RoundAnswers> => {
    // Sadece mevcut oyunun cevaplarını getir
    let retries = 5;
    let data: any[] | null = null;

    while (retries > 0) {
      const result = await supabase
        .from('answers')
        .select('player_id, answers_json')
        .eq('room_id', roomId)
        .eq('round_number', roundNumber)
        .eq('game_id', gameId);

      data = result.data;
      if (data && data.length > 0) break;

      retries--;
      if (retries > 0) await new Promise(r => setTimeout(r, 300));
    }

    const result: RoundAnswers = {};
    data?.forEach((item: any) => { result[item.player_id] = item.answers_json; });
    return result;
  },

  toggleVote: async (roomId: string, roundNumber: number, voterId: string, targetPlayerId: string, category: string) => {
    const { error } = await supabase.rpc('toggle_vote_secure', {
      p_room_id: roomId,
      p_round_number: roundNumber,
      p_voter_id: voterId,
      p_target_player_id: targetPlayerId,
      p_category: category
    });

    if (error) {
      console.error("Oy verme hatası (RPC):", error);
    }
  },

  getVotes: async (roomId: string, roundNumber: number): Promise<Vote[]> => {
    const { data } = await supabase.from('votes').select('id, voter_id, target_player_id, category, is_veto').eq('room_id', roomId).eq('round_number', roundNumber);
    return (data || []).map((v: any) => ({
      id: v.id,
      voterId: v.voter_id,
      targetPlayerId: v.target_player_id,
      category: v.category,
      isVeto: v.is_veto
    }));
  },

  calculateScores: async (roomId: string, roundNumber: number, players: Player[]) => {
    // GÜVENLİK GÜNCELLEMESİ:
    // Hesaplama işlemini tarayıcıdan kaldırdık. 
    // Artık işlemi veritabanındaki "calculate_round_scores" fonksiyonu yapıyor.
    // Bu sayede hile yapılamaz.

    // Tüm cevapların kaydedildiğinden emin ol (race condition önleme)
    const playerCount = players.length;
    let retries = 5;

    while (retries > 0) {
      const { count } = await supabase
        .from('answers')
        .select('*', { count: 'exact', head: true })
        .eq('room_id', roomId)
        .eq('round_number', roundNumber);

      if ((count || 0) >= playerCount) {
        break; // Tüm cevaplar kaydedildi
      }

      retries--;
      if (retries > 0) {
        await new Promise(r => setTimeout(r, 500)); // 500ms bekle
      }
    }

    // Ekstra güvenlik için küçük bir bekleme
    await new Promise(r => setTimeout(r, 300));

    const { error } = await supabase.rpc('calculate_round_scores', {
      p_room_id: roomId,
      p_round_number: roundNumber
    });

    if (error) {
      console.error("Puan hesaplama hatası (RPC):", error);
      throw error;
    }
  },

  submitVotes: async (roomId: string, roundNumber: number, votes: Vote[]) => { },

  // Realtime subscription with connection status tracking
  subscribeToRoom: (roomId: string, onUpdate: (payload: any) => void, onConnectionChange?: (status: 'connected' | 'disconnected' | 'reconnecting') => void) => {
    const channel = supabase.channel(`room:${roomId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` }, (payload) => onUpdate({ type: 'ROOM_UPDATE', data: payload.new }))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players', filter: `room_id=eq.${roomId}` }, () => onUpdate({ type: 'PLAYER_UPDATE' }))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'votes', filter: `room_id=eq.${roomId}` }, (payload) => onUpdate({ type: 'VOTES_UPDATE', payload: payload }))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'answers', filter: `room_id=eq.${roomId}` }, (payload) => onUpdate({ type: 'ANSWERS_UPDATE', payload: payload }))
      .subscribe((status) => {
        if (onConnectionChange) {
          if (status === 'SUBSCRIBED') {
            onConnectionChange('connected');
          } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
            onConnectionChange('disconnected');
          } else if (status === 'TIMED_OUT') {
            onConnectionChange('reconnecting');
          }
        }
      });

    return () => { supabase.removeChannel(channel); };
  }
};