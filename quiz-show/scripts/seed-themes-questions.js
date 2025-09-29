const { PrismaClient } = require('../src/generated/prisma');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding themes and questions...');

  // Create themes
  const themes = await Promise.all([
    prisma.theme.create({
      data: {
        name: 'Geografia',
        description: 'Perguntas sobre países, capitais, continentes e características geográficas',
        color: '#3B82F6'
      }
    }),
    prisma.theme.create({
      data: {
        name: 'História',
        description: 'Perguntas sobre eventos históricos, personalidades e datas importantes',
        color: '#EF4444'
      }
    }),
    prisma.theme.create({
      data: {
        name: 'Ciências',
        description: 'Perguntas sobre biologia, química, física e ciências naturais',
        color: '#10B981'
      }
    }),
    prisma.theme.create({
      data: {
        name: 'Esportes',
        description: 'Perguntas sobre futebol, olimpíadas, atletas e competições esportivas',
        color: '#F59E0B'
      }
    }),
    prisma.theme.create({
      data: {
        name: 'Entretenimento',
        description: 'Perguntas sobre filmes, música, TV, livros e cultura pop',
        color: '#8B5CF6'
      }
    })
  ]);

  console.log('✅ Themes created:', themes.length);

  // Create questions for each theme
  const questions = [
    // Geografia
    {
      text: 'Qual é a capital do Brasil?',
      option_a: 'São Paulo',
      option_b: 'Brasília',
      option_c: 'Rio de Janeiro',
      correct_answer: 'B',
      difficulty: 'easy',
      theme_id: themes[0].id
    },
    {
      text: 'Qual é o maior oceano do mundo?',
      option_a: 'Atlântico',
      option_b: 'Pacífico',
      option_c: 'Índico',
      correct_answer: 'B',
      difficulty: 'medium',
      theme_id: themes[0].id
    },
    {
      text: 'Qual país tem a maior população do mundo?',
      option_a: 'Índia',
      option_b: 'China',
      option_c: 'Estados Unidos',
      correct_answer: 'B',
      difficulty: 'easy',
      theme_id: themes[0].id
    },
    {
      text: 'Qual é o ponto mais alto do mundo?',
      option_a: 'Monte Kilimanjaro',
      option_b: 'Monte Everest',
      option_c: 'Monte Aconcágua',
      correct_answer: 'B',
      difficulty: 'medium',
      theme_id: themes[0].id
    },
    {
      text: 'Qual é o maior deserto do mundo?',
      option_a: 'Deserto do Saara',
      option_b: 'Deserto de Gobi',
      option_c: 'Deserto da Antártida',
      correct_answer: 'A',
      difficulty: 'hard',
      theme_id: themes[0].id
    },

    // História
    {
      text: 'Em que ano o Brasil foi descoberto?',
      option_a: '1498',
      option_b: '1500',
      option_c: '1502',
      correct_answer: 'B',
      difficulty: 'easy',
      theme_id: themes[1].id
    },
    {
      text: 'Quem foi o primeiro presidente do Brasil?',
      option_a: 'Deodoro da Fonseca',
      option_b: 'Prudente de Morais',
      option_c: 'Floriano Peixoto',
      correct_answer: 'A',
      difficulty: 'medium',
      theme_id: themes[1].id
    },
    {
      text: 'Em que ano terminou a Segunda Guerra Mundial?',
      option_a: '1944',
      option_b: '1945',
      option_c: '1946',
      correct_answer: 'B',
      difficulty: 'easy',
      theme_id: themes[1].id
    },
    {
      text: 'Qual foi o primeiro país a abolir a escravidão?',
      option_a: 'Brasil',
      option_b: 'Estados Unidos',
      option_c: 'Haiti',
      correct_answer: 'C',
      difficulty: 'hard',
      theme_id: themes[1].id
    },
    {
      text: 'Quem foi o último imperador do Brasil?',
      option_a: 'Pedro I',
      option_b: 'Pedro II',
      option_c: 'João VI',
      correct_answer: 'B',
      difficulty: 'medium',
      theme_id: themes[1].id
    },

    // Ciências
    {
      text: 'Qual é o planeta mais próximo do Sol?',
      option_a: 'Vênus',
      option_b: 'Mercúrio',
      option_c: 'Terra',
      correct_answer: 'B',
      difficulty: 'easy',
      theme_id: themes[2].id
    },
    {
      text: 'Qual é a fórmula química da água?',
      option_a: 'H2O',
      option_b: 'CO2',
      option_c: 'O2',
      correct_answer: 'A',
      difficulty: 'easy',
      theme_id: themes[2].id
    },
    {
      text: 'Quantos ossos tem o corpo humano adulto?',
      option_a: '206',
      option_b: '208',
      option_c: '210',
      correct_answer: 'A',
      difficulty: 'medium',
      theme_id: themes[2].id
    },
    {
      text: 'Qual é a velocidade da luz no vácuo?',
      option_a: '300.000 km/s',
      option_b: '300.000.000 m/s',
      option_c: 'Ambas estão corretas',
      correct_answer: 'C',
      difficulty: 'hard',
      theme_id: themes[2].id
    },
    {
      text: 'Qual é o elemento químico mais abundante na Terra?',
      option_a: 'Oxigênio',
      option_b: 'Silício',
      option_c: 'Ferro',
      correct_answer: 'A',
      difficulty: 'medium',
      theme_id: themes[2].id
    },

    // Esportes
    {
      text: 'Quantos jogadores tem um time de futebol em campo?',
      option_a: '10',
      option_b: '11',
      option_c: '12',
      correct_answer: 'B',
      difficulty: 'easy',
      theme_id: themes[3].id
    },
    {
      text: 'Em que ano o Brasil ganhou a primeira Copa do Mundo?',
      option_a: '1958',
      option_b: '1962',
      option_c: '1970',
      correct_answer: 'A',
      difficulty: 'medium',
      theme_id: themes[3].id
    },
    {
      text: 'Qual esporte é jogado em Wimbledon?',
      option_a: 'Tênis',
      option_b: 'Badminton',
      option_c: 'Squash',
      correct_answer: 'A',
      difficulty: 'easy',
      theme_id: themes[3].id
    },
    {
      text: 'Quantos metros tem uma piscina olímpica?',
      option_a: '50 metros',
      option_b: '100 metros',
      option_c: '200 metros',
      correct_answer: 'A',
      difficulty: 'hard',
      theme_id: themes[3].id
    },
    {
      text: 'Qual é o recorde mundial dos 100m rasos masculino?',
      option_a: '9,58 segundos',
      option_b: '9,69 segundos',
      option_c: '9,79 segundos',
      correct_answer: 'A',
      difficulty: 'hard',
      theme_id: themes[3].id
    },

    // Entretenimento
    {
      text: 'Qual é o filme mais premiado da história do Oscar?',
      option_a: 'Titanic',
      option_b: 'Ben-Hur',
      option_c: 'O Senhor dos Anéis: O Retorno do Rei',
      correct_answer: 'C',
      difficulty: 'medium',
      theme_id: themes[4].id
    },
    {
      text: 'Quem interpretou o Joker em "Coringa" (2019)?',
      option_a: 'Heath Ledger',
      option_b: 'Joaquin Phoenix',
      option_c: 'Jared Leto',
      correct_answer: 'B',
      difficulty: 'easy',
      theme_id: themes[4].id
    },
    {
      text: 'Qual banda lançou o álbum "Abbey Road"?',
      option_a: 'The Rolling Stones',
      option_b: 'The Beatles',
      option_c: 'Led Zeppelin',
      correct_answer: 'B',
      difficulty: 'medium',
      theme_id: themes[4].id
    },
    {
      text: 'Qual é o livro mais vendido da história?',
      option_a: 'Dom Quixote',
      option_b: 'A Bíblia',
      option_c: 'O Pequeno Príncipe',
      correct_answer: 'B',
      difficulty: 'hard',
      theme_id: themes[4].id
    },
    {
      text: 'Qual série de TV tem mais episódios?',
      option_a: 'The Simpsons',
      option_b: 'Grey\'s Anatomy',
      option_c: 'Law & Order',
      correct_answer: 'A',
      difficulty: 'hard',
      theme_id: themes[4].id
    }
  ];

  // Create questions
  const createdQuestions = await Promise.all(
    questions.map(question => prisma.question.create({ data: question }))
  );

  console.log('✅ Questions created:', createdQuestions.length);

  // Create default game config
  const defaultConfig = await prisma.gameConfig.create({
    data: {
      name: 'Configuração Padrão',
      description: 'Configuração padrão para partidas do quiz',
      rounds_count: 5,
      round_duration: 30,
      question_duration: 15,
      is_active: true
    }
  });

  console.log('✅ Default game config created:', defaultConfig.name);

  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
