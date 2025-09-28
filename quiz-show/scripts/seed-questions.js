const { PrismaClient } = require('../src/generated/prisma')

const prisma = new PrismaClient()

const questions = [
  // CONHECIMENTOS GERAIS (8 perguntas)
  {
    text: "Qual é a capital do Brasil?",
    option_a: "São Paulo",
    option_b: "Rio de Janeiro", 
    option_c: "Brasília",
    correct_answer: "C",
    difficulty: "easy"
  },
  {
    text: "Quantos continentes existem no mundo?",
    option_a: "5",
    option_b: "6",
    option_c: "7",
    correct_answer: "C",
    difficulty: "easy"
  },
  {
    text: "Qual é o maior planeta do sistema solar?",
    option_a: "Terra",
    option_b: "Júpiter",
    option_c: "Saturno",
    correct_answer: "B",
    difficulty: "medium"
  },
  {
    text: "Em que ano foi descoberto o Brasil?",
    option_a: "1498",
    option_b: "1500",
    option_c: "1502",
    correct_answer: "B",
    difficulty: "medium"
  },
  {
    text: "Qual é a moeda oficial do Japão?",
    option_a: "Won",
    option_b: "Yuan",
    option_c: "Iene",
    correct_answer: "C",
    difficulty: "medium"
  },
  {
    text: "Quem escreveu 'Dom Casmurro'?",
    option_a: "Machado de Assis",
    option_b: "José de Alencar",
    option_c: "Castro Alves",
    correct_answer: "A",
    difficulty: "hard"
  },
  {
    text: "Qual é a fórmula química da água?",
    option_a: "H2O",
    option_b: "CO2",
    option_c: "NaCl",
    correct_answer: "A",
    difficulty: "easy"
  },
  {
    text: "Em que oceano está localizado o Triângulo das Bermudas?",
    option_a: "Pacífico",
    option_b: "Atlântico",
    option_c: "Índico",
    correct_answer: "B",
    difficulty: "medium"
  },

  // CULTURA POP (8 perguntas)
  {
    text: "Qual é o nome do protagonista de 'Breaking Bad'?",
    option_a: "Jesse Pinkman",
    option_b: "Walter White",
    option_c: "Hank Schrader",
    correct_answer: "B",
    difficulty: "medium"
  },
  {
    text: "Qual cantora é conhecida como 'Queen of Pop'?",
    option_a: "Beyoncé",
    option_b: "Madonna",
    option_c: "Lady Gaga",
    correct_answer: "B",
    difficulty: "easy"
  },
  {
    text: "Qual filme ganhou o Oscar de Melhor Filme em 2020?",
    option_a: "1917",
    option_b: "Parasita",
    option_c: "Joker",
    correct_answer: "B",
    difficulty: "hard"
  },
  {
    text: "Qual é o nome do mascote da Copa do Mundo de 2014?",
    option_a: "Fuleco",
    option_b: "Zakumi",
    option_c: "Naranjito",
    correct_answer: "A",
    difficulty: "medium"
  },
  {
    text: "Qual rede social foi criada por Mark Zuckerberg?",
    option_a: "Twitter",
    option_b: "Instagram",
    option_c: "Facebook",
    correct_answer: "C",
    difficulty: "easy"
  },
  {
    text: "Qual é o nome do personagem principal de 'Game of Thrones'?",
    option_a: "Jon Snow",
    option_b: "Tyrion Lannister",
    option_c: "Daenerys Targaryen",
    correct_answer: "A",
    difficulty: "medium"
  },
  {
    text: "Qual banda britânica é conhecida como 'The Fab Four'?",
    option_a: "Rolling Stones",
    option_b: "The Beatles",
    option_c: "Queen",
    correct_answer: "B",
    difficulty: "easy"
  },
  {
    text: "Qual é o nome do primeiro filme da saga 'Star Wars' lançado?",
    option_a: "Uma Nova Esperança",
    option_b: "O Império Contra-Ataca",
    option_c: "O Retorno de Jedi",
    correct_answer: "A",
    difficulty: "hard"
  },

  // GEOGRAFIA (8 perguntas)
  {
    text: "Qual é o maior país do mundo em extensão territorial?",
    option_a: "China",
    option_b: "Rússia",
    option_c: "Canadá",
    correct_answer: "B",
    difficulty: "easy"
  },
  {
    text: "Qual é o rio mais longo do mundo?",
    option_a: "Nilo",
    option_b: "Amazonas",
    option_c: "Mississippi",
    correct_answer: "A",
    difficulty: "medium"
  },
  {
    text: "Qual é a montanha mais alta do mundo?",
    option_a: "K2",
    option_b: "Everest",
    option_c: "Kilimanjaro",
    correct_answer: "B",
    difficulty: "easy"
  },
  {
    text: "Qual é o menor país do mundo?",
    option_a: "Mônaco",
    option_b: "Vaticano",
    option_c: "Liechtenstein",
    correct_answer: "B",
    difficulty: "medium"
  },
  {
    text: "Qual é o deserto mais quente do mundo?",
    option_a: "Sahara",
    option_b: "Gobi",
    option_c: "Atacama",
    correct_answer: "A",
    difficulty: "easy"
  },
  {
    text: "Qual é a capital da Austrália?",
    option_a: "Sydney",
    option_b: "Melbourne",
    option_c: "Canberra",
    correct_answer: "C",
    difficulty: "hard"
  },
  {
    text: "Qual é o oceano mais profundo?",
    option_a: "Atlântico",
    option_b: "Pacífico",
    option_c: "Índico",
    correct_answer: "B",
    difficulty: "medium"
  },
  {
    text: "Qual é o país com mais fusos horários?",
    option_a: "Estados Unidos",
    option_b: "Rússia",
    option_c: "China",
    correct_answer: "B",
    difficulty: "hard"
  }
]

async function seedQuestions() {
  try {
    console.log('🌱 Iniciando seed das perguntas...')
    
    // Limpar perguntas existentes
    await prisma.question.deleteMany({})
    console.log('🗑️ Perguntas antigas removidas')
    
    // Inserir novas perguntas
    for (const question of questions) {
      await prisma.question.create({
        data: question
      })
    }
    
    console.log(`✅ ${questions.length} perguntas inseridas com sucesso!`)
    
    // Verificar distribuição por dificuldade
    const easyCount = questions.filter(q => q.difficulty === 'easy').length
    const mediumCount = questions.filter(q => q.difficulty === 'medium').length
    const hardCount = questions.filter(q => q.difficulty === 'hard').length
    
    console.log('📊 Distribuição por dificuldade:')
    console.log(`  - Fácil: ${easyCount} perguntas`)
    console.log(`  - Médio: ${mediumCount} perguntas`)
    console.log(`  - Difícil: ${hardCount} perguntas`)
    
  } catch (error) {
    console.error('❌ Erro ao fazer seed das perguntas:', error)
  } finally {
    await prisma.$disconnect()
  }
}

seedQuestions()
