// Gera o site do Observatório de Universos Bíblicos a partir da pasta dados/.
//
// Saída: _site/index.html (português), _site/en/index.html (inglês), 404.html,
// sitemap.xml, robots.txt, CNAME e a pasta assets/. A automação do GitHub
// (.github/workflows/publicar.yml) roda este script a cada alteração.
//
// Para testar no computador (precisa do Node.js 18 ou mais novo):
//   node scripts/gerar.mjs
// e abra _site/index.html no navegador.

import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync, existsSync, readdirSync } from "node:fs";
import ICAL from "ical.js";
import { createHash } from "node:crypto";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");
const SAIDA = join(RAIZ, "_site");
const DOMINIO = "https://universosbiblicos.org";
const HOJE = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
HOJE.setHours(0, 0, 0, 0);

const ler = nome => JSON.parse(readFileSync(join(RAIZ, "dados", nome), "utf8"));
const semTitulo = nome => String(nome || "").replace(/^((Prof|Profa|Dr|Dra|PD|Me|Ma)\.?\s+)+/g, "");
const site = ler("site.json");
const siteEn = existsSync(join(RAIZ, "dados", "site-en.json")) ? ler("site-en.json") : {};
const ordemDe = m => (m.ordem === "" || m.ordem == null || !Number.isFinite(Number(m.ordem))) ? 999 : Number(m.ordem);
/** Lê uma coleção do Pages CMS: uma pasta com um arquivo .json por item. */
const lerColecao = pasta => {
  const dir = join(RAIZ, "dados", pasta);
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter(f => f.endsWith(".json")).sort().map(f => ler(join(pasta, f)));
};
const membros = lerColecao("membros")
  .sort((a, b) => ordemDe(a) - ordemDe(b) || semTitulo(a.nome || "").localeCompare(semTitulo(b.nome || ""), "pt"));
const eventos = lerColecao("eventos");
const agenda = ler("agenda.json");

// ---------------------------------------------------------------- utilidades
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const dt = s => s ? new Date(String(s).slice(0, 10) + "T12:00:00") : null;
const dd = d => String(d.getDate()).padStart(2, "0");
const iso = d => d.toISOString().slice(0, 10);
const COLS = ["c2", "c3", "c4"];
// Muda sempre que o estilo muda: o navegador de quem visita busca a versão nova na hora.
const VERSAO_CSS = createHash("sha1").update(readFileSync(join(RAIZ, "assets", "estilo.css"))).digest("hex").slice(0, 8);
/** Campo traduzido: usa o campo _en na versão em inglês e cai para o português se estiver vazio. */
const tr = (obj, campo, L) => (L.id === "en" && obj?.[campo + "_en"]) ? obj[campo + "_en"] : (obj?.[campo] ?? "");

// ---------------------------------------------------------------- textos fixos
const IDIOMAS = {
  pt: {
    id: "pt", lang: "pt-BR", og: "pt_BR", pasta: "", raiz: "",
    nome: "Observatório de Universos Bíblicos",
    titulo: "Observatório de Universos Bíblicos | Grupo de pesquisa em ciências das religiões",
    descricao: "Grupo de pesquisa vinculado ao PPGP Ciências das Religiões da Faculdade Unida de Vitória que estuda inscrições, imagens, objetos, textos e ritos dos universos bíblicos.",
    ogDescricao: "Grupo de pesquisa em ciências das religiões e universos bíblicos, vinculado ao PPGP Ciências das Religiões da Faculdade Unida de Vitória.",
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
    rotuloLocal: "Local:", rotuloObs: "Observações:",
    assinarRotulo: "Assinar a agenda", assinarGoogle: "Adicionar ao Google Agenda", assinarIcs: "Assinar em outro aplicativo de calendário (.ics)",
    agendaFalhou: "A agenda do grupo não pôde ser atualizada agora. Ela volta a aparecer aqui na próxima atualização do site.",
    instituicao: "Instituição", diretorio: "Diretório do CNPq", verEspelho: "Ver o espelho do grupo",
    instagram: "Instagram do Observatório", escrever: e => `Escrever para ${e}`,
    rodape: "Observatório de Universos Bíblicos (OUB), grupo de pesquisa certificado pelo CNPq e vinculado ao Programa de Pós-Graduação Profissional em Ciências das Religiões (PPGP Ciências das Religiões) da Faculdade Unida de Vitória.",
    direitos: "© 2026 Observatório de Universos Bíblicos. Todos os direitos reservados.",
    voltar: "Voltar ao início",
    e: " e ",
  },
  en: {
    id: "en", lang: "en", og: "en_GB", pasta: "en/", raiz: "../",
    nome: siteEn.nome || "Observatory of Biblical Universes",
    titulo: `${siteEn.nome || "Observatory of Biblical Universes"} (OUB) | Research group in the study of religion`,
    descricao: "Research group affiliated with the PPGP Ciências das Religiões at Faculdade Unida de Vitória (Brazil), studying the inscriptions, images, objects, texts and rites of the biblical universes.",
    ogDescricao: "Research group on the study of religion and the biblical universes, affiliated with the PPGP Ciências das Religiões at Faculdade Unida de Vitória (Brazil).",
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
    rotuloLocal: "Location:", rotuloObs: "Notes:",
    assinarRotulo: "Subscribe to the calendar", assinarGoogle: "Add to Google Calendar", assinarIcs: "Subscribe in another calendar app (.ics)",
    agendaFalhou: "The group calendar could not be updated right now. It will be back here at the next site update.",
    instituicao: "Institution", diretorio: "CNPq directory", verEspelho: "View the group's CNPq page",
    instagram: "The Observatory on Instagram", escrever: e => `Write to ${e}`,
    rodape: "Observatório de Universos Bíblicos (OUB), a research group certified by CNPq and affiliated with the Professional Graduate Programme in Sciences of Religions (PPGP Ciências das Religiões) at Faculdade Unida de Vitória.",
    direitos: "© 2026 Observatório de Universos Bíblicos. All rights reserved.",
    voltar: "Back to top",
    e: " and ",
  },
};

