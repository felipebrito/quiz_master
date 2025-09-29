'use client';

import { useState, useEffect } from 'react';
import { PlusCircle, Edit, Trash2, Save, X, Search, Filter } from 'lucide-react';

interface Theme {
  id: string;
  name: string;
  description?: string;
  color: string;
  _count: { questions: number };
}

interface Question {
  id: string;
  text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  correct_answer: string;
  difficulty: string;
  theme?: Theme;
}

interface GameConfig {
  id: string;
  name: string;
  description?: string;
  rounds_count: number;
  round_duration: number;
  question_duration: number;
  is_active: boolean;
  _count: { games: number };
}

export default function GameEditor() {
  const [activeTab, setActiveTab] = useState<'themes' | 'questions' | 'configs'>('themes');
  const [themes, setThemes] = useState<Theme[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [configs, setConfigs] = useState<GameConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Theme states
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [editingTheme, setEditingTheme] = useState<Theme | null>(null);
  const [themeForm, setThemeForm] = useState({
    name: '',
    description: '',
    color: '#3B82F6'
  });

  // Question states
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [questionForm, setQuestionForm] = useState({
    text: '',
    option_a: '',
    option_b: '',
    option_c: '',
    correct_answer: 'A',
    difficulty: 'medium',
    theme_id: ''
  });
  const [questionFilters, setQuestionFilters] = useState({
    themeId: '',
    difficulty: '',
    search: ''
  });

  // Config states
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [editingConfig, setEditingConfig] = useState<GameConfig | null>(null);
  const [configForm, setConfigForm] = useState({
    name: '',
    description: '',
    rounds_count: 5,
    round_duration: 30,
    question_duration: 15,
    is_active: true
  });

  // Load data
  const loadThemes = async () => {
    try {
      const response = await fetch('/api/admin/themes');
      const data = await response.json();
      if (data.success) {
        setThemes(data.data);
      }
    } catch (error) {
      console.error('Error loading themes:', error);
    }
  };

  const loadQuestions = async () => {
    try {
      const params = new URLSearchParams();
      if (questionFilters.themeId) params.append('themeId', questionFilters.themeId);
      if (questionFilters.difficulty) params.append('difficulty', questionFilters.difficulty);
      
      const response = await fetch(`/api/admin/questions?${params.toString()}`);
      const data = await response.json();
      if (data.success) {
        let filteredQuestions = data.data;
        if (questionFilters.search) {
          filteredQuestions = filteredQuestions.filter((q: Question) =>
            q.text.toLowerCase().includes(questionFilters.search.toLowerCase())
          );
        }
        setQuestions(filteredQuestions);
      }
    } catch (error) {
      console.error('Error loading questions:', error);
    }
  };

  const loadConfigs = async () => {
    try {
      const response = await fetch('/api/admin/game-configs');
      const data = await response.json();
      if (data.success) {
        setConfigs(data.data);
      }
    } catch (error) {
      console.error('Error loading configs:', error);
    }
  };

  useEffect(() => {
    loadThemes();
    loadQuestions();
    loadConfigs();
  }, []);

  useEffect(() => {
    loadQuestions();
  }, [questionFilters]);

  // Theme handlers
  const handleCreateTheme = () => {
    setEditingTheme(null);
    setThemeForm({ name: '', description: '', color: '#3B82F6' });
    setShowThemeModal(true);
  };

  const handleEditTheme = (theme: Theme) => {
    setEditingTheme(theme);
    setThemeForm({
      name: theme.name,
      description: theme.description || '',
      color: theme.color
    });
    setShowThemeModal(true);
  };

  const handleSaveTheme = async () => {
    setLoading(true);
    try {
      const url = editingTheme ? `/api/admin/themes/${editingTheme.id}` : '/api/admin/themes';
      const method = editingTheme ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(themeForm)
      });

      const data = await response.json();
      if (data.success) {
        await loadThemes();
        setShowThemeModal(false);
        setEditingTheme(null);
      } else {
        setError(data.error);
      }
    } catch (error) {
      setError('Failed to save theme');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTheme = async (themeId: string) => {
    if (!confirm('Are you sure you want to delete this theme?')) return;
    
    try {
      const response = await fetch(`/api/admin/themes/${themeId}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      if (data.success) {
        await loadThemes();
      } else {
        setError(data.error);
      }
    } catch (error) {
      setError('Failed to delete theme');
    }
  };

  // Question handlers
  const handleCreateQuestion = () => {
    setEditingQuestion(null);
    setQuestionForm({
      text: '',
      option_a: '',
      option_b: '',
      option_c: '',
      correct_answer: 'A',
      difficulty: 'medium',
      theme_id: ''
    });
    setShowQuestionModal(true);
  };

  const handleEditQuestion = (question: Question) => {
    setEditingQuestion(question);
    setQuestionForm({
      text: question.text,
      option_a: question.option_a,
      option_b: question.option_b,
      option_c: question.option_c,
      correct_answer: question.correct_answer,
      difficulty: question.difficulty,
      theme_id: question.theme?.id || ''
    });
    setShowQuestionModal(true);
  };

  const handleSaveQuestion = async () => {
    setLoading(true);
    try {
      const url = editingQuestion ? `/api/admin/questions/${editingQuestion.id}` : '/api/admin/questions';
      const method = editingQuestion ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(questionForm)
      });

      const data = await response.json();
      if (data.success) {
        await loadQuestions();
        setShowQuestionModal(false);
        setEditingQuestion(null);
      } else {
        setError(data.error);
      }
    } catch (error) {
      setError('Failed to save question');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return;
    
    try {
      const response = await fetch(`/api/admin/questions/${questionId}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      if (data.success) {
        await loadQuestions();
      } else {
        setError(data.error);
      }
    } catch (error) {
      setError('Failed to delete question');
    }
  };

  // Config handlers
  const handleCreateConfig = () => {
    setEditingConfig(null);
    setConfigForm({
      name: '',
      description: '',
      rounds_count: 5,
      round_duration: 30,
      question_duration: 15,
      is_active: true
    });
    setShowConfigModal(true);
  };

  const handleEditConfig = (config: GameConfig) => {
    setEditingConfig(config);
    setConfigForm({
      name: config.name,
      description: config.description || '',
      rounds_count: config.rounds_count,
      round_duration: config.round_duration,
      question_duration: config.question_duration,
      is_active: config.is_active
    });
    setShowConfigModal(true);
  };

  const handleSaveConfig = async () => {
    setLoading(true);
    try {
      const url = editingConfig ? `/api/admin/game-configs/${editingConfig.id}` : '/api/admin/game-configs';
      const method = editingConfig ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(configForm)
      });

      const data = await response.json();
      if (data.success) {
        await loadConfigs();
        setShowConfigModal(false);
        setEditingConfig(null);
      } else {
        setError(data.error);
      }
    } catch (error) {
      setError('Failed to save config');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfig = async (configId: string) => {
    if (!confirm('Are you sure you want to delete this config?')) return;
    
    try {
      const response = await fetch(`/api/admin/game-configs/${configId}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      if (data.success) {
        await loadConfigs();
      } else {
        setError(data.error);
      }
    } catch (error) {
      setError('Failed to delete config');
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Editor de Partidas</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('themes')}
            className={`px-4 py-2 rounded-lg ${
              activeTab === 'themes' ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300'
            }`}
          >
            Temas
          </button>
          <button
            onClick={() => setActiveTab('questions')}
            className={`px-4 py-2 rounded-lg ${
              activeTab === 'questions' ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300'
            }`}
          >
            Perguntas
          </button>
          <button
            onClick={() => setActiveTab('configs')}
            className={`px-4 py-2 rounded-lg ${
              activeTab === 'configs' ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300'
            }`}
          >
            Configurações
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-900 border border-red-500 text-red-100 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Themes Tab */}
      {activeTab === 'themes' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-white">Temas</h3>
            <button
              onClick={handleCreateTheme}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center"
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Novo Tema
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {themes.map(theme => (
              <div key={theme.id} className="bg-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: theme.color }}
                  ></div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEditTheme(theme)}
                      className="text-blue-400 hover:text-blue-300"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteTheme(theme.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <h4 className="font-semibold text-white">{theme.name}</h4>
                {theme.description && (
                  <p className="text-gray-300 text-sm mt-1">{theme.description}</p>
                )}
                <p className="text-gray-400 text-sm mt-2">
                  {theme._count.questions} perguntas
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Questions Tab */}
      {activeTab === 'questions' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-white">Perguntas</h3>
            <button
              onClick={handleCreateQuestion}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center"
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Nova Pergunta
            </button>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Tema</label>
              <select
                value={questionFilters.themeId}
                onChange={(e) => setQuestionFilters(prev => ({ ...prev, themeId: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
              >
                <option value="">Todos os temas</option>
                {themes.map(theme => (
                  <option key={theme.id} value={theme.id}>{theme.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Dificuldade</label>
              <select
                value={questionFilters.difficulty}
                onChange={(e) => setQuestionFilters(prev => ({ ...prev, difficulty: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
              >
                <option value="">Todas as dificuldades</option>
                <option value="easy">Fácil</option>
                <option value="medium">Médio</option>
                <option value="hard">Difícil</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Buscar</label>
              <input
                type="text"
                value={questionFilters.search}
                onChange={(e) => setQuestionFilters(prev => ({ ...prev, search: e.target.value }))}
                placeholder="Digite para buscar..."
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
              />
            </div>
          </div>

          <div className="space-y-4">
            {questions.map(question => (
              <div key={question.id} className="bg-gray-700 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h4 className="font-semibold text-white mb-2">{question.text}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                      <div className="bg-gray-600 p-2 rounded">
                        <span className="font-medium">A:</span> {question.option_a}
                      </div>
                      <div className="bg-gray-600 p-2 rounded">
                        <span className="font-medium">B:</span> {question.option_b}
                      </div>
                      <div className="bg-gray-600 p-2 rounded">
                        <span className="font-medium">C:</span> {question.option_c}
                      </div>
                    </div>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-300">
                      <span>Resposta: {question.correct_answer}</span>
                      <span>Dificuldade: {question.difficulty}</span>
                      {question.theme && (
                        <span className="flex items-center">
                          <div 
                            className="w-3 h-3 rounded-full mr-1"
                            style={{ backgroundColor: question.theme.color }}
                          ></div>
                          {question.theme.name}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => handleEditQuestion(question)}
                      className="text-blue-400 hover:text-blue-300"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteQuestion(question.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Configs Tab */}
      {activeTab === 'configs' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-white">Configurações de Partida</h3>
            <button
              onClick={handleCreateConfig}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center"
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Nova Configuração
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {configs.map(config => (
              <div key={config.id} className="bg-gray-700 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-white">{config.name}</h4>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEditConfig(config)}
                      className="text-blue-400 hover:text-blue-300"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteConfig(config.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                {config.description && (
                  <p className="text-gray-300 text-sm mb-2">{config.description}</p>
                )}
                <div className="text-sm text-gray-400 space-y-1">
                  <p>Rodadas: {config.rounds_count}</p>
                  <p>Duração da rodada: {config.round_duration}s</p>
                  <p>Duração da pergunta: {config.question_duration}s</p>
                  <p>Status: {config.is_active ? 'Ativo' : 'Inativo'}</p>
                  <p>Usado em {config._count.games} partidas</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Theme Modal */}
      {showThemeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">
                {editingTheme ? 'Editar Tema' : 'Novo Tema'}
              </h3>
              <button
                onClick={() => setShowThemeModal(false)}
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
                  value={themeForm.name}
                  onChange={(e) => setThemeForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Descrição</label>
                <textarea
                  value={themeForm.description}
                  onChange={(e) => setThemeForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Cor</label>
                <input
                  type="color"
                  value={themeForm.color}
                  onChange={(e) => setThemeForm(prev => ({ ...prev, color: e.target.value }))}
                  className="w-full h-10 bg-gray-700 border border-gray-600 rounded-md"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => setShowThemeModal(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveTheme}
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Question Modal */}
      {showQuestionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">
                {editingQuestion ? 'Editar Pergunta' : 'Nova Pergunta'}
              </h3>
              <button
                onClick={() => setShowQuestionModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Pergunta</label>
                <textarea
                  value={questionForm.text}
                  onChange={(e) => setQuestionForm(prev => ({ ...prev, text: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Opção A</label>
                  <input
                    type="text"
                    value={questionForm.option_a}
                    onChange={(e) => setQuestionForm(prev => ({ ...prev, option_a: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Opção B</label>
                  <input
                    type="text"
                    value={questionForm.option_b}
                    onChange={(e) => setQuestionForm(prev => ({ ...prev, option_b: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Opção C</label>
                <input
                  type="text"
                  value={questionForm.option_c}
                  onChange={(e) => setQuestionForm(prev => ({ ...prev, option_c: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Resposta Correta</label>
                  <select
                    value={questionForm.correct_answer}
                    onChange={(e) => setQuestionForm(prev => ({ ...prev, correct_answer: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                  >
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Dificuldade</label>
                  <select
                    value={questionForm.difficulty}
                    onChange={(e) => setQuestionForm(prev => ({ ...prev, difficulty: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                  >
                    <option value="easy">Fácil</option>
                    <option value="medium">Médio</option>
                    <option value="hard">Difícil</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Tema</label>
                  <select
                    value={questionForm.theme_id}
                    onChange={(e) => setQuestionForm(prev => ({ ...prev, theme_id: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                  >
                    <option value="">Sem tema</option>
                    {themes.map(theme => (
                      <option key={theme.id} value={theme.id}>{theme.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => setShowQuestionModal(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveQuestion}
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Config Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">
                {editingConfig ? 'Editar Configuração' : 'Nova Configuração'}
              </h3>
              <button
                onClick={() => setShowConfigModal(false)}
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
                  value={configForm.name}
                  onChange={(e) => setConfigForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Descrição</label>
                <textarea
                  value={configForm.description}
                  onChange={(e) => setConfigForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Número de Rodadas</label>
                  <input
                    type="number"
                    value={configForm.rounds_count}
                    onChange={(e) => setConfigForm(prev => ({ ...prev, rounds_count: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                    min="1"
                    max="20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Duração da Rodada (s)</label>
                  <input
                    type="number"
                    value={configForm.round_duration}
                    onChange={(e) => setConfigForm(prev => ({ ...prev, round_duration: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                    min="10"
                    max="300"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Duração da Pergunta (s)</label>
                <input
                  type="number"
                  value={configForm.question_duration}
                  onChange={(e) => setConfigForm(prev => ({ ...prev, question_duration: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                  min="5"
                  max="60"
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={configForm.is_active}
                  onChange={(e) => setConfigForm(prev => ({ ...prev, is_active: e.target.checked }))}
                  className="mr-2"
                />
                <label className="text-sm font-medium text-gray-300">Ativo</label>
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => setShowConfigModal(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveConfig}
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
