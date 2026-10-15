#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Сборка сайта «Дыхание Воды — корпус истребителей» из папки content/.
Адаптировано с bloodpact-site: одна тёмная тема воды — фракция истребителей.

Результат (GitHub Pages публикует КОРЕНЬ ветки main):
  ./                 — сайт: index.html, law/, codex/, kata/, …
  ./embed/           — те же страницы без меню
  google-sites/      — сниппеты

Запуск: python3 build.py
"""
import argparse
import html
import json
import os
import re
import shutil

ROOT = os.path.dirname(os.path.abspath(__file__))
CONTENT = os.path.join(ROOT, "content")
SITE = ROOT
EMBED = os.path.join(SITE, "embed")
GS = os.path.join(ROOT, "google-sites")
IMG_DIR = os.path.join(SITE, "assets", "img")

FAVICON = (
    "data:image/svg+xml,"
    "%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E"
    "%3Ctext y='.9em' font-size='90'%3E%F0%9F%92%A7%3C/text%3E%3C/svg%3E"
)

CURSOR_HTML = (
    '<div class="wcur" data-cursor aria-hidden="true">'
    '<span class="wcur__glow"></span>'
    '<span class="wcur__ring"></span>'
    '<span class="wcur__dot"></span>'
    '<span class="wcur__fx" data-cursor-fx></span>'
    "</div>"
)

FONTS_URL = (
    "https://fonts.googleapis.com/css2?"
    "family=Unbounded:wght@300;400;600;800;900"
    "&family=Cormorant:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600"
    "&family=Manrope:wght@300;400;500;600;700;800"
    "&display=swap"
)

MARQUEE_QUOTES = [
    {"text": "Вода принимает любую форму. Стань как вода.", "author": "Томиока Гию · Столп Воды"},
    {"text": "Не позволяй другим решать, почему ты не можешь простить себя.", "author": "Томиока Гию · Столп Воды"},
    {"text": "Стань сильнее, пока не сможешь защитить то, что дорого.", "author": "Томиока Гию · Столп Воды"},
]

SIGIL = {
    "index": "水",
    "law": "法",
    "codex": "律",
    "elevation": "昇",
    "kata": "型",
    "butterfly": "蝶",
    "ranking": "位",
    "squads": "隊",
    "roster": "隊",
}

SPINE = [
    ("faction", "01", "Вода"),
    ("codex7", "02", "Кодекс"),
    ("path", "03", "Путь"),
    ("kata", "04", "Ката"),
    ("groups", "05", "Состав"),
]

def load():
    with open(os.path.join(CONTENT, "pages.json"), encoding="utf-8") as f:
        data = json.load(f)
    with open(os.path.join(CONTENT, "theme.css"), encoding="utf-8") as f:
        css = f.read()
    with open(os.path.join(CONTENT, "app.js"), encoding="utf-8") as f:
        js = f.read()
    data["lists"] = load_lists()
    return data, css, js

def load_lists():
    lists = {}
    data_dir = os.path.join(CONTENT, "data")
    for name in ("roster", "kata", "promotions", "ranking", "squads"):
        path = os.path.join(data_dir, name + ".json")
        if os.path.exists(path):
            with open(path, encoding="utf-8") as f:
                lists[name] = json.load(f)
        else:
            lists[name] = {}
    return lists

def page_href(page):
    return "index.html" if page["slug"] == "index" else page["slug"] + ".html"

def page_path(page):
    return "" if page["slug"] == "index" else page["slug"] + "/"

def rel_prefix(page):
    return "" if page["slug"] == "index" else "../"

def page_url(data, slug, kind, prefix=""):
    if kind == "embed":
        return "index.html" if slug == "index" else slug + ".html"
    if kind == "snippet":
        base = (data["site"].get("pages_url") or "https://water-breath-yufu.ru/").rstrip("/")
        return base + "/" if slug == "index" else base + "/" + slug + "/"
    return prefix + ("" if slug == "index" else slug + "/")

def resolve_asset(name, data, prefix="", asset_base=None):
    if asset_base:
        return asset_base.rstrip("/") + "/" + name
    if os.path.exists(os.path.join(IMG_DIR, name)):
        return f"{prefix}assets/img/{name}"
    return data["assets"].get(name, f"{prefix}assets/img/{name}")

def render_fragment(fragment, data, prefix="", asset_base=None, kind="site"):
    def repl_img(m):
        name = m.group(1)
        if name not in data["assets"] and not os.path.exists(os.path.join(IMG_DIR, name)):
            return m.group(0)
        return resolve_asset(name, data, prefix, asset_base)
    def repl_page(m):
        slug = m.group(1)
        if slug not in {p["slug"] for p in data["pages"]}:
            return m.group(0)
        return page_url(data, slug, kind, prefix)
    out = re.sub(r"\{\{img:([^}]+)\}\}", repl_img, fragment)
    out = re.sub(r"\{\{page:([a-z0-9_-]+)\}\}", repl_page, out)
    out = out.replace("{{marquee}}", render_marquee(data, False))
    out = out.replace("{{marquee:reverse}}", render_marquee(data, True))
    out = out.replace("{{roster}}", render_roster(data))
    out = out.replace("{{kata}}", render_kata(data, prefix=prefix, asset_base=asset_base))
    out = out.replace("{{kata-teaser}}", render_kata_teaser(data, prefix=prefix, asset_base=asset_base, kind=kind))
    out = out.replace("{{ranks}}", render_ranks(data, prefix=prefix, kind=kind))
    out = out.replace("{{groups}}", render_groups(data, prefix=prefix, kind=kind))
    out = out.replace("{{promotions}}", render_promotions(data))
    out = out.replace("{{ranking-top}}", render_ranking_top(data))
    return out

def _sigil(page):
    return page.get("sigil") or SIGIL.get(page["slug"], "水")

def plural(n, forms=("требование", "требования", "требований")):
    """Русская форма слова по числу."""
    n = abs(int(n))
    if n % 10 == 1 and n % 100 != 11:
        return forms[0]
    if 2 <= n % 10 <= 4 and not 12 <= n % 100 <= 14:
        return forms[1]
    return forms[2]


def hb_head(num, kanji, title, sub="", tail=""):
    """Заголовок секции главной: номер, иероглиф, крупное название и подпись."""
    sub_html = f'<p class="hb-head__sub">{sub}</p>' if sub else ""
    tail_html = f'<span class="hb-head__tail" aria-hidden="true">{tail}</span>' if tail else ""
    return (
        '<header class="hb-head reveal">'
        f'<span class="hb-head__kanji" aria-hidden="true">{kanji}</span>'
        f'<p class="hb-head__num"><span>{num}</span><i aria-hidden="true"></i>{tail_html}</p>'
        f'<h2 class="hb-head__title">{title}</h2>'
        f"{sub_html}"
        "</header>"
    )


def render_nav(data, current_page):
    """Шапка: логотип + лента вкладок-разделов (новый вариант — «жидкая» полоса
    с плавающей каплей-подсветкой, которая едет за активной вкладкой)."""
    site = data["site"]
    up = rel_prefix(current_page)
    home = "./" if current_page["slug"] == "index" else up
    entries = [{
        "slug": "index",
        "href": home,
        "sigil": SIGIL["index"],
        "label": "Вода",
        "title": site["name"],
    }]
    for p in data["pages"]:
        if not p.get("nav"):
            continue
        entries.append({
            "slug": p["slug"],
            "href": up + page_path(p),
            "sigil": _sigil(p),
            "label": p["nav"],
            "title": p["title"],
        })
    tabs = []
    for e in entries:
        on = e["slug"] == current_page["slug"]
        tabs.append(
            f'<a class="ntab{" is-on" if on else ""}" href="{e["href"]}"'
            + (' aria-current="page"' if on else "")
            + f' data-nav-title="{html.escape(e["title"])}"'
            + f' data-nav-sigil="{html.escape(e["sigil"])}">'
            + f'<i class="ntab__k" aria-hidden="true">{html.escape(e["sigil"])}</i>'
            + f'<span class="ntab__t">{html.escape(e["label"])}</span>'
            + "</a>"
        )
    return (
        '<header class="nav">'
        '<div class="nav__in">'
        f'<a class="nav__logo" href="{home}" data-nav-title="{html.escape(site["name"])}"'
        f' data-nav-sigil="{SIGIL["index"]}"><span class="nav__drop">{SIGIL["index"]}</span>'
        f'<span class="nav__word">{html.escape(site["home_label"]).replace("·", "<i>·</i>")}</span></a>'
        '<nav class="ntabs" data-seals aria-label="Разделы сайта">'
        '<span class="ntabs__track" data-tabs-track>'
        '<span class="ntabs__ink" data-tabs-ink aria-hidden="true"></span>'
        '<span class="ntabs__drop" data-tabs-drop aria-hidden="true"></span>'
        + "".join(tabs) + "</span>"
        '<span class="ntabs__wave" aria-hidden="true"></span>'
        "</nav>"
        '<button class="nav__burger" data-menu-open aria-label="Открыть кодекс">'
        '<span class="nav__burger-k">水</span><span class="nav__burger-t">Кодекс</span></button>'
        "</div></header>"
    )


def render_mmenu(data, current_page):
    """Кодекс — выезжающая панель со всеми разделами (для телефона и как карта сайта)."""
    up = rel_prefix(current_page)
    home = "./" if current_page["slug"] == "index" else up
    cards = []
    entries = [("index", "Главная", "Начало пути", home, SIGIL["index"])]
    for p in data["pages"]:
        if not p.get("nav"):
            continue
        entries.append((p["slug"], p["title"], p["nav"], up + page_path(p), _sigil(p)))
    for i, (slug, title, short, href, sig) in enumerate(entries):
        on = " on" if slug == current_page["slug"] else ""
        cards.append(
            f'<a class="codex__card{on}" href="{href}" style="transition-delay:{0.04 + i * 0.035:.2f}s"'
            f' data-nav-title="{html.escape(title)}" data-nav-sigil="{html.escape(sig)}">'
            f'<span class="codex__n">{i:02d}</span>'
            f'<span class="codex__t">{html.escape(title)}</span>'
            f'<span class="codex__s">{html.escape(short)}</span>'
            f'<span class="codex__k" aria-hidden="true">{html.escape(sig)}</span>'
            "</a>"
        )
    return (
        '<div class="mmenu" role="dialog" aria-label="Кодекс воды">'
        '<div class="mmenu__bar">'
        '<p class="mmenu__brand"><i>水</i><span>Кодекс воды</span></p>'
        '<button class="mmenu__close" data-menu-close aria-label="Закрыть">✕</button>'
        "</div>"
        '<nav class="codex">' + "".join(cards) + "</nav>"
        '<span class="mmenu__foot">水 · чистота · течение · защита</span>'
        "</div>"
    )


def render_spine():
    links = []
    for anchor, num, label in SPINE:
        links.append(
            f'<a href="#{anchor}" data-spy="{anchor}"><i>{num}</i><span>{label}</span></a>'
        )
    return '<nav class="spine" aria-label="Разделы главной">' + "".join(links) + "</nav>"

def split_word(word, delay, cls):
    chars = "".join(
        f'<span class="ch" style="animation-delay:{delay + i * 0.055:.2f}s">'
        f"{'&nbsp;' if ch == ' ' else html.escape(ch)}</span>"
        for i, ch in enumerate(word)
    )
    return f'<span class="w {cls}">{chars}</span>'

def render_quote(text, author, css_class):
    text = (text or "").strip()
    if not text:
        return ""
    quote = f'<span class="quote__text">«{html.escape(text)}»</span>'
    cite = f'<cite class="quote__author">— {html.escape(author)}</cite>' if author else ""
    return f'<p class="{css_class}">{quote}{cite}</p>'

def render_hero(page, data, prefix="", asset_base=None, kind="site", compact=False):
    is_index = page["slug"] == "index" and not compact
    bg = resolve_asset(page.get("cover_image") or "cover.jpg", data, prefix, asset_base)

    def hero_link(slug, fallback="#faction"):
        for pg in data["pages"]:
            if pg["slug"] == slug:
                return prefix + page_path(pg)
        return fallback

    media = f'<img class="bg" src="{bg}" alt="" fetchpriority="high">'
    if is_index:
        w1 = page.get("hero_title_1") or "ДЫХАНИЕ"
        w2 = page.get("hero_title_2") or "ВОДЫ"
        quote = page.get("hero_quote") or ""
        title = split_word(w1, 0.7, "bone") + split_word(w2, 1.0, "water")
        quote_html = render_quote(quote, page.get("hero_quote_author"), "hero__quote")
        kanji = (
            '<div class="hero__kanji">'
            '<span class="v">水ノ呼吸</span>'
            '<span class="line"></span>'
            '<span class="t">дыхание воды</span>'
            "</div>"
        )
        cue = (
            '<a class="hero__cue" href="#faction">'
            '<span class="hero__cue-t">Листай вниз</span><span aria-hidden="true">﹀</span></a>'
        )
        cls = "hero hero--index"
        stats = [
            ("10", "форм воды"),
            ("7", "принципов кодекса"),
            ("10", "рангов пути"),
            ("4", "завета"),
        ]
        stats_html = "".join(
            f'<li><b>{n}</b><span>{html.escape(label)}</span></li>' for n, label in stats
        )
        content = (
            f'<p class="hero__eyebrow">水&nbsp;&nbsp;{html.escape(page["cover_uptitle"])}</p>'
            f'<h1 class="hero__title">{title}</h1>'
            f"{quote_html}"
            '<div class="hero__btns">'
            f'<a class="btn btn--water" href="{hero_link("codex")}"><span>Кодекс воды</span></a>'
            f'<a class="btn btn--ghost" href="{hero_link("kata")}">Десять форм →</a>'
            "</div>"
            f'<ul class="hero__stats">{stats_html}</ul>'
        )
        crest = (
            '<div class="hero__crest hero__crest--index" aria-hidden="true">'
            '<span class="hero__crest-k">水</span>'
            '<span class="hero__crest-t">стань как вода</span>'
            "</div>"
        )
        waves = (
            '<div class="hero__waves" aria-hidden="true">'
            '<svg viewBox="0 0 1440 120" preserveAspectRatio="none" class="hero__wave hero__wave--back">'
            '<path d="M0,70 C160,20 320,20 480,70 C640,120 800,120 960,70 C1120,20 1280,20 1440,70 L1440,120 L0,120 Z"/>'
            "</svg>"
            '<svg viewBox="0 0 1440 120" preserveAspectRatio="none" class="hero__wave hero__wave--front">'
            '<path d="M0,80 C160,40 320,40 480,80 C640,120 800,120 960,80 C1120,40 1280,40 1440,80 L1440,120 L0,120 Z"/>'
            "</svg>"
            "</div>"
        )
    else:
        sig = html.escape(_sigil(page))
        label = page.get("nav") or page["cover_uptitle"]
        title = f'<span class="hero__plain"><span>{html.escape(page["cover_title"])}</span></span>'
        cue = '<a class="hero__cue" href="#content"><span>Читать свиток</span><span>﹀</span></a>'
        cls = "hero hero--inner"
        kanji = (
            '<div class="hero__kanji">'
            f'<span class="v">{sig}</span>'
            '<span class="line"></span>'
            f'<span class="t">{html.escape(label)}</span>'
            "</div>"
        )
        crest = f'<div class="hero__crest" aria-hidden="true"><span>{sig}</span></div>'
        waves = ""
        content = (
            f'<p class="hero__eyebrow">{sig}&nbsp;&nbsp;{html.escape(page["cover_uptitle"])}</p>'
            f'<h1 class="hero__title">{title}</h1>'
        )
    return (
        f'<section class="{cls}">'
        f'<div class="hero__media">{media}</div>'
        '<div class="hero__shade"></div>'
        f"{kanji}{crest}"
        f'<div class="hero__in">{content}</div>'
        f"{cue}"
        f"{waves}"
        "</section>"
    )

def render_marquee(data=None, reverse=False):
    quotes = ((data or {}).get("quotes") or {}).get("marquee") or MARQUEE_QUOTES
    def item(q):
        text = html.escape(str(q.get("text", "")).strip())
        author = html.escape(str(q.get("author", "")).strip())
        cite = f'<span class="marquee__a">— {author}</span>' if author else ""
        return (f'<span class="marquee__item"><span class="marquee__q">«{text}»</span>'
                f'{cite}<span class="marquee__dot"></span></span>')
    row = '<div class="marquee__row">' + "".join(item(q) for q in quotes) + "</div>"
    cls = "marquee marquee--reverse" if reverse else "marquee"
    return f'<div class="{cls}" aria-hidden="true"><div class="marquee__track">{row}{row}</div></div>'

def render_roster(data):
    roster = (data.get("lists") or {}).get("roster") or {}
    groups = roster.get("groups") or []
    if not groups:
        # fallback to old squads
        squads = (data.get("lists") or {}).get("squads") or {}
        groups = squads.get("groups") or []
    if not groups:
        return '<section class="s"><p>Состав скоро появится.</p></section>'
    out = []
    for g in groups:
        name = html.escape(g.get("name",""))
        role = html.escape(g.get("role",""))
        out.append(f'<div class="roster__group"><p class="roster__cap">{role} — {name}</p><div class="roster__grid">')
        for m in g.get("members") or []:
            mn = html.escape(m.get("name",""))
            mt = html.escape(m.get("title",""))
            ms = html.escape(m.get("status",""))
            md = html.escape(m.get("description",""))
            out.append(f'<div class="roster__card"><h4>{mn}</h4><p class="role">{mt} · {ms}</p><p>{md}</p></div>')
        out.append('</div></div>')
    return '<section class="s">' + "".join(out) + '</section>'

def kata_media(f, prefix="", asset_base=None):
    """Возвращает <video> для формы ката.

    Поддерживает mp4 (основной формат) + webm как второй источник,
    постер берётся из поля poster, иначе — общий kata-poster.svg.
    Ленивая загрузка: src подставляется скриптом (data-src), плеер играет
    по наведению/тапу. Так 10 анимаций не тянутся все сразу.
    """
    fid = f.get("id", "")
    name = html.escape(str(f.get("name", "")))
    video = str(f.get("video") or f.get("gif") or "")
    webm = str(f.get("webm") or "")
    poster = str(f.get("poster") or "assets/kata/kata-poster.svg")

    def url(path):
        if not path:
            return ""
        if path.startswith("http"):
            return path
        if asset_base:
            return asset_base.rstrip("/") + "/" + path
        return prefix + path

    def exists(path):
        return bool(path) and (path.startswith("http") or os.path.exists(os.path.join(ROOT, path)))

    sources = []
    if exists(video):
        kind = "video/webm" if video.lower().endswith(".webm") else "video/mp4"
        sources.append(f'<source data-src="{url(video)}" type="{kind}">')
    if exists(webm):
        sources.append(f'<source data-src="{url(webm)}" type="video/webm">')
    label = f'Анимация: {name}'
    if sources:
        return (
            '<figure class="kata-card__media" data-kata-media>'
            f'<video muted loop playsinline preload="none" poster="{url(poster)}"'
            f' data-kata-video aria-label="{label}">'
            + "".join(sources) +
            "</video>"
            "</figure>"
        )
    if exists(str(f.get("gif") or "")):
        return (f'<figure class="kata-card__media"><img src="{url(f.get("gif"))}" '
                f'alt="{name}" loading="lazy"></figure>')
    return (f'<figure class="kata-card__media kata-card__media--soon">'
            f'<span>Анимация формы {html.escape(str(fid))} — скоро</span></figure>')


def render_kata(data, prefix="", asset_base=None):
    kata = (data.get("lists") or {}).get("kata") or {}
    forms = kata.get("forms") or []
    if not forms:
        return '<section class="s"><p>Формы скоро появятся.</p></section>'
    cards = []
    for f in forms:
        fid = f.get("id", "")
        num = f"{int(fid):02d}" if str(fid).isdigit() else html.escape(str(fid))
        name = html.escape(str(f.get("name", "")))
        jp = html.escape(str(f.get("name_jp", "")))
        desc = html.escape(str(f.get("description", "")))
        tips = html.escape(str(f.get("tips", "")))
        tip_html = (
            '<p class="kata-card__tip"><span class="kata-card__tip-k" aria-hidden="true">技</span>'
            f"{tips}</p>" if tips else ""
        )
        cards.append(
            '<article class="kata-card reveal" data-kata-card>'
            '<div class="kata-card__top">'
            f'<span class="kata-card__num">{num}</span>'
            f'<p class="kata-card__jp">{jp}</p>'
            "</div>"
            f"<h3>{name}</h3>"
            f"<p>{desc}</p>"
            f"{tip_html}"
            f"{kata_media(f, prefix=prefix, asset_base=asset_base)}"
            "</article>"
        )
    return '<section class="s"><div class="kata-grid" id="kataGrid">' + "".join(cards) + "</div></section>"


def render_kata_teaser(data, prefix="", asset_base=None, kind="site"):
    """Секция ката для главной: ролик-превью + список всех форм."""
    kata = (data.get("lists") or {}).get("kata") or {}
    forms = kata.get("forms") or []
    if not forms:
        return ""
    href = page_url(data, "kata", kind, prefix)

    preview = forms[-1]
    for f in forms:
        if str(f.get("id")) == "10":
            preview = f
    pname = str(preview.get("name", ""))
    short = pname.split(":", 1)[-1].strip() or pname

    chips = []
    for f in forms:
        fid = f.get("id", "")
        num = f"{int(fid):02d}" if str(fid).isdigit() else html.escape(str(fid))
        fname = str(f.get("name", ""))
        fshort = fname.split(":", 1)[-1].strip() or fname
        chips.append(
            f'<a class="hb-kata__chip" href="{href}">'
            f'<span class="hb-kata__chip-n">{num}</span>'
            f'<span class="hb-kata__chip-t">{html.escape(fshort)}</span>'
            f'<span class="hb-kata__chip-jp" aria-hidden="true">{html.escape(str(f.get("name_jp", "")))}</span>'
            "</a>"
        )

    head = hb_head(
        "04", "型", 'Десять форм <em>воды</em>',
        'От рассекающей поверхность воды до постоянного потока, что усиливается с каждым вращением.',
        "ката",
    )
    return (
        '<section class="hb-section hb-section--dim hb-kata" id="kata">'
        '<div class="hb-wrap">'
        + head +
        '<div class="hb-kata__grid">'
        '<div class="hb-kata__preview reveal">'
        + kata_media(preview, prefix=prefix, asset_base=asset_base) +
        '<div class="hb-kata__cap">'
        f'<span class="hb-kata__cap-n">{html.escape(short)}</span>'
        f'<span class="hb-kata__cap-jp">{html.escape(str(preview.get("name_jp", "")))}</span>'
        "</div>"
        "</div>"
        '<div class="hb-kata__list">' + "".join(chips) + "</div>"
        "</div>"
        f'<div class="hb-kata__more"><a class="btn btn--water" href="{href}">'
        "<span>Разобрать все формы →</span></a></div>"
        "</div></section>"
    )


def render_ranks(data, prefix="", kind="site"):
    """Секция рангов для главной: лестница из промоушен-документа."""
    prom = (data.get("lists") or {}).get("promotions") or {}
    steps = prom.get("fighters") or []
    if not steps:
        return ""
    rows = []
    total = len(steps)
    for i, step in enumerate(steps):
        fr = html.escape(str(step.get("from", "")))
        to = html.escape(str(step.get("to", "")))
        req = len(step.get("requirements") or [])
        pct = int(round((i + 1) / total * 100))
        rows.append(
            f'<li class="hb-rank reveal" style="--p:{pct}%">'
            f'<span class="hb-rank__i">{i + 1:02d}</span>'
            f'<p class="hb-rank__path"><span>{fr}</span><i aria-hidden="true">→</i><b>{to}</b></p>'
            f'<span class="hb-rank__req">{req}&nbsp;{plural(req)}</span>'
            f'<span class="hb-rank__bar" aria-hidden="true"></span>'
            "</li>"
        )
    head = hb_head(
        "03", "昇", 'Десять рангов <em>пути</em>',
        'Мидзуното — первый ранг после отбора. Киноэ — высшая ступень истребителя воды.',
        "ранги",
    )
    return (
        '<section class="hb-section hb-ranks" id="ranks">'
        '<div class="hb-wrap">'
        + head +
        '<ol class="hb-ranks__ladder">' + "".join(rows) + "</ol>"
        '<div class="hb-ranks__more">'
        f'<a class="btn btn--ghost" href="{page_url(data, "elevation", kind, prefix)}">Требования к каждому рангу →</a>'
        "</div>"
        "</div></section>"
    )


def render_groups(data, prefix="", kind="site"):
    """Секция состава для главной: группы дыхания воды (Столп, цугуко, инструкторы…)."""
    roster = (data.get("lists") or {}).get("roster") or {}
    groups = roster.get("groups") or []
    if not groups:
        return ""
    cards = []
    for g in groups:
        members = []
        for m in g.get("members") or []:
            name = html.escape(str(m.get("name", "")))
            title = html.escape(str(m.get("title", "")))
            status = html.escape(str(m.get("status", "")))
            desc = html.escape(str(m.get("description", "")))
            free = "Вакантно" in str(m.get("name", "")) or "свободно" in str(m.get("status", "")).lower()
            members.append(
                f'<li class="hb-group__m{" is-free" if free else ""}">'
                f'<span class="hb-group__name">{name}</span>'
                f'<span class="hb-group__meta">{title}{" · " + status if status else ""}</span>'
                f'<p class="hb-group__desc">{desc}</p>'
                "</li>"
            )
        cards.append(
            '<article class="hb-card hb-group reveal">'
            f'<p class="hb-card__role">{html.escape(str(g.get("role", "")))}</p>'
            f'<h3 class="hb-card__title">{html.escape(str(g.get("name", "")))}</h3>'
            '<ul class="hb-group__list">' + "".join(members) + "</ul>"
            "</article>"
        )
    head = hb_head(
        "05", "隊", 'Состав <em>корпуса</em>',
        'Столп воды, его преемники, инструкторы, истребители и ученики — одна река.',
        "состав",
    )
    return (
        '<section class="hb-section hb-groups" id="groups">'
        '<div class="hb-wrap">'
        + head +
        '<div class="hb-groups__grid">' + "".join(cards) + "</div>"
        '<div class="hb-groups__more"><a class="btn btn--ghost" href="'
        + page_url(data, "roster", kind, prefix) + '">Полный состав и иерархия →</a></div>'
        "</div></section>"
    )


def render_promotions(data):
    prom = (data.get("lists") or {}).get("promotions") or {}
    fighters = prom.get("fighters") or []
    instructors = prom.get("instructors") or []
    def render_list(title, lst):
        items = []
        for it in lst:
            fr = html.escape(it.get("from",""))
            to = html.escape(it.get("to",""))
            reqs = "".join(f"<li>{html.escape(r)}</li>" for r in it.get("requirements") or [])
            items.append(
                f'<div class="promo__item"><div><span class="promo__from">{fr}</span> <span class="promo__arrow">→</span> <span class="promo__to">{to}</span><ul class="promo__req">{reqs}</ul></div></div>'
            )
        return f'<h3>{title}</h3><div class="promo">{"".join(items)}</div>'
    return '<section class="s">' + render_list("Истребители", fighters) + "<hr>" + render_list("Инструкторы / Цугуко", instructors) + '</section>'

def render_ranking_top(data):
    rk = (data.get("lists") or {}).get("ranking") or {}
    champ = rk.get("champion") or {}
    name = str(champ.get("name", "") or "").strip() or "Пока нет чемпиона"
    free = bool(champ.get("free", True))
    status = str(champ.get("status", "") or "").strip() or ("Место свободно" if free else "")
    aria = "Место чемпиона пока свободно" if free else "Печать чемпиона"
    champion = (
        '<section class="s narrow center champion">\n'
        '<h2 class="xl c-foam">Чемпион</h2>\n'
        f'<div class="avatar-mark" role="img" aria-label="{html.escape(aria)}">\n'
        '<span class="avatar-mark__kanji" aria-hidden="true">位</span>\n'
        f'<span class="avatar-mark__label">{html.escape(status)}</span>\n'
        "</div>\n"
        f'<p class="name c-water">{html.escape(name)}</p>\n'
        "</section>"
    )
    rows = []
    for e in rk.get("entries") or []:
        label = str(e.get("label", "") or "").strip()
        ename = str(e.get("name", "") or "").strip()
        if not label and not ename:
            continue
        if e.get("highlight"):
            span = f'<span class="c-water">{html.escape(label)} - </span>' if label else ""
            rows.append(f"<p><strong>{span}{html.escape(ename)}</strong></p>")
        else:
            tail = f" - {html.escape(ename)}" if ename else " -"
            rows.append(f"<p>▶ {html.escape(label)}{tail}</p>")
    table = '<section class="s narrow center">\n' + "\n".join(rows) + "\n</section>"
    return champion + "\n<hr>\n" + table

def render_footer(data, current_page):
    site = data["site"]
    quote = data["quotes"]["footer"]
    up = rel_prefix(current_page)
    links = []
    for p in data["pages"]:
        if not p.get("nav"):
            continue
        links.append(f'<a href="{up}{page_path(p)}">{html.escape(p["nav"])}</a>')
    return (
        '<footer class="footer">'
        '<div class="footer__glow"></div>'
        '<div class="footer__in">'
        '<div class="footer__top">'
        "<div>"
        f'<p class="footer__up">{html.escape(site["short"])} · Дыхание воды</p>'
        '<p class="footer__big"><span class="stroke">Дыхание</span> <span class="fill">Воды</span></p>'
        + render_quote(quote["text"], quote["author"], "footer__quote")
        + "</div>"
        '<div class="footer__side">'
        '<div class="footer__nav">' + "".join(links) + "</div>"
        '<a class="btn btn--ghost" href="#top">↑&nbsp;&nbsp;Наверх</a>'
        "</div>"
        "</div>"
        '<div class="footer__bot">'
        f'<p>© <span data-year>2026</span> {html.escape(site["name"])}</p>'
        "<p>水 · 隊 · 蝶 · 斬</p>"
        "</div>"
        "</div></footer>"
    )

def render_preloader():
    return (
        '<div class="preloader">'
        '<span class="preloader__kanji">水</span>'
        '<div class="preloader__bar">'
        '<div class="preloader__row"><span>Стань как вода</span><b data-count>0%</b></div>'
        '<div class="preloader__track"><div class="preloader__fill"></div></div>'
        "</div>"
        '<span class="preloader__foot">течение не остановить</span>'
        "</div>"
    )

def render_veil(sig=""):
    """Штора-волна для переходов между страницами.

    Панель = волна сверху + вода + волна снизу. При уходе со страницы вода
    поднимается снизу и накрывает экран, при приходе — уходит вверх и открывает
    новую страницу. Без JS штору убирает CSS-анимация в html.veil-cover.
    """
    sig = (sig or "").strip() or "水"
    wave_in = "M0,64 C120,20 240,20 360,64 C480,108 600,108 720,64 C840,20 960,20 1080,64 C1200,108 1320,108 1440,64 L1440,120 L0,120 Z"
    wave_out = "M0,56 C120,100 240,100 360,56 C480,12 600,12 720,56 C840,100 960,100 1080,56 C1200,12 1320,12 1440,56 L1440,0 L0,0 Z"
    return (
        '<div class="veil" data-veil aria-hidden="true">'
        '<div class="veil__panel">'
        f'<svg class="veil__wave veil__wave--in" viewBox="0 0 1440 120" preserveAspectRatio="none"><path d="{wave_in}"/></svg>'
        '<div class="veil__fill">'
        f'<span class="veil__kanji" data-veil-kanji>{html.escape(str(sig))}</span>'
        '<span class="veil__label" data-veil-label>Дыхание воды</span>'
        '<span class="veil__bar"><i></i></span>'
        "</div>"
        f'<svg class="veil__wave veil__wave--out" viewBox="0 0 1440 120" preserveAspectRatio="none"><path d="{wave_out}"/></svg>'
        "</div>"
        "</div>"
    )


def render_document(page, data, body, css_link=None, css_inline=None,
                    js_link=None, js_inline=None, body_class=""):
    site = data["site"]
    title = site["name"] if page["slug"] == "index" else f'{page["title"]} — {site["name"]}'
    base = (site.get("pages_url") or "https://water-breath-yufu.ru/").rstrip("/")
    og = base + "/assets/img/water-moon.jpg"
    head_css = (
        f'<link rel="stylesheet" href="{css_link}">' if css_link else f"<style>\n{css_inline}\n</style>"
    )
    script = (
        f'<script src="{js_link}" defer></script>' if js_link else f"<script>\n{js_inline}\n</script>"
    )
    slug = page.get("slug") or "page"
    sig = html.escape(SIGIL.get(slug, ""))
    cls = f"page-{slug} {body_class}".strip()
    visit = (
        "<script>try{"
        "var de=document.documentElement;"
        "if(sessionStorage.getItem('wb-visited')){de.classList.add('bp-seen');}"
        "else{sessionStorage.setItem('wb-visited','1');}"
        "if(sessionStorage.getItem('wb-nav')){de.classList.add('veil-cover');"
        "try{sessionStorage.removeItem('wb-nav');}catch(e2){}}"
        "}catch(e){}</script>"
    )
    theme_init = ""
    veil = render_veil(sig)
    return f"""<!DOCTYPE html>
