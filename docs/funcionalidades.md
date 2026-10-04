# Funcionalidades

Descrição de cada tela: quem usa, o que faz, as regras de negócio e os endpoints chamados. As permissões citadas estão em [Perfis e permissões](permissoes.md).

Recursos comuns a todas as telas:

- **Filial:** funcionários veem só a própria filial. O ADMIN escolhe a filial no seletor do topo, ou vê todas quando não há escolha.
- **Tempo real:** listas de pedidos, separação, estoque e relatórios se atualizam sozinhas quando a API publica um evento (veja [Tempo real](tempo-real.md)). O indicador "Tempo real ativo/inativo" fica no topo.
- **Listas:** paginadas em 20 itens (tamanho fixo da API), com busca de texto (`?search=`) e ordenação.
- **Formulários:** validados no navegador com Zod, com mensagens em pt-BR. Erros de campo vindos da API aparecem no campo correspondente.
- **Tema:** claro, escuro ou o do sistema. A sidebar pode ser recolhida, e a escolha fica guardada.

---

## Login (`/login`)

- E-mail e senha. O perfil `CLIENTE` é recusado.
- **Salvar senha neste navegador:** entrega a senha ao gerenciador de senhas do navegador e lembra só o e-mail. Detalhes em [Autenticação e segurança](autenticacao-e-seguranca.md#salvar-senha-neste-navegador).
- `?next=/rota` volta para a página pedida depois do login. `?expired=1` mostra "Sua sessão expirou".

## Dashboard (`/`)

Mostra uma de duas visões, conforme o perfil:

| Visão           | Perfis           | Conteúdo                                                                                                                                                                                  |
| --------------- | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Gestão**      | ADMIN, GERENTE   | KPIs de vendas de hoje e dos últimos 30 dias (faturamento, pedidos, ticket médio), pedidos em aberto, gráfico de pedidos por status, 5 produtos mais vendidos e alertas de estoque baixo. |
| **Operacional** | SEPARADOR, CAIXA | Contagem de pedidos pendentes, em separação e separados, com atalhos para a fila.                                                                                                         |

A visão operacional não usa `/relatorios` (esses perfis não têm acesso). Ela conta os pedidos pelo total (`count`) das listagens paginadas, que a API já restringe à filial do usuário.

Endpoints: `relatorios/vendas`, `relatorios/pedidos-por-status`, `relatorios/produtos-mais-vendidos`, `relatorios/estoque-baixo` e `pedidos?status=`.

## Pedidos (`/pedidos`)

**Lista:**

- filtros por status (aceita `?status=PENDENTE` na URL) e busca por código ou cliente;
- mostra código, cliente, filial, forma de pagamento, status, total e data, do mais novo para o mais antigo;
- ao abrir um pedido, o detalhe mostra itens (com ✓ nos já separados), total, forma de pagamento, observação, histórico de separações e as ações permitidas.

**Novo pedido** (`pedidos:create`):

| Campo              | Regra                                                                                                                                 |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| Cliente            | obrigatório; busca dentro da lista (nome ou e-mail) direto na API                                                                     |
| Filial             | obrigatória; o ADMIN escolhe, os demais ficam com a própria                                                                           |
| Forma de pagamento | obrigatória; só formas **ativas**, na ordem do cadastro; se a forma permite troco, aparece a dica para informar o valor na observação |
| Itens              | ao menos 1; produto **ativo** (busca por nome ou SKU dentro da lista) e quantidade de 1 a 999                                         |
| Observação         | opcional, até 500 caracteres                                                                                                          |

A API baixa o estoque na criação e responde **409** se faltar estoque.

**Ações** (dependem do status e do perfil):

| Status         | Ações possíveis                                            |
| -------------- | ---------------------------------------------------------- |
| `PENDENTE`     | iniciar separação, cancelar                                |
| `EM_SEPARACAO` | concluir separação (só com o checklist completo), cancelar |
| `SEPARADO`     | finalizar (entrega/pagamento), cancelar                    |
| `FINALIZADO`   | nenhuma                                                    |
| `CANCELADO`    | nenhuma                                                    |

O cancelamento pede confirmação e devolve os itens ao estoque.

Endpoints: `pedidos`, `pedidos/{id}`, `pedidos/{id}/cancelar`, `pedidos/{id}/iniciar-separacao`, `pedidos/{id}/finalizar`, `separacoes/{id}/concluir`, `formas-pagamento`, `clientes` e `produtos`.

## Fila de separação (`/separacao`)

Perfis: ADMIN, GERENTE e SEPARADOR. A tela tem duas colunas, sempre com o pedido mais antigo primeiro:

- **Aguardando** (`PENDENTE`): itens do pedido e o botão "Iniciar separação".
- **Em separação** (`EM_SEPARACAO`): o **checklist** dos itens.

**Checklist:**

- Cada item tem uma caixa de marcar, com quantidade, nome, SKU e código de barras, e há uma barra de progresso ("2 de 3 separados").
- **Bipar código de barras:** o leitor (ou a digitação seguida de Enter) marca o item com aquele código. Se o produto não tiver código, o SKU também serve. Se o código não estiver no pedido, aparece um aviso.
- A marcação aparece na hora (atualização otimista) e é gravada na API, então sobrevive a recarregar a página e aparece para os outros em tempo real.
- Só o separador responsável, ou ADMIN/GERENTE, pode marcar. Os demais veem o checklist só para leitura.
- **Concluir separação** fica bloqueado até todos os itens estarem marcados. Essa regra é do painel: a API aceita concluir sem o checklist completo.

Endpoints: `pedidos?status=...`, `pedidos/{id}/iniciar-separacao`, `separacoes/{id}/marcar-item` e `separacoes/{id}/concluir`.

## Produtos (`/produtos`)

**Lista:** miniatura da foto, nome, SKU e código de barras, categoria, preço e status. Há busca por nome, SKU, código de barras ou descrição, e filtro por categoria.

**Cadastro e edição** (`produtos:write`):

| Campo              | Regra                                                                                                                                                                                                             |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Nome               | obrigatório, até 150 caracteres                                                                                                                                                                                   |
| SKU                | obrigatório, até 30 caracteres; a API grava em maiúsculas                                                                                                                                                         |
| Código de barras   | opcional; GTIN válido (EAN-8, UPC-A, EAN-13 ou GTIN-14, com dígito verificador); único na rede. O Enter do leitor não envia o formulário.                                                                         |
| Preço              | obrigatório; aceita vírgula ("9,90")                                                                                                                                                                              |
| Categoria          | opcional                                                                                                                                                                                                          |
| Descrição          | opcional                                                                                                                                                                                                          |
| Foto               | opcional; JPEG, PNG ou WebP até 2 MB. A API converte para WebP (máx. 1200 px) e remove os metadados.                                                                                                              |
| Ativo              | desativar esconde o produto dos clientes e de pedidos novos                                                                                                                                                       |
| Estoque por filial | uma linha por filial visível. **Na criação:** estoque inicial e quantidade mínima. **Na edição:** só a quantidade mínima; o saldo atual aparece para consulta e muda pela tela de Estoque, com motivo registrado. |

O produto é salvo em etapas: produto → estoques → foto. Se uma etapa posterior falhar, o produto já está gravado. O aviso explica o que faltou, e o próximo "Salvar" **edita** esse produto em vez de criar outro (`ProdutoParcialError`).

"Excluir" **desativa** o produto. A API preserva o histórico de pedidos.

**Importar CSV:**

- colunas `nome;sku;codigo_barras;preco;categoria;descricao;ativo`, separadas por `;` ou `,`;
- cabeçalho sem diferenciar maiúsculas, com BOM aceito e até 1000 linhas;
- cada linha é validada com as mesmas regras do formulário, e os erros indicam o número da linha;
- há um botão para baixar um modelo.

XLSX não é aceito: exporte a planilha como CSV.

Endpoints: `produtos`, `produtos/{id}`, `produtos/{id}/foto` (POST multipart e DELETE), `estoques` e `lojas`.

## Estoque (`/estoque`)

- A lista mostra produto, filial, quantidade, quantidade mínima, situação ("abaixo do mínimo") e data da última atualização.
- Há um filtro "somente abaixo do mínimo".
- **Ajustar** (`estoque:write`): informa um delta (positivo = entrada, negativo = saída, nunca zero) e um motivo obrigatório. O ajuste fica registrado na API.
- Um produto fica **abaixo do mínimo** quando o saldo chega à quantidade mínima. Isso gera alerta no dashboard e no relatório.

Endpoints: `estoques` e `estoques/{id}/ajustar`.

## Clientes (`/clientes`)

**Lista:** nome, e-mail, telefone e data de cadastro. O detalhe mostra os endereços e o histórico de compras (pedidos do cliente, do mais recente para o mais antigo). Quem tem `clientes:write` também pode excluir, com confirmação.

**Cadastro** (`clientes:create`) **e edição** (`clientes:write`):

- **Telefone com máscara:** `(00) 0000-0000` ou `(00) 00000-0000`. Aceita colar com `+55`. A mesma máscara vale para usuários e filiais.
- **Endereço de entrega pelo CEP:** ao digitar o CEP, o [ViaCEP](https://viacep.com.br) preenche logradouro, bairro, cidade e UF. O complemento do ViaCEP vira só uma dica (ex.: faixa de numeração). Se o CEP não existir ou o ViaCEP estiver fora, o endereço pode ser preenchido à mão.
- **UF** com busca pelo nome do estado.
- O endereço editado é o principal do cliente.
- A API guarda cliente e endereço em recursos separados, então o painel grava primeiro o cliente e depois o endereço. Se só o endereço falhar, o cliente já está salvo e o próximo envio o edita (`EnderecoSaveError`).

Endpoints: `clientes`, `enderecos` e `pedidos?cliente=`; ViaCEP direto do navegador.

## Relatórios (`/relatorios`)

Perfis: ADMIN e GERENTE.

- Período (início e fim) aplicado por botão.
- **Vendas por filial:** pedidos, faturamento e ticket médio.
- **Produtos mais vendidos:** os 10 primeiros do período.
- **Estoque abaixo do mínimo.**

Endpoints: `relatorios/vendas`, `relatorios/produtos-mais-vendidos` e `relatorios/estoque-baixo` (parâmetros `loja`, `inicio`, `fim`, `limite`).

## Formas de pagamento (`/formas-pagamento`)

Perfis: ADMIN (edita) e GERENTE (consulta).

| Campo         | Regra                                                                                |
| ------------- | ------------------------------------------------------------------------------------ |
| Nome          | obrigatório, até 60 caracteres, único (ex.: "Vale-alimentação Alelo")                |
| Tipo          | Pix, Cartão de crédito, Cartão de débito, Dinheiro ou Vale-alimentação               |
| Permite troco | o cliente pode pedir troco; vem marcado ao escolher "Dinheiro"                       |
| Ordem         | ordem de exibição no pedido (menor primeiro); uma forma nova vai para o fim da lista |
| Ativa         | só formas ativas aparecem em pedidos novos                                           |

"Desativar" pede confirmação. A forma deixa de aparecer em pedidos novos, mas continua nos pedidos antigos. Para reativar, edite a forma e marque "Ativa".

Endpoint: `formas-pagamento`.

## Configurações (`/configuracoes`)

Perfis: ADMIN e GERENTE. São três abas:

- **Usuários:** cadastro dos funcionários (nome, e-mail, telefone, perfil, filial e ativo). A senha só é pedida na criação, com no mínimo 8 caracteres. O GERENTE não pode criar usuários ADMIN.
- **Filiais:** nome, endereço, telefone, horário de abertura e fechamento, e ativa. Só o ADMIN edita; desativar preserva o histórico.
- **Permissões:** a matriz de permissões por perfil, gerada a partir do código.

Endpoints: `usuarios` e `lojas`.

## Promoções e cupons (`/promocoes`)

Tela reservada. A API ainda não tem endpoints de promoções e cupons. Quando existirem, siga a receita "Nova tela de cadastro" em [Desenvolvimento](desenvolvimento.md#nova-tela-de-cadastro-crud).

## Acesso negado (`/acesso-negado`)

Destino do `proxy.ts` quando o perfil abre uma rota sem permissão. Tem um link para voltar ao início.
