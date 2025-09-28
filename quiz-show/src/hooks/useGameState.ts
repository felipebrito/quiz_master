'use client';

import { useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

export interface GameState {
  id: string;
  status: 'waiting' | 'starting' | 'active' | 'finished';
  currentRound: number;
  totalRounds: number;
  currentQuestion: {
    id: string;
    text: string;
    options: {
      letter: string;
      text: string;
      isCorrect: boolean;
    }[];
  } | null;
  startTime: Date | null;
  endTime: Date | null;
}

export interface Player {
  id: string;
  name: string;
  photo_url: string | null;
  points: number;
  correctAnswers: number;
  wrongAnswers: number;
  currentAnswer?: string;
  answerTime?: number;
  isConnected: boolean;
}

export interface GameResponse {
  playerId: string;
  playerName: string;
  answer: string;
  isCorrect: boolean;
  time: number;
  points: number;
  round: number;
  questionId: string;
}

export interface GamePhase {
  type: 'vinheta' | 'rodada' | 'pergunta' | 'resposta' | 'resultado';
  title: string;
  subtitle?: string;
  duration?: number;
  data?: any;
}

export const useGameState = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [responses, setResponses] = useState<GameResponse[]>([]);
  const [currentPhase, setCurrentPhase] = useState<GamePhase | null>(null);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Conectar ao Socket.IO
  useEffect(() => {
    const newSocket = io('http://localhost:3002/admin', {
      path: '/socket.io/',
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('Conectado ao servidor de jogo');
      setConnected(true);
      setLoading(false);
    });

    newSocket.on('disconnect', () => {
      console.log('Desconectado do servidor de jogo');
      setConnected(false);
    });

    newSocket.on('connect_error', (err) => {
      console.error('Erro de conexão:', err);
      setError('Erro ao conectar com o servidor de jogo');
      setLoading(false);
    });

    // Eventos do jogo
    newSocket.on('game:state', (state: GameState) => {
      console.log('Estado do jogo atualizado:', state);
      setGameState(state);
    });

    newSocket.on('game:players', (playersData: Player[]) => {
      console.log('Jogadores atualizados:', playersData);
      setPlayers(playersData);
    });

    newSocket.on('game:response', (response: GameResponse) => {
      console.log('Nova resposta:', response);
      setResponses(prev => [...prev, response]);
    });

    newSocket.on('game:phase', (phase: GamePhase) => {
      console.log('Nova fase do jogo:', phase);
      setCurrentPhase(phase);
    });

    newSocket.on('game:round:started', (data: { round: number, question: any }) => {
      console.log('Rodada iniciada:', data);
      setCurrentPhase({
        type: 'rodada',
        title: `Rodada ${data.round}`,
        subtitle: 'Preparem-se para a próxima pergunta!',
        data: data
      });
    });

    newSocket.on('game:question:started', (data: { question: any, round: number }) => {
      console.log('Pergunta iniciada:', data);
      setCurrentPhase({
        type: 'pergunta',
        title: `Pergunta ${data.round}`,
        subtitle: data.question.text,
        data: data
      });
    });

    newSocket.on('game:question:answered', (data: { responses: GameResponse[] }) => {
      console.log('Pergunta respondida:', data);
      setCurrentPhase({
        type: 'resposta',
        title: 'Respostas recebidas',
        subtitle: 'Aguardando próxima pergunta...',
        data: data
      });
    });

    newSocket.on('game:finished', (data: { finalScores: any }) => {
      console.log('Jogo finalizado:', data);
      setCurrentPhase({
        type: 'resultado',
        title: 'Jogo Finalizado!',
        subtitle: 'Confira os resultados finais',
        data: data
      });
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  // Funções para controlar o jogo
  const startGame = useCallback((playerIds: string[]) => {
    if (socket) {
      socket.emit('admin:start-game', { playerIds });
    }
  }, [socket]);

  const stopGame = useCallback(() => {
    if (socket) {
      socket.emit('admin:stop-game');
    }
  }, [socket]);

  const nextRound = useCallback(() => {
    if (socket) {
      socket.emit('admin:next-round');
    }
  }, [socket]);

  const nextQuestion = useCallback(() => {
    if (socket) {
      socket.emit('admin:next-question');
    }
  }, [socket]);

  // Calcular tempo decorrido
  const getElapsedTime = useCallback(() => {
    if (!gameState?.startTime) return 0;
    return Math.floor((Date.now() - gameState.startTime.getTime()) / 1000);
  }, [gameState?.startTime]);

  // Formatar tempo
  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Formatar tempo de resposta
  const formatResponseTime = useCallback((time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor((time % 60) / 1);
    const milliseconds = Math.floor((time % 1) * 1000);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
  }, []);

  return {
    // Estado
    gameState,
    players,
    responses,
    currentPhase,
    connected,
    loading,
    error,
    
    // Funções
    startGame,
    stopGame,
    nextRound,
    nextQuestion,
    getElapsedTime,
    formatTime,
    formatResponseTime,
    
    // Socket
    socket
  };
};
