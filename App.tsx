import React, { useState, useEffect, useRef, useCallback, Suspense, lazy } from 'react';
import Lobby from './components/Lobby';
import ConfirmDialog from './components/ConfirmDialog';
import ConnectionStatus from './components/ConnectionStatus';
import LoadingScreen from './components/LoadingScreen';
import { GameStatus, Player, Room, RoundAnswers, Vote, RoomSettings } from './types';
import { gameService } from './services/gameService';
import { CATEGORIES } from './constants';

// Lazy load with retry for Safari/mobile reliability
const lazyWithRetry = (importFn: () => Promise<any>, retries = 3): React.LazyExoticComponent<any> => {
  return lazy(async () => {
    for (let i = 0; i < retries; i++) {
      try {
        return await importFn();
      } catch (error) {
        if (i === retries - 1) throw error;
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
    return importFn();
  });
};

// Lazy load heavy game phase components with retry
const WaitingRoom = lazyWithRetry(() => import('./components/WaitingRoom'));
const GamePhase = lazyWithRetry(() => import('./components/GamePhase'));
const VotingPhase = lazyWithRetry(() => import('./components/VotingPhase'));
const Scoreboard = lazyWithRetry(() => import('./components/Scoreboard'));

// Preload components after initial render
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    setTimeout(() => {
      import('./components/WaitingRoom');
      import('./components/GamePhase');
      import('./components/VotingPhase');
      import('./components/Scoreboard');
    }, 2000);
  });
}

// Debounce utility
const debounce = <T extends (...args: any[]) => any>(fn: T, delay: number) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};

