# 🎮 Quiz Show Interativo

Sistema completo de quiz interativo com cadastro de participantes, gerenciamento de jogos em tempo real e dashboard administrativo.

## 🚀 Status do Projeto

### ✅ **Funcionalidades Implementadas (MVP)**

#### **1. Configuração da Fundação**
- ✅ Next.js 15.5.4 com TypeScript
- ✅ Tailwind CSS para estilização
- ✅ shadcn/ui para componentes
- ✅ Prisma ORM com SQLite
- ✅ ESLint configurado

#### **2. Sistema de Cadastro de Participantes**
- ✅ Interface de cadastro com formulário
- ✅ Captura de webcam para selfie
- ✅ Upload de imagens com validação
- ✅ API REST para CRUD de participantes
- ✅ Validação de dados (nome, cidade, estado)

#### **3. Comunicação em Tempo Real**
- ✅ Socket.IO para comunicação bidirecional
- ✅ Namespaces separados (admin, jogadores)
- ✅ Sincronização de cronômetro
- ✅ Eventos de conexão/desconexão

#### **4. Dashboard Administrativo**
- ✅ Lista de participantes em tempo real
- ✅ Seleção de 3 participantes para jogo
- ✅ Controles de cronômetro
- ✅ Início de partidas
- ✅ Monitoramento de status

#### **5. Sistema de Jogo Completo**
- ✅ Máquina de estados do jogo
- ✅ Criação automática de partidas
- ✅ Seleção aleatória de 8 perguntas
- ✅ Sistema de pontuação automático
- ✅ Controle de rodadas com timer
- ✅ Finalização automática e ranking

## 🏗️ Arquitetura

### **Frontend (Next.js)**
```
src/
├── app/
│   ├── admin/           # Dashboard administrativo
│   ├── cadastro/        # Interface de cadastro
│   ├── jogador1/        # Interface do jogador 1
│   ├── jogador2/        # Interface do jogador 2
│   ├── jogador3/        # Interface do jogador 3
│   └── api/             # API routes
├── components/          # Componentes shadcn/ui
├── hooks/               # Custom hooks (useSocket)
├── lib/                 # Utilitários e configurações
└── types/               # Definições TypeScript
```

### **Backend (Socket.IO + Prisma)**
```
socket-server-game.js    # Servidor Socket.IO principal
prisma/
├── schema.prisma        # Schema do banco de dados
└── seed.ts             # Script de seed com perguntas
```

### **Banco de Dados (SQLite)**
- **Participant**: Dados dos participantes
- **Game**: Partidas criadas
- **Question**: Perguntas do quiz
- **Answer**: Respostas dos jogadores
- **GameParticipant**: Relação jogo-participante
- **Round**: Rodadas das partidas

## 🎯 Funcionalidades Principais

### **1. Cadastro de Participantes**
- Formulário com validação
- Captura de webcam para selfie
- Upload de imagens
- Status de participante (waiting, playing, finished)

### **2. Sistema de Jogo**
- **Estados**: waiting → active → finished
- **Rodadas**: 8 perguntas por partida
- **Timer**: 30 segundos por pergunta
- **Pontuação**: 10 pontos por resposta correta
- **Ranking**: Ordenação por pontuação

### **3. Dashboard Admin**
- Lista de participantes em tempo real
- Seleção de 3 participantes
- Controles de cronômetro
- Início/parada de jogos
- Monitoramento de status

### **4. Comunicação em Tempo Real**
- Sincronização de cronômetro
- Eventos de jogo (início, rodada, fim)
- Notificações de status
- Reconexão automática

## 🛠️ Tecnologias Utilizadas

### **Frontend**
- **Next.js 15.5.4** - Framework React
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização
- **shadcn/ui** - Componentes
- **Socket.IO Client** - Comunicação em tempo real
- **Framer Motion** - Animações

### **Backend**
- **Socket.IO** - Servidor WebSocket
- **Prisma ORM** - ORM para banco de dados
- **SQLite** - Banco de dados
- **Node.js** - Runtime JavaScript

### **Ferramentas**
- **ESLint** - Linting
- **Task Master AI** - Gerenciamento de tarefas
- **Git** - Controle de versão

## 🚀 Como Executar

### **Pré-requisitos**
- Node.js 18+
- npm ou yarn

### **Instalação**
```bash
# Clone o repositório
git clone https://github.com/felipebrito/quiz_master.git
cd quiz_master

# Instale as dependências
cd quiz-show
npm install

# Configure o banco de dados
npx prisma generate
npx prisma db push
npx prisma db seed

# Inicie o servidor Socket.IO
node socket-server-game.js

# Em outro terminal, inicie o Next.js
npm run dev
```

