import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { playerIds } = await request.json();

    if (!playerIds || !Array.isArray(playerIds) || playerIds.length !== 3) {
      return NextResponse.json({
        success: false,
        error: 'É necessário selecionar exatamente 3 jogadores'
      }, { status: 400 });
    }

    // Verificar se os jogadores existem e estão disponíveis
    const participants = await prisma.participant.findMany({
      where: {
        id: { in: playerIds },
        status: 'waiting'
      }
    });

    if (participants.length !== 3) {
      return NextResponse.json({
        success: false,
        error: 'Alguns jogadores não foram encontrados ou não estão disponíveis'
      }, { status: 400 });
    }

    // Atualizar status dos jogadores para 'playing'
    await prisma.participant.updateMany({
      where: { id: { in: playerIds } },
      data: { status: 'playing' }
    });

    // Criar um novo jogo
    const game = await prisma.game.create({
      data: {
        status: 'active',
        current_round: 1,
        started_at: new Date(),
        participants: {
          create: playerIds.map((id, index) => ({
            participant_id: id,
            position: index + 1,
            score: 0
          }))
        }
      }
    });

    // Aqui você emitiria eventos via Socket.IO para notificar os clientes
    // Por enquanto, apenas retornamos sucesso

    return NextResponse.json({
      success: true,
      data: {
        gameId: game.id,
        message: 'Jogo iniciado com sucesso'
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Erro ao iniciar jogo:', error);
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 });
  }
}
