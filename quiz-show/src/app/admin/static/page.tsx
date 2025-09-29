export default function AdminStatic() {
  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8 text-center">QUIZ // APARATO - STATIC</h1>
        
        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-2xl font-bold text-white mb-4">Estatísticas (Estáticas)</h2>
          
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-4xl font-bold text-white">12</p>
              <p className="text-gray-400">partidas</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-white">10</p>
              <p className="text-gray-400">participantes</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-white">7.8</p>
              <p className="text-gray-400">~pontos</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-white">44</p>
              <p className="text-gray-400">~duração</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

