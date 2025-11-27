import React, { useState, useEffect } from 'react';
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

  // --- YENİ EKLENEN: SAYFA YENİLEME UYARISI ---
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Eğer oyun oynanıyorsa (PLAYING) veya oylama (VOTING) yapılıyorsa uyarı ver
      if (status === GameStatus.PLAYING || status === GameStatus.VOTING) {
        e.preventDefault();
        e.returnValue = ''; // Modern tarayıcılar için bu standarttır
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [status]);
  // -------------------------------------------

  // --- RECONNECTION ---
  useEffect(() => {
    const session = localStorage.getItem('harfbaz_session');
    if (session && !activeRoomId) {
       const { roomId, playerId } = JSON.parse(session);
       gameService.reconnect(roomId, playerId).then(data => {
          if (data) {
             setRoom(data.room);
             setMe(data.player);
             setActiveRoomId(data.room.id);
             
             // Odanın DB durumuna göre UI durumunu belirle
             let recoveredStatus = data.room.status as GameStatus;
             if (data.room.status === 'LOBBY') recoveredStatus = GameStatus.WAITING;
             setStatus(recoveredStatus);
          } else {
             localStorage.removeItem('harfbaz_session');
          }
       });
    }
  }, []); 

  // --- REALTIME ---
  useEffect(() => {
    if (!activeRoomId) return;

    const refreshPlayers = async () => {
      const freshPlayers = await gameService.getPlayers(activeRoomId);
      setRoom((prev: any) => prev ? { ...prev, players: freshPlayers } : null);
      if (me && !freshPlayers.find(p => p.id === me.id)) window.location.reload();
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
          votingCategoryIndex: newRoomData.voting_category_index 
        } : null);
      }
      if (update.type === 'PLAYER_UPDATE') refreshPlayers();
      if (update.type === 'VOTES_UPDATE' && room) refreshVotes(room.currentRound);
    });
    return () => { unsubscribe(); };
  }, [activeRoomId, status, room?.currentRound, me]);

  // --- AKSİYONLAR ---
  const handleJoinRoom = (roomData: Room, playerData: Player) => {
    setRoom(roomData);
    setMe(playerData);
    setActiveRoomId(roomData.id);
    setStatus(GameStatus.WAITING);
    localStorage.setItem('harfbaz_session', JSON.stringify({ roomId: roomData.id, playerId: playerData.id }));
  };

  const handleLeaveRoom = async () => {
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
      let attempts = 0;
      const maxAttempts = 10; 
      const checkInterval = setInterval(async () => {
         const allSubmitted = await gameService.checkAllAnswersSubmitted(activeRoomId, room.currentRound, room.players.length);
         attempts++;
         if (allSubmitted || attempts >= maxAttempts) {
            clearInterval(checkInterval);
            await gameService.updateStatus(activeRoomId, GameStatus.VOTING);
         }
      }, 1000); 
    }
  };

  const handleNextCategory = async () => {
    if (!room || !activeRoomId || !me?.isHost) return;
    const currentIndex = room.votingCategoryIndex || 0;
    if (currentIndex < CATEGORIES.length - 1) {
      await gameService.updateVotingIndex(activeRoomId, currentIndex + 1);
    } else {
      await gameService.calculateScores(activeRoomId, room.currentRound, room.players);
      if (room.currentRound < room.settings.totalRounds) {
          await gameService.nextRound(activeRoomId, room.currentRound, room.settings.totalRounds);
      } else {
          await gameService.updateStatus(activeRoomId, GameStatus.GAME_OVER);
      }
    }
  };

  const handleToggleVote = async (targetPlayerId: string) => {
    if (!room || !me || !activeRoomId) return;
    const currentCategory = CATEGORIES[room.votingCategoryIndex || 0];
    await gameService.toggleVote(activeRoomId, room.currentRound, me.id, targetPlayerId, currentCategory);
  };

  const handleReset = async () => { if (me?.isHost && activeRoomId) await gameService.resetGame(activeRoomId); };
  const handleNextRound = async () => { if (room && me?.isHost && activeRoomId) await gameService.nextRound(activeRoomId, room.currentRound, room.settings.totalRounds); };

  const renderContent = () => {
    switch (status) {
      case GameStatus.LOBBY: return <Lobby onJoin={handleJoinRoom} />;
      case GameStatus.WAITING: return room && me ? <WaitingRoom room={room} currentPlayer={me} onStart={handleStartGame} onUpdateSettings={handleUpdateSettings} onLeave={handleLeaveRoom} /> : null;
      case GameStatus.PLAYING: return room && me && activeRoomId ? <GamePhase letter={room.currentLetter} roundDuration={room.settings.roundDuration} roomId={activeRoomId} playerId={me.id} onTimeUp={handleRoundTimeUp} /> : null;
      case GameStatus.VOTING: return room && me ? <VotingPhase players={room.players} answers={roundAnswers} currentLetter={room.currentLetter} currentPlayerId={me.id} currentVotes={currentVotes} currentCategoryIndex={room.votingCategoryIndex || 0} isHost={me.isHost} onNextCategory={handleNextCategory} onToggleVote={handleToggleVote} onVotingComplete={() => {}} initialBotVotes={[]} /> : null;
      case GameStatus.SCORING:
      case GameStatus.GAME_OVER: return room ? <Scoreboard players={room.players} onNextRound={status === GameStatus.GAME_OVER ? handleReset : handleNextRound} isGameOver={status === GameStatus.GAME_OVER} roundNumber={room.currentRound} isHost={me?.isHost || false} onLeave={handleLeaveRoom} /> : null;
      default: return <div className="text-white animate-pulse">Yükleniyor...</div>;
    }
  };

  return <div className="min-h-screen bg-slate-900 text-slate-100 font-sans flex flex-col"><div className="container mx-auto px-4 py-6 flex-grow flex flex-col justify-center items-center w-full">{renderContent()}</div></div>;
};

export default App;