import { PrismaClient } from '../src/generated/prisma/index.js'

const prisma = new PrismaClient()

const questions = [
  {
    text: "Qual é a capital do Brasil?",
    option_a: "São Paulo",
    option_b: "Brasília",
    option_c: "Rio de Janeiro",
    correct_answer: "B",
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
    difficulty: "easy"
  },
  {
    text: "Quem escreveu 'Dom Casmurro'?",
    option_a: "Machado de Assis",
    option_b: "José de Alencar",
    option_c: "Castro Alves",
    correct_answer: "A",
    difficulty: "medium"
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
    text: "Em que ano foi descoberto o Brasil?",
    option_a: "1498",
    option_b: "1500",
    option_c: "1502",
    correct_answer: "B",
    difficulty: "easy"
  },
  {
    text: "Qual é o nome do processo de transformação de água em vapor?",
    option_a: "Condensação",
    option_b: "Evaporação",
    option_c: "Sublimação",
    correct_answer: "B",
    difficulty: "medium"
  },
  {
    text: "Quem pintou a 'Mona Lisa'?",
    option_a: "Michelangelo",
    option_b: "Leonardo da Vinci",
    option_c: "Rafael",
    correct_answer: "B",
    difficulty: "easy"
  },
  {
    text: "Qual é o maior oceano do mundo?",
    option_a: "Atlântico",
    option_b: "Pacífico",
    option_c: "Índico",
    correct_answer: "B",
    difficulty: "easy"
  },
  {
    text: "Qual é a velocidade da luz no vácuo?",
    option_a: "300.000 km/s",
    option_b: "300.000.000 m/s",
    option_c: "Ambas estão corretas",
    correct_answer: "C",
    difficulty: "hard"
  },
  {
    text: "Qual é o nome do processo de divisão celular?",
    option_a: "Mitose",
    option_b: "Meiose",
    option_c: "Ambos",
    correct_answer: "C",
    difficulty: "hard"
  },
  {
    text: "Qual é a moeda oficial do Japão?",
    option_a: "Won",
    option_b: "Yuan",
    option_c: "Iene",
    correct_answer: "C",
    difficulty: "easy"
  },
  {
    text: "Quem foi o primeiro presidente do Brasil?",
    option_a: "Deodoro da Fonseca",
    option_b: "Prudente de Morais",
    option_c: "Floriano Peixoto",
    correct_answer: "A",
    difficulty: "medium"
  },
  {
    text: "Qual é o nome do processo de fotossíntese?",
    option_a: "Conversão de CO2 em O2",
    option_b: "Conversão de luz em energia química",
    option_c: "Ambos",
    correct_answer: "C",
    difficulty: "hard"
  },
  {
    text: "Qual é o maior deserto do mundo?",
    option_a: "Saara",
    option_b: "Antártico",
    option_c: "Gobi",
    correct_answer: "B",
    difficulty: "medium"
  },
  {
    text: "Quem escreveu 'Os Lusíadas'?",
    option_a: "Fernando Pessoa",
    option_b: "Luís de Camões",
    option_c: "Eça de Queirós",
    correct_answer: "B",
    difficulty: "medium"
  },
  {
    text: "Qual é a temperatura de ebulição da água ao nível do mar?",
    option_a: "90°C",
    option_b: "100°C",
    option_c: "110°C",
    correct_answer: "B",
    difficulty: "easy"
  },
  {
    text: "Qual é o nome do processo de formação de montanhas?",
    option_a: "Erosão",
    option_b: "Orogênese",
    option_c: "Sedimentação",
    correct_answer: "B",
    difficulty: "hard"
  },
  {
    text: "Quem foi o primeiro homem a pisar na Lua?",
    option_a: "Neil Armstrong",
    option_b: "Buzz Aldrin",
    option_c: "Michael Collins",
    correct_answer: "A",
    difficulty: "easy"
  },
  {
    text: "Qual é o nome do processo de respiração celular?",
    option_a: "Fotossíntese",
    option_b: "Fermentação",
    option_c: "Respiração aeróbica",
    correct_answer: "C",
    difficulty: "hard"
  },
  {
    text: "Qual é o maior rio do mundo?",
    option_a: "Nilo",
    option_b: "Amazonas",
    option_c: "Mississippi",
    correct_answer: "B",
    difficulty: "medium"
  },
  {
    text: "Quem foi o autor de 'O Pequeno Príncipe'?",
    option_a: "Antoine de Saint-Exupéry",
    option_b: "Jules Verne",
    option_c: "Victor Hugo",
    correct_answer: "A",
    difficulty: "medium"
  },
  {
    text: "Qual é o nome do processo de formação de rochas ígneas?",
    option_a: "Cristalização do magma",
    option_b: "Sedimentação",
    option_c: "Metamorfismo",
    correct_answer: "A",
    difficulty: "hard"
  },
  {
    text: "Qual é o nome do processo de formação de fósseis?",
    option_a: "Fossilização",
    option_b: "Petrificação",
    option_c: "Ambos",
    correct_answer: "C",
    difficulty: "hard"
  }
]

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...')
  
  // Limpar perguntas existentes
  await prisma.question.deleteMany()
  console.log('🗑️  Perguntas existentes removidas')
  
  // Inserir as 24 perguntas
  for (const question of questions) {
    await prisma.question.create({
      data: question
    })
  }
  
  console.log(`✅ ${questions.length} perguntas inseridas com sucesso!`)
  
  // Verificar se as perguntas foram inseridas
  const count = await prisma.question.count()
  console.log(`📊 Total de perguntas no banco: ${count}`)
}

main()
  .catch((e) => {
    console.error('❌ Erro durante o seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    console.log('🔌 Conexão com o banco encerrada')
  })
