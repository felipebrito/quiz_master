'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import GameAdminInterface from '@/components/GameAdminInterface';

interface Player {
  id: string;
  name: string;
  photo_url: string | null;
  points: number;
  correctAnswers: number;
  wrongAnswers: number;
  currentAnswer?: string;
  answerTime?: number;
}

interface Question {
  id: string;
  text: string;
  options: {
    letter: string;
    text: string;
    isCorrect: boolean;
  }[];
}

interface GameResponse {
  playerId: string;
  playerName: string;
  answer: string;
  isCorrect: boolean;
  time: number;
  points: number;
}

export default function GameAdminPage() {
  const router = useRouter();
  const [gameId, setGameId] = useState<string>('');
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [currentRound, setCurrentRound] = useState(1);
  const [totalRounds, setTotalRounds] = useState(6);
  const [gameStartTime, setGameStartTime] = useState(new Date());
  const [responses, setResponses] = useState<GameResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Simular carregamento de dados do jogo
    // Em uma implementação real, isso viria do Socket.IO ou API
    loadGameData();
  }, []);

  const loadGameData = async () => {
    try {
      setLoading(true);
      
      // Simular dados de exemplo
      const mockPlayers: Player[] = [
        {
          id: '1',
          name: 'João Silva',
          photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
          points: 178,
          correctAnswers: 1,
          wrongAnswers: 0
        },
        {
          id: '2',
          name: 'Maria Santos',
          photo_url: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
          points: 178,
          correctAnswers: 0,
          wrongAnswers: 1
        },
        {
          id: '3',
          name: 'Pedro Costa',
          photo_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
          points: 178,
          correctAnswers: 0,
          wrongAnswers: 1
        }
      ];

      const mockQuestion: Question = {
        id: '1',
        text: 'Quem descobriu a América?',
        options: [
          { letter: 'A', text: 'Américo Vespúcio', isCorrect: true },
          { letter: 'B', text: 'Felipe Brito', isCorrect: false },
          { letter: 'C', text: 'Pedro Álvares Cabral', isCorrect: false }
        ]
      };

      const mockResponses: GameResponse[] = [
        {
          playerId: '1',
          playerName: 'João',
          answer: 'A',
          isCorrect: true,
          time: 221, // 3:41 em segundos
          points: 100
        },
        {
          playerId: '3',
          playerName: 'Pedro',
          answer: 'C',
          isCorrect: false,
          time: 322, // 5:22 em segundos
          points: 0
        },
        {
          playerId: '2',
          playerName: 'Maria',
          answer: 'C',
          isCorrect: false,
          time: 489, // 8:09 em segundos
          points: 0
        }
      ];

      setGameId('game-123');
      setPlayers(mockPlayers);
      setCurrentQuestion(mockQuestion);
      setCurrentRound(1);
      setTotalRounds(6);
      setGameStartTime(new Date(Date.now() - 300000)); // 5 minutos atrás
      setResponses(mockResponses);
      
    } catch (err) {
      setError('Erro ao carregar dados do jogo');
      console.error('Erro ao carregar jogo:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStopGame = () => {
    if (confirm('Tem certeza que deseja parar a partida?')) {
      // Aqui você implementaria a lógica para parar o jogo
      console.log('Parando jogo...');
      router.push('/admin');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Carregando jogo...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={() => router.push('/admin')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Voltar ao Admin
          </button>
        </div>
      </div>
    );
  }

  return (
    <GameAdminInterface
      gameId={gameId}
      players={players}
      currentQuestion={currentQuestion}
      currentRound={currentRound}
      totalRounds={totalRounds}
      gameStartTime={gameStartTime}
      responses={responses}
      onStopGame={handleStopGame}
    />
  );
}
