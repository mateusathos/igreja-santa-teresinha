# Paróquia Santa Teresinha — Site Institucional

Site institucional da **Paróquia Santa Teresinha**, publicado em:

- https://paroquiasantateresinha.com

O projeto é um site em HTML/CSS/JavaScript hospedado na Vercel, com foco em divulgação pastoral, horários de celebrações, avisos, informações sacramentais, contatos e doações.

Além das páginas públicas, o projeto possui um painel administrativo para gerenciar avisos e a programação das comunidades usando Turso DB e Vercel Functions.

---

## Visão geral

Este repositório contém o site da paróquia, com navegação responsiva, carregamento dinâmico de componentes comuns (cabeçalho e rodapé), painel administrativo e APIs serverless para avisos paroquiais.

Principais características:

- Estrutura simples e leve (sem framework SPA)
- Layout responsivo com Tailwind CSS compilado no build
- Fontes Google Fonts (`Julius Sans One` e `Open Sans`)
- Componentização de `header` e `footer` via `fetch`
- Destaque automático da página ativa no menu
- Efeitos visuais (fade, hover, animações de entrada)
- Sistema visual mobile-first compartilhado entre as páginas públicas
- Página inicial alimentada pelas APIs de programação e avisos
- Modal de doação via PIX (na home e na página de doação)
- URLs limpas na Vercel, como `/avisos`, `/admin` e `/celebracoes`
- Painel administrativo com login e sessão persistente
- CRUD de avisos, comunidades, celebrações e atividades com Turso DB

---

## Estrutura do projeto

```text
.
├── index.html
├── home.js
├── admin.html
├── admin.js
├── admin-programacao.js
├── admin.bundle.js
├── celebracoes.html
├── programacoes.js
├── avisos.html
├── avisos.js
├── confissao.html
├── batismo.html
├── crisma.html
├── teresinha.html
├── doacao.html
├── contatos.html
├── scripts.js
├── styles.css
├── styles.custom.css
├── styles.source.css
├── tailwind.config.js
├── vercel.json
├── package.json
├── api/
│   ├── avisos.js
│   ├── programacoes.js
│   ├── _lib/
│   │   ├── auth.js
│   │   ├── db.js
│   │   └── http.js
│   └── admin/
│       ├── avisos.js
│       ├── programacoes.js
│       ├── login.js
│       ├── logout.js
│       ├── session.js
│       └── upload.js
├── components/
│   ├── header.html
│   └── footer.html
└── imgs/
    ├── ... (imagens por seção e ícones)
```

### Páginas

- `/` (`index.html`) — página inicial com destaque de celebrações, avisos e botão de doação
- `/admin` (`admin.html`) — painel administrativo para gerenciar avisos e programação
- `/avisos` (`avisos.html`) — avisos paroquiais carregados pela API
- `/celebracoes` (`celebracoes.html`) — celebrações e atividades carregadas dinamicamente
- `/confissao` (`confissao.html`) — explicação e orientações sobre confissão
- `/batismo` (`batismo.html`) — conteúdo e contato para preparação do batismo
- `/crisma` (`crisma.html`) — conteúdo e contato para preparação da crisma
- `/teresinha` (`teresinha.html`) — biografia e espiritualidade de Santa Teresinha
- `/doacao` (`doacao.html`) — chamada para contribuição com modal PIX
- `/contatos` (`contatos.html`) — canais da secretaria, endereço e redes sociais

---

## Tecnologias utilizadas

- **HTML5**
- **CSS3** (`styles.css`)
- **JavaScript (ES6+)** (`scripts.js`)
- **Tailwind CSS** compilado localmente
- **Google Fonts**
- **Vercel Functions** em `api/`
- **Turso DB** via `@libsql/client`
- **Vercel Blob** para imagens dos avisos

O arquivo `styles.source.css` reúne as diretivas do Tailwind e o sistema visual de `styles.custom.css`. O processo de build gera o `styles.css` minificado consumido por todas as páginas.

---

## URLs limpas

O arquivo `vercel.json` habilita URLs sem `.html`:

```json
{
  "cleanUrls": true,
  "trailingSlash": false
}
```

Com isso, as rotas devem ser acessadas como `/avisos`, `/admin`, `/celebracoes`, etc. Essa configuração é aplicada pela Vercel e pelo `vercel dev`.

---

## Componentes e comportamento global

### `components/header.html`

- Menu desktop e menu mobile
- Botão hambúrguer no mobile
- Links de navegação para todas as páginas principais

### `components/footer.html`

- Informações de secretaria
- Endereço
- Link para Instagram

### `scripts.js`

Responsável por comportamentos globais:

- Carregar `header.html` e `footer.html` nos elementos `#header` e `#footer`
- Marcar item ativo no menu conforme URL atual
- Abrir/fechar menu mobile
- Alternar imagens da home em intervalo automático
- Aplicar animações com `IntersectionObserver`
- Controlar o estado acessível do menu mobile e a página ativa

### `home.js`

- Carrega as próximas celebrações em ordem cronológica
- Exibe uma síntese dos avisos mais recentes
- Mantém a página inicial sincronizada com o conteúdo administrativo

### `avisos.js`

Responsável pela página pública de avisos:

- Buscar avisos ativos em `/api/avisos`
- Renderizar os cards dinamicamente
- Exibir data da última atualização
- Mostrar estado vazio ou mensagem de erro quando necessário
- Expandir textos longos e abrir imagens em tamanho ampliado

### `admin.js`

Responsável pelo painel administrativo:

- Verificar sessão do administrador
- Exibir tela de login quando não houver sessão válida
- Mostrar/ocultar senha com botão de ícone de olho
- Listar avisos atuais
- Criar, editar e excluir avisos
- Anexar ou remover uma imagem opcional com prévia
- Encerrar sessão com o botão `Sair`

### `programacoes.js` e `admin-programacao.js`

- `programacoes.js` carrega a programação pública e agrupa as atividades por comunidade
- `admin-programacao.js` controla a aba administrativa de programação
- A interface aceita recorrências semanais, mensais, datas específicas e descrições personalizadas
- Cada atividade possui comunidade, nome, horário e observação opcional
- O cadastro de comunidades mantém nome, endereço, ordem de exibição e visibilidade

### `styles.css`

É o artefato CSS compilado usado pelo navegador. A origem do sistema visual fica em `styles.custom.css` e inclui:

- Scroll suave
- Transições do menu mobile
- Animações de fade e modal PIX
- Efeitos de hover em links, cards, botões e imagens
- Ajustes de tipografia para títulos e conteúdos
- Cabeçalho, navegação mobile, rodapé e componentes da página inicial
- Estados de foco e suporte a redução de movimento

---

## Arquitetura de avisos

Os avisos paroquiais deixaram de ser conteúdo fixo no HTML e passaram a ser dados persistidos no Turso DB.

Fluxo público:

- `avisos.html` carrega `avisos.js`
- `avisos.js` chama `GET /api/avisos`
- `api/avisos.js` consulta apenas avisos ativos no Turso
- A página renderiza os cards e a data da última atualização no navegador

Fluxo administrativo:

- `admin.html` carrega `admin.js`
- `admin.js` consulta `GET /api/admin/session`
- Sem sessão válida, a interface exibe a tela de login
- Com sessão válida, a interface lista os avisos atuais
- Criação, edição e exclusão passam por `api/admin/avisos.js`
- Imagens são processadas no navegador e enviadas diretamente ao Vercel Blob

As rotas administrativas exigem sessão válida. O endpoint público não exige autenticação.

---

## Arquitetura da programação

Os horários de missas e demais atividades são armazenados como dados estruturados no Turso, em vez de imagens estáticas.

Fluxo público:

- `celebracoes.html` carrega `programacoes.js`
- `programacoes.js` consulta `GET /api/programacoes`
- A API retorna comunidades ativas e suas atividades ativas
- O navegador agrupa e ordena os registros para exibição responsiva

Fluxo administrativo:

- A aba `Programação` do painel consulta `GET /api/admin/programacoes`
- A mesma rota recebe criação, edição e exclusão de comunidades e atividades
- O formulário adapta os campos ao tipo de recorrência e mostra uma prévia antes de salvar
- Comunidades com atividades vinculadas não podem ser excluídas

---

## Autenticação administrativa

O login administrativo usa senha única e sessão persistente por cookie HTTP-only assinado.

Componentes principais:

- `api/admin/login.js` valida a senha administrativa
- `api/_lib/auth.js` cria e verifica o cookie `admin_session`
- `api/admin/session.js` informa se a sessão atual é válida
- `api/admin/logout.js` limpa a sessão
- `admin.js` alterna entre tela de login e painel conforme o estado da sessão

O cookie é assinado com um segredo de servidor, tem `HttpOnly`, `SameSite=Lax` e usa `Secure` em ambiente de produção.

---

## Persistência

O Turso DB armazena os avisos, as comunidades e suas atividades. As tabelas são criadas automaticamente pelas APIs quando necessário.

Campos principais:

- `id`
- `titulo`
- `descricao`
- `ativo`
- `criado_em`
- `atualizado_em`
- `imagem_url`
- `imagem_pathname`

A página pública usa apenas avisos ativos. O painel administrativo trabalha com a lista completa e permite remover registros.

As tabelas `comunidades` e `programacoes` representam a programação paroquial. A relação entre elas permite manter múltiplas atividades por comunidade, com ordenação e visibilidade independentes. Na primeira inicialização, os horários antes publicados nas imagens são migrados como registros editáveis.

As imagens são armazenadas em um Blob público e exibidas com `object-contain`, preservando integralmente formatos verticais e horizontais. O Turso mantém somente a URL e o pathname do arquivo. Ao substituir a imagem ou excluir o aviso, a API remove o Blob anterior.

---

## Deploy

O deploy principal é feito na Vercel. O projeto combina páginas HTML estáticas, arquivos JS/CSS públicos e funções serverless em `api/`.

As variáveis sensíveis ficam no ambiente da Vercel e não são expostas ao navegador. O navegador conversa com as APIs internas do projeto, e as APIs fazem a comunicação com o Turso e autorizam uploads diretos para o Vercel Blob.

---

## Melhorias futuras (opcional)

- Centralizar dados de contato/PIX em único arquivo para evitar duplicação
- Padronizar caminhos de imagens (algumas páginas usam `../imgs/...` e outras `imgs/...`)
- Expor na interface a opção de ativar/desativar atividades sem excluir
- Adicionar auditoria simples de alterações administrativas