// ---------------------------------------------------------------- ícones
const ICONES = ["lattes", "orcid", "linkedin", "instagram", "email", "googlecalendar", "calendario"];
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
      ${imgs.map((im, i) => `<figure class="faixa ${COLS[i]}" style="margin:0"><img src="${esc(asset(L, im.imagem))}" alt="${esc(alts[i] || im.descricao)}"${i ? "" : ` fetchpriority="high"`}></figure>`).join("\n      ")}
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
          ? `<figure class="cel c2 ev-img ${e.imagem_ajuste === "inteira" ? "contain" : ""}" style="margin:0"><img src="${esc(asset(L, e.imagem))}" alt="${esc(tr(e, "imagem_descricao", L))}" loading="lazy" width="600" height="600"></figure>`
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

// ---------------------------------------------------------------- Google Agenda
// Na geração do site, o feed público da agenda (.ics) é lido e os próximos eventos
// entram na página já desenhados no estilo do site. A automação roda de hora em hora.
const FUSO = "America/Sao_Paulo";
const JANELA_DIAS = 365;   // mostra eventos dos próximos 12 meses
const MAX_EVENTOS = 12;

const partes = (() => {
  const f = new Intl.DateTimeFormat("en-CA", { timeZone: FUSO, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23", weekday: "short" });
  const dias = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return d => { const o = {}; for (const p of f.formatToParts(d)) o[p.type] = p.value; return { ano: +o.year, mes: +o.month, dia: +o.day, h: +o.hour, min: +o.minute, sem: dias[o.weekday] }; };
})();
const textoLimpo = (t, max = 280) => {
  const ent = { nbsp: " ", amp: "&", quot: '"', apos: "'", lt: "<", gt: ">" };
  const s = String(t || "").replace(/<br\s*\/?>/gi, " ").replace(/<[^>]+>/g, "")
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, c) => c[0] === "#" ? String.fromCodePoint(c[1].toLowerCase() === "x" ? parseInt(c.slice(2), 16) : +c.slice(1)) : (ent[c.toLowerCase()] ?? m))
    .replace(/\s+/g, " ").trim();
  return s.length > max ? s.slice(0, s.lastIndexOf(" ", max)).replace(/[,.;:]$/, "") + "…" : s;
};

