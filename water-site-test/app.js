'use strict';

const FILES = {
  fighters: 'Повышение истребителей.txt',
  instructors: 'Повышение инструкторцугуко.txt',
  charter: 'УСТАВ ОРГАНИЗАЦИИ.txt',
  estate: 'Правила Поместья Кочо.txt'
};

const MAIN_PANELS = ['codex', 'promotion', 'kata', 'regulations'];

const CODEX = {
  preface: 'Соблюдение данного кодекса — один из шагов к становлению сильным мечником.',
  principles: [
    'Уважай других! Это основа каждого бойца.',
    'Для решения проблем делай то что нужно, всегда можно пойти на жертвы ради большего.',
    'Не подавай виду эмоциям во время боя. Неважно что у тебя на душе, страх, злость, горе, боль или тому подобное. Когда эмоции берут верх - мышление притупляется.',
    'Оказавшись в трудной ситуации, всегда ищи способ выбраться из неё. Также, как вода ищет куда просочиться.',
    'Не подводи своё дыхание, иначе ты подведёшь всех своих товарищей',
    'Никогда не говори гадостей за спинами своих товарищей.',
    'Имей цель, без этого прогресса не будет.'
  ],
  reminders: [
    'Боевой товарищ всегда лучше, чем самая лучшая катана.',
    'Нарушение кодекса порицается, но не ведёт к ограничениям.',
    'Кодекс нужен людям, чтобы помогать другим людям.'
  ]
};

function makeElement(tagName, className, text) {
  const node = document.createElement(tagName);
  if (className) node.className = className;
  if (text !== undefined && text !== null) node.textContent = text;
  return node;
}

function makeChevron(className) {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 20 20');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('class', className);
  const path = document.createElementNS(ns, 'path');
  path.setAttribute('d', 'm5 7.5 5 5 5-5');
  path.setAttribute('stroke', 'currentColor');
  path.setAttribute('stroke-width', '1.5');
  path.setAttribute('stroke-linecap', 'round');
  path.setAttribute('stroke-linejoin', 'round');
  svg.append(path);
  return svg;
}

function animateItems(container, selector, className = 'reveal-item') {
  if (!container) return;
  const items = [...container.querySelectorAll(selector)];
  items.forEach((item) => {
    item.classList.remove(className);
    item.style.removeProperty('--reveal-delay');
  });
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  void container.offsetWidth;
  items.forEach((item, index) => {
    item.style.setProperty('--reveal-delay', `${Math.min(index, 9) * 55}ms`);
    item.classList.add(className);
  });
}

function animateRankPane(pane) {
  if (!pane) return;
  const cards = [...pane.querySelectorAll('.rank-card')];
  pane.classList.remove('route-enter');
  cards.forEach((card) => {
    card.classList.remove('rank-enter');
    card.style.removeProperty('--rank-delay');
  });
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  void pane.offsetWidth;
  pane.classList.add('route-enter');
  cards.forEach((card, index) => {
    card.style.setProperty('--rank-delay', `${Math.min(index, 8) * 48}ms`);
    card.classList.add('rank-enter');
  });
}

function animateDocumentPanel(documentName) {
  const panel = document.querySelector(`[data-document-panel="${documentName}"]`);
  if (!panel) return;
  panel.classList.remove('document-enter');
  void panel.offsetWidth;
  panel.classList.add('document-enter');
  animateItems(panel, documentName === 'charter' ? '.chapter-card' : '.rule-card');
}

function animateMainPanel(panelName) {
  const panel = document.querySelector(`[data-main-panel="${panelName}"]`);
  if (!panel) return;
  panel.classList.remove('main-panel-enter');
  void panel.offsetWidth;
  panel.classList.add('main-panel-enter');

  window.requestAnimationFrame(() => {
    if (panelName === 'codex') {
      animateItems(document.getElementById('principlesGrid'), '.principle-card');
    } else if (panelName === 'promotion') {
      animateRankPane(document.querySelector('[data-route-pane]:not([hidden])'));
    } else if (panelName === 'kata') {
      animateItems(document.getElementById('kataGrid'), '.kata-card');
    } else if (panelName === 'regulations') {
      const activeDocument = document.querySelector('[data-document-panel]:not([hidden])');
      if (activeDocument) {
        const documentName = activeDocument.dataset.documentPanel;
        animateDocumentPanel(documentName);
      }
    }
  });
}

