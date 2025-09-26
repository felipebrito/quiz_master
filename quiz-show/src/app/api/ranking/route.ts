import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Buscar participantes com pontuação através da tabela GameParticipant
    const ranking = await prisma.gameParticipant.findMany({
      where: {
        score: {
          gt: 0 // Apenas participantes com pontuação > 0
        }
      },
      include: {
        participant: {
          select: {
            id: true,
            name: true,
            city: true,
            state: true,
            photo_url: true,
            updated_at: true
          }
        }
      },
      orderBy: {
        score: 'desc'
      },
      take: 10, // Top 10
    })

    // Transformar os dados para o formato esperado
    const formattedRanking = ranking.map(gp => ({
      id: gp.participant.id,
      name: gp.participant.name,
      city: gp.participant.city,
      state: gp.participant.state,
      score: gp.score,
      photo_url: gp.participant.photo_url,
      updated_at: gp.participant.updated_at
    }))

    return NextResponse.json({
      success: true,
      data: formattedRanking,
      message: 'Ranking carregado com sucesso'
    })

  } catch (error) {
    console.error('Erro ao buscar ranking:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor',
        data: []
      },
      { status: 500 }
    )
  }
}
