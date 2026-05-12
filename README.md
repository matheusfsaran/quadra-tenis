# 🎾 Quadra de Tênis — Sistema de Agendamento

App web para agendamento de jogos de tênis com uma quadra, múltiplos usuários e notificação via WhatsApp.

## Tecnologias
- React 18
- Supabase (banco de dados)
- Vercel (hospedagem)

## Regras do sistema
- Horário de funcionamento: 07:00 às 22:00
- Duração de cada jogo: 1h30min
- Espaçamento mínimo entre jogos: 1h30min
- Usuário com jogo ativo não pode fazer novo agendamento
- Somente quem criou o jogo pode alterar ou cancelar
- Notificação automática via WhatsApp ao agendar ou alterar

## Como fazer o deploy

### 1. Suba o projeto no GitHub
1. Acesse https://github.com/new
2. Crie um repositório chamado `quadra-tenis` (público)
3. No terminal (ou GitHub Desktop), faça upload de todos os arquivos desta pasta

### 2. Deploy na Vercel
1. Acesse https://vercel.com
2. Clique em "Add New Project"
3. Importe o repositório `quadra-tenis` do GitHub
4. Clique em "Deploy" (sem configuração adicional)
5. Aguarde ~1 minuto — seu link estará pronto!

## Estrutura de arquivos
```
quadra-tenis/
├── public/
│   └── index.html
├── src/
│   ├── index.js
│   ├── App.js
│   └── supabase.js
├── package.json
└── README.md
```
