# Site do Observatório de Universos Bíblicos

Site em português (universosbiblicos.org) e em inglês (universosbiblicos.org/en/), hospedado de graça no GitHub Pages e editado pelo **Pages CMS**, um painel com formulários, sem mexer em código.

## Como funciona

1. O conteúdo fica em arquivos simples na pasta `dados/`.
2. Alguém edita esses dados pelo Pages CMS e salva.
3. A automação do GitHub (`.github/workflows/publicar.yml`) roda o gerador (`scripts/gerar.mjs`), que monta as duas páginas completas, em português e em inglês, e publica no GitHub Pages.
4. Em um ou dois minutos o site no ar está atualizado.

Como as páginas já saem prontas, os buscadores leem todo o conteúdo, a abertura aparece de imediato e o site funciona até com o JavaScript desligado. A automação também roda todo dia de madrugada, para tirar da agenda as atividades que já passaram.

## O que tem na pasta

```
dados/site.json              textos do site em português (abertura, sobre, focos, contato, Instagram)
dados/site-en.json           os mesmos textos em inglês
dados/membros.json           membros, com links de Lattes, ORCID, LinkedIn e e-mail
dados/eventos.json           eventos e programações
dados/agenda.json            próximas atividades e Google Agenda
assets/estilo.css            o desenho do site (cores, tipos, grade)
assets/imagens/              imagens editáveis (as enviadas pelo painel vão para cá)
assets/icones/               ícones de Lattes, ORCID, LinkedIn, Instagram e e-mail (créditos em CREDITOS.txt)
assets/fonts/                fonte Jost, hospedada no próprio site (licença OFL incluída)
assets/*.svg, *.jpg          logo, símbolo, ícone da aba e imagem de compartilhamento
scripts/gerar.mjs            o gerador das páginas
.github/workflows/publicar.yml  a automação que gera e publica o site
.pages.yml                   configuração do painel de edição (Pages CMS)
404.html                     página para endereços que não existem
robots.txt, CNAME            orientação para buscadores e domínio do site
```

Atenção: `.github`, `.pages.yml` e `.gitignore` começam com ponto e podem ficar ocultos no seu computador. No Mac, aperte **Cmd + Shift + .** no Finder para vê-los. No Windows, ative "Itens ocultos" na aba Exibir do Explorador.

## 1. Criar o repositório e subir os arquivos (uma vez só)

Conta do GitHub: **silasklein**. Domínio: **universosbiblicos.org**.

1. Entre em github.com com a conta `silasklein` e ative a verificação em duas etapas, se ainda não estiver ativa (Settings → Password and authentication).
2. Clique em **New repository**, dê o nome `site-oub`, deixe **Public** e crie.
3. Na página do repositório, clique em **uploading an existing file** e arraste **todo o conteúdo** desta pasta, inclusive os itens ocultos (`.github`, `.pages.yml`, `.gitignore`). Clique em **Commit changes**.
4. Confira se aparecem no repositório a pasta `.github/workflows` com o arquivo `publicar.yml` e o arquivo `.pages.yml`. Se faltar algum, clique em **Add file → Create new file**, digite o caminho exato (por exemplo `.github/workflows/publicar.yml`), cole o conteúdo do arquivo e salve.

## 2. Ligar a publicação automática (uma vez só)

1. No repositório, vá em **Settings → Pages**.
2. Em **Build and deployment → Source**, escolha **GitHub Actions**. Esse é o passo mais importante: sem ele, o site não é gerado.
3. Vá na aba **Actions**, clique em **Publicar site** e depois em **Run workflow**. Em um ou dois minutos aparece um sinal verde, e o site fica no ar.

## 3. Apontar o domínio universosbiblicos.org (uma vez só)

1. **Verifique o domínio na sua conta do GitHub antes de tudo.** Clique na sua foto → **Settings → Pages → Add a domain**, digite `universosbiblicos.org` e siga as instruções: o GitHub mostra um registro TXT para você criar no DNS. Isso impede que outra pessoa use o seu domínio em um repositório dela.
2. No painel da empresa onde você registrou `universosbiblicos.org`, abra a zona de DNS e deixe estes registros (apague outros registros A ou CNAME antigos de `@` e `www`, se houver):

   | Tipo  | Nome | Valor |
   |-------|------|-------|
   | A     | @ | 185.199.108.153 |
   | A     | @ | 185.199.109.153 |
   | A     | @ | 185.199.110.153 |
   | A     | @ | 185.199.111.153 |
   | CNAME | www | silasklein.github.io |
   | TXT   | (o nome que o GitHub indicar no passo 1) | (o código que o GitHub indicar no passo 1) |

   Alguns painéis pedem o nome completo em vez de `@`: nesse caso use `universosbiblicos.org` e `www.universosbiblicos.org`. O CNAME aponta para `silasklein.github.io`, sem o nome do repositório.
