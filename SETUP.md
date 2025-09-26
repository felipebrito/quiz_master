# 🚀 Guia de Setup - Quiz Show Interativo

## 📋 Pré-requisitos

- **Node.js** 18+ 
- **npm** ou **yarn**
- **Git** (para clonar o repositório)

## 🔧 Configuração Local

### 1. Clone o Repositório
```bash
git clone https://github.com/felipebrito/quiz_master.git
cd quiz_master
```

### 2. Configure as Variáveis de Ambiente

#### Para o Next.js (quiz-show/.env.local):
```bash
cd quiz-show
cp .env.example .env.local
```

Edite o arquivo `.env.local`:
```env
# Database
DATABASE_URL="file:./dev.db"

# Socket.IO
SOCKET_PORT=3001

# Next.js
NEXT_PUBLIC_SOCKET_URL="http://localhost:3001"
```

#### Para o Task Master (.cursor/mcp.json):
Edite o arquivo `.cursor/mcp.json` e substitua as chaves de API:
```json
{
  "mcpServers": {
    "task-master-ai": {
      "command": "npx",
      "args": ["-y", "task-master-ai"],
      "env": {
        "ANTHROPIC_API_KEY": "sua_chave_aqui",
        "PERPLEXITY_API_KEY": "sua_chave_aqui",
        "GOOGLE_API_KEY": "sua_chave_aqui"
      }
    }
  }
}
```

### 3. Instale as Dependências
```bash
cd quiz-show
npm install
```

### 4. Configure o Banco de Dados
```bash
# Gere o cliente Prisma
npx prisma generate

# Execute as migrações
npx prisma db push

# Popule com dados iniciais
npx prisma db seed
```

### 5. Inicie os Serviços

#### Terminal 1 - Servidor Socket.IO:
```bash
cd quiz-show
node socket-server-game.js
```

#### Terminal 2 - Next.js:
```bash
cd quiz-show
npm run dev
```

## 🌐 URLs de Acesso

- **Página Principal**: http://localhost:3000
- **Cadastro**: http://localhost:3000/cadastro
- **Admin Dashboard**: http://localhost:3000/admin
- **Jogadores**: 
  - http://localhost:3000/jogador1
  - http://localhost:3000/jogador2
  - http://localhost:3000/jogador3
- **Prisma Studio**: http://localhost:5555

## 🧪 Teste do Sistema

### 1. Teste de Cadastro
1. Acesse http://localhost:3000/cadastro
2. Preencha os dados do participante
3. Tire uma selfie ou faça upload de foto
4. Verifique se aparece no admin dashboard

### 2. Teste de Jogo
1. Acesse http://localhost:3000/admin
2. Cadastre pelo menos 3 participantes
3. Selecione 3 participantes
4. Clique em "Iniciar Partida"
5. Observe os logs no terminal do servidor

### 3. Teste de Socket.IO
1. Abra múltiplas abas com as páginas de jogadores
2. No admin, use os controles de cronômetro
3. Verifique se todos os jogadores recebem as atualizações

## 🔍 Troubleshooting

### Problema: "Database not found"
```bash
npx prisma db push
npx prisma db seed
```

### Problema: "Socket.IO connection failed"
- Verifique se o servidor está rodando na porta 3001
- Confirme se não há firewall bloqueando

### Problema: "Webcam not working"
- Acesse via HTTPS (use ngrok ou similar)
- Verifique permissões do navegador

### Problema: "Prisma client not found"
```bash
npx prisma generate
```

## 📊 Estrutura do Projeto

```
quiz_master/
├── README.md                 # Documentação principal
├── SETUP.md                  # Este guia
├── .cursor/                  # Configuração MCP
├── .taskmaster/              # Tarefas do projeto
├── quiz-show/                # Aplicação principal
│   ├── src/                  # Código fonte
│   ├── prisma/               # Schema e migrações
│   ├── public/               # Arquivos estáticos
│   └── socket-server-game.js # Servidor Socket.IO
└── scripts/                  # Scripts auxiliares
```

## 🎯 Próximos Passos

1. **Interface de Jogo**: Implementar telas para os jogadores
2. **Tela Pública**: Display para audiência
3. **Relatórios**: Estatísticas e rankings
4. **Configurações**: Personalização do jogo

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch: `git checkout -b feature/nova-funcionalidade`
3. Commit: `git commit -m 'Add nova funcionalidade'`
4. Push: `git push origin feature/nova-funcionalidade`
5. Abra um Pull Request

## 📞 Suporte

- **Issues**: [GitHub Issues](https://github.com/felipebrito/quiz_master/issues)
- **Documentação**: [README.md](README.md)

---

**Última atualização**: 26 de Setembro de 2025
