import { supabase } from './supabase';
import { Player, RoomSettings, RoundAnswers, Vote } from '../types';
import { CATEGORIES } from '../constants';

const mapDbPlayer = (dbPlayer: any): Player => ({
  id: dbPlayer.id,
  name: dbPlayer.name,
  avatar: dbPlayer.avatar,
  isHost: dbPlayer.is_host,
  score: dbPlayer.score,
  isReady: dbPlayer.is_ready,
  joinedAt: dbPlayer.created_at
});

const mapDbRoom = (roomData: any, players: Player[]) => ({
  ...roomData,
  currentLetter: roomData.current_letter,
  currentRound: roomData.current_round,
  currentGameId: roomData.current_game_id,
  votingCategoryIndex: roomData.voting_category_index,
  revealedPlayers: roomData.revealed_players || [],
  roundStartTime: roomData.round_start_time,
  isPublic: roomData.is_public === true,
  players
});

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
    await ensureAuth();

    const initialSettings = {
      ...settings,
      isHiddenMode: settings.isHiddenMode || false,
      categories: CATEGORIES
    };

    const { data, error } = await supabase.rpc('create_room_secure', {
      p_host_name: hostName,
      p_avatar: avatar,
      p_settings: initialSettings
    });

    if (error) throw error;
    if (!data?.room || !data?.player) throw new Error("Oda oluşturulamadı");

    const player = mapDbPlayer(data.player);
    const room = mapDbRoom(data.room, [player]);
    return { room, player };
  },

  joinRoom: async (roomCode: string, playerName: string, avatar: string) => {
    await ensureAuth();

    const { data, error } = await supabase.rpc('join_room_secure', {
      p_room_code: roomCode,
      p_player_name: playerName,
      p_avatar: avatar
    });

    if (error) throw error;
    if (!data?.room || !data?.player) throw new Error("Odaya katılınamadı");

    const player = mapDbPlayer(data.player);
    const allPlayers = (data.players || []).map(mapDbPlayer);
    const room = mapDbRoom(data.room, allPlayers);
    return { room, player };
  },

  joinRandomRoom: async (playerName: string, avatar: string) => {
    await ensureAuth();

    const { data, error } = await supabase.rpc('join_random_room_secure', {
      p_player_name: playerName,
      p_avatar: avatar
    });

    if (error) throw error;
    if (!data?.room || !data?.player) throw new Error("Aktif online oda bulunamadı");

    const player = mapDbPlayer(data.player);
    const allPlayers = (data.players || []).map(mapDbPlayer);
    const room = mapDbRoom(data.room, allPlayers);
    return { room, player };
  },

  setRoomPublic: async (roomId: string, isPublic: boolean) => {
    const { error } = await supabase.rpc('set_room_public_secure', {
      p_room_id: roomId,
      p_is_public: isPublic
    });
    if (error) throw error;
  },

  reconnect: async (roomId: string, playerId: string) => {
    await ensureAuth();

    const { data: roomData } = await supabase.from('rooms').select('*').eq('id', roomId).maybeSingle();
    if (!roomData) return null;
    const { data: playerData } = await supabase.from('players').select('*').eq('id', playerId).maybeSingle();
    if (!playerData) return null;
    const { data: allPlayers } = await supabase.from('players').select('*').eq('room_id', roomId);

    const players = (allPlayers || []).map(mapDbPlayer);
    return { room: mapDbRoom(roomData, players), player: mapDbPlayer(playerData) };
  },

  leaveRoom: async (playerId: string) => {
    try {
      // RLS: yalnızca id = auth.uid() olan satır silinir
      const { error } = await supabase.from('players').delete().eq('id', playerId);
      if (error) console.error("Odadan ayrılırken hata oluştu:", error);
    } catch (err) {
      console.error("Odadan ayrılma hatası:", err);
    }
  },

  kickPlayer: async (roomId: string, playerId: string) => {
    const { error } = await supabase.rpc('kick_player_secure', {
      p_room_id: roomId,
      p_target_id: playerId
    });
    if (error) throw error;
  },

  getPlayers: async (roomId: string): Promise<Player[]> => {
    const { data } = await supabase.from('players').select('*').eq('room_id', roomId);
    return (data || []).map(mapDbPlayer);
  },

  startGame: async (roomId: string) => {
    const { data, error } = await supabase.rpc('start_game_secure', { p_room_id: roomId });
    if (error) throw error;
    return data as string;
  },

  nextRound: async (roomId: string) => {
    const { error } = await supabase.rpc('next_round_secure', { p_room_id: roomId });
    if (error) throw error;
  },

  revealCard: async (roomId: string, playerId: string) => {
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
    const { error } = await supabase.rpc('update_room_status_secure', {
      p_room_id: roomId,
      p_status: status
    });
    if (error) throw error;
  },

  updateSettings: async (roomId: string, newSettings: RoomSettings) => {
    const { error } = await supabase.rpc('update_settings_secure', {
      p_room_id: roomId,
      p_settings: newSettings
    });
    if (error) throw error;
  },

  updateVotingIndex: async (roomId: string, index: number) => {
    const { error } = await supabase.rpc('update_voting_index_secure', {
      p_room_id: roomId,
      p_index: index
    });
    if (error) throw error;
  },

  resetGame: async (roomId: string) => {
    const { error } = await supabase.rpc('reset_game_secure', { p_room_id: roomId });
    if (error) throw error;
  },

  fillMissingAnswers: async (roomId: string, roundNumber: number, gameId: string) => {
    const { error } = await supabase.rpc('fill_missing_answers_secure', {
      p_room_id: roomId,
      p_round_number: roundNumber,
      p_game_id: gameId
    });
    if (error) throw error;
  },

  submitAnswers: async (roomId: string, playerId: string, roundNumber: number, answers: Record<string, string>, gameId: string) => {
    // RLS: player_id = auth.uid() olmalı; kullanıcı sadece kendi cevabını yazabilir
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
    const { count } = await supabase
      .from('answers')
      .select('*', { count: 'exact', head: true })
      .eq('room_id', roomId)
      .eq('round_number', roundNumber)
      .eq('game_id', gameId);
    return (count || 0) >= playerCount;
  },

  getRoundAnswers: async (roomId: string, roundNumber: number, gameId: string): Promise<RoundAnswers> => {
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

  toggleVote: async (roomId: string, roundNumber: number, targetPlayerId: string, category: string) => {
    const { error } = await supabase.rpc('toggle_vote_secure', {
      p_room_id: roomId,
      p_round_number: roundNumber,
      p_target_player_id: targetPlayerId,
      p_category: category
    });

    if (error) {
      console.error("Oy verme hatası (RPC):", error);
      throw error;
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

  calculateScores: async (roomId: string, roundNumber: number) => {
    const { error } = await supabase.rpc('calculate_round_scores', {
      p_room_id: roomId,
      p_round_number: roundNumber
    });

    if (error) {
      console.error("Puan hesaplama hatası (RPC):", error);
      throw error;
    }
  },

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
  },

  getLobbyStats: async (): Promise<{ roomCount: number; playerCount: number }> => {
    const [roomsRes, playersRes] = await Promise.all([
      supabase
        .from('rooms')
        .select('id', { count: 'exact', head: true })
        .in('status', ['waiting', 'playing']),
      supabase
        .from('players')
        .select('id', { count: 'exact', head: true })
        .gt('created_at', new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()),
    ]);
    return {
      roomCount: roomsRes.count ?? 0,
      playerCount: playersRes.count ?? 0,
    };
  },
};