### **URLs de Acesso**
- **Página Principal**: http://localhost:3000
- **Cadastro**: http://localhost:3000/cadastro
- **Admin**: http://localhost:3000/admin
- **Jogadores**: http://localhost:3000/jogador1, jogador2, jogador3
- **Prisma Studio**: http://localhost:5555

## 📋 Roadmap de Desenvolvimento

### **✅ Concluído (MVP)**
- [x] Configuração da fundação
- [x] Sistema de cadastro
- [x] Comunicação Socket.IO
- [x] Dashboard administrativo
- [x] Lógica de jogo completa
- [x] Sistema de pontuação
- [x] Controle de rodadas

### **🔄 Em Desenvolvimento**
- [ ] Interface de jogo para jogadores
- [ ] Tela pública de exibição
- [ ] Sistema de ranking
- [ ] Relatórios de partidas

### **📅 Próximas Funcionalidades**
- [ ] Autenticação de admin
- [ ] Configurações de jogo
- [ ] Estatísticas avançadas
- [ ] Exportação de dados
- [ ] Temas personalizáveis

## 🧪 Testes

### **Testes Manuais**
1. **Cadastro**: Acesse `/cadastro` e cadastre participantes
2. **Admin**: Acesse `/admin` e selecione 3 participantes
3. **Jogo**: Inicie uma partida e observe os logs
4. **Socket.IO**: Verifique conexões no terminal

### **Testes de Integração**
- Validação de formulários
- Comunicação Socket.IO
- Persistência no banco
- Sincronização de estados

## 📊 Estrutura do Banco de Dados

```sql
-- Participantes
CREATE TABLE participants (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  photo_url TEXT,
  status TEXT DEFAULT 'waiting',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Jogos
CREATE TABLE games (
  id TEXT PRIMARY KEY,
  status TEXT DEFAULT 'waiting',
  current_round INTEGER DEFAULT 0,
  started_at DATETIME,
  ended_at DATETIME
);

-- Perguntas
CREATE TABLE questions (
  id TEXT PRIMARY KEY,
  text TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  correct_answer TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Respostas
CREATE TABLE answers (
  id TEXT PRIMARY KEY,
  participant_id TEXT NOT NULL,
  question_id TEXT NOT NULL,
  game_id TEXT NOT NULL,
  selected_option TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  points_awarded INTEGER NOT NULL,
  answered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (participant_id) REFERENCES participants(id),
  FOREIGN KEY (question_id) REFERENCES questions(id),
  FOREIGN KEY (game_id) REFERENCES games(id)
);

-- Participantes do Jogo
CREATE TABLE game_participants (
  id TEXT PRIMARY KEY,
  game_id TEXT NOT NULL,
  participant_id TEXT NOT NULL,
  score INTEGER DEFAULT 0,
  joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  left_at DATETIME,
  FOREIGN KEY (game_id) REFERENCES games(id),
  FOREIGN KEY (participant_id) REFERENCES participants(id)
);

-- Rodadas
CREATE TABLE rounds (
  id TEXT PRIMARY KEY,
  game_id TEXT NOT NULL,
  question_id TEXT NOT NULL,
  round_number INTEGER NOT NULL,
  start_time DATETIME NOT NULL,
  end_time DATETIME,
  FOREIGN KEY (game_id) REFERENCES games(id),
  FOREIGN KEY (question_id) REFERENCES questions(id)
);
```

## 🔧 Configuração

### **Variáveis de Ambiente**
```env
# Database
DATABASE_URL="file:./dev.db"

# Socket.IO
SOCKET_PORT=3001

# Next.js
NEXT_PUBLIC_SOCKET_URL="http://localhost:3001"
```

### **Scripts Disponíveis**
```json
{
  "dev": "next dev --turbopack",
  "build": "next build --turbopack",
  "start": "next start",
  "lint": "eslint",
  "seed": "ts-node prisma/seed.ts"
}
```

## 📝 Logs e Debugging

### **Console do Servidor**
- Conexões de jogadores e admin
- Eventos de jogo
- Erros e exceções
- Status das partidas

### **Console do Cliente**
- Status de conexão Socket.IO
- Eventos recebidos
- Erros de validação
- Debug de componentes

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👥 Autores

- **Felipe Brito** - Desenvolvimento inicial e arquitetura

## 📞 Suporte

Para suporte ou dúvidas, abra uma issue no repositório ou entre em contato.

---

**Última atualização**: 26 de Setembro de 2025
**Versão**: 1.0.0 (MVP)
**Status**: ✅ Funcional e pronto para uso