async function lerGoogleAgenda(id) {
  if (!id) return [];
  let ics;
  try {
    if (process.env.AGENDA_ICS_ARQUIVO) ics = readFileSync(process.env.AGENDA_ICS_ARQUIVO, "utf8");   // para testes
    else {
      const url = `https://calendar.google.com/calendar/ical/${encodeURIComponent(id)}/public/basic.ics`;
      const r = await fetch(url, { signal: AbortSignal.timeout(20000) });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      ics = await r.text();
    }
  } catch (e) {
    console.warn(`Aviso: não foi possível ler o Google Agenda (${e.message}). A seção Agenda mostra só o link para a agenda.`);
    return null;
  }
  const comp = new ICAL.Component(ICAL.parse(ics));
  for (const tz of comp.getAllSubcomponents("vtimezone")) ICAL.TimezoneService.register(new ICAL.Timezone(tz));
  const agora = new Date(), limite = new Date(agora.getTime() + JANELA_DIAS * 864e5);
  const bases = new Map(), soltos = [];
  const vevents = comp.getAllSubcomponents("vevent");
  for (const v of vevents) if (!v.hasProperty("recurrence-id")) bases.set(v.getFirstPropertyValue("uid"), new ICAL.Event(v));
  for (const v of vevents) if (v.hasProperty("recurrence-id")) {
    const base = bases.get(v.getFirstPropertyValue("uid"));
    if (base) base.relateException(v); else soltos.push(new ICAL.Event(v));
  }
  const cancelado = ev => String(ev.component.getFirstPropertyValue("status") || "").toUpperCase() === "CANCELLED";
  const saida = [];
  const incluir = (item, inicio, fim) => {
    if (cancelado(item)) return;
    const ini = inicio.toJSDate(), f = (fim || inicio).toJSDate();
    if (f < agora || ini > limite) return;
    const diaInteiro = inicio.isDate;
    saida.push({
      inicio: diaInteiro ? { ano: inicio.year, mes: inicio.month, dia: inicio.day } : partes(ini),
      fim: diaInteiro ? (() => { const t = (fim || inicio).clone(); if (fim) t.adjust(-1, 0, 0, 0); return { ano: t.year, mes: t.month, dia: t.day }; })() : partes(f),
      diaInteiro, ordem: ini.getTime(), termina: f.getTime(),
      titulo: item.summary || "", local: item.location || "", descricao: textoLimpo(item.description),
    });
  };
  for (const ev of [...bases.values(), ...soltos]) {
    if (ev.isRecurring() && !ev.isRecurrenceException()) {
      const it = ev.iterator();
      let t, n = 0;
      while ((t = it.next()) && n++ < 2000) {
        const det = ev.getOccurrenceDetails(t);
        if (det.startDate.toJSDate() > limite) break;
        incluir(det.item, det.startDate, det.endDate);
      }
    } else incluir(ev, ev.startDate, ev.endDate);
  }
  return saida.sort((a, b) => a.ordem - b.ordem);
}

const idAgendaGoogle = idGoogleAgenda(agenda.google_calendar_id);
const eventosGoogle = await lerGoogleAgenda(idAgendaGoogle);

const DIAS_SEMANA = {
  pt: ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"],
  en: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
};
const hora = (p, L) => L.id === "pt" ? `${p.h}h${p.min ? String(p.min).padStart(2, "0") : ""}` : `${String(p.h).padStart(2, "0")}:${String(p.min).padStart(2, "0")}`;
const mesmoDia = (a, b) => a.ano === b.ano && a.mes === b.mes && a.dia === b.dia;

function linhaAgenda(e, L) {
  const M = L.meses, i = e.inicio, f = e.fim;
  const multi = !mesmoDia(i, f);
  const grande = !multi ? `${String(i.dia).padStart(2, "0")} ${M[i.mes - 1]}`
    : i.mes === f.mes ? `${String(i.dia).padStart(2, "0")}–${String(f.dia).padStart(2, "0")} ${M[i.mes - 1]}`
    : `${String(i.dia).padStart(2, "0")} ${M[i.mes - 1]}–${String(f.dia).padStart(2, "0")} ${M[f.mes - 1]}`;
  const sem = DIAS_SEMANA[L.id][new Date(Date.UTC(i.ano, i.mes - 1, i.dia)).getUTCDay()];
  const quando = [i.ano !== partes(new Date()).ano ? String(i.ano) : "", multi ? "" : sem,
    e.diaInteiro ? "" : (e.hora || `${hora(i, L)}–${hora(f, L)}`)].filter(Boolean).join(", ");
  return `<div class="linha proximo" data-fim="${e.termina}">
        <div class="cel c1 dt">${grande}<small>${esc(quando)}</small></div>
        <div class="cel c2-4"><h3>${esc(e.titulo)}</h3>${e.local ? `<p><span class="campo">${L.rotuloLocal}</span> ${esc(e.local)}</p>` : ""}${e.descricao ? `<p><span class="campo">${L.rotuloObs}</span> ${esc(e.descricao)}</p>` : ""}</div>
      </div>`;
}

