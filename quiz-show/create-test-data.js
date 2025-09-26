const { PrismaClient } = require('./src/generated/prisma')

const prisma = new PrismaClient()

async function createTestData() {
  try {
    console.log('🎮 Criando dados de teste para o ranking...')

    // Criar participantes de teste
    const participants = await Promise.all([
      prisma.participant.create({
        data: {
          name: 'João Silva',
          city: 'São Paulo',
          state: 'SP',
          photo_url: null,
          status: 'finished'
        }
      }),
      prisma.participant.create({
        data: {
          name: 'Maria Santos',
          city: 'Rio de Janeiro',
          state: 'RJ',
          photo_url: null,
          status: 'finished'
        }
      }),
      prisma.participant.create({
        data: {
          name: 'Pedro Costa',
          city: 'Belo Horizonte',
          state: 'MG',
          photo_url: null,
          status: 'finished'
        }
      }),
      prisma.participant.create({
        data: {
          name: 'Ana Oliveira',
          city: 'Salvador',
          state: 'BA',
          photo_url: null,
          status: 'finished'
        }
      }),
      prisma.participant.create({
        data: {
          name: 'Carlos Lima',
          city: 'Brasília',
          state: 'DF',
          photo_url: null,
          status: 'finished'
        }
      })
    ])

    console.log('✅ Participantes criados:', participants.length)

    // Criar um jogo de teste
    const game = await prisma.game.create({
      data: {
        status: 'finished',
        current_round: 8,
        started_at: new Date(Date.now() - 3600000), // 1 hora atrás
        ended_at: new Date(),
        winner_id: participants[0].id
      }
    })

    console.log('✅ Jogo criado:', game.id)

    // Criar GameParticipants com pontuações
    const gameParticipants = await Promise.all([
      prisma.gameParticipant.create({
        data: {
          game_id: game.id,
          participant_id: participants[0].id,
          position: 1,
          score: 850
        }
      }),
      prisma.gameParticipant.create({
        data: {
          game_id: game.id,
          participant_id: participants[1].id,
          position: 2,
          score: 720
        }
      }),
      prisma.gameParticipant.create({
        data: {
          game_id: game.id,
          participant_id: participants[2].id,
          position: 3,
          score: 680
        }
      }),
      prisma.gameParticipant.create({
        data: {
          game_id: game.id,
          participant_id: participants[3].id,
          position: 4,
          score: 540
        }
      }),
      prisma.gameParticipant.create({
        data: {
          game_id: game.id,
          participant_id: participants[4].id,
          position: 5,
          score: 420
        }
      })
    ])

    console.log('✅ GameParticipants criados:', gameParticipants.length)
    console.log('🎉 Dados de teste criados com sucesso!')

  } catch (error) {
    console.error('❌ Erro ao criar dados de teste:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createTestData()
