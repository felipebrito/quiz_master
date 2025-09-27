export default function TestTailwind() {
  return (
    <div className="min-h-screen bg-red-500 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          🧪 Teste Tailwind CSS
        </h1>
        <div className="space-y-4">
          <div className="bg-blue-100 p-4 rounded">
            <p className="text-blue-800">✅ Se você vê este card azul, o Tailwind básico funciona</p>
          </div>
          <div className="bg-green-100 p-4 rounded">
            <p className="text-green-800">✅ Se você vê este card verde, as cores funcionam</p>
          </div>
          <div className="bg-gradient-to-r from-purple-500 to-blue-500 p-4 rounded">
            <p className="text-white">✅ Se você vê gradiente aqui, os gradientes funcionam</p>
          </div>
          <div className="border border-gray-300 p-4 rounded">
            <p className="text-gray-700">✅ Se você vê bordas aqui, as bordas funcionam</p>
          </div>
        </div>
        <div className="mt-6 text-center">
          <a href="/" className="text-blue-600 hover:text-blue-800 underline">
            ← Voltar para Home
          </a>
        </div>
      </div>
    </div>
  )
}