3. No repositório, em **Settings → Pages → Custom domain**, digite `universosbiblicos.org` e salve.
4. Quando o DNS propagar (de minutos a algumas horas), marque **Enforce HTTPS** na mesma página. O endereço `www.universosbiblicos.org` passa a redirecionar sozinho para `universosbiblicos.org`.

**Proteja também o domínio:** no painel da empresa de registro, ative a verificação em duas etapas, a renovação automática e o bloqueio de transferência (às vezes chamado de *domain lock* ou *transfer lock*).

## 4. Ligar o painel de edição (uma vez só)

1. Acesse **app.pagescms.org** e entre com a sua conta do GitHub.
2. Quando pedido, instale o aplicativo do Pages CMS no GitHub. Escolha **Only select repositories** e marque só o `site-oub`, para que o painel não tenha acesso a mais nada da sua conta.
3. Abra o repositório no painel. O menu lateral mostra: **Textos do site (português)**, **Textos do site (inglês)**, **Membros**, **Eventos** e **Agenda**, além da biblioteca de imagens.

**Convidar colegas:** o Pages CMS permite convidar colaboradores por e-mail, sem que eles precisem de conta no GitHub. Quem tem acesso ao repositório faz o convite pelo painel. Convide só quem vai editar, e retire o acesso de quem sair do grupo.

## 5. Editar o site no dia a dia

Entre em app.pagescms.org, escolha a seção, edite e clique em **Salvar**. O site no ar se atualiza em um ou dois minutos. Para acompanhar, veja a aba **Actions** do repositório: sinal verde é publicação concluída, vermelho é erro.

- **Versão em inglês:** os campos marcados **(inglês)** alimentam a página em inglês. Se um deles ficar vazio, a página em inglês mostra o texto em português, então nada some. Nomes, títulos de eventos e títulos de falas são os mesmos nos dois idiomas.
- **Membros:** um item por pessoa. Em *Grupo*, escolha Liderança, Pesquisadores doutores, Estudantes ou Colaboradores estrangeiros. Cada pessoa mostra título e nome, instituição (ou nível, para estudantes) e os ícones de Lattes, ORCID, LinkedIn e e-mail. Os links são opcionais e só aparecem se preenchidos; se alguém colar um link sem o `https://`, o site corrige sozinho.
- **Eventos:** os mais recentes aparecem primeiro. A data é montada sozinha a partir do início e do término. Na programação, preencha *Novo dia* só no primeiro item de cada dia; o *Título da fala* aparece em itálico.
- **Agenda:** atividades com data passada somem do site sozinhas. Sem atividades futuras, aparece o aviso laranja com o botão para pedir a programação por e-mail.
- **Google Agenda (opcional):** cole o ID da agenda no último campo da seção Agenda. O ID fica em Google Agenda → Configurações da agenda → Integrar agenda → ID da agenda, e a agenda precisa estar marcada como pública.
- **Instagram:** o link fica em *Textos do site (português)*. O ícone aparece no contato e no rodapé das duas versões.

## Observações

- O repositório é **público**: qualquer pessoa pode ver os arquivos e o histórico de alterações. Não guarde nele nada que não deva ser público (CPF, telefones pessoais, documentos internos, senhas). Apagar um arquivo depois não o remove do histórico.
- Cada salvamento fica registrado no histórico do GitHub, e qualquer versão anterior pode ser recuperada. Mesmo assim, de vez em quando baixe uma cópia em **Code → Download ZIP**.
- O GitHub pausa automações agendadas de repositórios sem nenhuma alteração por 60 dias. Se isso acontecer, a agenda continua escondendo as atividades vencidas pelo próprio navegador de quem visita; basta salvar qualquer alteração para a automação diária voltar.
- Depois que o site estiver no ar, cadastre `universosbiblicos.org` no **Google Search Console** (search.google.com/search-console) e envie o endereço `https://universosbiblicos.org/sitemap.xml`.
- **Para ver o site no computador antes de publicar** (opcional, precisa do Node.js): na pasta do site, rode `node scripts/gerar.mjs` e abra `_site/index.html` no navegador.
- **Para mudar o desenho** (cores, tamanhos, espaçamentos), edite `assets/estilo.css`. Para mudar a estrutura das seções ou os textos fixos (menus, rótulos, nos dois idiomas), edite `scripts/gerar.mjs`.
