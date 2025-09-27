import { useState, useEffect } from 'react';

export interface State {
  id: number;
  sigla: string;
  nome: string;
}

export interface City {
  id: number;
  nome: string;
}

export function useStatesCities() {
  const [states, setStates] = useState<State[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStates = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados');
      const data = await response.json();
      setStates(data.sort((a: State, b: State) => a.nome.localeCompare(b.nome)));
    } catch (err) {
      setError('Erro ao carregar estados');
      console.error('Erro ao carregar estados:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadCities = async (stateId: number) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${stateId}/municipios`);
      const data = await response.json();
      setCities(data.sort((a: City, b: City) => a.nome.localeCompare(b.nome)));
    } catch (err) {
      setError('Erro ao carregar cidades');
      console.error('Erro ao carregar cidades:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStates();
  }, []);

  return {
    states,
    cities,
    loading,
    error,
    loadCities,
    loadStates
  };
}
