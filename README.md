# Дыхание Воды — сайт фракции

Сайт фракции **Дыхание Воды** в стиле добра + воды, сделан на основе [bloodpact-site](https://github.com/DeusOfSanguis/bloodpact-site).

**Домен:** https://water-breath-yufu.ru/ (настраивается, аналог bloodpact.su)

Хостинг — **GitHub Pages**: публикуется корень ветки `main`, домен `water-breath-yufu.ru` через файл `CNAME`.

---

## Тема — светлая вода + тёмный океан

Сделано 2 темы с переключателем в шапке (☾/☀), сохраняется в `localStorage`:

- **Светлая (по умолчанию, добро):** `#f4f9fd` фон, белые карточки, синий акцент `#1e8cb8`, тёмный текст `#10202e` — чистота, поместье Бабочки
- **Тёмная (ночной океан):** `#050c18` фон, `#0a1a2a` карточки, `#3ab4e0` свечение, светлый текст `#e0f0f8` — кинематографичность как у bloodpact, но вода

Цвета — в `:root` в `content/theme.css`, иероглиф раздела — 水 вместо 血.

Обложки: `assets/img/water-moon.jpg` (ночь, луна над водой), `water-surface.jpg` (дневная вода), `butterfly-estate.jpg` (сад поместья) — без людей, только места.

---

## Правки без кода (админка)

Страница [`/admin/`](https://water-breath-yufu.ru/admin/) — вход по GitHub Personal Access Token (Fine-grained → только `DeusOfSanguis/water-breath-site` → Contents: Read and write).

| Вкладка | Что правит | Файл |
|---|---|---|
| **Состав** | Группы и участники дыхания воды | `content/data/roster.json` |
| **Ката** | 10 форм воды, гифки/видео, описание | `content/data/kata.json` |
| **Повышения** | Требования для истребителей и инструкторов/цугуко | `content/data/promotions.json` |
| **Рейтинг** | Чемпион и таблица | `content/data/ranking.json` |
| **Цитаты** | Бегущая строка, подвал, 404 | `content/pages.json` → `quotes` |
| **Файлы** | Любые тексты страниц | `content/*.html`, `content/data/*.json` |

После «Сохранить» GitHub Actions пересобирает сайт.

---

## Как править тексты

В админке `/admin/` или руками в `content/`:

```bash
python3 build.py
git add -A && git commit -m "Правки" && git push origin main
```

Заголовки, картинки обложек, цитаты, порядок меню и домен — в `content/pages.json`.

Локально: `python3 -m http.server 8000` → http://localhost:8000/

---

## Что в репозитории

```
content/                исходники — править только тут
  pages.json              список страниц, заголовки, обложки, цитаты, домен
  data/
    roster.json           состав воды (группы + участники)
    kata.json             10 форм (id, название, jp, описание, gif/mp4)
    promotions.json       повышения (fighters + instructors)
    ranking.json          чемпион и места
  index.html              главная: 01 вода, 02 определения, 03 ранги, 04 путь, 05 иерархия, 06 ката, 07 состав
  law.html, codex.html…   остальные страницы
  theme.css               оформление — 2 темы (светлая + тёмная вода)
  app.js                  скрипты + переключатель темы
admin/                  админка (GitHub token)
.github/workflows/      автосборка при правках content/
build.py                сборка (Python 3, без зависимостей)
index.html, law/, …     ГОТОВЫЙ САЙТ в корне (генерируется)
assets/style.css        стили (генерируются из content/theme.css)
assets/app.js           скрипты (генерируются из content/app.js)
assets/img/             обложки (water-moon, water-surface, butterfly-estate)
assets/kata/            место для конвертнутых mp4/webm ката (пока пусто, гифки в docs/original/kata-gifs/ и игнорируются)
docs/original/          оригинальные txt и гифки из старой базы (не публикуются на сайте, гифки в .gitignore)
CNAME                   домен water-breath-yufu.ru
.nojekyll               отключает Jekyll
```

Страницы:

| Страница | Путь | Источник |
|---|---|---|
| Главная | `/` | новая |
| Устав | `/law/` | УСТАВ ОРГАНИЗАЦИИ.txt |
| Кодекс | `/codex/` | https://waterbreathingyufu.tilda.ws/codex + 7 правил |
| Повышения | `/elevation/` | Повышение истребителей + инструкторцугуко |
| Ката | `/kata/` | 10 гиф форм (место под mp4) |
| Поместье Кочо | `/butterfly/` | Правила Поместья Кочо.txt |
| Рейтинг | `/ranking/` | топ истребителей |

---

## Гифки ката

Оригинальные 10 гиф — 40 МБ, лежат в `docs/original/kata-gifs/` и игнорируются `.gitignore` чтобы не грузить GitHub Pages.

**Нужно конвертнуть:**

```bash
ffmpeg -i "1 ката.gif" -movflags faststart -pix_fmt yuv420p -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" assets/kata/01-kata.mp4
ffmpeg -i "1 ката.gif" -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" -c:v libvpx-vp9 -b:v 0 -crf 30 assets/kata/01-kata.webm
```

Потом в `content/data/kata.json` указать `assets/kata/01-kata.mp4`. В `kata.html` уже есть поддержка `<video autoplay loop muted>` через `{{kata}}`.

Если пока нет конвертнутых — на сайте показывается заглушка «Место для гифки — скоро».

---

## Домен water-breath-yufu.ru

Как у bloodpact.su:

DNS у регистратора:

| Тип | Имя | Значение |
|---|---|---|
| A | `@` | `185.199.108.153` |
| A | `@` | `185.199.109.153` |
| A | `@` | `185.199.110.153` |
| A | `@` | `185.199.111.153` |
| CNAME | `www` | `deusofsanguis.github.io` |

Домен продублирован в `content/pages.json → site.domain`, сборка сама создаёт `CNAME`.

**Быстрый откат:** удалить `CNAME` и очистить Custom domain в Settings → Pages → сайт вернётся на `deusofsanguis.github.io/water-breath-site/`.

---

## Отличия от bloodpact-site

- Палитра: вместо кроваво-красного `#d3132a` — водный синий `#1e8cb8` / `#3ab4e0`
- Фон: светлый `#f4f9fd` по умолчанию + тёмный океан `#050c18` переключателем
- Иероглифы: 血 → 水, 法, 律, 型, 蝶, 位
- Герой: «Стань как вода» + «течение не остановить» вместо «Возгордись своей расой»
- Цитаты: Томиока Гию и Урокодаки вместо Лун и Мудзана
- Контент: устав истребителей, кодекс воды, ката, поместье Бабочки
- Админка: 5 вкладок (состав, ката, повышения, рейтинг, цитаты) вместо 3
- Гифки ката — место под mp4/webm с lazy load