function renderCodex() {
  document.getElementById('codexPreface').textContent = CODEX.preface;
  const grid = document.getElementById('principlesGrid');
  const reminders = document.getElementById('codexReminders');

  CODEX.principles.forEach((text, index) => {
    const number = String(index + 1).padStart(2, '0');
    const card = makeElement('article', 'principle-card');
    card.id = `principle-${index + 1}`;
    card.append(
      makeElement('span', 'principle-number', `ПУНКТ ${number}`),
      makeElement('p', 'principle-text', text)
    );
    grid.append(card);
  });

  CODEX.reminders.forEach((text) => reminders.append(makeElement('p', 'reminder-item', text)));
}

function parsePromotion(rawText) {
  const lines = rawText.replace(/^\uFEFF/, '').split(/\r?\n/);
  const title = lines.find((line) => line.trim())?.trim() || '';
  const records = [];
  let current = null;

  for (const sourceLine of lines) {
    const line = sourceLine.trim();
    if (!line) continue;
    const heading = line.match(/^С\s+(.+?)\s+на\s+(.+?)\.?$/u);
    if (heading) {
      current = { from: heading[1].trim(), to: heading[2].trim(), items: [] };
      records.push(current);
      continue;
    }
    if (current) current.items.push(line.replace(/^\d+\.\s*/, '').trim());
  }
  return { title, records };
}

function taskCountLabel(count) {
  const mod100 = count % 100;
  if (mod100 >= 11 && mod100 <= 14) return `${count} заданий`;
  const mod10 = count % 10;
  if (mod10 === 1) return `${count} задание`;
  if (mod10 >= 2 && mod10 <= 4) return `${count} задания`;
  return `${count} заданий`;
}

function renderPromotion(rawText, route, listId, titleId) {
  const data = parsePromotion(rawText);
  const list = document.getElementById(listId);
  const sourceTitle = document.getElementById(titleId);
  sourceTitle.textContent = data.title;
  list.replaceChildren();

  if (!data.records.length) {
    list.append(makeElement('p', 'route-error', 'В документе не удалось найти список ступеней.'));
    return;
  }

  data.records.forEach((record, index) => {
    const number = String(index + 1).padStart(2, '0');
    const details = makeElement('details', 'rank-card');
    details.id = `${route}-rank-${index + 1}`;
    if (index === 0) details.open = true;

    const summary = document.createElement('summary');
    const step = makeElement('span', 'rank-step', number);
    const transition = makeElement('span', 'rank-transition');
    transition.append(document.createTextNode(`С ${record.from} `));
    const arrow = makeElement('span', '', '→');
    arrow.setAttribute('aria-hidden', 'true');
    transition.append(arrow, document.createTextNode(` ${record.to}`));
    const count = makeElement('span', 'rank-count', taskCountLabel(record.items.length));
    summary.append(step, transition, count, makeChevron('rank-toggle'));

    const listItems = document.createElement('ol');
    listItems.className = 'rank-list';
    record.items.forEach((text) => listItems.append(makeElement('li', '', text)));
    details.append(summary, listItems);
    list.append(details);
  });

  const pane = document.querySelector(`[data-route-pane="${route}"]`);
  if (pane && !pane.hidden) window.requestAnimationFrame(() => animateRankPane(pane));
}

