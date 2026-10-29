// Gera o site do Observatório de Universos Bíblicos a partir da pasta dados/.
//
// Saída: _site/index.html (português), _site/en/index.html (inglês), 404.html,
// sitemap.xml, robots.txt, CNAME e a pasta assets/. A automação do GitHub
// (.github/workflows/publicar.yml) roda este script a cada alteração.
//
// Para testar no computador (precisa do Node.js 18 ou mais novo):
//   node scripts/gerar.mjs
// e abra _site/index.html no navegador.

import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");
const SAIDA = join(RAIZ, "_site");
const DOMINIO = "https://universosbiblicos.org";
const HOJE = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
HOJE.setHours(0, 0, 0, 0);

const ler = nome => JSON.parse(readFileSync(join(RAIZ, "dados", nome), "utf8"));
const site = ler("site.json");
const siteEn = existsSync(join(RAIZ, "dados", "site-en.json")) ? ler("site-en.json") : {};
const membros = ler("membros.json");
const eventos = ler("eventos.json");
const agenda = ler("agenda.json");

// ---------------------------------------------------------------- utilidades
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const dt = s => s ? new Date(String(s).slice(0, 10) + "T12:00:00") : null;
const dd = d => String(d.getDate()).padStart(2, "0");
const iso = d => d.toISOString().slice(0, 10);
const COLS = ["c2", "c3", "c4"];
/** Campo traduzido: usa o campo _en na versão em inglês e cai para o português se estiver vazio. */
const tr = (obj, campo, L) => (L.id === "en" && obj?.[campo + "_en"]) ? obj[campo + "_en"] : (obj?.[campo] ?? "");
const semTitulo = nome => nome.replace(/^((Prof|Profa|Dr|Dra|PD|Me|Ma)\.?\s+)+/g, "");