<html lang="{site['lang']}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{html.escape(title)}</title>
<meta name="description" content="{html.escape(site['description'])}">
<meta property="og:type" content="website">
<meta property="og:title" content="{html.escape(title)}">
<meta property="og:description" content="{html.escape(site['description'])}">
<meta property="og:image" content="{og}">
<link rel="icon" href="{FAVICON}">
{theme_init}
{visit}
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="{FONTS_URL}">
{head_css}
</head>
<body id="top" class="{cls}" data-sigil="{sig}">
{veil}
{body}
{script}
</body>
</html>
"""

def write_cheatsheet(data):
    lines = [
        "# Шпаргалка для переноса в Google Sites",
        "",
        "Файл генерируется автоматически (`python3 build.py`) из `content/pages.json`.",
        "",
        "## Страницы",
        "",
        "| № | Страница | Заголовок | Файл |",
        "|---|---|---|---|",
    ]
    for i, p in enumerate(data["pages"], 1):
        lines.append(
            f"| {i} | {p['title']} | {p['cover_uptitle']} / {p['cover_title']} | "
            f"`google-sites/{i:02d}-{p['slug']}.html` |"
        )
    with open(os.path.join(GS, "ASSETS.md"), "w", encoding="utf-8") as f:
        f.write("\n".join(lines))

PROTECTED = {
    ".git", ".gitignore", ".nojekyll", "CNAME", "README.md", "LICENSE",
    ".github", "admin", "build.py", "content", "scripts", "google-sites", "assets",
    "Новая папка (3)",
    "Повышение инструкторцугуко.txt",
    "Повышение истребителей.txt",
    "Правила Поместья Кочо.txt",
    "УСТАВ ОРГАНИЗАЦИИ.txt",
}

def clean_site(page_slugs):
    generated = {"index.html", "404.html", "embed"} | set(page_slugs)
    generated -= {"index"}
    for name in generated:
        if name in PROTECTED:
            raise SystemExit(f"Слаг «{name}» конфликтует со служебным — переименуйте.")
        p = os.path.join(SITE, name)
        if os.path.isdir(p):
            shutil.rmtree(p)
        elif os.path.exists(p):
            os.remove(p)

def clean_dir(path):
    if os.path.isdir(path):
        for name in os.listdir(path):
            p = os.path.join(path, name)
            if os.path.isdir(p):
                shutil.rmtree(p)
            else:
                os.remove(p)

def build(asset_base=None):
    data, css, js = load()
    clean_site(p["slug"] for p in data["pages"])
    clean_dir(GS)
    os.makedirs(os.path.join(SITE, "assets"), exist_ok=True)
    os.makedirs(IMG_DIR, exist_ok=True)
    os.makedirs(EMBED, exist_ok=True)
    os.makedirs(GS, exist_ok=True)

    with open(os.path.join(SITE, "assets", "style.css"), "w", encoding="utf-8") as f:
        f.write(css)
    with open(os.path.join(SITE, "assets", "app.js"), "w", encoding="utf-8") as f:
        f.write(js)
    open(os.path.join(SITE, ".nojekyll"), "w").close()

    site = data["site"]
    domain = (site.get("domain") or "").strip().lower()
    if domain:
        with open(os.path.join(SITE, "CNAME"), "w", encoding="utf-8") as f:
            f.write(domain + "\n")

    for i, page in enumerate(data["pages"]):
        with open(os.path.join(CONTENT, page["slug"] + ".html"), encoding="utf-8") as f:
            fragment = f.read().strip()

        is_index = page["slug"] == "index"
        sig = html.escape(_sigil(page))

        up = rel_prefix(page)
        main_cls = ' id="content"' if is_index else f' id="content" class="article" data-kanji="{sig}"'
        body = (
            CURSOR_HTML + "\n"
            '<div class="progress"></div>\n'
            + (render_spine() if is_index else "")
            + render_nav(data, page)
            + render_mmenu(data, page)
            + render_hero(page, data, prefix=up, kind="site")
            + render_marquee(data)
            + f"<main{main_cls}>\n" + render_fragment(fragment, data, prefix=up, kind="site") + "\n</main>\n"
            + render_footer(data, page)
        )
        out = render_document(page, data, body, css_link=f"{up}assets/style.css",
                              js_link=f"{up}assets/app.js")
        out_dir = os.path.join(SITE, page_path(page))
        os.makedirs(out_dir, exist_ok=True)
        with open(os.path.join(out_dir, "index.html"), "w", encoding="utf-8") as f:
            f.write(out)

        main_cls_e = ' id="content"' if is_index else f' id="content" class="article" data-kanji="{sig}"'
        body = (
            render_hero(page, data, prefix="../", kind="embed", compact=True)
            + render_marquee(data)
            + f"<main{main_cls_e}>\n" + render_fragment(fragment, data, prefix="../", kind="embed") + "\n</main>\n"
        )
        out = render_document(page, data, body, css_link="../assets/style.css",
                              js_link="../assets/app.js", body_class="embed")
        with open(os.path.join(EMBED, page_href(page)), "w", encoding="utf-8") as f:
            f.write(out)

        base = asset_base
        main_cls_g = ' id="content"' if is_index else ' id="content" class="article"'
        body = (
            render_hero(page, data, asset_base=base, kind="snippet", compact=True)
            + render_marquee(data)
            + f"<main{main_cls_g}>\n" + render_fragment(fragment, data, asset_base=base, kind="snippet") + "\n</main>\n"
        )
        out = render_document(page, data, body, css_inline=css, js_inline=js, body_class="embed")
        name = f"{i + 1:02d}-{page['slug']}.html"
        with open(os.path.join(GS, name), "w", encoding="utf-8") as f:
            f.write(out)

    write_404(data, css, js)
    write_cheatsheet(data)
    print("Собрано страниц:", len(data["pages"]))
    for p in data["pages"]:
        print(f"  /{page_path(p):14s}  ./{page_path(p)}index.html")
    if domain:
        print("Домен (CNAME):", domain)

def write_404(data, css, js):
    quote = data["quotes"]["not_found"]
    body = (
        CURSOR_HTML + "\n"
        '<div class="progress"></div>\n'
        '<section class="hero hero--inner">'
        '<div class="hero__shade"></div>'
        '<div class="hero__in">'
        '<p class="hero__eyebrow">Ошибка 404</p>'
        f'<h1 class="hero__title">{split_word("ПУСТОТА", 0.2, "bone")}</h1>'
        + render_quote(quote["text"], quote["author"], "hero__quote")
        + '<div class="hero__btns"><a class="btn btn--water" id="home" href="/"><span>На главную</span></a></div>'
        "</div></section>"
        "<script>(function(){var h=location.hostname,p=location.pathname.split('/');"
        "document.getElementById('home').href=/\\.github\\.io$/.test(h)&&p[1]?'/'+p[1]+'/':'/';})();</script>"
    )
    page = {"slug": "404", "title": "Страница не найдена"}
    out = render_document(page, data, body, css_inline=css, js_inline=js)
    with open(os.path.join(SITE, "404.html"), "w", encoding="utf-8") as f:
        f.write(out)

if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--asset-base", default=None,
                    help="URL папки с картинками для сниппетов")
    args = ap.parse_args()
    build(asset_base=args.asset_base)
