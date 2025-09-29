'use client'

import Link from 'next/link'

export default function HomePage() {
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom right, #0f172a, #581c87, #0f172a)', color: 'white', padding: '20px', fontFamily: 'system-ui, sans-serif' }}>
      {/* Navegação */}
      <nav style={{ marginBottom: '40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>🎯 Quiz Show Interativo</div>
          <div style={{ display: 'flex', gap: '20px' }}>
            <Link href="/admin" style={{ color: '#94a3b8', textDecoration: 'none', transition: 'color 0.2s' }}>
              Admin
            </Link>
            <Link href="/display" style={{ color: '#94a3b8', textDecoration: 'none', transition: 'color 0.2s' }}>
              Display
            </Link>
            <Link href="/ranking" style={{ color: '#94a3b8', textDecoration: 'none', transition: 'color 0.2s' }}>
              Ranking
            </Link>
            <Link href="/admin/game-editor" style={{ color: '#94a3b8', textDecoration: 'none', transition: 'color 0.2s' }}>
              Editor
            </Link>
          </div>
        </div>
      </nav>

      <div style={{ textAlign: 'center', paddingTop: '50px' }}>
        <h1 style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '20px' }}>🎯 Quiz Show Interativo</h1>
        <p style={{ fontSize: '1.2rem', marginBottom: '40px' }}>Sistema de entretenimento digital para quiz shows interativos</p>
        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/cadastro" style={{ background: 'rgba(59, 130, 246, 0.9)', color: 'white', padding: '12px 24px', borderRadius: '8px', textDecoration: 'none', fontSize: '1.1rem', fontWeight: '500', transition: 'background 0.2s' }}>
            👤 Cadastrar Participantes
          </Link>
          <Link href="/admin" style={{ background: 'rgba(34, 197, 94, 0.9)', color: 'white', padding: '12px 24px', borderRadius: '8px', textDecoration: 'none', fontSize: '1.1rem', fontWeight: '500', transition: 'background 0.2s' }}>
            ⚙️ Painel Admin
          </Link>
          <Link href="/display" style={{ background: 'rgba(168, 85, 247, 0.9)', color: 'white', padding: '12px 24px', borderRadius: '8px', textDecoration: 'none', fontSize: '1.1rem', fontWeight: '500', transition: 'background 0.2s' }}>
            📺 Display Público
          </Link>
          <Link href="/ranking" style={{ background: 'rgba(245, 158, 11, 0.9)', color: 'white', padding: '12px 24px', borderRadius: '8px', textDecoration: 'none', fontSize: '1.1rem', fontWeight: '500', transition: 'background 0.2s' }}>
            🏆 Ranking
          </Link>
          <Link href="/admin/game-editor" style={{ background: 'rgba(236, 72, 153, 0.9)', color: 'white', padding: '12px 24px', borderRadius: '8px', textDecoration: 'none', fontSize: '1.1rem', fontWeight: '500', transition: 'background 0.2s' }}>
            ✏️ Editor de Partidas
          </Link>
        </div>
        <div style={{ marginTop: '60px', background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: '12px', padding: '30px', maxWidth: '800px', margin: '60px auto 0' }}>
          <h2 style={{ fontSize: '2rem', marginBottom: '20px' }}>🎮 Funcionalidades</h2>
          <p style={{ fontSize: '1.1rem', lineHeight: '1.6', marginBottom: '0' }}>Tudo que você precisa para um quiz show profissional</p>
        </div>
      </div>
    </div>
  )
}