// ---------------------------------------------------------------- textos fixos
const IDIOMAS = {
  pt: {
    id: "pt", lang: "pt-BR", og: "pt_BR", pasta: "", raiz: "",
    nome: "Observatório de Universos Bíblicos",
    titulo: "Observatório de Universos Bíblicos | Grupo de pesquisa da FUV",
    descricao: "Grupo de pesquisa da Faculdade Unida de Vitória que estuda inscrições, imagens, objetos, textos e ritos dos universos bíblicos pelas ciências das religiões.",
    ogDescricao: "Grupo de pesquisa da Faculdade Unida de Vitória em ciências das religiões e universos bíblicos.",
    ogAlt: "Logo do Observatório de Universos Bíblicos ao lado das palavras universos bíblicos",
    pular: "Pular para o conteúdo",
    marca: ", Observatório de Universos Bíblicos: voltar ao início",
    menuAbrir: "Abrir menu", menuFechar: "Fechar menu", navLabel: "Seções do site",
    nav: ["Sobre", "Pesquisa", "Membros", "Eventos", "Agenda", "Contato"],
    secoes: ["sobre", "pesquisa", "membros", "eventos", "agenda", "contato"],
    outro: { href: "en/", lang: "en", sigla: "EN", texto: " – read this page in English" },
    logoAlt: "Logo do Observatório de Universos Bíblicos",
    h1Prefixo: "Observatório de ",
    apresentaRodape: "Faculdade Unida de Vitória<br>Grupo certificado pelo CNPq",
    focosRotulo: "Focos de pesquisa", areas: "Áreas em diálogo", lideranca: "Liderança",
    focosIntro: n => `${["Um foco", "Dois focos", "Três focos"][n - 1]} ${n > 1 ? "articulam" : "articula"} as pesquisas do grupo.`,
    grupos: { "Líder": "Liderança", "Pesquisador(a)": "Pesquisadores doutores", "Estudante": "Estudantes", "Colaborador(a)": "Colaboradores estrangeiros" },
    nota: "A composição oficial do grupo está no", notaLink: "espelho do grupo no Diretório de Grupos de Pesquisa do CNPq",
    novaAba: " (abre em nova aba)",
    lattes: n => `Currículo Lattes de ${n}`, orcid: n => `ORCID de ${n}`, linkedin: n => `LinkedIn de ${n}`, email: n => `E-mail de ${n}`,
    eventosIntro: "Simpósios e escolas organizados pelo grupo e por seus parceiros.",
    verProgramacao: "Ver programação",
    meses: ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"],
    vazioTitulo: "Nenhuma atividade agendada no momento.",
    vazioTexto: "Reuniões, seminários e eventos abertos do grupo aparecem aqui assim que forem marcados.",
    vazioAcao: "Pedir a programação por e-mail", vazioAssunto: "Programação do Observatório de Universos Bíblicos",
    calendario: "Calendário do grupo", calHl: "pt_BR",
    instituicao: "Instituição", diretorio: "Diretório do CNPq", verEspelho: "Ver o espelho do grupo",
    instagram: "Instagram do Observatório", escrever: e => `Escrever para ${e}`,
    rodape: "Observatório de Universos Bíblicos (OUB), grupo de pesquisa da Faculdade Unida de Vitória certificado pelo CNPq.",
    voltar: "Voltar ao início",
    e: " e ",
  },
  en: {
    id: "en", lang: "en", og: "en_GB", pasta: "en/", raiz: "../",
    nome: siteEn.nome || "Observatory of Biblical Universes",
    titulo: `${siteEn.nome || "Observatory of Biblical Universes"} (OUB) | Research group at FUV`,
    descricao: "Research group at Faculdade Unida de Vitória (Brazil) studying inscriptions, images, objects, texts and rites of the biblical universes through the study of religion.",
    ogDescricao: "Research group at Faculdade Unida de Vitória (Brazil) on the study of religion and the biblical universes.",
    ogAlt: "Logo of the Observatório de Universos Bíblicos next to the words biblical universes",
    pular: "Skip to content",
    marca: ", Observatory of Biblical Universes: back to top",
    menuAbrir: "Open menu", menuFechar: "Close menu", navLabel: "Site sections",
    nav: ["About", "Research", "Members", "Events", "Calendar", "Contact"],
    secoes: ["about", "research", "members", "events", "calendar", "contact"],
    outro: { href: "../", lang: "pt-BR", sigla: "PT", texto: " – ler esta página em português" },
    logoAlt: "Logo of the Observatório de Universos Bíblicos",
    h1Prefixo: "Observatory of ",
    apresentaRodape: "Faculdade Unida de Vitória, Brazil<br>Research group certified by CNPq",
    focosRotulo: "Research foci", areas: "Fields in dialogue", lideranca: "Leadership",
    focosIntro: n => `${["One focus structures", "Two foci structure", "Three foci structure"][n - 1]} the group's research.`,
    grupos: { "Líder": "Leadership", "Pesquisador(a)": "Researchers (PhD)", "Estudante": "Students", "Colaborador(a)": "International collaborators" },
    nota: "The official composition of the group is listed on the", notaLink: "group's page in the CNPq Directory of Research Groups",
    novaAba: " (opens in a new tab)",
    lattes: n => `Lattes CV of ${n}`, orcid: n => `ORCID of ${n}`, linkedin: n => `LinkedIn of ${n}`, email: n => `E-mail ${n}`,
    eventosIntro: "Symposia and schools organised by the group and its partners.",
    verProgramacao: "View programme",
    meses: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    vazioTitulo: "No activities scheduled at the moment.",
    vazioTexto: "Group meetings, seminars and public events appear here as soon as they are scheduled.",
    vazioAcao: "Ask for the programme by e-mail", vazioAssunto: "Programme of the Observatory of Biblical Universes",
    calendario: "Group calendar", calHl: "en_GB",
    instituicao: "Institution", diretorio: "CNPq directory", verEspelho: "View the group's CNPq page",
    instagram: "The Observatory on Instagram", escrever: e => `Write to ${e}`,
    rodape: "Observatório de Universos Bíblicos (OUB), a research group at Faculdade Unida de Vitória certified by CNPq.",
    voltar: "Back to top",
    e: " and ",
  },
};

