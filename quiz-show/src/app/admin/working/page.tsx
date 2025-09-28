'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { PlusCircle, Search, Rocket, Edit, ChevronLeft, ChevronRight, Check, Camera, Upload, X } from 'lucide-react';
import Link from 'next/link';
import { useStatesCities } from '@/hooks/useStatesCities';
import WebcamCapture from '@/components/WebcamCapture';

interface Participant {
  id: string;
  name: string;
  city: string;
  state: string;
  photo_url: string;
  status: string;
  points: number;
}

export default function AdminWorking() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalGames: 0,
    totalParticipants: 0,
    avgScore: 0,
    avgDuration: 0
  });

  // Estados para edição
  const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showWebcam, setShowWebcam] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    city: '',
    state: 0,
    photo: ''
  });

  const { states, cities, loading: loadingStates, loadCities } = useStatesCities();

  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('Carregando dados...');
        
        // Buscar participantes
        const participantsRes = await fetch('/api/participants');
        if (!participantsRes.ok) {
          throw new Error(`HTTP error! status: ${participantsRes.status}`);
        }
        const participantsData = await participantsRes.json();
        const participantsWithPoints = participantsData.data.map((p: Participant) => ({
          ...p,
          points: Math.floor(Math.random() * 200) + 50,
        }));
        setParticipants(participantsWithPoints);

        // Buscar estatísticas
        const statsRes = await fetch('/api/admin/stats');
        if (!statsRes.ok) {
          throw new Error(`HTTP error! status: ${statsRes.status}`);
        }
        const statsData = await statsRes.json();
        setStats(statsData);

        console.log('Dados carregados com sucesso');
        setLoading(false);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        setError('Erro ao carregar dados');
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const filteredParticipants = participants.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.state.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePlayerSelect = (participantId: string) => {
    if (selectedPlayers.includes(participantId)) {
      setSelectedPlayers(selectedPlayers.filter(id => id !== participantId));
    } else if (selectedPlayers.length < 3) {
      setSelectedPlayers([...selectedPlayers, participantId]);
    }
  };

  const handleStartGame = async () => {
    if (selectedPlayers.length !== 3) {
      alert('Selecione exatamente 3 jogadores');
      return;
    }

    try {
      const response = await fetch('/api/game/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ playerIds: selectedPlayers }),
      });

      const result = await response.json();
      if (result.success) {
        window.location.href = '/admin/game';
      } else {
        alert(`Erro ao iniciar jogo: ${result.error}`);
      }
    } catch (error) {
      console.error('Erro ao iniciar jogo:', error);
      alert('Erro ao conectar com o servidor');
    }
  };

  const handleEditParticipant = (participant: Participant, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingParticipant(participant);
    
    // Encontrar o ID do estado baseado na sigla
    const stateId = states.find(s => s.sigla === participant.state)?.id || 0;
    
    setEditForm({
      name: participant.name,
      city: participant.city,
      state: stateId,
      photo: participant.photo_url || ''
    });
    setShowEditModal(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setEditForm(prev => ({ ...prev, photo: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleWebcamCapture = (imageData: string) => {
    setEditForm(prev => ({ ...prev, photo: imageData }));
    setShowWebcam(false);
  };

  const handleStateChange = (stateId: number) => {
    const selectedState = states.find(s => s.id === stateId);
    if (selectedState) {
      setEditForm(prev => ({ ...prev, state: stateId }));
      loadCities(stateId);
    }
  };

  const handleSaveParticipant = async () => {
    try {
      const selectedState = states.find(s => s.id === editForm.state);
      const formData = new FormData();
      formData.append('name', editForm.name);
      formData.append('city', editForm.city);
      formData.append('state', selectedState?.sigla || '');
      if (editForm.photo) {
        formData.append('image', editForm.photo);
      }

      const response = await fetch(`/api/participants/${editingParticipant?.id}`, {
        method: 'PUT',
        body: formData,
      });

      if (response.ok) {
        // Recarregar a página para atualizar os dados
        window.location.reload();
      } else {
        console.error('Erro ao salvar participante');
      }
    } catch (error) {
      console.error('Erro ao salvar participante:', error);
    }
  };

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

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500">Erro: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8 text-center">QUIZ // APARATO</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Section: Actions and Stats */}
          <div className="lg:col-span-1 space-y-6">
            {/* Action Buttons */}
            <div className="space-y-4">
              <button
                onClick={handleStartGame}
                disabled={selectedPlayers.length !== 3}
                className="w-full bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:opacity-50 text-white px-6 py-3 rounded-lg flex items-center justify-center transition-colors"
              >
                <Rocket className="mr-3 h-6 w-6" />
                Iniciar partida
              </button>
              
              <Link href="/cadastro" className="block">
                <button className="w-full bg-white hover:bg-gray-100 text-gray-900 px-6 py-3 rounded-lg flex items-center justify-center transition-colors">
                  <PlusCircle className="mr-3 h-6 w-6 text-green-500" />
                  cadastrar jogador
                </button>
              </Link>
            </div>

            {/* Statistics */}
            <div className="bg-gray-800 p-6 rounded-lg">
              <h2 className="text-xl font-bold text-white mb-4">Estatísticas</h2>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-white">{stats.totalGames}</p>
                  <p className="text-sm text-gray-400">partidas</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stats.totalParticipants}</p>
                  <p className="text-sm text-gray-400">participantes</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stats.avgScore.toFixed(1)}</p>
                  <p className="text-sm text-gray-400">~pontos</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{Math.round(stats.avgDuration)}</p>
                  <p className="text-sm text-gray-400">~duração</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Section: Player Selection and List */}
          <div className="lg:col-span-2 space-y-6">
            {/* Player Slots */}
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3].map((slot) => {
                const player = participants.find(p => selectedPlayers.includes(p.id));
                return (
                  <div
                    key={slot}
                    className="bg-gray-800 p-4 rounded-lg text-center min-h-[120px] flex flex-col items-center justify-center"
                  >
                    {player ? (
                      <div className="text-center">
                        <Image
                          src={player.photo_url}
                          alt={player.name}
                          width={40}
                          height={40}
                          className="rounded-full mx-auto mb-2"
                        />
                        <p className="text-white text-sm font-medium">{player.name}</p>
                        <p className="text-gray-400 text-xs">{player.city} - {player.state}</p>
                      </div>
                    ) : (
                      <div className="text-gray-500 text-sm">
                        Jogador {slot}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Digite o nome"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-800 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* Player List */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-lg font-bold text-white mb-4">Lista de Participantes</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredParticipants.map((participant) => (
                  <div
                    key={participant.id}
                    onClick={() => handlePlayerSelect(participant.id)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedPlayers.includes(participant.id)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 hover:bg-gray-600 text-white'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Image
                        src={participant.photo_url}
                        alt={participant.name}
                        width={40}
                        height={40}
                        className="rounded-full"
                      />
                      <div className="flex-1">
                        <p className="font-medium">{participant.name}</p>
                        <p className="text-sm opacity-75">{participant.city} - {participant.state}</p>
                        <p className="text-sm opacity-75">{participant.points} pontos</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {selectedPlayers.includes(participant.id) && (
                          <Check className="h-5 w-5" />
                        )}
                        <button
                          onClick={(e) => handleEditParticipant(participant, e)}
                          className="p-1 hover:bg-gray-600 rounded"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Edit Modal */}
        {showEditModal && editingParticipant && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md mx-auto shadow-lg">
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
                {/* Photo */}
                <div className="text-center">
                  {editForm.photo ? (
                    <Image
                      src={editForm.photo}
                      alt="Preview"
                      width={100}
                      height={100}
                      className="rounded-full mx-auto mb-2"
                      style={{ width: "auto", height: "auto" }}
                    />
                  ) : (
                    <div className="w-24 h-24 bg-gray-700 rounded-full mx-auto mb-2 flex items-center justify-center">
                      <Camera className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                  
                  <div className="flex justify-center space-x-2">
                    <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm">
                      <Upload className="h-4 w-4 inline mr-1" />
                      Upload
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                    <button
                      onClick={() => setShowWebcam(true)}
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                    >
                      <Camera className="h-4 w-4 inline mr-1" />
                      Webcam
                    </button>
                  </div>
                </div>

                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Nome</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-800 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                {/* State */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Estado</label>
                  <select
                    value={editForm.state}
                    onChange={(e) => handleStateChange(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-800 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                    disabled={loadingStates}
                  >
                    <option value={0}>Selecione o estado</option>
                    {states.map((state) => (
                      <option key={state.id} value={state.id}>
                        {state.nome} - {state.sigla}
                      </option>
                    ))}
                  </select>
                </div>

                {/* City */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Cidade</label>
                  <select
                    value={editForm.city}
                    onChange={(e) => setEditForm(prev => ({ ...prev, city: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-800 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                    disabled={!editForm.state || cities.length === 0}
                  >
                    <option value="">Selecione a cidade</option>
                    {cities.map((city) => (
                      <option key={city.id} value={city.nome}>
                        {city.nome}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Save Button */}
                <button
                  onClick={handleSaveParticipant}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors"
                >
                  Salvar Alterações
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Webcam Modal */}
        {showWebcam && (
          <WebcamCapture
            onCapture={handleWebcamCapture}
            onClose={() => setShowWebcam(false)}
          />
        )}
      </div>
    </div>
  );
}
