import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@/lib/prisma'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') as 'pdf' | 'excel' | 'json'
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    if (!format || !['pdf', 'excel', 'json'].includes(format)) {
      return NextResponse.json(
        { error: 'Invalid format. Must be pdf, excel, or json' },
        { status: 400 }
      )
    }

    const fromDate = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const toDate = to ? new Date(to) : new Date()

    // Fetch comprehensive data
    const [
      games,
      participants,
      answers
    ] = await Promise.all([
      prisma.game.findMany({
        where: {
          started_at: {
            gte: fromDate,
            lte: toDate
          }
        },
        include: {
          gameParticipants: {
            include: {
              participant: true
            }
          }
        },
        orderBy: {
          started_at: 'desc'
        }
      }),

      prisma.participant.findMany({
        where: {
          gameParticipants: {
            some: {
              game: {
                started_at: {
                  gte: fromDate,
                  lte: toDate
                }
              }
            }
          }
        },
        include: {
          gameParticipants: {
            where: {
              game: {
                started_at: {
                  gte: fromDate,
                  lte: toDate
                }
              }
            },
            include: {
              game: true
            }
          }
        }
      }),

      prisma.answer.findMany({
        where: {
          game: {
            started_at: {
              gte: fromDate,
              lte: toDate
            }
          }
        },
        include: {
          participant: true,
          question: true,
          game: true
        }
      })
    ])

    // Calculate metrics
    const totalGames = games.length
    const completedGames = games.filter(g => g.status === 'finished').length
    const uniqueParticipants = participants.length
    const totalAnswers = answers.length
    const correctAnswers = answers.filter(a => a.is_correct).length
    const averageAccuracy = totalAnswers > 0 ? (correctAnswers / totalAnswers) * 100 : 0

    const averageGameDuration = games.length > 0 
      ? games.reduce((acc, game) => {
          if (game.started_at && game.ended_at) {
            const duration = (game.ended_at.getTime() - game.started_at.getTime()) / (1000 * 60)
            return acc + duration
          }
          return acc
        }, 0) / games.length
      : 0

    const averageResponseTime = answers.length > 0
      ? answers.reduce((acc, answer) => acc + answer.response_time, 0) / answers.length / 1000
      : 0

    // Prepare report data
    const reportData = {
      metadata: {
        generatedAt: new Date().toISOString(),
        period: {
          from: fromDate.toISOString(),
          to: toDate.toISOString()
        },
        format
      },
      summary: {
        totalGames,
        completedGames,
        completionRate: totalGames > 0 ? (completedGames / totalGames) * 100 : 0,
        uniqueParticipants,
        totalAnswers,
        correctAnswers,
        averageAccuracy,
        averageGameDuration: Math.round(averageGameDuration),
        averageResponseTime: Math.round(averageResponseTime * 10) / 10
      },
      games: games.map(game => ({
        id: game.id,
        status: game.status,
        startedAt: game.started_at?.toISOString(),
        endedAt: game.ended_at?.toISOString(),
        duration: game.started_at && game.ended_at 
          ? Math.round((game.ended_at.getTime() - game.started_at.getTime()) / (1000 * 60))
          : null,
        participants: game.gameParticipants.map(gp => ({
          id: gp.participant.id,
          name: gp.participant.name,
          score: gp.score,
          position: gp.position
        }))
      })),
      participants: participants.map(participant => {
        const gameStats = participant.gameParticipants
        const totalScore = gameStats.reduce((acc, gp) => acc + gp.score, 0)
        const gamesPlayed = gameStats.length
        const averageScore = gamesPlayed > 0 ? totalScore / gamesPlayed : 0

        return {
          id: participant.id,
          name: participant.name,
          city: participant.city,
          state: participant.state,
          photoUrl: participant.photo_url,
          gamesPlayed,
          totalScore,
          averageScore: Math.round(averageScore * 10) / 10,
          games: gameStats.map(gp => ({
            gameId: gp.game.id,
            score: gp.score,
            position: gp.position,
            playedAt: gp.game.started_at?.toISOString()
          }))
        }
      }),
      answers: answers.map(answer => ({
        id: answer.id,
        participantName: answer.participant.name,
        questionText: answer.question.text,
        selectedAnswer: answer.answer,
        correctAnswer: answer.question.correct_answer,
        isCorrect: answer.is_correct,
        responseTime: answer.response_time,
        answeredAt: answer.created_at?.toISOString()
      }))
    }

    if (format === 'json') {
      return new NextResponse(JSON.stringify(reportData, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="analytics-report-${new Date().toISOString().split('T')[0]}.json"`
        }
      })
    }

    if (format === 'excel') {
      // For Excel, we'll return a simplified CSV format
      const csvData = generateCSV(reportData)
      return new NextResponse(csvData, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="analytics-report-${new Date().toISOString().split('T')[0]}.csv"`
        }
      })
    }

    if (format === 'pdf') {
      // For PDF, we'll return a simplified text format
      const textData = generateTextReport(reportData)
      return new NextResponse(textData, {
        headers: {
          'Content-Type': 'text/plain',
          'Content-Disposition': `attachment; filename="analytics-report-${new Date().toISOString().split('T')[0]}.txt"`
        }
      })
    }

    return NextResponse.json({ error: 'Unsupported format' }, { status: 400 })

  } catch (error) {
    console.error('Error generating export:', error)
    return NextResponse.json(
      { error: 'Failed to generate export' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

function generateCSV(data: any): string {
  const lines = []
  
  // Header
  lines.push('Relatório de Analytics - Quiz Show')
  lines.push(`Período: ${new Date(data.metadata.period.from).toLocaleDateString('pt-BR')} a ${new Date(data.metadata.period.to).toLocaleDateString('pt-BR')}`)
  lines.push(`Gerado em: ${new Date(data.metadata.generatedAt).toLocaleString('pt-BR')}`)
  lines.push('')
  
  // Summary
  lines.push('RESUMO EXECUTIVO')
  lines.push(`Total de Partidas,${data.summary.totalGames}`)
  lines.push(`Partidas Concluídas,${data.summary.completedGames}`)
  lines.push(`Taxa de Conclusão,${data.summary.completionRate.toFixed(1)}%`)
  lines.push(`Participantes Únicos,${data.summary.uniqueParticipants}`)
  lines.push(`Total de Respostas,${data.summary.totalAnswers}`)
  lines.push(`Respostas Corretas,${data.summary.correctAnswers}`)
  lines.push(`Taxa de Acerto,${data.summary.averageAccuracy.toFixed(1)}%`)
  lines.push(`Duração Média das Partidas,${data.summary.averageGameDuration} minutos`)
  lines.push(`Tempo Médio de Resposta,${data.summary.averageResponseTime} segundos`)
  lines.push('')
  
  // Games
  lines.push('DETALHES DAS PARTIDAS')
  lines.push('ID,Status,Iniciada em,Finalizada em,Duração (min),Participantes')
  data.games.forEach((game: any) => {
    const participants = game.participants.map((p: any) => `${p.name}(${p.score})`).join('; ')
    lines.push(`${game.id},${game.status},${game.startedAt || 'N/A'},${game.endedAt || 'N/A'},${game.duration || 'N/A'},${participants}`)
  })
  
  return lines.join('\n')
}

function generateTextReport(data: any): string {
  const lines = []
  
  lines.push('='.repeat(60))
  lines.push('RELATÓRIO DE ANALYTICS - QUIZ SHOW')
  lines.push('='.repeat(60))
  lines.push('')
  lines.push(`Período: ${new Date(data.metadata.period.from).toLocaleDateString('pt-BR')} a ${new Date(data.metadata.period.to).toLocaleDateString('pt-BR')}`)
  lines.push(`Gerado em: ${new Date(data.metadata.generatedAt).toLocaleString('pt-BR')}`)
  lines.push('')
  
  // Summary
  lines.push('RESUMO EXECUTIVO')
  lines.push('-'.repeat(30))
  lines.push(`Total de Partidas: ${data.summary.totalGames}`)
  lines.push(`Partidas Concluídas: ${data.summary.completedGames}`)
  lines.push(`Taxa de Conclusão: ${data.summary.completionRate.toFixed(1)}%`)
  lines.push(`Participantes Únicos: ${data.summary.uniqueParticipants}`)
  lines.push(`Total de Respostas: ${data.summary.totalAnswers}`)
  lines.push(`Respostas Corretas: ${data.summary.correctAnswers}`)
  lines.push(`Taxa de Acerto: ${data.summary.averageAccuracy.toFixed(1)}%`)
  lines.push(`Duração Média das Partidas: ${data.summary.averageGameDuration} minutos`)
  lines.push(`Tempo Médio de Resposta: ${data.summary.averageResponseTime} segundos`)
  lines.push('')
  
  // Top Participants
  lines.push('TOP PARTICIPANTES')
  lines.push('-'.repeat(30))
  data.participants
    .sort((a: any, b: any) => b.averageScore - a.averageScore)
    .slice(0, 10)
    .forEach((participant: any, index: number) => {
      lines.push(`${index + 1}. ${participant.name}`)
      lines.push(`   Partidas: ${participant.gamesPlayed}`)
      lines.push(`   Pontuação Média: ${participant.averageScore}`)
      lines.push(`   Pontuação Total: ${participant.totalScore}`)
      lines.push('')
    })
  
  return lines.join('\n')
}
