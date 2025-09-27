import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@/lib/prisma'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    const fromDate = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const toDate = to ? new Date(to) : new Date()

    // Basic metrics
    const [
      totalGames,
      uniqueParticipants,
      gamesWithParticipants,
      allAnswers,
      topParticipants
    ] = await Promise.all([
      // Total games in period
      prisma.game.count({
        where: {
          started_at: {
            gte: fromDate,
            lte: toDate
          }
        }
      }),

      // Unique participants in period
      prisma.participant.count({
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
        }
      }),

      // Games with participants for completion rate
      prisma.game.findMany({
        where: {
          started_at: {
            gte: fromDate,
            lte: toDate
          }
        },
        include: {
          gameParticipants: true
        }
      }),

      // All answers for response time analysis
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
          game: true
        }
      }),

      // Top participants
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
            }
          }
        },
        take: 10
      })
    ])

    // Calculate derived metrics
    const completedGames = gamesWithParticipants.filter(game => game.status === 'finished').length
    const completionRate = totalGames > 0 ? (completedGames / totalGames) * 100 : 0

    const averageGameDuration = gamesWithParticipants.length > 0 
      ? gamesWithParticipants.reduce((acc, game) => {
          if (game.started_at && game.ended_at) {
            const duration = (game.ended_at.getTime() - game.started_at.getTime()) / (1000 * 60) // minutes
            return acc + duration
          }
          return acc
        }, 0) / gamesWithParticipants.length
      : 0

    const averageResponseTime = allAnswers.length > 0
      ? allAnswers.reduce((acc, answer) => acc + answer.response_time, 0) / allAnswers.length / 1000 // convert to seconds
      : 0

    const averageParticipationRate = gamesWithParticipants.length > 0
      ? gamesWithParticipants.reduce((acc, game) => acc + game.gameParticipants.length, 0) / gamesWithParticipants.length
      : 0

    // Process top participants
    const processedTopParticipants = topParticipants.map(participant => ({
      id: participant.id,
      name: participant.name,
      gamesPlayed: participant.gameParticipants.length,
      averageScore: participant.gameParticipants.length > 0
        ? participant.gameParticipants.reduce((acc, gp) => acc + gp.score, 0) / participant.gameParticipants.length
        : 0,
      photo_url: participant.photo_url
    })).sort((a, b) => b.gamesPlayed - a.gamesPlayed)

    // Generate chart data for games over time
    const gamesOverTime = []
    const currentDate = new Date(fromDate)
    while (currentDate <= toDate) {
      const dayStart = new Date(currentDate)
      const dayEnd = new Date(currentDate)
      dayEnd.setHours(23, 59, 59, 999)

      const dayGames = await prisma.game.count({
        where: {
          started_at: {
            gte: dayStart,
            lte: dayEnd
          }
        }
      })

      const dayParticipants = await prisma.participant.count({
        where: {
          gameParticipants: {
            some: {
              game: {
                started_at: {
                  gte: dayStart,
                  lte: dayEnd
                }
              }
            }
          }
        }
      })

      gamesOverTime.push({
        date: currentDate.toISOString().split('T')[0],
        games: dayGames,
        participants: dayParticipants
      })

      currentDate.setDate(currentDate.getDate() + 1)
    }

    // Generate response time distribution
    const responseTimeDistribution = [
      { range: '0-5s', count: allAnswers.filter(a => a.response_time <= 5000).length },
      { range: '5-10s', count: allAnswers.filter(a => a.response_time > 5000 && a.response_time <= 10000).length },
      { range: '10-15s', count: allAnswers.filter(a => a.response_time > 10000 && a.response_time <= 15000).length },
      { range: '15-20s', count: allAnswers.filter(a => a.response_time > 15000 && a.response_time <= 20000).length },
      { range: '20s+', count: allAnswers.filter(a => a.response_time > 20000).length }
    ]

    const metrics = {
      totalGames,
      uniqueParticipants,
      averageParticipationRate: averageParticipationRate * 100, // Convert to percentage
      averageGameDuration: Math.round(averageGameDuration),
      totalRevenue: totalGames * 50, // Mock revenue calculation
      completionRate,
      averageResponseTime: Math.round(averageResponseTime * 10) / 10,
      topParticipants: processedTopParticipants
    }

    const chartData = {
      gamesOverTime,
      participationTrend: gamesOverTime.map(item => ({
        date: item.date,
        rate: item.games > 0 ? (item.participants / (item.games * 3)) * 100 : 0
      })),
      responseTimeDistribution
    }

    return NextResponse.json({
      metrics,
      chartData
    })

  } catch (error) {
    console.error('Error fetching analytics data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
