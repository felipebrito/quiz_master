const { PrismaClient } = require('./src/generated/prisma')

async function testPrisma() {
  const prisma = new PrismaClient()
  
  try {
    console.log('🧪 Testando Prisma...')
    
    // Testar conexão
    await prisma.$connect()
    console.log('✅ Prisma conectado')
    
    // Testar busca de participantes
    const participants = await prisma.participant.findMany({
      where: { status: 'waiting' },
      take: 3
    })
    console.log('✅ Participantes encontrados:', participants.length)
    participants.forEach(p => console.log(`  - ${p.name} (${p.id})`))
    
    // Testar busca de perguntas
    const questions = await prisma.question.findMany({ take: 3 })
    console.log('✅ Perguntas encontradas:', questions.length)
    questions.forEach(q => console.log(`  - ${q.text.substring(0, 50)}...`))
    
    // Testar criação de jogo
    const game = await prisma.game.create({
      data: {
        status: 'active',
        current_round: 0,
        started_at: new Date()
      }
    })
    console.log('✅ Jogo criado:', game.id)
    
    // Testar criação de game participant
    const gameParticipant = await prisma.gameParticipant.create({
      data: {
        game_id: game.id,
        participant_id: participants[0].id,
        score: 0,
        position: 1
      }
    })
    console.log('✅ GameParticipant criado:', gameParticipant.id)
    
    // Limpar dados de teste
    await prisma.gameParticipant.delete({ where: { id: gameParticipant.id } })
    await prisma.game.delete({ where: { id: game.id } })
    console.log('✅ Dados de teste limpos')
    
    console.log('🎉 Prisma funcionando perfeitamente!')
    
  } catch (error) {
    console.error('❌ Erro no Prisma:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testPrisma()