const App: React.FC = () => {
  const [status, setStatus] = useState<GameStatus>(GameStatus.LOBBY);
  const [room, setRoom] = useState<Room | null>(null);
  const [me, setMe] = useState<Player | null>(null);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [roundAnswers, setRoundAnswers] = useState<RoundAnswers>({});
  const [currentVotes, setCurrentVotes] = useState<Vote[]>([]);

  const [loading, setLoading] = useState(false);
  const processingRef = useRef(false);
  const processedRoundsRef = useRef<Set<number>>(new Set());
  const isLeavingRef = useRef(false);
  const checkIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Dialog state
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [kickDialogOpen, setKickDialogOpen] = useState(false);
  const [playerToKick, setPlayerToKick] = useState<string | null>(null);

  // Connection state
  const [isConnected, setIsConnected] = useState(true);
  const [isReconnecting, setIsReconnecting] = useState(false);

  const meRef = useRef(me);
  const roomRef = useRef(room);
  const statusRef = useRef(status);

  useEffect(() => {
    meRef.current = me;
    roomRef.current = room;
    statusRef.current = status;
  }, [me, room, status]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isLeavingRef.current) return;
      if (status === GameStatus.PLAYING || status === GameStatus.VOTING) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [status]);

  useEffect(() => {
    if (loading || processingRef.current) {
      setLoading(false);
      processingRef.current = false;
    }
  }, [room?.votingCategoryIndex, room?.currentRound, status]);

  useEffect(() => {
    const session = localStorage.getItem('harfbaz_session');
    if (session && !activeRoomId) {
      const { roomId, playerId } = JSON.parse(session);
      gameService.reconnect(roomId, playerId).then(data => {
        if (data) {
          setRoom(data.room);
          setMe(data.player);
          setActiveRoomId(data.room.id);
          let recoveredStatus = data.room.status as GameStatus;
          if (data.room.status === 'LOBBY') recoveredStatus = GameStatus.WAITING;
          setStatus(recoveredStatus);
        } else {
          localStorage.removeItem('harfbaz_session');
        }
      });
    }
  }, []);

  useEffect(() => {
    if (!activeRoomId) return;

    const refreshPlayers = async () => {
      const freshPlayers = await gameService.getPlayers(activeRoomId);
      setRoom((prev) => prev ? { ...prev, players: freshPlayers } : null);

      const currentMe = meRef.current;
      if (currentMe) {
        const myFreshData = freshPlayers.find(p => p.id === currentMe.id);
        if (!myFreshData) {
          window.location.reload();
        } else {
          if (myFreshData.isHost !== currentMe.isHost || myFreshData.score !== currentMe.score) {
            setMe(myFreshData);
          }
        }
      }
    };

    // Debounced version - çok sık çağrıları engeller
    const debouncedRefreshPlayers = debounce(refreshPlayers, 300);

    const refreshVotes = async (round: number) => {
      const votes = await gameService.getVotes(activeRoomId, round);
      setCurrentVotes(votes);
    };

    refreshPlayers();

    // Connection status handler
    const handleConnectionChange = (status: 'connected' | 'disconnected' | 'reconnecting') => {
      setIsConnected(status === 'connected');
      setIsReconnecting(status === 'reconnecting');
    };

    const unsubscribe = gameService.subscribeToRoom(activeRoomId, async (update) => {

      if (update.type === 'ROOM_UPDATE') {
        const newRoomData = update.data;
        let dbStatus = newRoomData.status as string;
        let uiStatus = dbStatus as GameStatus;
        if (dbStatus === 'LOBBY' && activeRoomId) uiStatus = GameStatus.WAITING;

        if (uiStatus !== statusRef.current) {
          setStatus(uiStatus);
          if (uiStatus === GameStatus.VOTING) {
            const answers = await gameService.getRoundAnswers(activeRoomId, newRoomData.current_round);
            // Eğer fetch sırasında canlı bir veri geldiyse onu silme, birleştir:
            setRoundAnswers(prev => ({ ...prev, ...answers }));
            refreshVotes(newRoomData.current_round);
          }
          if (uiStatus === GameStatus.SCORING || uiStatus === GameStatus.GAME_OVER) {
            refreshPlayers();
          }
        }

        setRoom((prev) => prev ? {
          ...prev,
          status: newRoomData.status,
          currentLetter: newRoomData.current_letter,
          currentRound: newRoomData.current_round,
          settings: newRoomData.settings,
          votingCategoryIndex: newRoomData.voting_category_index,
          revealedPlayers: newRoomData.revealed_players,
          roundStartTime: newRoomData.round_start_time
        } : null);
      }

      // 2. OYUNCU GÜNCELLEMELERİ
      if (update.type === 'PLAYER_UPDATE') {
        debouncedRefreshPlayers();
      }

      // 3. OYLAMA GÜNCELLEMELERİ
      if (update.type === 'VOTES_UPDATE') {
        const { eventType, new: newRecord, old: oldRecord } = update.payload;

        setCurrentVotes(prevVotes => {
          if (eventType === 'DELETE' && oldRecord?.id) {
            return prevVotes.filter(v => v.id !== oldRecord.id);
          }

          if (eventType === 'INSERT' && newRecord) {
            const cleanVotes = prevVotes.filter(v =>
              !(v.voterId === newRecord.voter_id &&
                v.targetPlayerId === newRecord.target_player_id &&
                v.category === newRecord.category)
            );

            const newVote: Vote = {
              id: newRecord.id,
              voterId: newRecord.voter_id,
              targetPlayerId: newRecord.target_player_id,
              category: newRecord.category,
              isVeto: newRecord.is_veto
            };
            return [...cleanVotes, newVote];
          }
          return prevVotes;
        });

        // Not: Optimistic update zaten yapıldı, duplike fetch kaldırıldı
      }

      if (update.type === 'ANSWERS_UPDATE') {
        const { new: newRecord, eventType } = update.payload;
        if ((eventType === 'INSERT' || eventType === 'UPDATE') && newRecord) {
          setRoundAnswers(prev => ({
            ...prev,
            [newRecord.player_id]: newRecord.answers_json
          }));
        }
      }

    }, handleConnectionChange);

    return () => { unsubscribe(); };
  }, [activeRoomId]);

  // --- AKSİYONLAR ---

  const handleJoinRoom = (roomData: Room, playerData: Player) => {
    setRoom(roomData);
    setMe(playerData);
    setActiveRoomId(roomData.id);
    setStatus(GameStatus.WAITING);
    localStorage.setItem('harfbaz_session', JSON.stringify({ roomId: roomData.id, playerId: playerData.id }));
  };

  const handleLeaveRoom = async () => {
    setLeaveDialogOpen(true);
  };

  const confirmLeaveRoom = async () => {
    setLeaveDialogOpen(false);
    isLeavingRef.current = true;
    localStorage.removeItem('harfbaz_session');
    if (me?.id) await gameService.leaveRoom(me.id);
    window.location.reload();
  };

  const handleKickPlayer = async (playerId: string) => {
    if (me?.isHost && activeRoomId) {
      setPlayerToKick(playerId);
      setKickDialogOpen(true);
    }
  };

  const confirmKickPlayer = async () => {
    setKickDialogOpen(false);
    if (playerToKick) {
      await gameService.kickPlayer(playerToKick);
      setPlayerToKick(null);
    }
  };

  const handleUpdateSettings = async (newSettings: RoomSettings) => {
    if (activeRoomId) {
      setRoom((prev: any) => prev ? { ...prev, settings: newSettings } : null);
      await gameService.updateSettings(activeRoomId, newSettings);
    }
  };

  const handleStartGame = async () => {
    if (activeRoomId) await gameService.startGame(activeRoomId);
  };

  const handleRoundTimeUp = async (myAnswers: Record<string, string>) => {
    if (!me || !activeRoomId || !room) return;

    await gameService.submitAnswers(activeRoomId, me.id, room.currentRound, myAnswers);

    if (me.isHost) {
      // Önceki interval'i temizle (memory leak önleme)
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }

      checkIntervalRef.current = setInterval(async () => {
        const allSubmitted = await gameService.checkAllAnswersSubmitted(
          activeRoomId,
          room.currentRound,
          room.players.length
        );

        const startTime = room.roundStartTime ? new Date(room.roundStartTime).getTime() : Date.now();
        const durationMs = room.settings.roundDuration * 1000;
        const bufferMs = 3000;
        const now = Date.now();
        const isTimeExpired = now > (startTime + durationMs + bufferMs);

        if (allSubmitted || isTimeExpired) {
          if (checkIntervalRef.current) {
            clearInterval(checkIntervalRef.current);
            checkIntervalRef.current = null;
          }
          await gameService.updateStatus(activeRoomId, GameStatus.VOTING);
        }
      }, 1000);
    }
  };

  const handleNextCategory = async () => {
    if (!room || !activeRoomId || !me?.isHost) return;
    if (processingRef.current) return;

    processingRef.current = true;
    setLoading(true);

    const safetyTimer = setTimeout(() => {
      setLoading(false);
      processingRef.current = false;
    }, 5000);

    try {
      const currentIndex = room.votingCategoryIndex || 0;
      const currentCategories = room.settings.categories || CATEGORIES;

      if (currentIndex < currentCategories.length - 1) {
        await gameService.updateVotingIndex(activeRoomId, currentIndex + 1);
      } else {
        // İdempotency: Bu tur zaten hesaplandıysa atla
        if (processedRoundsRef.current.has(room.currentRound)) {
          console.warn(`Tur ${room.currentRound} zaten hesaplandı, atlanıyor.`);
        } else {
          await gameService.calculateScores(activeRoomId, room.currentRound, room.players);
          processedRoundsRef.current.add(room.currentRound);
        }

        if (room.currentRound < room.settings.totalRounds) {
          await gameService.nextRound(activeRoomId, room.currentRound, room.settings.totalRounds);
        } else {
          await gameService.updateStatus(activeRoomId, GameStatus.GAME_OVER);
        }
      }
    } catch (e) {
      console.error("Kategori geçiş hatası:", e);
      setLoading(false);
      processingRef.current = false;
      clearTimeout(safetyTimer);
    }
  };

  const handleToggleVote = async (targetPlayerId: string) => {
    if (!room || !me || !activeRoomId) return;
    const currentCategories = room.settings.categories || CATEGORIES;
    const currentCategory = currentCategories[room.votingCategoryIndex || 0];

    const isAlreadyVoted = currentVotes.some(v =>
      v.voterId === me.id &&
      v.targetPlayerId === targetPlayerId &&
      v.category === currentCategory
    );

    let optimisticVotes;
    if (isAlreadyVoted) {
      optimisticVotes = currentVotes.filter(v =>
        !(v.voterId === me.id && v.targetPlayerId === targetPlayerId && v.category === currentCategory)
      );
    } else {
      const newVote: Vote = {
        id: 'temp-' + Date.now(),
        voterId: me.id,
        targetPlayerId: targetPlayerId,
        category: currentCategory,
        isVeto: true
      };
      optimisticVotes = [...currentVotes, newVote];
    }

    setCurrentVotes(optimisticVotes);

    try {
      await gameService.toggleVote(activeRoomId, room.currentRound, me.id, targetPlayerId, currentCategory);
    } catch (e) {
      console.error("Oy verme hatası:", e);
    }
  };

  const handleRevealCard = async (playerId: string) => {
    if (activeRoomId) {
      await gameService.revealCard(activeRoomId, playerId);
    }
  };

  const handleReset = async () => { if (me?.isHost && activeRoomId) await gameService.resetGame(activeRoomId); };
  const handleNextRound = async () => { if (room && me?.isHost && activeRoomId) await gameService.nextRound(activeRoomId, room.currentRound, room.settings.totalRounds); };

  const renderContent = () => {
    switch (status) {
      case GameStatus.LOBBY:
        return <Lobby onJoin={handleJoinRoom} />;

      case GameStatus.WAITING:
        return room && me ? (
          <WaitingRoom
            room={room}
            currentPlayer={me}
            onStart={handleStartGame}
            onUpdateSettings={handleUpdateSettings}
            onLeave={handleLeaveRoom}
            onKick={handleKickPlayer}
          />
        ) : null;

      case GameStatus.PLAYING:
        return room && me && activeRoomId ? (
          <GamePhase
            letter={room.currentLetter}
            roundDuration={room.settings.roundDuration}
            roomId={activeRoomId}
            playerId={me.id}
            onTimeUp={handleRoundTimeUp}
            onLeave={handleLeaveRoom}
            categories={room.settings.categories}
            roundStartTime={room.roundStartTime}
          />
        ) : null;

      case GameStatus.VOTING:
        return room && me ? (
          <VotingPhase
            players={room.players}
            answers={roundAnswers}
            currentLetter={room.currentLetter}
            currentPlayerId={me.id}
            currentVotes={currentVotes}
            currentCategoryIndex={room.votingCategoryIndex || 0}
            isHost={me.isHost}
            onNextCategory={handleNextCategory}
            onToggleVote={handleToggleVote}
            onVotingComplete={() => { }}
            initialBotVotes={[]}
            onLeave={handleLeaveRoom}
            isHiddenMode={room.settings.isHiddenMode || false}
            revealedPlayers={room.revealedPlayers || []}
            onRevealCard={handleRevealCard}
            isLoading={loading}
            roundStartTime={room.roundStartTime}
          />
        ) : null;

      case GameStatus.SCORING:
      case GameStatus.GAME_OVER:
        return room ? (
          <Scoreboard
            players={room.players}
            onNextRound={status === GameStatus.GAME_OVER ? handleReset : handleNextRound}
            isGameOver={status === GameStatus.GAME_OVER}
            roundNumber={room.currentRound}
            isHost={me?.isHost || false}
            onLeave={handleLeaveRoom}
          />
        ) : null;

      default:
        return <div className="text-white animate-pulse">Yükleniyor...</div>;
    }
  };

  // Get correct loading skeleton variant based on current status
  const getLoadingVariant = () => {
    switch (status) {
      case GameStatus.WAITING: return 'waiting';
      case GameStatus.PLAYING: return 'game';
      case GameStatus.VOTING: return 'voting';
      case GameStatus.SCORING:
      case GameStatus.GAME_OVER: return 'scoreboard';
      default: return 'default';
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans">
      <Suspense fallback={<LoadingScreen variant={getLoadingVariant()} />}>
        {renderContent()}
      </Suspense>

      {/* Connection Status Indicator */}
      {activeRoomId && (
        <ConnectionStatus isConnected={isConnected} isReconnecting={isReconnecting} />
      )}

      {/* Leave Room Dialog */}
      <ConfirmDialog
        isOpen={leaveDialogOpen}
        title="Oyundan Ayrıl"
        message="Oyundan ayrılmak istediğine emin misin?"
        confirmText="Ayrıl"
        cancelText="İptal"
        onConfirm={confirmLeaveRoom}
        onCancel={() => setLeaveDialogOpen(false)}
        variant="danger"
      />

      {/* Kick Player Dialog */}
      <ConfirmDialog
        isOpen={kickDialogOpen}
        title="Oyuncuyu At"
        message="Bu oyuncuyu odadan atmak istediğine emin misin?"
        confirmText="At"
        cancelText="İptal"
        onConfirm={confirmKickPlayer}
        onCancel={() => { setKickDialogOpen(false); setPlayerToKick(null); }}
        variant="warning"
      />
    </div>
  );
};

export default App;