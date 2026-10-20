# Checklist de testes manuais

Verificações que os testes unitários não cobrem. Rode no emulador ou em um aparelho com build nativo (`npm run android`; o Expo Go não suporta lembretes). Marque os itens conforme avança.

## 0. Preparação

- [x] `npm install` e depois `npm run android`; o app abre e a splash desaparece.
- [x] Quatro abas, nesta ordem: `Semana`, `Compras`, `3D`, `Manutenção`. O cabeçalho e a saudação aparecem em todas as abas.

## 1. Lembretes (plano 005)

- [ ] Os lembretes começam desligados e nenhum pedido de permissão aparece ao abrir o app.
- [ ] Ao ligar a chave em `Manutenção` > `Lembretes`, o pedido de permissão aparece (se ainda não foi concedida).
- [ ] Crie um evento avulso para daqui a alguns minutos e uma rotina para o dia da semana de hoje: as notificações chegam na hora certa, com o título e `Começa em 5 min (HH:mm)`.
- [ ] `Manutenção` > `Lembretes`: mude a antecedência; os lembretes são reagendados.
- [ ] Desligue os lembretes: nada chega.
- [ ] Negue a permissão (nas configurações do sistema): a dica aparece.
- [ ] Se as notificações chegarem com minutos de atraso, adicione `"permissions": ["android.permission.SCHEDULE_EXACT_ALARM"]` em `android` no `app.json` e recompile.

## 2. Retenção de eventos passados (plano 006)

- [ ] Crie um evento avulso de 12 dias atrás e outro de 5 dias atrás (setas de data no formulário). Os dois permanecem até o próximo início.
- [ ] Reinicie o app: o de 12 dias some, o de 5 dias continua.
- [ ] `Histórico` > `7 dias`: a confirmação mostra a contagem certa; `Cancelar` mantém os dados e o período antigo; `Apagar` remove os itens.
- [ ] `Histórico` > `30 dias`: sem confirmação, nada é apagado.
- [ ] Restaure um backup com eventos avulsos antigos: eles permanecem até o próximo início.

## 3. Tarefas do dia (plano 007)

- [ ] O `+` em `Semana` abre `O que você quer adicionar?` com `Evento` e `Tarefa`; `Evento` abre o formulário de sempre.
- [ ] Adicione tarefas para hoje, amanhã e por `Escolher data`. Título vazio mostra `Informe o título.`.
- [ ] O bloco `Tarefas` mostra `X de Y feitas`; ao marcar, o título fica riscado e vai para o fim.
- [ ] Tocar no título edita (inclusive a data); o ícone de lixeira pede confirmação.
- [ ] A faixa de dias mostra um ponto só nos dias com tarefa pendente; um dia só com tarefas não mostra `Nada planejado para este dia.`.
- [ ] Rollover: crie uma tarefa pendente para hoje, feche o app, mude a data do aparelho para amanhã e reabra: a tarefa está no novo hoje. Repita deixando o app em segundo plano durante a mudança de data (gatilho de primeiro plano). Uma tarefa feita fica no seu dia.
- [ ] `Histórico` em `7 dias` com uma tarefa feita há mais de 7 dias: a confirmação conta a tarefa; tarefas pendentes antigas nunca são apagadas.

## 4. Lista de impressão 3D (plano 007)

- [ ] A mensagem de lista vazia aparece.
- [ ] Adicione um item com link válido; um link inválido (`printables.com`, `javascript:alert(1)`) mostra `Cole um link que comece com http:// ou https://` e não salva nada.
- [ ] A linha mostra o domínio (por exemplo `printables.com`); tocar no título ou no ícone de abrir abre o navegador.
- [ ] Marque como impresso: fica riscado e vai para o fim. A lixeira exclui na hora.
- [ ] `Limpar impressos` pede confirmação e remove só os itens impressos.

## 5. Backup e restauração

- [ ] Crie um backup com tarefas e itens de impressão, use `Limpar tudo` e restaure: as duas listas voltam.
- [ ] Restaure um backup feito antes do recurso de tarefas: ele carrega, com as listas de tarefas e de impressão vazias.
- [ ] `Limpar tudo` também esvazia as tarefas e os itens de impressão.
