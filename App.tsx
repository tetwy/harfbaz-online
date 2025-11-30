import React, { useState, useEffect, useRef } from 'react';
import Lobby from './components/Lobby';
import WaitingRoom from './components/WaitingRoom';
import GamePhase from './components/GamePhase';
import VotingPhase from './components/VotingPhase';
import Scoreboard from './components/Scoreboard';
import { GameStatus, Player, Room, RoundAnswers, Vote, RoomSettings } from './types';
import { gameService } from './services/gameService';
import { CATEGORIES } from './constants';

const App: React.FC = () => {
  const [status, setStatus] = useState<GameStatus>(GameStatus.LOBBY);
  const [room, setRoom] = useState<any>(null);
  const [me, setMe] = useState<Player | null>(null);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [roundAnswers, setRoundAnswers] = useState<RoundAnswers>({});
  const [currentVotes, setCurrentVotes] = useState<Vote[]>([]);
  
  const [loading, setLoading] = useState(false);
  const processingRef = useRef(false);
  const isLeavingRef = useRef(false);

  // --- YENİ: Verileri referanslarda tut (Bağlantı kopmadan erişebilmek için) ---
  const meRef = useRef(me);
  const roomRef = useRef(room);
  const statusRef = useRef(status);

  // Her render'da ref'leri güncelle
  useEffect(() => {
    meRef.current = me;
    roomRef.current = room;
    statusRef.current = status;
  }, [me, room, status]);

  // --- KİLİT AÇMA ---
  useEffect(() => {
    if (loading || processingRef.current) {
        setLoading(false);
        processingRef.current = false;
    }
  }, [room?.votingCategoryIndex, room?.currentRound, status]);

  // --- SAYFA YENİLEME ENGELİ ---
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

  // --- OTURUM KURTARMA ---
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

  // --- ANA SUBSCRIPTION (BAĞLANTI) ---
  // KRİTİK DÜZELTME: Dependency array sadece [activeRoomId] oldu.
  // Artık puan değişince veya status değişince bağlantı KOPMAYACAK.
  useEffect(() => {
    if (!activeRoomId) return;

    const refreshPlayers = async () => {
      const freshPlayers = await gameService.getPlayers(activeRoomId);
      setRoom((prev: any) => prev ? { ...prev, players: freshPlayers } : null);
      
      // Ref üzerinden güncel "me" verisine eriş
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

    const refreshVotes = async (round: number) => {
       const votes = await gameService.getVotes(activeRoomId, round);
       setCurrentVotes(votes);
    };

    // İlk açılışta verileri çek
    refreshPlayers();

    // Sadece oda ID'si değişirse abone ol/çık
    const unsubscribe = gameService.subscribeToRoom(activeRoomId, async (update) => {
      if (update.type === 'ROOM_UPDATE') {
        const newRoomData = update.data;
        let dbStatus = newRoomData.status as string;
        let uiStatus = dbStatus as GameStatus;
        if (dbStatus === 'LOBBY' && activeRoomId) uiStatus = GameStatus.WAITING;

        // Ref üzerinden güncel status'e eriş
        if (uiStatus !== statusRef.current) {
           setStatus(uiStatus);
           if (uiStatus === GameStatus.VOTING) {
             const answers = await gameService.getRoundAnswers(activeRoomId, newRoomData.current_round);
             setRoundAnswers(answers);
             refreshVotes(newRoomData.current_round);
           }
           if (uiStatus === GameStatus.SCORING || uiStatus === GameStatus.GAME_OVER) refreshPlayers();
        }

        setRoom((prev: any) => prev ? { 
          ...prev, status: newRoomData.status, currentLetter: newRoomData.current_letter,
          currentRound: newRoomData.current_round, settings: newRoomData.settings,
          votingCategoryIndex: newRoomData.voting_category_index,
          revealedPlayers: newRoomData.revealed_players,
          roundStartTime: newRoomData.round_start_time
        } : null);
      }
      
      if (update.type === 'PLAYER_UPDATE') {
          // Oyuncu güncellemesi geldiğinde listeyi yenile
          refreshPlayers();
      }
      
      if (update.type === 'VOTES_UPDATE') {
          // Ref üzerinden güncel oda verisine eriş
          const currentRoom = roomRef.current;
          if (currentRoom) refreshVotes(currentRoom.currentRound);
      }
    });
    
    return () => { unsubscribe(); };
  }, [activeRoomId]); // <-- DİKKAT: Burası artık tertemiz, sadece ID'ye bağlı.

  const handleJoinRoom = (roomData: Room, playerData: Player) => {
    setRoom(roomData);
    setMe(playerData);
    setActiveRoomId(roomData.id);
    setStatus(GameStatus.WAITING);
    localStorage.setItem('harfbaz_session', JSON.stringify({ roomId: roomData.id, playerId: playerData.id }));
  };

  const handleLeaveRoom = async () => {
    if (!window.confirm("Oyundan ayrılmak istediğine emin misin?")) return;
    isLeavingRef.current = true;
    localStorage.removeItem('harfbaz_session');
    if (me?.id) await gameService.leaveRoom(me.id);
    window.location.reload();
  };

  const handleUpdateSettings = async (newSettings: RoomSettings) => {
    if (activeRoomId) {
      setRoom((prev: any) => prev ? { ...prev, settings: newSettings } : null);
      await gameService.updateSettings(activeRoomId, newSettings);
    }
  };

  const handleStartGame = async () => { if (activeRoomId) await gameService.startGame(activeRoomId); };

  const handleRoundTimeUp = async (myAnswers: Record<string, string>) => {
    if (!me || !activeRoomId || !room) return;
    
    await gameService.submitAnswers(activeRoomId, me.id, room.currentRound, myAnswers);
    
    if (me.isHost) {
      const checkInterval = setInterval(async () => {
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
            clearInterval(checkInterval);
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
          await gameService.calculateScores(activeRoomId, room.currentRound, room.players);
          
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
      case GameStatus.LOBBY: return <Lobby onJoin={handleJoinRoom} />;
      case GameStatus.WAITING: return room && me ? <WaitingRoom room={room} currentPlayer={me} onStart={handleStartGame} onUpdateSettings={handleUpdateSettings} onLeave={handleLeaveRoom} /> : null;
      case GameStatus.PLAYING: return room && me && activeRoomId ? <GamePhase letter={room.currentLetter} roundDuration={room.settings.roundDuration} roomId={activeRoomId} playerId={me.id} onTimeUp={handleRoundTimeUp} onLeave={handleLeaveRoom} categories={room.settings.categories} roundStartTime={room.roundStartTime} /> : null;
      case GameStatus.VOTING: return room && me ? (
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
            onVotingComplete={() => {}} 
            initialBotVotes={[]} 
            onLeave={handleLeaveRoom} 
            isHiddenMode={room.settings.isHiddenMode || false}
            revealedPlayers={room.revealedPlayers || []}
            onRevealCard={handleRevealCard}
            isLoading={loading} 
        />
      ) : null;
      case GameStatus.SCORING:
      case GameStatus.GAME_OVER: return room ? <Scoreboard players={room.players} onNextRound={status === GameStatus.GAME_OVER ? handleReset : handleNextRound} isGameOver={status === GameStatus.GAME_OVER} roundNumber={room.currentRound} isHost={me?.isHost || false} onLeave={handleLeaveRoom} /> : null;
      default: return <div className="text-white animate-pulse">Yükleniyor...</div>;
    }
  };

  return <div className="min-h-screen bg-slate-900 text-slate-100 font-sans flex flex-col"><div className="container mx-auto px-4 py-6 flex-grow flex flex-col justify-center items-center w-full">{renderContent()}</div></div>;
};

export default App;