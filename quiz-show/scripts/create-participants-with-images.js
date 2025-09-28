const { PrismaClient } = require('../src/generated/prisma');

const prisma = new PrismaClient();

// Lista de participantes com imagens de placeholder
const participants = [
  {
    name: 'Ana Silva',
    city: 'São Paulo',
    state: 'SP',
    photo_url: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
    status: 'waiting'
  },
  {
    name: 'Bruno Costa',
    city: 'Rio de Janeiro',
    state: 'RJ',
    photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    status: 'waiting'
  },
  {
    name: 'Carlos Lima',
    city: 'Belo Horizonte',
    state: 'MG',
    photo_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    status: 'waiting'
  },
  {
    name: 'Diana Santos',
    city: 'Salvador',
    state: 'BA',
    photo_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    status: 'waiting'
  },
  {
    name: 'Eduardo Oliveira',
    city: 'Fortaleza',
    state: 'CE',
    photo_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
    status: 'waiting'
  },
  {
    name: 'Fernanda Rocha',
    city: 'Brasília',
    state: 'DF',
    photo_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face',
    status: 'waiting'
  },
  {
    name: 'Gabriel Alves',
    city: 'Manaus',
    state: 'AM',
    photo_url: 'https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=150&h=150&fit=crop&crop=face',
    status: 'waiting'
  },
  {
    name: 'Helena Pereira',
    city: 'Curitiba',
    state: 'PR',
    photo_url: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150&h=150&fit=crop&crop=face',
    status: 'waiting'
  },
  {
    name: 'Igor Fernandes',
    city: 'Recife',
    state: 'PE',
    photo_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face',
    status: 'waiting'
  },
  {
    name: 'Julia Martins',
    city: 'Porto Alegre',
    state: 'RS',
    photo_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face',
    status: 'waiting'
  },
  {
    name: 'Kleber Souza',
    city: 'Goiânia',
    state: 'GO',
    photo_url: 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=150&h=150&fit=crop&crop=face',
    status: 'waiting'
  },
  {
    name: 'Larissa Barbosa',
    city: 'Belém',
    state: 'PA',
    photo_url: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=150&h=150&fit=crop&crop=face',
    status: 'waiting'
  }
];

async function createParticipants() {
  try {
    console.log('🗑️ Limpando participantes existentes...');
    await prisma.participant.deleteMany({});
    
    console.log('👥 Criando participantes com imagens...');
    const createdParticipants = await Promise.all(
      participants.map(participant => 
        prisma.participant.create({ data: participant })
      )
    );
    
    console.log('✅ Participantes criados com sucesso:');
    createdParticipants.forEach((p, index) => {
      console.log(`  ${index + 1}. ${p.name} (${p.city} - ${p.state}) - ID: ${p.id}`);
    });
    
    console.log(`\n🎮 Total: ${createdParticipants.length} participantes prontos para jogar!`);
    
  } catch (error) {
    console.error('❌ Erro ao criar participantes:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createParticipants();
