'use client';

import { useState, useEffect } from 'react';
import { Square, Trophy, CheckCircle, XCircle, Clock, Play, Pause, SkipForward } from 'lucide-react';
import Image from 'next/image';
import { useGameState, GamePhase } from '@/hooks/useGameState';

interface GameAdminInterfaceProps {
  onStopGame: () => void;
}

export default function GameAdminInterface({
  onStopGame
}: GameAdminInterfaceProps) {
  const {
    gameState,
    players,
    responses,
    currentPhase,
    connected,
    loading,
    error,
    stopGame,
    nextRound,
    nextQuestion,
    getElapsedTime,
    formatTime,
    formatResponseTime
  } = useGameState();

  const [gameTime, setGameTime] = useState(0);

  // Timer do jogo
  useEffect(() => {
    const interval = setInterval(() => {
      setGameTime(getElapsedTime());
    }, 100);

    return () => clearInterval(interval);
  }, [getElapsedTime]);

  const handleStopGame = () => {
    stopGame();
    onStopGame();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Conectando ao jogo...</p>
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
            onClick={onStopGame}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Voltar ao Admin
          </button>
        </div>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white mb-4">Nenhum jogo ativo</p>
          <button
            onClick={onStopGame}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Voltar ao Admin
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white">QUIZ // APARATO</h1>
            <div className="flex items-center mt-2">
              <div className={`w-3 h-3 rounded-full mr-2 ${connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm text-gray-400">
                {connected ? 'Conectado' : 'Desconectado'}
              </span>
            </div>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={nextRound}
              className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
            >
              <SkipForward className="h-4 w-4 mr-2" />
              Próxima Rodada
            </button>
            <button
              onClick={nextQuestion}
              className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors"
            >
              <Play className="h-4 w-4 mr-2" />
              Próxima Pergunta
            </button>
            <button
              onClick={handleStopGame}
              className="flex items-center px-6 py-3 bg-pink-600 hover:bg-pink-700 text-white rounded-lg font-semibold transition-colors"
            >
              <Square className="h-5 w-5 mr-2" />
              Parar partida
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Painel Esquerdo - Status e Respostas */}
          <div className="space-y-6">
            {/* Status da Partida */}
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-white">
                    {gameState.currentRound}/{gameState.totalRounds}
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

            {/* Estado do Jogo */}
            {currentPhase && (
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-xl font-bold text-white mb-4">Estado do Jogo</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Fase:</span>
                    <span className="text-white font-semibold capitalize">{currentPhase.type}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Título:</span>
                    <span className="text-white font-semibold">{currentPhase.title}</span>
                  </div>
                  {currentPhase.subtitle && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Subtítulo:</span>
                      <span className="text-white font-semibold">{currentPhase.subtitle}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Status:</span>
                    <span className={`font-semibold ${
                      gameState.status === 'active' ? 'text-green-400' :
                      gameState.status === 'waiting' ? 'text-yellow-400' :
                      gameState.status === 'finished' ? 'text-red-400' :
                      'text-blue-400'
                    }`}>
                      {gameState.status === 'active' ? 'Ativo' :
                       gameState.status === 'waiting' ? 'Aguardando' :
                       gameState.status === 'finished' ? 'Finalizado' :
                       'Iniciando'}
                    </span>
                  </div>
                </div>
              </div>
            )}

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
            {gameState.currentQuestion && (
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-xl font-bold text-white mb-4">
                  {gameState.currentQuestion.text}
                </h3>
                <div className="space-y-3">
                  {gameState.currentQuestion.options.map((option) => (
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