function secaoAgenda(L) {
  const id = L.secoes[4];
  // Atividades digitadas no painel (opcional) somam-se às do Google Agenda.
  const manuais = (agenda.atividades || []).map(e => {
    const d = dt(e.data); if (!d) return null;
    const p = { ano: d.getFullYear(), mes: d.getMonth() + 1, dia: d.getDate() };
    return { inicio: p, fim: p, diaInteiro: !e.hora, hora: e.hora || "", ordem: d.getTime(), termina: d.getTime() + 864e5,
      titulo: tr(e, "titulo", L), local: tr(e, "local", L), descricao: tr(e, "descricao", L) };
  }).filter(e => e && e.termina >= HOJE.getTime());
  const lista = [...(eventosGoogle || []), ...manuais].sort((a, b) => a.ordem - b.ordem).slice(0, MAX_EVENTOS);
  // Cada linha leva o horário de término em data-fim: um script pequeno no fim da página
  // esconde o que já passou entre uma atualização e outra.
  const itens = lista.map(e => linhaAgenda(e, L)).join("\n      ");
  const assinar = idAgendaGoogle ? `<div class="linha"><div class="c1"></div><div class="cel c2-4 assinar">
        <span class="rotulo cinza">${L.assinarRotulo}</span>
        <div class="icones">${linkIcone(`https://calendar.google.com/calendar/u/0?cid=${encodeURIComponent(Buffer.from(idAgendaGoogle).toString("base64").replace(/=+$/, ""))}`, "googlecalendar", L.assinarGoogle, L)}${linkIcone(`https://calendar.google.com/calendar/ical/${encodeURIComponent(idAgendaGoogle)}/public/basic.ics`, "calendario", L.assinarIcs, L, false)}</div>
      </div></div>` : "";
  const texto = eventosGoogle === null ? L.agendaFalhou : L.vazioTexto;
  const vazio = `<div class="linha agenda-vazia"${lista.length ? " hidden" : ""}><div class="c1"></div><div class="cel c2-3 bloco vazio">
        <h3>${L.vazioTitulo}</h3>
        <div><p>${texto}</p>
        <a class="acao" href="mailto:${esc(site.email)}?subject=${encodeURIComponent(L.vazioAssunto)}">${L.vazioAcao}</a></div></div></div>`;
  return `<section id="${id}" aria-labelledby="t-${id}">
    <div class="g">
      ${cabecalhoSecao("05", id, id)}
      ${itens}
      ${vazio}
      ${assinar}
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
    <div class="cel c2-3 pequeno cinza creditos" style="align-self:end"><div class="parceiros"><img src="${asset(L, "assets/logo-unida.svg")}" alt="Faculdade Unida de Vitória" width="47" height="40" loading="lazy"><img src="${asset(L, "assets/logo-cnpq.svg")}" alt="CNPq" width="104" height="32" loading="lazy"></div><p>${L.rodape}</p><p>${L.direitos}</p></div>
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
    memberOf: { "@type": "EducationalOrganization", name: "Programa de Pós-Graduação Profissional em Ciências das Religiões (PPGP Ciências das Religiões)", parentOrganization: { "@type": "CollegeOrUniversity", name: "Faculdade Unida de Vitória" } },
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

  /* Agenda: esconde o que já terminou desde a última atualização do site. */
  var agora = Date.now();
  var itens = document.querySelectorAll(".proximo[data-fim]"), restantes = 0;
  for (var i = 0; i < itens.length; i++) {
    if (Number(itens[i].getAttribute("data-fim")) < agora) itens[i].hidden = true; else restantes++;
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
<link rel="stylesheet" href="${asset(L, "assets/estilo.css")}?v=${VERSAO_CSS}">
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
// Data da última alteração registrada no repositório (cai para hoje se o git não estiver disponível).
const ULTIMA_ALTERACAO = (() => { try { return execSync("git log -1 --format=%cs", { cwd: RAIZ, stdio: ["ignore", "pipe", "ignore"] }).toString().trim() || iso(HOJE); } catch { return iso(HOJE); } })();
rmSync(SAIDA, { recursive: true, force: true });
mkdirSync(join(SAIDA, "en"), { recursive: true });
cpSync(join(RAIZ, "assets"), join(SAIDA, "assets"), { recursive: true });
// Arquivos fixos da raiz, mais os de verificação de buscadores (Google Search Console,
// Bing, Yandex): basta enviá-los para a raiz do repositório que eles vão para o site.
const VERIFICACAO = /^(google[0-9a-z]+\.html|BingSiteAuth\.xml|yandex_[0-9a-z]+\.html)$/i;
for (const arquivo of ["404.html", "robots.txt", "CNAME", ...readdirSync(RAIZ).filter(f => VERIFICACAO.test(f))]) {
  if (existsSync(join(RAIZ, arquivo))) cpSync(join(RAIZ, arquivo), join(SAIDA, arquivo));
}
writeFileSync(join(SAIDA, "index.html"), pagina(IDIOMAS.pt));
writeFileSync(join(SAIDA, "en", "index.html"), pagina(IDIOMAS.en));
writeFileSync(join(SAIDA, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${["", "en/"].map(p => `  <url>
    <loc>${DOMINIO}/${p}</loc>
    <lastmod>${ULTIMA_ALTERACAO}</lastmod>
    <xhtml:link rel="alternate" hreflang="pt-BR" href="${DOMINIO}/"/>
    <xhtml:link rel="alternate" hreflang="en" href="${DOMINIO}/en/"/>
  </url>`).join("\n")}
</urlset>
`);
console.log(`Site gerado em _site/ (${membros.length} membros, ${eventos.length} eventos, ${(agenda.atividades || []).length} atividades na agenda).`);