// ---------------------------------------------------------------- ícones
const ICONES = ["lattes", "orcid", "linkedin", "instagram", "email"];
const sprite = `<svg xmlns="http://www.w3.org/2000/svg" style="display:none">${ICONES.map(n => {
  const svg = readFileSync(join(RAIZ, "assets", "icones", `${n}.svg`), "utf8");
  const viewBox = svg.match(/viewBox="([^"]+)"/)[1];
  const corpo = svg.replace(/^[\s\S]*?<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "").replace(/<title>[\s\S]*?<\/title>/, "");
  return `<symbol id="i-${n}" viewBox="${viewBox}">${corpo}</symbol>`;
}).join("")}</svg>`;
const icone = n => `<svg aria-hidden="true" focusable="false"><use href="#i-${n}"></use></svg>`;
/** Corrige links digitados sem https:// e codifica letras acentuadas (ex.: linkedin.com/in/cídio). */
const link = href => {
  let h = String(href || "").trim();
  if (!h || /^mailto:/i.test(h)) return h;
  if (!/^https?:\/\//i.test(h)) h = "https://" + h.replace(/^\/+/, "");
  try { return new URL(h).href; } catch { return h; }
};
const linkIcone = (href, nomeIcone, rotulo, L, externo = true) =>
  `<a href="${esc(link(href))}"${externo ? ` target="_blank" rel="noopener"` : ""} title="${esc(rotulo)}">${icone(nomeIcone)}<span class="sr-only">${esc(rotulo)}${externo ? L.novaAba : ""}</span></a>`;

// ---------------------------------------------------------------- partes da página
const asset = (L, caminho) => L.raiz + String(caminho || "").replace(/^\/+/, "");
const externo = (href, texto, L) => `<a href="${esc(link(href))}" target="_blank" rel="noopener">${texto}<span class="sr-only">${L.novaAba}</span></a>`;
const S = L => L.id === "en" ? { ...site, ...Object.fromEntries(Object.entries(siteEn).filter(([, v]) => v && (!Array.isArray(v) || v.length))) } : site;

function cabecalho(L) {
  const ids = L.secoes;
  return `<header class="topo">
  <div class="g">
    <a class="marca" href="#inicio">
      <img src="${asset(L, "assets/simbolo-oub.svg")}" alt="" width="38" height="30">
      <span>OUB</span><span class="sr-only">${L.marca}</span>
    </a>
    <div class="acoes">
      <nav id="menu" aria-label="${L.navLabel}">
        <ul>${L.nav.map((n, i) => `<li><a href="#${ids[i]}">${n}</a></li>`).join("")}</ul>
      </nav>
      <a class="idioma" href="${L.outro.href}" hreflang="${L.outro.lang}" lang="${L.outro.lang}">${L.outro.sigla}<span class="sr-only">${L.outro.texto}</span></a>
      <button class="menu-btn" type="button" aria-expanded="false" aria-controls="menu" aria-label="${L.menuAbrir}"><i></i><i></i><i></i></button>
    </div>
  </div>
</header>`;
}

function abertura(L) {
  const s = S(L);
  const imgs = (site.imagens_abertura || []).slice(0, 2);
  const alts = L.id === "en" ? (siteEn.descricoes_imagens || []) : [];
  return `<div class="abertura">
    <div class="g">
      <div class="cel logo-cel"><img src="${asset(L, "assets/logo-oub.svg")}" alt="${L.logoAlt}" width="230" height="188"></div>
      <h1 class="gigante"><span class="sr-only">${L.h1Prefixo}</span>${esc(s.titulo_abertura)}</h1>
      <div class="cel apresenta">
        <p class="pequeno">${esc(s.chamada)}</p>
        <p class="pequeno cinza">${L.apresentaRodape}</p>
      </div>
      ${imgs.map((im, i) => `<figure class="faixa ${COLS[i]}" style="margin:0"><img src="${asset(L, im.imagem)}" alt="${esc(alts[i] || im.descricao)}"${i ? "" : ` fetchpriority="high"`}></figure>`).join("\n      ")}
      <div class="cel bloco focos-bloco">
        <p class="rotulo">${L.focosRotulo}</p>
        <ul>${(s.focos || []).map(f => `<li><a href="#${L.secoes[1]}">${esc(f.palavra_chave)}</a></li>`).join("")}</ul>
      </div>
    </div>
  </div>`;
}

const cabecalhoSecao = (num, id, titulo, intro = "") => `<div class="cab">
        <div class="cel meta"><p class="num">${num}</p>${intro ? `<p class="pequeno cinza">${intro}</p>` : ""}</div>
        <h2 id="t-${id}" class="titulo">${titulo}</h2>
      </div>`;

function secaoSobre(L) {
  const s = S(L);
  const lideres = membros.filter(m => m.funcao === "Líder");
  const [id] = L.secoes;
  return `<section id="${id}" class="sobre" aria-labelledby="t-${id}">
    <div class="g">
      ${cabecalhoSecao("01", id, L.secoes[0])}
      <div class="cel c1 areas">
        <h3 class="rotulo cinza">${L.areas}</h3>
        <ul style="margin-top:8px">${(s.areas || []).map(a => `<li>${esc(a)}</li>`).join("")}</ul>
      </div>
      <div class="cel c2-3 texto">
        <p class="lead">${esc(s.sobre_destaque)}</p>
        ${(s.sobre_paragrafos || []).map(p => `<p>${esc(p)}</p>`).join("\n        ")}
      </div>
      <div class="cel c4 lideranca">
        <h3 class="rotulo cinza">${L.lideranca}</h3>
        <ul>${lideres.map(m => `<li>${esc(m.nome)}</li>`).join("")}</ul>
      </div>
    </div>
  </section>`;
}

function secaoPesquisa(L) {
  const focos = (S(L).focos || []).slice(0, 3);
  const id = L.secoes[1];
  return `<section id="${id}" aria-labelledby="t-${id}">
    <div class="g">
      ${cabecalhoSecao("02", id, id, focos.length ? L.focosIntro(focos.length) : "")}
      <div class="linha"><div class="c1"></div>${focos.map((f, i) => `
        <article class="cel ${COLS[i]} foco">
          <h3>${esc(f.palavra_chave)}</h3>
          ${f.titulo ? `<h4>${esc(f.titulo)}</h4>` : ""}
          <p>${esc(f.texto)}</p>
        </article>`).join("")}
      </div>
    </div>
  </section>`;
}

function iconesMembro(m, L) {
  const nome = semTitulo(m.nome);
  const partes = [];
  if (m.lattes) partes.push(linkIcone(m.lattes, "lattes", L.lattes(nome), L));
  if (m.orcid) partes.push(linkIcone(m.orcid, "orcid", L.orcid(nome), L));
  if (m.linkedin) partes.push(linkIcone(m.linkedin, "linkedin", L.linkedin(nome), L));
  if (m.email) partes.push(linkIcone(`mailto:${m.email}`, "email", L.email(nome), L, false));
  return partes.length ? `<div class="icones">${partes.join("")}</div>` : "";
}

function secaoMembros(L) {
  const id = L.secoes[2];
  let html = "";
  for (const [funcao, titulo] of Object.entries(L.grupos)) {
    const lista = membros.filter(m => m.funcao === funcao);
    for (let i = 0; i < lista.length; i += 3) {
      html += `<div class="linha"><div class="cel c1">${i === 0 ? `<h3 class="rotulo">${titulo}</h3>` : ""}</div>` +
        lista.slice(i, i + 3).map((m, j) => {
          const vinc = tr(m, "vinculo", L);
          return `<div class="cel ${COLS[j]} pessoa"><h4>${esc(m.nome)}</h4>
          ${vinc ? `<p class="vinc pequeno cinza">${esc(vinc)}</p>` : ""}
          ${iconesMembro(m, L)}</div>`;
        }).join("") + `</div>\n      `;
    }
  }
  if (site.link_cnpq) html += `<div class="linha"><p class="cel c2-4 pequeno cinza nota"><span>${L.nota} ${externo(site.link_cnpq, L.notaLink, L)}.</span></p></div>`;
  return `<section id="${id}" aria-labelledby="t-${id}">
    <div class="g">
      ${cabecalhoSecao("03", id, id)}
      ${html}
    </div>
  </section>`;
}

function dataEvento(e, L) {
  const a = dt(e.data_inicio), b = dt(e.data_fim), M = L.meses;
  if (!a) return "";
  if (!b || b <= a) return `${dd(a)}<br>${M[a.getMonth()]} ${a.getFullYear()}`;
  if (a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear()) return `${dd(a)}–${dd(b)}<br>${M[a.getMonth()]} ${a.getFullYear()}`;
  return `${dd(a)} ${M[a.getMonth()]}–<br>${dd(b)} ${M[b.getMonth()]} ${b.getFullYear()}`;
}

function secaoEventos(L) {
  const id = L.secoes[3];
  const lista = [...eventos].sort((x, y) => (dt(y.data_inicio) || 0) - (dt(x.data_inicio) || 0));
  const html = lista.map(e => {
    const itens = (e.programacao || []).filter(p => p.horario || p.responsavel || p.titulo || p.dia).map(p => {
      const dia = tr(p, "dia", L), hora = tr(p, "horario", L), resp = tr(p, "responsavel", L);
      const desc = [resp && esc(resp), p.titulo && `<i>${esc(p.titulo)}</i>`].filter(Boolean).join(": ");
      return (dia ? `<li class="dia">${esc(dia)}</li>` : "") + ((hora || desc) ? `<li><span class="h">${esc(hora)}</span><span>${desc}</span></li>` : "");
    }).join("");
    const local = tr(e, "local", L), tipo = tr(e, "tipo", L), descricao = tr(e, "descricao", L);
    return `<article class="linha evento">
        <p class="cel c1 ev-data"><strong>${dataEvento(e, L)}</strong>${local ? `<span class="rotulo">${esc(local)}</span>` : ""}</p>
        ${e.imagem
          ? `<figure class="cel c2 ev-img ${e.imagem_ajuste === "inteira" ? "contain" : ""}" style="margin:0"><img src="${asset(L, e.imagem)}" alt="${esc(tr(e, "imagem_descricao", L))}" loading="lazy" width="600" height="600"></figure>`
          : `<div class="c2"></div>`}
        <div class="cel c3-4 ev-txt">
          <h3>${esc(e.titulo)}</h3>
          ${tipo ? `<p class="tipo">${esc(tipo)}</p>` : ""}
          ${descricao ? `<p>${esc(descricao)}</p>` : ""}
          ${itens ? `<details><summary>${L.verProgramacao}</summary><ul class="prog">${itens}</ul></details>` : ""}
        </div>
      </article>`;
  }).join("\n      ");
  return `<section id="${id}" aria-labelledby="t-${id}">
    <div class="g">
      ${cabecalhoSecao("04", id, id, L.eventosIntro)}
      ${html}
    </div>
  </section>`;
}

/** Aceita o ID da agenda (algo@group.calendar.google.com), o link público ou o link de incorporação. */
function idGoogleAgenda(valor) {
  const v = String(valor || "").trim();
  if (!v) return "";
  const src = v.match(/[?&]src=([^&"\s]+)/);
  if (src) return decodeURIComponent(src[1]);
  const cid = v.match(/[?&]cid=([^&"\s]+)/);
  if (cid) {
    const c = decodeURIComponent(cid[1]);
    try { return /@/.test(c) ? c : Buffer.from(c, "base64").toString("utf8"); } catch { return c; }
  }
  return v;
}

function secaoAgenda(L) {
  const id = L.secoes[4];
  const futuros = (agenda.atividades || []).map(e => ({ ...e, d: dt(e.data) }))
    .filter(e => e.d && e.d >= HOJE).sort((a, b) => a.d - b.d);
  const M = L.meses;
  // As atividades levam a data no atributo data-dia: um script pequeno no fim da página
  // esconde as que já passaram, mesmo que o site não tenha sido gerado de novo.
  const itens = futuros.map(e => `<div class="linha proximo" data-dia="${iso(e.d)}">
        <div class="cel c1 dt">${dd(e.d)} ${M[e.d.getMonth()]}<small>${e.d.getFullYear()}${e.hora ? ", " + esc(e.hora) : ""}</small></div>
        <div class="cel c2-4"><h4>${esc(tr(e, "titulo", L))}</h4>${tr(e, "local", L) ? `<p>${esc(tr(e, "local", L))}</p>` : ""}${tr(e, "descricao", L) ? `<p>${esc(tr(e, "descricao", L))}</p>` : ""}</div>
      </div>`).join("\n      ");
  // Com o Google Agenda ligado, o próprio calendário mostra os eventos: o aviso de "nenhuma atividade" não aparece.
  const temCalendario = !!idGoogleAgenda(agenda.google_calendar_id);
  const vazio = temCalendario ? "" : `<div class="linha agenda-vazia"${futuros.length ? " hidden" : ""}><div class="c1"></div><div class="cel c2-3 bloco vazio">
        <h3>${L.vazioTitulo}</h3>
        <div><p>${L.vazioTexto}</p>
        <a class="acao" href="mailto:${esc(site.email)}?subject=${encodeURIComponent(L.vazioAssunto)}">${L.vazioAcao}</a></div></div></div>`;
  const idAgenda = idGoogleAgenda(agenda.google_calendar_id);
  const cal = idAgenda
    ? `<div class="linha"><div class="cel c2-4 calendario"><iframe src="https://calendar.google.com/calendar/embed?src=${encodeURIComponent(idAgenda)}&amp;ctz=America%2FSao_Paulo&amp;hl=${L.calHl}&amp;mode=AGENDA&amp;showTitle=0&amp;showPrint=0" title="${L.calendario}" loading="lazy"></iframe></div></div>`
    : "";
  return `<section id="${id}" aria-labelledby="t-${id}">
    <div class="g">
      ${cabecalhoSecao("05", id, id)}
      ${itens}
      ${vazio}
      ${cal}
      <div class="c1 agenda-fim"></div>
    </div>
  </section>`;
}

function iconesGrupo(L, grandes) {
  const partes = [];
  if (site.instagram) partes.push(linkIcone(site.instagram, "instagram", L.instagram, L));
  if (site.email) partes.push(linkIcone(`mailto:${site.email}`, "email", L.escrever(site.email), L, false));
  return partes.length ? `<div class="icones${grandes ? " grandes" : ""}">${partes.join("")}</div>` : "";
}

function secaoContato(L) {
  const s = S(L);
  const id = L.secoes[5];
  const lideres = membros.filter(m => m.funcao === "Líder").map(m => esc(semTitulo(m.nome)));
  return `<section id="${id}" aria-labelledby="t-${id}">
    <div class="g">
      ${cabecalhoSecao("06", id, id)}
      <div class="cel c2-4" style="padding-top:0"><a class="email" href="mailto:${esc(site.email)}">${esc(site.email)}</a>${iconesGrupo(L, true)}</div>
      <dl class="linha contato-dados" style="margin:0">
        <div class="cel c2"><dt>${L.instituicao}</dt><dd>${esc(s.instituicao)}</dd></div>
        <div class="cel c3"><dt>${L.diretorio}</dt><dd>${site.link_cnpq ? externo(site.link_cnpq, L.verEspelho, L) : ""}</dd></div>
        <div class="cel c4"><dt>${L.lideranca}</dt><dd>${lideres.join(L.e)}</dd></div>
      </dl>
    </div>
  </section>`;
}

const rodape = L => `<footer class="camada">
  <div class="g">
    <div class="cel c1 logo-rod"><img src="${asset(L, "assets/logo-oub.svg")}" alt="" width="170" height="139" loading="lazy"></div>
    <p class="cel c2-3 pequeno cinza" style="align-self:end">${L.rodape}</p>
    <div class="cel c4 fim">${iconesGrupo(L, false)}<a class="voltar pequeno" href="#inicio">${L.voltar}</a></div>
  </div>
</footer>`;

// ---------------------------------------------------------------- dados estruturados (schema.org)
function jsonLd(L) {
  const org = {
    "@context": "https://schema.org", "@type": "ResearchOrganization",
    name: "Observatório de Universos Bíblicos", alternateName: ["OUB", IDIOMAS.en.nome],
    url: DOMINIO + "/", logo: DOMINIO + "/assets/logo-oub.svg", email: site.email,
    description: L.descricao,
    parentOrganization: { "@type": "CollegeOrUniversity", name: "Faculdade Unida de Vitória" },
    address: { "@type": "PostalAddress", addressLocality: "Vitória", addressRegion: "ES", addressCountry: "BR" },
    sameAs: [site.link_cnpq, site.instagram].filter(Boolean),
    member: membros.map(m => ({ "@type": "Person", name: semTitulo(m.nome), sameAs: [m.orcid, m.lattes, m.linkedin].filter(Boolean).map(link) })),
  };
  const evs = eventos.filter(e => e.titulo && e.data_inicio).map(e => ({
    "@context": "https://schema.org", "@type": "Event", name: e.titulo,
    description: tr(e, "descricao", L) || undefined,
    startDate: String(e.data_inicio).slice(0, 10), endDate: e.data_fim ? String(e.data_fim).slice(0, 10) : undefined,
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode", eventStatus: "https://schema.org/EventScheduled",
    image: e.imagem ? `${DOMINIO}/${String(e.imagem).replace(/^\/+/, "")}` : undefined,
    location: { "@type": "Place", name: e.local || "Faculdade Unida de Vitória", address: e.local || "Vitória, ES, Brasil" },
    organizer: { "@type": "Organization", name: "Observatório de Universos Bíblicos", url: DOMINIO + "/" },
  }));
  return JSON.stringify([org, ...evs]).replace(/</g, "\\u003c");
}

// ---------------------------------------------------------------- script da página
const scriptPagina = L => `<script>
(function(){
  /* Menu no celular: abre e fecha pelo botão, fecha com Esc e ao escolher uma seção. */
  var btn = document.querySelector(".menu-btn"), nav = document.getElementById("menu");
  function fechar(focar){ nav.classList.remove("aberto"); btn.setAttribute("aria-expanded","false"); btn.setAttribute("aria-label",${JSON.stringify(L.menuAbrir)}); if(focar) btn.focus(); }
  btn.addEventListener("click", function(){
    var aberto = nav.classList.toggle("aberto");
    btn.setAttribute("aria-expanded", String(aberto));
    btn.setAttribute("aria-label", aberto ? ${JSON.stringify(L.menuFechar)} : ${JSON.stringify(L.menuAbrir)});
  });
  document.addEventListener("keydown", function(e){ if(e.key === "Escape" && nav.classList.contains("aberto")) fechar(true); });
  nav.addEventListener("click", function(e){ if(e.target.tagName === "A") fechar(false); });

  /* Agenda: esconde atividades que já passaram desde a última publicação. */
  var hoje = new Date(); hoje.setHours(0,0,0,0);
  var itens = document.querySelectorAll(".proximo[data-dia]"), restantes = 0;
  for (var i = 0; i < itens.length; i++) {
    if (new Date(itens[i].getAttribute("data-dia") + "T23:59:59") < hoje) itens[i].hidden = true; else restantes++;
  }
  var vazio = document.querySelector(".agenda-vazia");
  if (vazio && itens.length && !restantes) vazio.hidden = false;
})();
</script>`;

// ---------------------------------------------------------------- página completa
function pagina(L) {
  const url = DOMINIO + "/" + L.pasta;
  return `<!doctype html>
<html lang="${L.lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(L.titulo)}</title>
<meta name="description" content="${esc(L.descricao)}">
<link rel="canonical" href="${url}">
<link rel="alternate" hreflang="pt-BR" href="${DOMINIO}/">
<link rel="alternate" hreflang="en" href="${DOMINIO}/en/">
<link rel="alternate" hreflang="x-default" href="${DOMINIO}/">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Observatório de Universos Bíblicos">
<meta property="og:locale" content="${L.og}">
<meta property="og:locale:alternate" content="${L.id === "pt" ? "en_GB" : "pt_BR"}">
<meta property="og:url" content="${url}">
<meta property="og:title" content="${esc(L.nome)}">
<meta property="og:description" content="${esc(L.ogDescricao)}">
<meta property="og:image" content="${DOMINIO}/assets/compartilhamento.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${esc(L.ogAlt)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#FFFFFF">
<link rel="icon" href="${asset(L, "assets/favicon.svg")}" type="image/svg+xml">
<link rel="preload" href="${asset(L, "assets/fonts/jost-latin-wght-normal.woff2")}" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="${asset(L, "assets/estilo.css")}">
<script type="application/ld+json">${jsonLd(L)}</script>
</head>
<body>
${sprite}
<a class="pular" href="#inicio">${L.pular}</a>

<div class="guias" aria-hidden="true"><div class="g"><span></span><span></span><span></span><span></span></div></div>

${cabecalho(L)}

<!-- Página gerada automaticamente por scripts/gerar.mjs a partir da pasta dados/. Não edite este arquivo: edite os dados pelo Pages CMS. -->
<main id="inicio" class="camada">

  ${abertura(L)}

  ${secaoSobre(L)}

  ${secaoPesquisa(L)}

  ${secaoMembros(L)}

  ${secaoEventos(L)}

  ${secaoAgenda(L)}

  ${secaoContato(L)}

</main>

${rodape(L)}

${scriptPagina(L)}
</body>
</html>
`;
}

// ---------------------------------------------------------------- gravação
rmSync(SAIDA, { recursive: true, force: true });
mkdirSync(join(SAIDA, "en"), { recursive: true });
cpSync(join(RAIZ, "assets"), join(SAIDA, "assets"), { recursive: true });
for (const arquivo of ["404.html", "robots.txt", "CNAME"]) {
  if (existsSync(join(RAIZ, arquivo))) cpSync(join(RAIZ, arquivo), join(SAIDA, arquivo));
}
writeFileSync(join(SAIDA, "index.html"), pagina(IDIOMAS.pt));
writeFileSync(join(SAIDA, "en", "index.html"), pagina(IDIOMAS.en));
writeFileSync(join(SAIDA, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${["", "en/"].map(p => `  <url>
    <loc>${DOMINIO}/${p}</loc>
    <lastmod>${iso(HOJE)}</lastmod>
    <xhtml:link rel="alternate" hreflang="pt-BR" href="${DOMINIO}/"/>
    <xhtml:link rel="alternate" hreflang="en" href="${DOMINIO}/en/"/>
  </url>`).join("\n")}
</urlset>
`);
console.log(`Site gerado em _site/ (${membros.length} membros, ${eventos.length} eventos, ${(agenda.atividades || []).length} atividades na agenda).`);
