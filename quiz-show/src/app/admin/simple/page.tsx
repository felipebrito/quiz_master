'use client';

import { useState, useEffect } from 'react';

export default function AdminSimple() {
  const [stats, setStats] = useState({
    totalGames: 0,
    totalParticipants: 0,
    avgScore: 0,
    avgDuration: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('useEffect executado');
    
    const fetchData = async () => {
      try {
        console.log('Buscando dados...');
        
        // Buscar estatísticas
        const statsRes = await fetch('/api/admin/stats');
        const statsData = await statsRes.json();
        console.log('Stats recebidas:', statsData);
        setStats(statsData);
        
        setLoading(false);
        console.log('Dados carregados com sucesso');
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Carregando dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8 text-center">QUIZ // APARATO - SIMPLES</h1>
        
        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-2xl font-bold text-white mb-4">Estatísticas Reais</h2>
          
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-4xl font-bold text-white">{stats.totalGames}</p>
              <p className="text-gray-400">partidas</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-white">{stats.totalParticipants}</p>
              <p className="text-gray-400">participantes</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-white">{stats.avgScore.toFixed(1)}</p>
              <p className="text-gray-400">~pontos</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-white">{Math.round(stats.avgDuration)}</p>
              <p className="text-gray-400">~duração</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