function parseCharter(rawText) {
  const lines = rawText.replace(/^\uFEFF/, '').split(/\r?\n/).map((line) => line.trim());
  const firstContentIndex = lines.findIndex(Boolean);
  const chapterStart = lines.findIndex((line, index) => index > firstContentIndex && /^Глава\s+(?:\d+|[IVXLCDM]+)\./u.test(line));
  const title = firstContentIndex >= 0 ? lines[firstContentIndex] : '';
  const introduction = lines.slice(firstContentIndex + 1, chapterStart).filter(Boolean);
  const chapters = [];
  let current = null;

  for (const line of lines.slice(chapterStart >= 0 ? chapterStart : lines.length)) {
    if (!line) continue;
    const heading = line.match(/^Глава\s+(\d+|[IVXLCDM]+)\.\s*(.*)$/u);
    if (heading) {
      current = { number: heading[1].trim(), title: heading[2].trim(), lines: [] };
      chapters.push(current);
    } else if (current) {
      current.lines.push(line);
    }
  }
  return { title, introduction, chapters };
}

function makeDocumentLine(line) {
  const paragraph = makeElement('p', 'document-line');
  if (/^(Исключение|Примечания):?/u.test(line)) paragraph.classList.add('is-note');
  if (/^[^\d].{0,100}:$/u.test(line)) paragraph.classList.add('is-subheading');
  const clause = line.match(/^(\d+(?:\.\d+)*\.)\s*(.*)$/u);
  if (clause) {
    paragraph.classList.add('is-clause');
    paragraph.append(makeElement('span', 'clause-number', clause[1]), makeElement('span', '', clause[2]));
  } else {
    paragraph.textContent = line;
  }
  return paragraph;
}

function renderCharter(rawText) {
  const data = parseCharter(rawText);
  const intro = document.getElementById('charterIntro');
  const chaptersContainer = document.getElementById('charterChapters');
  intro.replaceChildren();
  chaptersContainer.replaceChildren();

  intro.append(makeElement('h3', 'charter-document-title', data.title));
  data.introduction.forEach((text) => intro.append(makeElement('p', '', text)));

  data.chapters.forEach((chapter, index) => {
    const details = makeElement('details', 'chapter-card');
    details.id = `charter-chapter-${index + 1}`;
    if (index === 0) details.open = true;

    const summary = document.createElement('summary');
    summary.append(
      makeElement('span', 'chapter-index', `Глава ${chapter.number}`),
      makeElement('span', 'chapter-title', chapter.title),
      makeChevron('accordion-chevron')
    );
    const body = makeElement('div', 'charter-lines');
    chapter.lines.forEach((line) => body.append(makeDocumentLine(line)));
    details.append(summary, body);
    chaptersContainer.append(details);
  });
}

function parseEstate(rawText) {
  const lines = rawText.replace(/^\uFEFF/, '').split(/\r?\n/).map((line) => line.trim());
  const title = lines.find((line) => line && !/^[—–-]+$/u.test(line)) || '';
  const rules = [];
  let current = null;

  for (const line of lines) {
    if (!line || /^[—–-]+$/u.test(line)) continue;
    const numbered = line.match(/^(\d+)\.\s*(.*)$/u);
    if (numbered) {
      current = { number: Number(numbered[1]), lines: [numbered[2].trim()] };
      rules.push(current);
    } else if (current) {
      current.lines.push(line);
    }
  }
  return { title, rules };
}

function truncate(text, maxLength) {
  const clean = text.replace(/\s+/gu, ' ').trim();
  if (clean.length <= maxLength) return clean;
  return `${clean.slice(0, maxLength - 1).trimEnd()}…`;
}

