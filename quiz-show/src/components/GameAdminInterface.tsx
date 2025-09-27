'use client';

import { useState, useEffect } from 'react';
import { Square, Trophy, CheckCircle, XCircle, Clock } from 'lucide-react';
import Image from 'next/image';

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

interface GameAdminInterfaceProps {
  gameId: string;
  players: Player[];
  currentQuestion: Question | null;
  currentRound: number;
  totalRounds: number;
  gameStartTime: Date;
  responses: GameResponse[];
  onStopGame: () => void;
}

export default function GameAdminInterface({
  gameId,
  players,
  currentQuestion,
  currentRound,
  totalRounds,
  gameStartTime,
  responses,
  onStopGame
}: GameAdminInterfaceProps) {
  const [gameTime, setGameTime] = useState(0);

  // Timer do jogo
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const elapsed = Math.floor((now.getTime() - gameStartTime.getTime()) / 1000);
      setGameTime(elapsed);
    }, 100);

    return () => clearInterval(interval);
  }, [gameStartTime]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatResponseTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor((time % 60) / 1);
    const milliseconds = Math.floor((time % 1) * 1000);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-white">QUIZ // APARATO</h1>
          <button
            onClick={onStopGame}
            className="flex items-center px-6 py-3 bg-pink-600 hover:bg-pink-700 text-white rounded-lg font-semibold transition-colors"
          >
            <Square className="h-5 w-5 mr-2" />
            Parar partida
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Painel Esquerdo - Status e Respostas */}
          <div className="space-y-6">
            {/* Status da Partida */}
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-white">
                    {currentRound}/{totalRounds}
                  </div>
                  <div className="text-gray-400">rodadas</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-white">
                    {formatTime(gameTime)}
                  </div>
                  <div className="text-gray-400">~tempo</div>
                </div>
              </div>
            </div>

            {/* Respostas */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-xl font-bold text-white mb-4">RESPOSTAS</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {responses.length === 0 ? (
                  <div className="text-gray-400 text-center py-4">
                    Aguardando respostas...
                  </div>
                ) : (
                  responses.map((response, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-gray-700 rounded-lg p-3"
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-gray-400 text-sm">
                          {formatResponseTime(response.time)}
                        </span>
                        <span className="text-white font-medium">
                          [{response.playerName}]
                        </span>
                        <span className="text-blue-400 font-bold">
                          {response.answer}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {response.isCorrect ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500" />
                        )}
                        <span className="text-white font-bold">
                          {response.points} pontos
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Painel Direito - Jogadores e Pergunta */}
          <div className="space-y-6">
            {/* Jogadores */}
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {players.map((player) => (
                  <div key={player.id} className="text-center">
                    <div className="relative w-20 h-20 mx-auto mb-3">
                      <Image
                        src={player.photo_url || '/placeholder-avatar.png'}
                        alt={player.name}
                        width={80}
                        height={80}
                        className="rounded-full object-cover"
                        style={{ width: "auto", height: "auto" }}
                      />
                    </div>
                    <div className="text-white font-bold text-lg mb-1">
                      {player.name}
                    </div>
                    <div className="flex items-center justify-center mb-2">
                      <Trophy className="h-4 w-4 text-yellow-500 mr-1" />
                      <span className="text-yellow-500 font-bold">
                        {player.points} pontos
                      </span>
                    </div>
                    <div className="text-sm text-gray-400">
                      {player.correctAnswers}/{totalRounds} Acertos
                    </div>
                    <div className="text-sm text-gray-400">
                      {player.wrongAnswers} Erros
                    </div>
                    <div className="flex justify-center mt-2 space-x-1">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <XCircle className="h-4 w-4 text-red-500" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pergunta Atual */}
            {currentQuestion && (
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-xl font-bold text-white mb-4">
                  {currentQuestion.text}
                </h3>
                <div className="space-y-3">
                  {currentQuestion.options.map((option) => (
                    <div
                      key={option.letter}
                      className={`p-4 rounded-lg border-2 transition-colors ${
                        option.isCorrect
                          ? 'border-green-500 bg-green-900/30 text-green-300'
                          : 'border-gray-600 bg-gray-700 text-white'
                      }`}
                    >
                      <div className="flex items-center">
                        <span className="font-bold text-lg mr-3">
                          {option.letter}:
                        </span>
                        <span>{option.text}</span>
                        {option.isCorrect && (
                          <CheckCircle className="h-5 w-5 text-green-500 ml-auto" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
