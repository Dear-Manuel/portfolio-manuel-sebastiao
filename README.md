# Portefólio — Manuel Sebastião

## Estrutura do projeto

```
index.html, styles.css, script.js   → o site (não precisa de tocar aqui)
data.json                            → perfil, competências, formação
content/projects.json                → os seus projetos
admin/                                → painel de administração (CMS)
uploads/                              → imagens que carregar pelo painel
```

Há duas formas de gerir o conteúdo:

1. **Editar `data.json` e `content/projects.json` à mão** (como antes) — sempre disponível.
2. **Usar o painel em `/admin`** — formulário no navegador para adicionar
   projetos com imagem, vídeo, link e descrição longa. Publica diretamente
   no site. Precisa da configuração abaixo (uma vez só).

---

## PARTE 1 — Publicar o site no GitHub + Netlify

### 1. Criar o repositório no GitHub

1. Vá a github.com → **New repository**
2. Nome sugerido: `portfolio-manuel-sebastiao`
3. Crie como **privado ou público** (tanto faz)
4. Envie todos os ficheiros desta pasta para o repositório (pelo GitHub
   Desktop, ou pelo terminal: `git init`, `git add .`, `git commit -m "site inicial"`,
   `git remote add origin <link-do-repo>`, `git push -u origin main`)

### 2. Ligar o repositório ao Netlify

1. Vá a app.netlify.com → **Add new site → Import an existing project**
2. Escolha **GitHub** e autorize o Netlify a aceder ao repositório
3. Selecione o repositório `portfolio-manuel-sebastiao`
4. Não precisa de comando de build — deixe os campos em branco (ou
   "Build command" vazio, "Publish directory" = `.`)
5. Clique em **Deploy site**

Ao fim de 1 minuto tem um link tipo `nome-aleatorio.netlify.app`. Pode
mudar o nome em **Site settings → Change site name**.

---

## PARTE 2 — Ativar o painel de administração (/admin)

Isto permite-lhe entrar em `seusite.netlify.app/admin`, preencher um
formulário e publicar um projeto novo (com imagem, vídeo, link, descrição
longa) sem tocar em código.

### 1. Ativar o Netlify Identity (sistema de login)

1. No painel do Netlify, vá ao seu site → **Site configuration → Identity**
2. Clique **Enable Identity**
3. Em **Registration**, escolha **Invite only** (para que só você se
   consiga registar)

### 2. Ativar o Git Gateway

1. Ainda em Identity, vá a **Services → Git Gateway**
2. Clique **Enable Git Gateway**
   (Isto permite que o painel publique diretamente no seu repositório GitHub)

### 3. Convidar-se a si mesmo

1. Vá a **Identity → Invite users**
2. Introduza o seu próprio email
3. Vai receber um email — abra o link, defina uma password

### 4. Aceder ao painel

Vá a `seusite.netlify.app/admin`, entre com o email e password que
definiu, e verá dois separadores:

- **Projetos** → adicionar/editar projetos (título, categoria, descrição
  longa, imagem, vídeo, link, ferramentas usadas, etapas do processo)
- **Perfil do site** → editar nome, frase de posicionamento, sobre mim,
  competências e formação

Cada vez que grava algo no painel, isso cria um commit no seu
repositório GitHub e o site atualiza-se automaticamente em cerca de 1 minuto.

**Sobre vídeos:** pode colar um link do YouTube ou Vimeo (mostra
incorporado no site), ou carregar um ficheiro de vídeo diretamente.

**Sobre a descrição:** pode escrever o quanto quiser — suporta parágrafos,
**negrito**, *itálico*, listas e links.

---

## Testar localmente (opcional, antes de publicar)

```
python3 -m http.server 8000
```

Depois abra `http://localhost:8000`. (O painel `/admin` só funciona depois
de publicado no Netlify — localmente não tem acesso ao Git Gateway.)