function renderEstate(rawText) {
  const data = parseEstate(rawText);
  const intro = document.getElementById('estateIntro');
  const rulesContainer = document.getElementById('estateRules');
  intro.replaceChildren(makeElement('h3', 'estate-document-title', data.title));
  rulesContainer.replaceChildren();

  if (!data.rules.length) {
    rulesContainer.append(makeElement('p', 'route-error', 'В документе не удалось найти правила.'));
    return;
  }

  data.rules.forEach((rule, index) => {
    const number = String(rule.number).padStart(2, '0');
    const details = makeElement('details', 'rule-card');
    details.id = `estate-rule-${rule.number}`;
    if (index === 0) details.open = true;

    const summary = document.createElement('summary');
    summary.append(
      makeElement('span', 'rule-number', number),
      makeElement('span', 'rule-summary-title', truncate(rule.lines[0] || `Правило ${number}`, 94)),
      makeChevron('accordion-chevron')
    );

    const body = makeElement('div', 'rule-body');
    rule.lines.forEach((line) => {
      const paragraph = makeElement('p', 'rule-line', line);
      if (/^Исключение:?/u.test(line)) paragraph.classList.add('is-exception');
      if (/^Примечания:?/u.test(line)) paragraph.classList.add('is-notes');
      if (/^\[Наказание:/u.test(line)) paragraph.classList.add('is-sanction');
      body.append(paragraph);
    });
    details.append(summary, body);
    rulesContainer.append(details);
  });
}

function playKataVideo(video) {
  if (!video.paused) return;
  video.muted = true;
  const playback = video.play();
  if (playback && typeof playback.catch === 'function') playback.catch(() => {});
}

function pauseKataVideos() {
  document.querySelectorAll('#kataGrid video').forEach((video) => video.pause());
}

function syncKataPlayback() {
  const panel = document.querySelector('[data-main-panel="kata"]');
  const canPlay = panel && !panel.hidden && !document.hidden;
  document.querySelectorAll('#kataGrid video').forEach((video) => {
    const rect = video.getBoundingClientRect();
    const visibleHeight = Math.max(0, Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0));
    const visibleRatio = rect.height ? visibleHeight / rect.height : 0;
    if (canPlay && visibleRatio >= 0.2) playKataVideo(video);
    else video.pause();
  });
}

function setupKataPlayback() {
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      const panel = document.querySelector('[data-main-panel="kata"]');
      const canPlay = panel && !panel.hidden && !document.hidden;
      entries.forEach((entry) => {
        const video = entry.target.querySelector('video');
        if (canPlay && entry.isIntersecting && entry.intersectionRatio >= 0.2) playKataVideo(video);
        else video.pause();
      });
    }, { threshold: [0, 0.2, 0.5], rootMargin: '0px 0px -60px 0px' });
    document.querySelectorAll('.kata-card').forEach((card) => observer.observe(card));
  } else {
    window.addEventListener('scroll', syncKataPlayback, { passive: true });
    window.addEventListener('resize', syncKataPlayback);
  }
  document.addEventListener('visibilitychange', syncKataPlayback);
}

function renderKata() {
  const grid = document.getElementById('kataGrid');
  for (let number = 1; number <= 10; number += 1) {
    const label = String(number).padStart(2, '0');
    const card = makeElement('article', 'kata-card');
    card.id = `kata-${number}`;

    const head = makeElement('div', 'kata-card-head');
    head.append(makeElement('span', 'kata-number', `Ката ${label}`));

    const stage = makeElement('div', 'video-stage');
    const video = document.createElement('video');
    video.controls = false;
    video.preload = 'none';
    video.playsInline = true;
    video.muted = true;
    video.loop = true;
    video.poster = './kata-poster.svg';
    video.setAttribute('aria-label', `Ката ${number}, видео без звука`);
    video.src = encodeURI(`./анимации кат/${number} ката.webm`);

    stage.append(video);
    card.append(head, stage);
    grid.append(card);
  }
}

