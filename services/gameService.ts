import { supabase } from './supabase';
import { Player, RoomSettings, RoundAnswers, Vote } from '../types';
import { ALPHABET, CATEGORIES } from '../constants';

const mapDbPlayer = (dbPlayer: any): Player => ({
  id: dbPlayer.id,
  name: dbPlayer.name,
  avatar: dbPlayer.avatar,
  isHost: dbPlayer.is_host,
  score: dbPlayer.score,
  isReady: dbPlayer.is_ready
});

export const gameService = {
  // --- ODA YÖNETİMİ ---
  createRoom: async (hostName: string, avatar: string, settings: RoomSettings) => {
    const roomCode = Math.random().toString(36).substring(2, 6).toUpperCase();
    const { data: roomData, error: roomError } = await supabase.from('rooms').insert({ code: roomCode, status: 'LOBBY', settings, voting_category_index: 0 }).select().single();
    if (roomError) throw roomError;
    const { data: playerData, error: playerError } = await supabase.from('players').insert({ room_id: roomData.id, name: hostName, avatar, is_host: true, is_ready: true }).select().single();
    if (playerError) throw playerError;
    return { room: { ...roomData, players: [mapDbPlayer(playerData)] }, player: mapDbPlayer(playerData) };
  },

  joinRoom: async (roomCode: string, playerName: string, avatar: string) => {
    const { data: roomData, error: roomFetchError } = await supabase.from('rooms').select('*').eq('code', roomCode).single();
    if (roomFetchError || !roomData) throw new Error("Oda bulunamadı!");
    const { data: playerData, error: playerError } = await supabase.from('players').insert({ room_id: roomData.id, name: playerName, avatar, is_host: false, is_ready: true }).select().single();
    if (playerError) throw playerError;
    const { data: allPlayers } = await supabase.from('players').select('*').eq('room_id', roomData.id);
    return { room: { ...roomData, players: (allPlayers || []).map(mapDbPlayer) }, player: mapDbPlayer(playerData) };
  },

  // --- RECONNECTION (DÜZELTİLDİ: Harf ve Tur verisi maplendi) ---
  reconnect: async (roomId: string, playerId: string) => {
    const { data: roomData } = await supabase.from('rooms').select('*').eq('id', roomId).single();
    if (!roomData) return null;
    const { data: playerData } = await supabase.from('players').select('*').eq('id', playerId).single();
    if (!playerData) return null;
    const { data: allPlayers } = await supabase.from('players').select('*').eq('room_id', roomId);
    
    // DB verisini frontend formatına çevir (current_letter -> currentLetter)
    const mappedRoom = {
      ...roomData,
      currentLetter: roomData.current_letter,
      currentRound: roomData.current_round,
      votingCategoryIndex: roomData.voting_category_index,
      players: (allPlayers || []).map(mapDbPlayer)
    };

    return { room: mappedRoom, player: mapDbPlayer(playerData) };
  },

  leaveRoom: async (playerId: string) => {
    await supabase.from('players').delete().eq('id', playerId);
  },

  getPlayers: async (roomId: string): Promise<Player[]> => {
    const { data } = await supabase.from('players').select('*').eq('room_id', roomId);
    return (data || []).map(mapDbPlayer);
  },

  // --- OYUN AKIŞI ---
  startGame: async (roomId: string) => {
    const letter = ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
    await supabase.from('rooms').update({ status: 'PLAYING', current_letter: letter, current_round: 1, voting_category_index: 0 }).eq('id', roomId);
  },

  nextRound: async (roomId: string, currentRound: number, totalRounds: number) => {
    if (currentRound >= totalRounds) {
      await supabase.from('rooms').update({ status: 'GAME_OVER' }).eq('id', roomId);
    } else {
      const letter = ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
      await supabase.from('rooms').update({ status: 'PLAYING', current_letter: letter, current_round: currentRound + 1, voting_category_index: 0 }).eq('id', roomId);
    }
  },

  updateStatus: async (roomId: string, status: string) => {
    const updateData: any = { status };
    if (status === 'VOTING') updateData.voting_category_index = 0;
    await supabase.from('rooms').update(updateData).eq('id', roomId);
  },

  updateSettings: async (roomId: string, newSettings: RoomSettings) => {
    await supabase.from('rooms').update({ settings: newSettings }).eq('id', roomId);
  },

  updateVotingIndex: async (roomId: string, index: number) => {
    await supabase.from('rooms').update({ voting_category_index: index }).eq('id', roomId);
  },

  resetGame: async (roomId: string) => {
    await supabase.from('answers').delete().eq('room_id', roomId);
    await supabase.from('votes').delete().eq('room_id', roomId);
    await supabase.from('players').update({ score: 0, is_ready: true }).eq('room_id', roomId);
    await supabase.from('rooms').update({ status: 'LOBBY', current_round: 1, current_letter: null, voting_category_index: 0 }).eq('id', roomId);
  },

  // --- CEVAPLAR & OYLAR ---
  submitAnswers: async (roomId: string, playerId: string, roundNumber: number, answers: Record<string, string>) => {
    await supabase.from('answers').insert({ room_id: roomId, player_id: playerId, round_number: roundNumber, answers_json: answers });
  },

  // Akıllı Bekleme Kontrolü
  checkAllAnswersSubmitted: async (roomId: string, roundNumber: number, playerCount: number): Promise<boolean> => {
    // RPC fonksiyonu yoksa hata vermemesi için try-catch veya direkt sorgu kullanılabilir.
    // Şimdilik daha güvenli olan count sorgusu yöntemi:
    const { count } = await supabase.from('answers')
      .select('*', { count: 'exact', head: true })
      .eq('room_id', roomId)
      .eq('round_number', roundNumber);
      
    return (count || 0) >= playerCount;
  },

  getRoundAnswers: async (roomId: string, roundNumber: number): Promise<RoundAnswers> => {
    const { data } = await supabase.from('answers').select('player_id, answers_json').eq('room_id', roomId).eq('round_number', roundNumber);
    const result: RoundAnswers = {};
    data?.forEach((item: any) => { result[item.player_id] = item.answers_json; });
    return result;
  },

  toggleVote: async (roomId: string, roundNumber: number, voterId: string, targetPlayerId: string, category: string) => {
    const { data: existingVote } = await supabase.from('votes').select('id').match({ room_id: roomId, round_number: roundNumber, voter_id: voterId, target_player_id: targetPlayerId, category: category }).single();
    if (existingVote) {
      await supabase.from('votes').delete().eq('id', existingVote.id);
    } else {
      await supabase.from('votes').insert({ room_id: roomId, round_number: roundNumber, voter_id: voterId, target_player_id: targetPlayerId, category: category, is_veto: true });
    }
  },

  getVotes: async (roomId: string, roundNumber: number): Promise<Vote[]> => {
    const { data } = await supabase.from('votes').select('voter_id, target_player_id, category, is_veto').eq('room_id', roomId).eq('round_number', roundNumber);
    return (data || []).map((v: any) => ({ voterId: v.voter_id, targetPlayerId: v.target_player_id, category: v.category, isVeto: v.is_veto }));
  },

  // Puan Hesaplama (Pişti: 5, Normal: 10, Hata: 0)
  calculateScores: async (roomId: string, roundNumber: number, players: Player[]) => {
    const { data: votes } = await supabase.from('votes').select('*').eq('room_id', roomId).eq('round_number', roundNumber);
    const { data: answersData } = await supabase.from('answers').select('*').eq('room_id', roomId).eq('round_number', roundNumber);
    const { data: roomData } = await supabase.from('rooms').select('current_letter').eq('id', roomId).single();
    
    const targetLetter = (roomData?.current_letter || '').toLocaleLowerCase('tr-TR');
    
    const categoryWordPool: Record<string, string[]> = {};
    CATEGORIES.forEach(cat => {
      categoryWordPool[cat] = [];
      answersData?.forEach((row: any) => {
        const word = row.answers_json[cat];
        if (word && word.trim()) categoryWordPool[cat].push(word.trim().toLocaleLowerCase('tr-TR'));
      });
    });

    for (const player of players) {
      const playerAnswersRow = answersData?.find((a: any) => a.player_id === player.id);
      const playerAnswers = playerAnswersRow ? playerAnswersRow.answers_json : {};
      let roundScore = 0;

      CATEGORIES.forEach(category => {
        const rawAnswer = playerAnswers[category] || "";
        const cleanAnswer = rawAnswer.trim();
        const normalizedAnswer = cleanAnswer.toLocaleLowerCase('tr-TR');

        if (!cleanAnswer) return;
        if (!normalizedAnswer.startsWith(targetLetter)) return;

        const vetoCount = votes?.filter((v: any) => v.target_player_id === player.id && v.category === category && v.is_veto).length || 0;
        if (vetoCount > players.length / 2) return;

        const duplicateCount = categoryWordPool[category].filter(w => w === normalizedAnswer).length;
        if (duplicateCount > 1) { roundScore += 5; } else { roundScore += 10; }
      });

      await supabase.from('players').update({ score: player.score + roundScore }).eq('id', player.id);
    }
  },

  submitVotes: async (roomId: string, roundNumber: number, votes: Vote[]) => {},

  subscribeToRoom: (roomId: string, onUpdate: (payload: any) => void) => {
    const channel = supabase.channel(`room:${roomId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` }, (payload) => onUpdate({ type: 'ROOM_UPDATE', data: payload.new }))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players', filter: `room_id=eq.${roomId}` }, () => onUpdate({ type: 'PLAYER_UPDATE' }))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'votes', filter: `room_id=eq.${roomId}` }, () => onUpdate({ type: 'VOTES_UPDATE' }))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }
};