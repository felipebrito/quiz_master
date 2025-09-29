'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import GameEditor from '@/components/admin/GameEditor';

export default function GameEditorPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center mb-8">
          <Link 
            href="/admin"
            className="mr-4 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <div>
            <h1 className="text-4xl font-bold text-gray-100">Editor de Partidas</h1>
            <p className="text-gray-400 mt-2">Gerencie temas, perguntas e configurações de partida</p>
          </div>
        </div>

        <GameEditor />
      </div>
    </div>
  );
}
