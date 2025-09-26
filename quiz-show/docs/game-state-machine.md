# Máquina de Estados do Jogo

## Estados Principais

### 1. `waiting` (Aguardando)
- **Descrição**: Jogo criado mas não iniciado
- **Transições possíveis**: `active`
- **Eventos**: Nenhum

### 2. `active` (Ativo)
- **Descrição**: Jogo em andamento
- **Transições possíveis**: `finished`
- **Sub-estados de rodada**:
  - `waiting`: Aguardando início da rodada
  - `active`: Rodada em andamento (pergunta sendo respondida)
  - `finished`: Rodada finalizada

### 3. `finished` (Finalizado)
- **Descrição**: Jogo encerrado
- **Transições possíveis**: Nenhuma (estado final)
- **Eventos**: Ranking final, vencedor

## Transições de Estado

```
waiting → active → finished
```

### Condições para Transições

#### `waiting` → `active`
- Admin emite evento `admin:game:start`
- 3 participantes selecionados
- Perguntas carregadas
- Criação de registros no banco de dados

#### `active` → `finished`
- Todas as rodadas foram concluídas
- Admin emite evento `admin:game:stop`
- Erro crítico no jogo

## Eventos Socket.IO

### Eventos de Entrada (Admin)
- `admin:game:start`: Iniciar jogo
- `admin:game:stop`: Parar jogo
- `admin:round:next`: Avançar para próxima rodada

### Eventos de Saída (Broadcast)
- `game:started`: Jogo iniciado
- `game:ended`: Jogo finalizado
- `round:started`: Rodada iniciada
- `round:ended`: Rodada finalizada
- `timer:update`: Atualização do cronômetro

### Eventos de Entrada (Jogadores)
- `player:answer`: Resposta do jogador
- `player:joined`: Jogador entrou
- `player:left`: Jogador saiu

## Fluxo de uma Partida

1. **Inicialização**
   - Admin seleciona 3 participantes
   - Sistema busca 8 perguntas aleatórias
   - Cria registros `Game` e `GameParticipant`

2. **Início do Jogo**
   - Estado muda para `active`
   - Emite `game:started` para todos os clientes
   - Inicia primeira rodada

3. **Rodada Ativa**
   - Estado da rodada muda para `active`
   - Emite `round:started` com pergunta e timer
   - Jogadores respondem via `player:answer`
   - Timer de 30 segundos

4. **Finalização da Rodada**
   - Estado da rodada muda para `finished`
   - Emite `round:ended` com resposta correta
   - Processa pontuações

5. **Próxima Rodada ou Fim**
   - Se há mais rodadas: avança automaticamente
   - Se última rodada: finaliza jogo

6. **Finalização do Jogo**
   - Estado muda para `finished`
   - Calcula ranking final
   - Emite `game:ended` com vencedor

## Validações

### Transições Válidas
- `waiting` → `active`: ✅
- `active` → `finished`: ✅
- `finished` → qualquer estado: ❌

### Validações de Negócio
- Máximo 3 participantes por jogo
- 8 perguntas por partida
- 30 segundos por pergunta
- Respostas aceitas apenas durante rodada ativa
- Uma resposta por jogador por pergunta

## Tratamento de Erros

### Erros de Transição
- Log do erro
- Manutenção do estado atual
- Notificação ao admin

### Erros de Jogador
- Resposta fora de tempo: ignorada
- Resposta duplicada: primeira aceita
- Jogador desconectado: pontuação zerada

### Erros de Sistema
- Falha na base de dados: jogo pausado
- Falha no Socket.IO: reconexão automática
- Timeout de rede: finalização forçada
