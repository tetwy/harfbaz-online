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
  
  // YENİ: Yükleniyor kilidi (Çift tıklamayı önler)
  const [loading, setLoading] = useState(false);
  
  const isLeavingRef = useRef(false);

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
      setRoom((prev: any) => prev ? { ...prev, players: freshPlayers } : null);
      
      // Host devri için senkronizasyon
      if (me) {
        const myFreshData = freshPlayers.find(p => p.id === me.id);
        if (!myFreshData) {
           window.location.reload();
        } else {
           if (myFreshData.isHost !== me.isHost || myFreshData.score !== me.score) {
              setMe(myFreshData);
           }
        }
      }
    };

    const refreshVotes = async (round: number) => {
       const votes = await gameService.getVotes(activeRoomId, round);
       setCurrentVotes(votes);
    };

    refreshPlayers();

    const unsubscribe = gameService.subscribeToRoom(activeRoomId, async (update) => {
      if (update.type === 'ROOM_UPDATE') {
        const newRoomData = update.data;
        let dbStatus = newRoomData.status as string;
        let uiStatus = dbStatus as GameStatus;
        if (dbStatus === 'LOBBY' && activeRoomId) uiStatus = GameStatus.WAITING;

        if (uiStatus !== status) {
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
      if (update.type === 'PLAYER_UPDATE') refreshPlayers();
      if (update.type === 'VOTES_UPDATE' && room) refreshVotes(room.currentRound);
    });
    return () => { unsubscribe(); };
  }, [activeRoomId, status, room?.currentRound, me]);

  const handleJoinRoom = (roomData: Room, playerData: Player) => {
    setRoom(roomData);
    setMe(playerData);
    setActiveRoomId(roomData.id);
    setStatus(GameStatus.WAITING);
    localStorage.setItem('harfbaz_session', JSON.stringify({ roomId: roomData.id, playerId: playerData.id }));
  };

  const handleLeaveRoom = async () => {
    if (!window.confirm("Oyundan ayrılmak istediğine emin misin?")) {
        return; 
    }
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
    
    // 1. Önce kendi cevaplarımızı gönderelim
    await gameService.submitAnswers(activeRoomId, me.id, room.currentRound, myAnswers);
    
    // 2. Eğer Host isek, oyunun ilerleyişini yönetelim
    if (me.isHost) {
      const checkInterval = setInterval(async () => {
         // A) Herkes gönderdi mi kontrolü
         const allSubmitted = await gameService.checkAllAnswersSubmitted(
            activeRoomId, 
            room.currentRound, 
            room.players.length
         );

         // B) Süre doldu mu kontrolü
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

  // GÜNCELLENDİ: Loading kontrolü eklendi
  const handleNextCategory = async () => {
    if (!room || !activeRoomId || !me?.isHost) return;
    if (loading) return; // Zaten işlem yapılıyorsa dur

    setLoading(true); // Kilitle
    try {
        const currentIndex = room.votingCategoryIndex || 0;
        const currentCategories = room.settings.categories || CATEGORIES;

        if (currentIndex < currentCategories.length - 1) {
          await gameService.updateVotingIndex(activeRoomId, currentIndex + 1);
        } else {
          // Paralel puan hesaplama
          await gameService.calculateScores(activeRoomId, room.currentRound, room.players);
          
          if (room.currentRound < room.settings.totalRounds) {
              await gameService.nextRound(activeRoomId, room.currentRound, room.settings.totalRounds);
          } else {
              await gameService.updateStatus(activeRoomId, GameStatus.GAME_OVER);
          }
        }
    } catch (e) {
        console.error("Kategori geçiş hatası:", e);
    } finally {
        setLoading(false); // Kilidi aç
    }
  };

  const handleToggleVote = async (targetPlayerId: string) => {
    if (!room || !me || !activeRoomId) return;
    const currentCategories = room.settings.categories || CATEGORIES;
    const currentCategory = currentCategories[room.votingCategoryIndex || 0];
    await gameService.toggleVote(activeRoomId, room.currentRound, me.id, targetPlayerId, currentCategory);
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
            isLoading={loading} // YENİ: Prop olarak geçirildi
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