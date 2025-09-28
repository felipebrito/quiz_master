import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Contar partidas finalizadas
    const totalGames = await prisma.game.count({
      where: { status: 'finished' }
    });

    // Contar total de participantes
    const totalParticipants = await prisma.participant.count();

    // Calcular média de pontos
    const gameParticipants = await prisma.gameParticipant.findMany({
      select: { score: true }
    });
    const avgScore = gameParticipants.length > 0 
      ? gameParticipants.reduce((sum, gp) => sum + gp.score, 0) / gameParticipants.length
      : 0;

    // Calcular média de duração das partidas
    const games = await prisma.game.findMany({
      where: { 
        status: 'finished',
        started_at: { not: null },
        ended_at: { not: null }
      },
      select: { started_at: true, ended_at: true }
    });

    const avgDuration = games.length > 0 
      ? games.reduce((sum, game) => {
          const duration = (game.ended_at!.getTime() - game.started_at!.getTime()) / (1000 * 60); // minutos
          return sum + duration;
        }, 0) / games.length
      : 0;

    return NextResponse.json({
      totalGames,
      totalParticipants,
      averageScore: avgScore / 10, // Converter para escala de 0-10
      averageDuration: avgDuration
    });

  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