function selectMainTab(panelName, shouldScroll = false) {
  document.querySelectorAll('[data-main-tab]').forEach((button) => {
    const active = button.dataset.mainTab === panelName;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-selected', String(active));
  });
  document.querySelectorAll('[data-main-panel]').forEach((panel) => {
    panel.hidden = panel.dataset.mainPanel !== panelName;
  });
  animateMainPanel(panelName);
  if (panelName === 'kata') window.requestAnimationFrame(syncKataPlayback);
  else pauseKataVideos();
  if (shouldScroll) {
    const panel = document.querySelector(`[data-main-panel="${panelName}"]`);
    if (panel) window.requestAnimationFrame(() => panel.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }
}

function selectRoute(route) {
  document.querySelectorAll('[data-route-tab]').forEach((button) => {
    const active = button.dataset.routeTab === route;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-selected', String(active));
  });
  document.querySelectorAll('[data-route-pane]').forEach((pane) => {
    const active = pane.dataset.routePane === route;
    pane.hidden = !active;
    pane.classList.toggle('is-active', active);
    if (active) window.requestAnimationFrame(() => animateRankPane(pane));
  });
}

function selectDocument(documentName) {
  document.querySelectorAll('[data-document-tab]').forEach((button) => {
    const active = button.dataset.documentTab === documentName;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-selected', String(active));
  });
  document.querySelectorAll('[data-document-panel]').forEach((panel) => {
    const active = panel.dataset.documentPanel === documentName;
    panel.hidden = !active;
    panel.classList.toggle('is-active', active);
  });
  const expandButton = document.getElementById('expandDocs');
  expandButton.textContent = 'Развернуть все';
  expandButton.setAttribute('aria-pressed', 'false');
  window.requestAnimationFrame(() => animateDocumentPanel(documentName));
}

function setupMainTabs() {
  document.querySelectorAll('[data-main-tab]').forEach((button) => {
    button.addEventListener('click', () => selectMainTab(button.dataset.mainTab, true));
  });
  document.querySelectorAll('[data-open-main-tab]').forEach((link) => {
    link.addEventListener('click', () => selectMainTab(link.dataset.openMainTab));
  });
}

function setupTabs() {
  document.querySelectorAll('[data-route-tab]').forEach((button) => {
    button.addEventListener('click', () => selectRoute(button.dataset.routeTab));
  });
  document.querySelectorAll('[data-document-tab]').forEach((button) => {
    button.addEventListener('click', () => selectDocument(button.dataset.documentTab));
  });

  document.getElementById('expandDocs').addEventListener('click', (event) => {
    const activePanel = document.querySelector('[data-document-panel]:not([hidden])');
    const accordions = [...activePanel.querySelectorAll('details')];
    const shouldExpand = accordions.some((item) => !item.open);
    accordions.forEach((item) => { item.open = shouldExpand; });
    event.currentTarget.textContent = shouldExpand ? 'Свернуть все' : 'Развернуть все';
    event.currentTarget.setAttribute('aria-pressed', String(shouldExpand));
  });
}

function setupMobileNav() {
  const toggle = document.getElementById('navToggle');
  const nav = document.getElementById('siteNav');
  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    nav.classList.toggle('is-open', open);
  });
  nav.querySelectorAll('[data-main-tab]').forEach((button) => {
    button.addEventListener('click', () => {
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Открыть меню');
      nav.classList.remove('is-open');
    });
  });
}

async function loadTextFile(fileName) {
  const response = await fetch(`./${encodeURIComponent(fileName)}`);
  if (!response.ok) throw new Error(`Не удалось загрузить ${fileName}: ${response.status}`);
  return response.text();
}

function showLoadError(elementId, message) {
  const element = document.getElementById(elementId);
  if (element) element.replaceChildren(makeElement('p', 'route-error', message));
}

async function init() {
  renderCodex();
  renderKata();
  setupKataPlayback();
  setupMainTabs();
  setupTabs();
  setupMobileNav();

  const requestedPanel = window.location.hash.slice(1);
  selectMainTab(MAIN_PANELS.includes(requestedPanel) ? requestedPanel : 'codex');

  const jobs = [
    loadTextFile(FILES.fighters)
      .then((text) => renderPromotion(text, 'fighters', 'fighterRanks', 'fightersSourceTitle'))
      .catch(() => showLoadError('fighterRanks', 'Не удалось загрузить файл с повышением истребителей.')),
    loadTextFile(FILES.instructors)
      .then((text) => renderPromotion(text, 'instructors', 'instructorRanks', 'instructorsSourceTitle'))
      .catch(() => showLoadError('instructorRanks', 'Не удалось загрузить файл с повышением инструкторов и цугуко.')),
    loadTextFile(FILES.charter)
      .then(renderCharter)
      .catch(() => showLoadError('charterIntro', 'Не удалось загрузить Устав организации.')),
    loadTextFile(FILES.estate)
      .then(renderEstate)
      .catch(() => showLoadError('estateIntro', 'Не удалось загрузить правила Поместья Бабочки.'))
  ];
  await Promise.all(jobs);
}

init();
