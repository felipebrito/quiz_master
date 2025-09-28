'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { PlusCircle, Search, Rocket, Edit, ChevronLeft, ChevronRight, Check, Camera, Upload, X } from 'lucide-react';
import Link from 'next/link';
import { useStatesCities } from '@/hooks/useStatesCities';
import WebcamCapture from '@/components/WebcamCapture';
import { getAdminSocket } from '@/lib/socket';
import GameMonitor from '@/components/admin/GameMonitor';

interface Participant {
  id: string;
  name: string;
  city: string;
  state: string;
  photo_url?: string;
  points: number;
  status: string;
}

export default function AdminPage() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null);
  const [showWebcam, setShowWebcam] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    city: '',
    state: '',
    photo: ''
  });
  const [adminSocket, setAdminSocket] = useState<any>(null);
  const [isGameActive, setIsGameActive] = useState(false);
  const [stats, setStats] = useState({
    totalGames: 0,
    totalParticipants: 0,
    averageScore: 0,
    averageDuration: 0
  });

  const { states, cities, loading: loadingLocations, loadCities } = useStatesCities();

  // Load statistics
  const loadStats = async () => {
    try {
      const response = await fetch('/api/admin/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  // Configure admin socket
  useEffect(() => {
    const socket = getAdminSocket();
    setAdminSocket(socket);

    socket?.on('connect', () => {
      console.log('✅ Admin connected to socket server');
    });

    socket?.on('admin:message', (data: any) => {
      console.log('📨 Admin message:', data);
      if (data.success) {
        alert('Jogo iniciado com sucesso!');
        setIsGameActive(true);
        loadStats(); // Reload stats after game start
      } else {
        alert('Erro ao iniciar jogo: ' + data.error);
      }
    });

    socket?.on('game:stopped', (data: any) => {
      console.log('🛑 Game stopped:', data);
      // Reset admin interface
      setIsGameActive(false);
      setSelectedPlayers([]);
      setSearchTerm('');
      setCurrentPage(1);
      loadStats(); // Reload stats after game stop
    });

    socket?.on('game:reset', (data: any) => {
      console.log('🔄 Game reset:', data);
      // Reset admin interface
      setIsGameActive(false);
      setSelectedPlayers([]);
      setSearchTerm('');
      setCurrentPage(1);
      loadStats(); // Reload stats after game reset
    });

    return () => {
      socket?.disconnect();
    };
  }, []);

  const fetchParticipants = useCallback(async () => {
    console.log('🔄 Fetching participants...');
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/participants');
      console.log('📡 Response status:', res.status);
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      console.log('📊 Participants data:', data);
      const participantsWithPoints = data.data.map((p: Participant) => ({
        ...p,
        points: Math.floor(Math.random() * 200) + 50,
      }));
      setParticipants(participantsWithPoints);
      console.log('✅ Participants loaded:', participantsWithPoints.length);
    } catch (e: any) {
      console.error('❌ Erro ao buscar participantes:', e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchParticipants();
  }, []);

  useEffect(() => {
    loadStats();
  }, []);

  const filteredParticipants = participants.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.state.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const itemsPerPage = 6;
  const totalPages = Math.ceil(filteredParticipants.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentParticipants = filteredParticipants.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const togglePlayerSelection = (participantId: string) => {
    setSelectedPlayers(prev => {
      if (prev.includes(participantId)) {
        return prev.filter(id => id !== participantId);
      } else if (prev.length < 3) {
        return [...prev, participantId];
      }
      return prev;
    });
  };

  const canStartGame = selectedPlayers.length === 3;

  const handleStartGame = () => {
    if (adminSocket && canStartGame) {
      console.log('🎮 Starting game with participants:', selectedPlayers);
      adminSocket.emit('admin:game:start', {
        participantIds: selectedPlayers
      });
    }
  };

  const handleEditParticipant = (participant: Participant) => {
    setEditingParticipant(participant);
    setEditForm({
      name: participant.name,
      city: participant.city,
      state: participant.state,
      photo: participant.photo_url || ''
    });
    setShowEditModal(true);
  };

  const handleSaveParticipant = async () => {
    if (!editingParticipant) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/participants/${editingParticipant.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm),
      });

      const result = await response.json();
      if (result.success) {
        await fetchParticipants();
        setShowEditModal(false);
        setEditingParticipant(null);
        setEditForm({ name: '', city: '', state: '', photo: '' });
      } else {
        throw new Error(result.error || 'Erro ao salvar participante');
      }
      
    } catch (error) {
      console.error('Erro ao salvar participante:', error);
      setError(error instanceof Error ? error.message : 'Erro ao salvar participante');
    } finally {
      setLoading(false);
    }
  };

  const handleWebcamCapture = (imageData: string) => {
    setEditForm(prev => ({ ...prev, photo: imageData }));
    setShowWebcam(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Carregando participantes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500">Erro ao carregar participantes: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-12 text-center text-gray-100">QUIZ // APARATO</h1>

        <div className="space-y-8">
                  {/* Top Section: Controls and Stats */}
                  <div className="flex flex-col lg:flex-row gap-8">
                    {/* Left Section: Controls and Statistics */}
                    <div className="flex flex-col w-full lg:w-1/3 space-y-6">
                      <button
                        onClick={handleStartGame}
                        disabled={!canStartGame}
                        className={`font-bold py-4 px-6 rounded-lg flex items-center justify-center text-xl shadow-lg transition-all duration-200 ${
                          canStartGame
                            ? 'bg-green-600 hover:bg-green-700 text-white'
                            : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        <Rocket className="mr-3 h-6 w-6" />
                        Iniciar partida {selectedPlayers.length > 0 && `(${selectedPlayers.length}/3)`}
                      </button>

                      <Link href="/cadastro" className="w-full">
                        <button className="w-full bg-white border border-gray-300 text-gray-700 font-bold py-4 px-6 rounded-lg flex items-center justify-center text-xl shadow-md hover:bg-gray-50 transition-all duration-200">
                          <PlusCircle className="mr-3 h-6 w-6 text-green-500" />
                          cadastrar jogador
                        </button>
                      </Link>

                      {/* Statistics */}
                      <div className="border-t border-gray-600 pt-6 grid grid-cols-2 gap-4 text-center">
                        <div>
                          <p className="text-4xl font-bold text-white">{stats.totalGames}</p>
                          <p className="text-gray-400">partidas</p>
                        </div>
                        <div>
                          <p className="text-4xl font-bold text-white">{stats.totalParticipants}</p>
                          <p className="text-gray-400">participantes</p>
                        </div>
                        <div>
                          <p className="text-4xl font-bold text-white">{stats.averageScore.toFixed(1)}</p>
                          <p className="text-gray-400">~pontos</p>
                        </div>
                        <div>
                          <p className="text-4xl font-bold text-white">{stats.averageDuration.toFixed(0)}</p>
                          <p className="text-gray-400">~duração</p>
                        </div>
                      </div>
                    </div>

                    {/* Right Section: Player Selection and List */}
                    <div className="flex flex-col w-full lg:w-2/3 space-y-6">
              {/* Player Slots */}
              <div className="flex justify-center gap-4 mb-6">
                {[1, 2, 3].map(num => {
                  const playerId = selectedPlayers[num - 1];
                  const player = playerId ? participants.find(p => p.id === playerId) : null;
                  return (
                    <div key={num} className="w-20 h-20 bg-gray-800 rounded-lg flex items-center justify-center text-white text-3xl font-bold shadow-md border-2 border-gray-600">
                      {player ? (
                        <div className="w-full h-full rounded-lg overflow-hidden">
                          <Image
                            src={player.photo_url || '/placeholder-avatar.png'}
                            alt={player.name}
                            width={64}
                            height={64}
                            className="object-cover w-full h-full"
                          />
                        </div>
                      ) : (
                        num
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Search Bar */}
              <div className="relative w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Digite o nome"
                  className="w-full pl-12 pr-4 py-3 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-200 text-white bg-gray-800 placeholder-gray-400"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>

              {/* Participant List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {currentParticipants.map(participant => {
                  const isSelected = selectedPlayers.includes(participant.id);
                  const canSelect = selectedPlayers.length < 3 || isSelected;
                  
                  return (
                    <div 
                      key={participant.id} 
                      className={`border rounded-lg p-4 flex items-center space-x-4 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer ${
                        isSelected 
                          ? 'bg-green-900 border-green-500' 
                          : canSelect 
                            ? 'bg-gray-800 border-gray-600 hover:bg-gray-700' 
                            : 'bg-gray-800 border-gray-600 opacity-50 cursor-not-allowed'
                      }`}
                      onClick={() => canSelect && togglePlayerSelection(participant.id)}
                    >
                      <div className="flex-shrink-0 w-16 h-16 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                        <Image
                          src={participant.photo_url || '/placeholder-avatar.png'}
                          alt={participant.name}
                          width={64}
                          height={64}
                          className="object-cover"
                          onError={(e) => {
                            e.currentTarget.src = '/placeholder-avatar.png';
                          }}
                        />
                      </div>
                      <div className="flex-grow">
                        <h3 className="font-bold text-lg text-white">{participant.name}</h3>
                        <p className="text-gray-300">{participant.points} pontos</p>
                        <p className="text-gray-400 text-sm">{participant.city} - {participant.state}</p>
                        <button 
                          className="mt-2 text-sm text-gray-400 hover:text-green-400 flex items-center transition-colors duration-200"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditParticipant(participant);
                          }}
                        >
                          <Edit className="h-4 w-4 mr-1" /> EDITAR
                        </button>
                      </div>
                      <div className="flex-shrink-0">
                        {isSelected ? (
                          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                            <Check className="h-4 w-4 text-white" />
                          </div>
                        ) : (
                          <div className="w-6 h-6 border-2 border-gray-400 rounded-full"></div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Debug Info */}
              <div className="text-center text-sm text-gray-400 mt-4">
                Mostrando {currentParticipants.length} de {filteredParticipants.length} participantes
                {searchTerm && ` (filtrado por: "${searchTerm}")`}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center space-x-2 mt-6">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded-md bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="h-5 w-5 text-white" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => handlePageChange(i + 1)}
                      className={`px-4 py-2 rounded-md ${
                        currentPage === i + 1
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      } transition-colors`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-md bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="h-5 w-5 text-white" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Game Monitor */}
      <div className="mt-8">
        <GameMonitor adminSocket={adminSocket} />
      </div>

      {/* Modal de Edição */}
      {showEditModal && editingParticipant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">Editar Participante</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Nome</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Estado</label>
                <select
                  value={editForm.state}
                  onChange={(e) => {
                    setEditForm(prev => ({ ...prev, state: e.target.value }));
                    const selectedState = states.find(s => s.sigla === e.target.value);
                    if (selectedState) {
                      loadCities(selectedState.id);
                    }
                  }}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Selecione o estado</option>
                  {states.map((state, index) => (
                    <option key={state.sigla} value={state.sigla}>{state.nome}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Cidade</label>
                <select
                  value={editForm.city}
                  onChange={(e) => setEditForm(prev => ({ ...prev, city: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  disabled={!editForm.state}
                >
                  <option value="">Selecione a cidade</option>
                  {cities.map((city, index) => (
                    <option key={city.nome} value={city.nome}>{city.nome}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Foto</label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={editForm.photo}
                    onChange={(e) => setEditForm(prev => ({ ...prev, photo: e.target.value }))}
                    placeholder="URL da foto"
                    className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <button
                    onClick={() => setShowWebcam(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    <Camera className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {editForm.photo && (
                <div className="mt-4">
                  <img
                    src={editForm.photo}
                    alt="Preview"
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveParticipant}
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Captura de Webcam */}
      {showWebcam && (
        <WebcamCapture
          onCapture={handleWebcamCapture}
          onClose={() => setShowWebcam(false)}
        />
      )}
    </div>
  );
}