"""
Generate the CheckVAERS clinician brief PDF.

Editorial layout, navy + cyan brand palette, premium typography, no
marketing fluff. Renders the content of BRIEF.md as a polished
multi-page document with a custom cover.

Run:  python scripts/generate-brief-pdf.py
"""

from __future__ import annotations

from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import LETTER
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    HRFlowable,
    KeepTogether,
    NextPageTemplate,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)


# -------------------------------------------------------------- #
# Brand                                                          #
# -------------------------------------------------------------- #

NAVY = colors.HexColor("#0B1B3B")
NAVY_70 = colors.HexColor("#142A56")
CYAN = colors.HexColor("#29C5F6")
CYAN_TINT = colors.HexColor("#E6F8FE")
TEXT = colors.HexColor("#1A2333")
MUTED = colors.HexColor("#5A6577")
RULE = colors.HexColor("#E5E7EB")
SOFT_BG = colors.HexColor("#F8FAFC")

PAGE_W, PAGE_H = LETTER
MARGIN_X = 0.75 * inch
MARGIN_Y = 0.75 * inch
CONTENT_W = PAGE_W - 2 * MARGIN_X

REPO_URL = "https://github.com/Gaffattack54/checkvaers-mobile"
SITE_URL = "https://checkvaers-site.vercel.app"
APP_URL = "https://check-vaers.vercel.app"
RELEASE_URL = (
    "https://github.com/Gaffattack54/checkvaers-mobile/releases/tag/v0.1.1-data"
)
CONTACT = "hello@checkvaers.app"


# -------------------------------------------------------------- #
# Helpers                                                        #
# -------------------------------------------------------------- #


def _draw_tracked(
    canv: canvas.Canvas,
    x: float,
    y: float,
    text: str,
    *,
    font: str = "Helvetica",
    size: float = 10,
    tracking: float = 0,
    color=None,
) -> None:
    """Draw a string with per-character spacing using a TextObject."""
    to = canv.beginText(x, y)
    to.setFont(font, size)
    if color is not None:
        to.setFillColor(color)
    to.setCharSpace(tracking)
    to.textOut(text)
    canv.drawText(to)


# -------------------------------------------------------------- #
# Paragraph styles                                               #
# -------------------------------------------------------------- #

_styles = getSampleStyleSheet()


def style(
    name: str,
    *,
    parent: str = "Normal",
    fontName: str = "Helvetica",
    fontSize: float = 10,
    leading: float | None = None,
    spaceBefore: float = 0,
    spaceAfter: float = 0,
    textColor=TEXT,
    alignment: int = TA_LEFT,
    leftIndent: float = 0,
    firstLineIndent: float = 0,
    bulletIndent: float = 0,
    tracking: float = 0,
):
    if leading is None:
        leading = fontSize * 1.4
    kwargs = dict(
        name=name,
        parent=_styles[parent],
        fontName=fontName,
        fontSize=fontSize,
        leading=leading,
        spaceBefore=spaceBefore,
        spaceAfter=spaceAfter,
        textColor=textColor,
        alignment=alignment,
        leftIndent=leftIndent,
        firstLineIndent=firstLineIndent,
        bulletIndent=bulletIndent,
    )
    if tracking:
        # `charSpace` is supported by ParagraphStyle in reportlab 4.x.
        kwargs["charSpace"] = tracking
    return ParagraphStyle(**kwargs)


STY_EYEBROW = style(
    "Eyebrow",
    fontName="Helvetica-Bold",
    fontSize=8,
    textColor=CYAN,
    spaceAfter=6,
    tracking=2.5,
)
STY_H1 = style(
    "H1",
    fontName="Helvetica-Bold",
    fontSize=22,
    leading=26,
    textColor=NAVY,
    spaceAfter=8,
)
STY_H2 = style(
    "H2",
    fontName="Helvetica-Bold",
    fontSize=15,
    leading=20,
    textColor=NAVY,
    spaceBefore=18,
    spaceAfter=6,
)
STY_H3 = style(
    "H3",
    fontName="Helvetica-Bold",
    fontSize=11,
    leading=15,
    textColor=NAVY,
    spaceBefore=10,
    spaceAfter=2,
)
STY_BODY = style(
    "Body",
    fontSize=10.5,
    leading=15.5,
    spaceAfter=8,
)
STY_BODY_TIGHT = style(
    "BodyTight",
    fontSize=10.5,
    leading=15,
    spaceAfter=4,
)
STY_LIST = style(
    "List",
    fontSize=10.5,
    leading=15.5,
    spaceAfter=4,
    leftIndent=16,
    bulletIndent=4,
)
STY_LIST_TIGHT = style(
    "ListTight",
    fontSize=10.5,
    leading=15,
    spaceAfter=2,
    leftIndent=16,
    bulletIndent=4,
)
STY_LEAD = style(
    "Lead",
    fontSize=12,
    leading=18,
    textColor=NAVY,
    spaceAfter=10,
)
STY_CALLOUT = style(
    "Callout",
    fontName="Helvetica-Bold",
    fontSize=14,
    leading=20,
    textColor=NAVY,
    alignment=TA_LEFT,
    leftIndent=12,
)
STY_CALLOUT_BODY = style(
    "CalloutBody",
    fontSize=10,
    leading=14,
    textColor=MUTED,
    leftIndent=12,
    spaceAfter=2,
)
STY_TABLE_HEAD = style(
    "TableHead",
    fontName="Helvetica-Bold",
    fontSize=9.5,
    leading=12,
    textColor=colors.white,
    tracking=1,
)
STY_TABLE_CELL = style(
    "TableCell",
    fontSize=9.5,
    leading=13,
    textColor=TEXT,
)
STY_TABLE_LABEL = style(
    "TableLabel",
    fontName="Helvetica-Bold",
    fontSize=9.5,
    leading=13,
    textColor=NAVY,
)
STY_MONO = style(
    "Mono",
    fontName="Courier",
    fontSize=9.5,
    leading=14,
)
STY_COVER_WORDMARK = style(
    "CoverWordmark",
    fontName="Helvetica-Bold",
    fontSize=64,
    leading=70,
    textColor=colors.white,
    alignment=TA_LEFT,
)
STY_COVER_TAGLINE = style(
    "CoverTagline",
    fontSize=15,
    leading=22,
    textColor=colors.HexColor("#C9D4E8"),
    alignment=TA_LEFT,
)
STY_COVER_EYEBROW = style(
    "CoverEyebrow",
    fontName="Helvetica-Bold",
    fontSize=10,
    textColor=CYAN,
    tracking=4,
    alignment=TA_LEFT,
)
STY_COVER_STAT_VAL = style(
    "CoverStatVal",
    fontName="Helvetica-Bold",
    fontSize=26,
    leading=28,
    textColor=CYAN,
    alignment=TA_LEFT,
)
STY_COVER_STAT_LBL = style(
    "CoverStatLbl",
    fontName="Helvetica-Bold",
    fontSize=8,
    textColor=colors.HexColor("#A9B6CC"),
    tracking=3,
    alignment=TA_LEFT,
)
STY_COVER_FOOT = style(
    "CoverFoot",
    fontSize=9,
    textColor=colors.HexColor("#9AA8BF"),
    alignment=TA_LEFT,
)


# -------------------------------------------------------------- #
# Cover page                                                     #
# -------------------------------------------------------------- #


def draw_cover(canv: canvas.Canvas, doc) -> None:
    """Cover page — restrained editorial layout. One wordmark, one
    cyan accent rule, generous negative space, restrained bottom bar."""
    canv.saveState()

    # 1. Solid navy ground.
    canv.setFillColor(NAVY)
    canv.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)

    # 2. A single soft glow in the upper right — a directional cue
    # without the busyness of a tiled pattern. Drawn as a series of
    # concentric outline circles fading into the navy.
    glow_cx = PAGE_W - 1.4 * inch
    glow_cy = PAGE_H - 1.6 * inch
    for i in range(14, 0, -1):
        r = i * 12
        # Lerp from a very dark navy at the edge to a light cyan tint at the centre.
        t = 1 - i / 14
        col = colors.Color(
            (NAVY.red * (1 - t) + CYAN.red * t * 0.18) / 1,
            (NAVY.green * (1 - t) + CYAN.green * t * 0.18) / 1,
            (NAVY.blue * (1 - t) + CYAN.blue * t * 0.18) / 1,
        )
        canv.setStrokeColor(col)
        canv.setLineWidth(0.4)
        canv.circle(glow_cx, glow_cy, r, stroke=1, fill=0)

    # 3. Bare typographic stack — left-aligned to a single hairline grid
    # column. No badge, no side rule, no marketing collateral.
    text_x = 0.85 * inch
    text_w = PAGE_W - text_x - 0.85 * inch

    # Eyebrow (top)
    _draw_tracked(
        canv,
        text_x,
        PAGE_H - 1.15 * inch,
        "CLINICIAN BRIEF",
        font="Helvetica-Bold",
        size=10,
        tracking=5,
        color=CYAN,
    )

    # Hair rule under the eyebrow — small, sets the column edge.
    canv.setStrokeColor(colors.HexColor("#1F3463"))
    canv.setLineWidth(0.6)
    canv.line(
        text_x,
        PAGE_H - 1.32 * inch,
        text_x + 1.2 * inch,
        PAGE_H - 1.32 * inch,
    )

    # Wordmark — large, white, kerning a touch tight.
    word_y = PAGE_H - 3.3 * inch
    to = canv.beginText(text_x, word_y)
    to.setFillColor(colors.white)
    to.setFont("Helvetica-Bold", 64)
    to.setCharSpace(-0.5)
    to.textOut("CheckVAERS")
    canv.drawText(to)

    # Short cyan accent rule directly under the wordmark.
    canv.setFillColor(CYAN)
    canv.rect(
        text_x,
        word_y - 0.32 * inch,
        1.4 * inch,
        0.05 * inch,
        fill=1,
        stroke=0,
    )

    # Tagline — two restrained lines in muted slate.
    tagline_para = Paragraph(
        "An on-device search interface<br/>to the public VAERS COVID-19 dataset.",
        STY_COVER_TAGLINE,
    )
    tagline_para.wrapOn(canv, text_w, 3 * inch)
    tagline_para.drawOn(canv, text_x, word_y - 1.45 * inch)

    # 4. Bottom band — hairline + four stats + version line.
    bottom_y = 1.55 * inch
    canv.setStrokeColor(colors.HexColor("#1F3463"))
    canv.setLineWidth(0.7)
    canv.line(text_x, bottom_y + 0.95 * inch, PAGE_W - text_x, bottom_y + 0.95 * inch)

    stats = [
        ("889,521", "VAERS REPORTS"),
        ("56", "STATES & TERR."),
        ("2020–25", "YEARS COVERED"),
        ("5", "DOSES / CHECK"),
    ]
    col_w = (PAGE_W - 2 * text_x) / 4
    for i, (val, lbl) in enumerate(stats):
        x = text_x + i * col_w
        canv.setFillColor(CYAN)
        canv.setFont("Helvetica-Bold", 22)
        canv.drawString(x, bottom_y + 0.5 * inch, val)
        _draw_tracked(
            canv,
            x,
            bottom_y + 0.25 * inch,
            lbl,
            font="Helvetica-Bold",
            size=7.5,
            tracking=2.5,
            color=colors.HexColor("#7F8CA6"),
        )

    # Footer (very bottom).
    canv.setFillColor(colors.HexColor("#7F8CA6"))
    canv.setFont("Helvetica", 9)
    canv.drawString(text_x, 0.75 * inch, "checkvaers-site.vercel.app")
    canv.setFillColor(colors.HexColor("#5C6A82"))
    canv.setFont("Helvetica", 9)
    canv.drawRightString(PAGE_W - text_x, 0.75 * inch, "v0.1.1 — May 2026")

    canv.restoreState()


# -------------------------------------------------------------- #
# Content page header/footer                                     #
# -------------------------------------------------------------- #


def draw_content_chrome(canv: canvas.Canvas, doc) -> None:
    """Subtle header + footer on every content page."""
    canv.saveState()

    page = canv.getPageNumber()
    # Page number = 1 on cover, content starts at page 2 → display as 1, 2, …
    display = page - 1

    # Header row
    canv.setFillColor(NAVY)
    canv.setFont("Helvetica-Bold", 9)
    canv.drawString(MARGIN_X, PAGE_H - 0.45 * inch, "CheckVAERS")
    canv.setFillColor(MUTED)
    canv.setFont("Helvetica", 9)
    canv.drawString(MARGIN_X + 1.05 * inch, PAGE_H - 0.45 * inch, "Clinician brief")

    canv.setFillColor(CYAN)
    canv.rect(MARGIN_X, PAGE_H - 0.55 * inch, 0.6 * inch, 0.02 * inch, fill=1, stroke=0)

    canv.setFillColor(MUTED)
    canv.setFont("Helvetica", 8.5)
    canv.drawRightString(PAGE_W - MARGIN_X, PAGE_H - 0.45 * inch, "v0.1.1")

    # Footer row
    canv.setStrokeColor(RULE)
    canv.setLineWidth(0.5)
    canv.line(MARGIN_X, 0.55 * inch, PAGE_W - MARGIN_X, 0.55 * inch)
    canv.setFillColor(MUTED)
    canv.setFont("Helvetica", 8.5)
    canv.drawString(
        MARGIN_X,
        0.4 * inch,
        "CheckVAERS · checkvaers-site.vercel.app",
    )
    canv.drawRightString(
        PAGE_W - MARGIN_X,
        0.4 * inch,
        f"{display}",
    )

    canv.restoreState()


# -------------------------------------------------------------- #
# Reusable flowables                                             #
# -------------------------------------------------------------- #


def section_rule(width: float = 1.5 * inch) -> HRFlowable:
    return HRFlowable(
        width=width,
        thickness=2,
        color=CYAN,
        spaceBefore=4,
        spaceAfter=4,
        hAlign="LEFT",
    )


def eyebrow_heading(eyebrow: str, heading: str) -> list:
    return [
        Spacer(1, 4),
        Paragraph(eyebrow, STY_EYEBROW),
        Paragraph(heading, STY_H2),
        section_rule(),
        Spacer(1, 2),
    ]


def kv_table(rows: list[tuple[str, str]]) -> Table:
    """Two-column key/value table for the Data block."""
    data = []
    for k, v in rows:
        data.append(
            [Paragraph(k, STY_TABLE_LABEL), Paragraph(v, STY_TABLE_CELL)]
        )
    t = Table(
        data,
        colWidths=[1.6 * inch, CONTENT_W - 1.6 * inch],
        hAlign="LEFT",
    )
    style_cmds = [
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("LINEBELOW", (0, 0), (-1, -2), 0.5, RULE),
        ("BACKGROUND", (0, 0), (0, -1), SOFT_BG),
    ]
    # Alternating row backgrounds on the value column
    for i in range(len(data)):
        if i % 2 == 1:
            style_cmds.append(("BACKGROUND", (1, i), (1, i), SOFT_BG))
    t.setStyle(TableStyle(style_cmds))
    return t


def algo_bucket_table(rows: list[tuple[str, str, str]]) -> Table:
    """Three-column algorithm bucket table with a navy header row."""
    head = [
        Paragraph("BUCKET", STY_TABLE_HEAD),
        Paragraph("RULES", STY_TABLE_HEAD),
        Paragraph("NOTE", STY_TABLE_HEAD),
    ]
    data = [head]
    for bucket, rules, note in rows:
        data.append(
            [
                Paragraph(f"<b>{bucket}</b>", STY_TABLE_LABEL),
                Paragraph(rules, STY_TABLE_CELL),
                Paragraph(note, STY_TABLE_CELL),
            ]
        )
    t = Table(
        data,
        colWidths=[1.1 * inch, 3.3 * inch, CONTENT_W - 1.1 * inch - 3.3 * inch],
        hAlign="LEFT",
    )
    style_cmds = [
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 9),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 9),
        ("LINEBELOW", (0, 0), (-1, -2), 0.5, RULE),
    ]
    for i in range(1, len(data)):
        if i % 2 == 0:
            style_cmds.append(("BACKGROUND", (0, i), (-1, i), SOFT_BG))
    t.setStyle(TableStyle(style_cmds))
    return t


def callout(headline: str, body: str | None = None) -> Table:
    """Cyan-bordered pull-quote callout block."""
    cells = [[Paragraph(headline, STY_CALLOUT)]]
    if body:
        cells.append([Paragraph(body, STY_CALLOUT_BODY)])
    t = Table(cells, colWidths=[CONTENT_W], hAlign="LEFT")
    style_cmds = [
        ("LEFTPADDING", (0, 0), (-1, -1), 16),
        ("RIGHTPADDING", (0, 0), (-1, -1), 12),
        ("TOPPADDING", (0, 0), (0, 0), 14),
        ("BOTTOMPADDING", (0, -1), (-1, -1), 14),
        ("BACKGROUND", (0, 0), (-1, -1), CYAN_TINT),
        ("LINEBEFORE", (0, 0), (0, -1), 3, CYAN),
    ]
    t.setStyle(TableStyle(style_cmds))
    return t


def numbered_list(items: list[str]) -> list:
    flows: list = []
    for i, item in enumerate(items, 1):
        flows.append(
            Paragraph(
                f'<font color="#29C5F6"><b>{i}.</b></font>&nbsp;&nbsp;{item}',
                STY_LIST_TIGHT,
            )
        )
    return flows


def bullet_list(items: list[str], *, tight: bool = False) -> list:
    sty = STY_LIST_TIGHT if tight else STY_LIST
    return [
        Paragraph(
            f'<font color="#29C5F6">●</font>&nbsp;&nbsp;{item}',
            sty,
        )
        for item in items
    ]


def link(text: str, href: str) -> str:
    return f'<link href="{href}"><font color="#29C5F6">{text}</font></link>'


def mono(text: str) -> str:
    return f'<font face="Courier" color="#0B1B3B">{text}</font>'


# -------------------------------------------------------------- #
# Content                                                        #
# -------------------------------------------------------------- #


def build_story() -> list:
    story: list = []

    # --- COVER ---
    # Force a page using a sentinel; the cover is drawn entirely by the
    # cover template's draw function. Add a microscopic spacer so Platypus
    # actually places something on the page.
    story.append(Spacer(1, 1))
    story.append(NextPageTemplate("content"))
    story.append(PageBreak())

    # ---------------------------------------------------------- #
    # Page 2 — Lead                                              #
    # ---------------------------------------------------------- #
    story += eyebrow_heading("OVERVIEW", "In one sentence")
    story.append(
        Paragraph(
            "CheckVAERS lets a patient check whether a report matching their "
            "<b>state</b>, <b>sex</b>, <b>age at vaccination</b>, and "
            "<b>dose date(s)</b> exists in HHS's public COVID-19 adverse-event "
            "dataset — without transmitting any of that information off "
            "their device.",
            STY_LEAD,
        )
    )

    # Status box
    status_cells = [
        [
            Paragraph(
                f"<b>Site</b><br/>{link(SITE_URL.replace('https://', ''), SITE_URL)}",
                STY_TABLE_CELL,
            ),
            Paragraph(
                f"<b>App (PWA)</b><br/>{link(APP_URL.replace('https://', ''), APP_URL)}",
                STY_TABLE_CELL,
            ),
            Paragraph(
                f"<b>Source</b><br/>{link('github.com/Gaffattack54/checkvaers-mobile', REPO_URL)}",
                STY_TABLE_CELL,
            ),
        ]
    ]
    t = Table(status_cells, colWidths=[CONTENT_W / 3.0] * 3, hAlign="LEFT")
    t.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 14),
                ("RIGHTPADDING", (0, 0), (-1, -1), 14),
                ("TOPPADDING", (0, 0), (-1, -1), 12),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 12),
                ("BACKGROUND", (0, 0), (-1, -1), SOFT_BG),
                ("LINEABOVE", (0, 0), (-1, 0), 2, CYAN),
            ]
        )
    )
    story.append(t)
    story.append(Spacer(1, 14))

    # Why it exists
    story += eyebrow_heading("CONTEXT", "Why it exists")
    story.append(
        Paragraph(
            f"The public VAERS dataset is released as ~700 MB of CSVs at "
            f"{link('vaers.hhs.gov/data/datasets.html', 'https://vaers.hhs.gov/data/datasets.html')}. "
            f"The patient who asks <i>“is my report in there?”</i> has no "
            f"reasonable path through that workflow, and the official lookup "
            f"tool (CDC WONDER) is desktop-only and not built for one-off "
            f"self-queries.",
            STY_BODY,
        )
    )
    story.append(
        Paragraph(
            "CheckVAERS is the missing four-question interface over the same "
            "data: surface matching VAERS_IDs, or honestly say <i>no match — "
            "here are the partial matches to review.</i>",
            STY_BODY,
        )
    )

    story.append(PageBreak())

    # ---------------------------------------------------------- #
    # Page 3 — Data                                              #
    # ---------------------------------------------------------- #
    story += eyebrow_heading("DATA", "Provenance, coverage, and de-identification")
    story.append(
        kv_table(
            [
                ("Source", "vaers.hhs.gov public CSV exports (VAERSDATA, VAERSVAX, VAERSSYMPTOMS)"),
                ("Coverage", "2020 – 2025"),
                ("Filter", f"{mono('VAX_TYPE = &quot;COVID19&quot;')} with a valid {mono('VAX_DATE')}"),
                ("Records", "<b>889,521</b>"),
                (
                    "Manufacturer split",
                    "Pfizer/BioNTech 47% &nbsp;·&nbsp; Moderna 46% &nbsp;·&nbsp; Janssen 6% &nbsp;·&nbsp; Novavax &lt;1% &nbsp;·&nbsp; Unknown &lt;1%",
                ),
                (
                    "De-identification",
                    "Performed upstream by HHS per HIPAA Privacy Rule §164.514(b) Safe Harbor before public release. CheckVAERS only ever consumes the already-de-identified version.",
                ),
                (
                    "Refresh cadence",
                    f"Manual re-prep against the latest published CSVs. Current snapshot tagged {link('v0.1.1-data', RELEASE_URL)}.",
                ),
                (
                    "Snapshot size",
                    "15 MB gzipped (≈60 MB uncompressed), served same-origin via an edge proxy to satisfy browser CORS constraints on the upstream GitHub-hosted release.",
                ),
            ]
        )
    )

    story.append(PageBreak())

    # Matching algorithm — kept together so the table + summary don't
    # split awkwardly across a page boundary.
    algo_block: list = []
    algo_block += eyebrow_heading("ALGORITHM", "Matching, in spec form")
    algo_block.append(
        Paragraph(
            f"<b>Input.</b> {mono('state')} (USPS 2-letter), {mono('sex')} "
            f"(M / F / U, matching VAERS schema), "
            f"{mono('dob → ageYears')}, and "
            f"{mono('vaccineDates[]')} (1–5 ISO {mono('YYYY-MM-DD')} dates).",
            STY_BODY,
        )
    )
    algo_block.append(
        algo_bucket_table(
            [
                (
                    "Exact",
                    "<b>state</b> and <b>sex</b> equal; <b>|ageDelta| ≤ 1 year</b>; "
                    "<b>any</b> user dose date within <b>±7 days</b> of the record's VAX_DATE.",
                    "Returned in full.",
                ),
                (
                    "Potential",
                    "<b>state</b> and <b>sex</b> equal; <b>|ageDelta| ≤ 5 years</b>; "
                    "any user dose date within <b>±30 days</b>.",
                    "Capped at 20, sorted ascending by combined age + date delta. Exact-bucket records excluded.",
                ),
                (
                    "None",
                    "Both buckets empty.",
                    "Result page surfaces the dataset metadata and offers the Report deep-link.",
                ),
            ]
        )
    )
    algo_block.append(Spacer(1, 6))
    algo_block.append(
        Paragraph(
            "Records are stratified by a state-keyed index built once at "
            "data-load time. Per-check latency on the full 900k-record "
            "dataset is <b>under 10 ms on a phone CPU</b>, well below one "
            "frame.",
            STY_BODY,
        )
    )
    story.append(KeepTogether(algo_block))

    # ---------------------------------------------------------- #
    # Page 4 — Privacy posture                                   #
    # ---------------------------------------------------------- #
    story += eyebrow_heading("PRIVACY", "Why HIPAA does not attach")
    story.append(
        callout(
            "“We do not store PHI in the first place.”",
            "The defensible answer to a reviewer asking how PHI is encrypted at rest.",
        )
    )
    story.append(Spacer(1, 10))
    story += bullet_list(
        [
            "<b>No PHI is processed.</b> The dataset is de-identified by HHS before release; we read only that copy.",
            "<b>HIPAA does not attach.</b> CheckVAERS is a consumer-facing search tool, not a covered entity or business associate. The Privacy Rule does not apply to a consumer's voluntary self-query against public data.",
            "<b>User inputs never leave the device.</b> State, sex, DOB, and dose dates stay in the browser. Matching runs entirely in client-side JavaScript.",
            "<b>Local-only persistence.</b> Completed checks save to IndexedDB on the user's device. There is no server-side database.",
            "<b>HTTPS-only.</b> Snapshot is ETag-validated on first launch and cached for offline use.",
            "<b>No accounts. No tracking. No analytics. No third-party scripts.</b>",
        ]
    )

    # UX flow
    story += eyebrow_heading("FLOW", "Six steps, one screen apiece")
    story += numbered_list(
        [
            "<b>State</b> — searchable USPS dropdown.",
            "<b>Sex</b> — M / F / Prefer not to say.",
            "<b>Date of birth</b> — native date picker; age computed and displayed inline.",
            "<b>Vaccine dose date(s)</b> — 1 to 5 entries.",
            "<b>Review</b> — single screen, every row deep-linked back to its edit step.",
            "<b>Result</b> — YES / MAYBE / NO headline with the VAERS_ID list, manufacturer breakdown, and a CDC WONDER deep link to the canonical full report.",
        ]
    )
    story.append(Spacer(1, 4))
    story.append(
        Paragraph(
            f"Draft is autosaved to {mono('sessionStorage')} for refresh "
            f"resilience. Completed checks appear in a per-device History tab "
            f"keyed by the device, not by identity.",
            STY_BODY,
        )
    )

    story.append(PageBreak())

    # ---------------------------------------------------------- #
    # Page 5 — Trade-off + What it isn't                         #
    # ---------------------------------------------------------- #
    story += eyebrow_heading("TRADE-OFF", "A deliberate omission, called out plainly")
    story.append(
        Paragraph(
            f"The prepared snapshot omits four fields that would otherwise "
            f"inflate the in-browser object graph past iOS Safari's per-tab "
            f"memory budget: {mono('SYMPTOM_TEXT')} (narrative), "
            f"{mono('RECVDATE')}, {mono('NUMDAYS')}, and the 4th–5th "
            f"{mono('SYMPTOM')} codes.",
            STY_BODY,
        )
    )
    story.append(
        Paragraph(
            f"Each result card shows: {mono('VAERS_ID')}, manufacturer, "
            f"vaccination date, state, age, top 3 coded symptoms, and a "
            f"<b>“View full report on CDC WONDER”</b> link by "
            f"{mono('VAERS_ID')}. The full record — narrative, days to "
            f"onset, treatment, recovery — is one click away at the "
            f"canonical source.",
            STY_BODY,
        )
    )
    story.append(
        Paragraph(
            "This was an engineering choice, not a content choice: keep the "
            "browser memory budget safe on a six-year-old iPhone, and let "
            "CDC WONDER serve as the authoritative detail layer.",
            STY_BODY,
        )
    )

    # What this is not
    story += eyebrow_heading("BOUNDARIES", "What CheckVAERS is not")
    story.append(
        callout(
            "“A VAERS match is a report, not a diagnosis.”",
            "The same framing CDC uses when describing VAERS' role in safety surveillance.",
        )
    )
    story.append(Spacer(1, 10))
    story += bullet_list(
        [
            "Not medical advice. Not a diagnostic tool.",
            "Not a causation tool.",
            f"Not a substitute for filing a VAERS report — the Report tab deep-links to {link('vaers.hhs.gov/reportevent.html', 'https://vaers.hhs.gov/reportevent.html')}.",
            "Not affiliated with CDC, FDA, HHS, or any government agency.",
            "Not a real-time mirror of the live VAERS database. The snapshot lags.",
        ],
        tight=True,
    )

    story.append(PageBreak())

    # ---------------------------------------------------------- #
    # Page 6 — Architecture + Roadmap + Links                    #
    # ---------------------------------------------------------- #
    story += eyebrow_heading("ENGINEERING", "Architecture in one paragraph")
    story.append(
        Paragraph(
            f"Next.js 14 (App Router, TypeScript), deployed as two Vercel "
            f"projects from the same monorepo: a <i>site</i> build (rich "
            f"desktop-first marketing landing) and an <i>app</i> build "
            f"(mobile-first PWA, installable to home screen). The two share "
            f"100% of the functional code; a single "
            f"{mono('NEXT_PUBLIC_VARIANT')} env var selects the home-route "
            f"presentation. The client matcher is an in-browser "
            f"state-indexed scan. Persistence is Dexie over IndexedDB "
            f"(check history + data cache). The dataset is prepared by a "
            f"Node script from raw HHS year CSVs and published as a GitHub "
            f"Release asset; the client fetches it via a same-origin "
            f"{mono('/api/vaers-data')} route that follows the upstream "
            f"redirects server-side (the upstream "
            f"release-assets.githubusercontent.com does not send CORS "
            f"headers, so a direct fetch would fail). A service worker "
            f"caches the app shell and the data file for offline use.",
            STY_BODY,
        )
    )

    # Roadmap
    story += eyebrow_heading("ROADMAP", "What comes next")

    story.append(Paragraph("Near-term", STY_H3))
    story += bullet_list(
        [
            "<b>Per-state lazy loading.</b> The API endpoint returns only the user's state slice on demand, dropping first-load payload from 15 MB to 1–3 MB and removing the mobile memory ceiling entirely.",
            f"<b>Detail-on-demand.</b> A {mono('/api/vaers-detail/[id]')} route restores the narrative, days-to-onset, and receive-date fields per match — without re-bloating the in-browser dataset.",
        ],
        tight=True,
    )

    story.append(Paragraph("Medium-term", STY_H3))
    story += bullet_list(
        [
            "Coverage beyond COVID-19 (flu, MMR, HPV, etc.) using the same prep pipeline and matcher.",
            "A VICP / CICP eligibility flowchart on the Learn tab.",
            "Optional opt-in Plausible analytics for usage metrics — privacy-respecting, no cross-site cookies.",
        ],
        tight=True,
    )

    story.append(Paragraph("Open question", STY_H3))
    story += bullet_list(
        [
            "Whether a clinician-facing variant — full record fields client-side, desktop memory budget assumed — is worth a separate build.",
        ],
        tight=True,
    )

    # Links
    story += eyebrow_heading("REFERENCES", "Links")
    link_table_data = [
        ["Site (marketing)", link(SITE_URL, SITE_URL)],
        ["App (PWA)", link(APP_URL, APP_URL)],
        ["Source code", link(REPO_URL, REPO_URL)],
        ["Current data snapshot", link(RELEASE_URL, RELEASE_URL)],
        ["Contact", f"<font color='#29C5F6'>{CONTACT}</font>"],
    ]
    rows = []
    for label, val in link_table_data:
        rows.append(
            [Paragraph(label, STY_TABLE_LABEL), Paragraph(val, STY_TABLE_CELL)]
        )
    t = Table(rows, colWidths=[1.7 * inch, CONTENT_W - 1.7 * inch], hAlign="LEFT")
    t.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 10),
                ("RIGHTPADDING", (0, 0), (-1, -1), 10),
                ("TOPPADDING", (0, 0), (-1, -1), 7),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
                ("LINEBELOW", (0, 0), (-1, -2), 0.5, RULE),
            ]
        )
    )
    story.append(t)

    return story


# -------------------------------------------------------------- #
# Build                                                          #
# -------------------------------------------------------------- #


def build_pdf(out_path: Path) -> None:
    doc = BaseDocTemplate(
        str(out_path),
        pagesize=LETTER,
        leftMargin=MARGIN_X,
        rightMargin=MARGIN_X,
        topMargin=0.85 * inch,
        bottomMargin=0.7 * inch,
        title="CheckVAERS — Clinician Brief",
        author="CheckVAERS",
        subject="Clinician brief for stakeholder review",
        creator="reportlab",
    )

    cover_frame = Frame(
        0, 0, PAGE_W, PAGE_H,
        leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0,
        showBoundary=0,
    )
    content_frame = Frame(
        MARGIN_X,
        0.7 * inch,
        CONTENT_W,
        PAGE_H - 0.85 * inch - 0.7 * inch,
        leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0,
        showBoundary=0,
    )

    doc.addPageTemplates(
        [
            PageTemplate(id="cover", frames=[cover_frame], onPage=draw_cover),
            PageTemplate(
                id="content",
                frames=[content_frame],
                onPage=draw_content_chrome,
            ),
        ]
    )

    doc.build(build_story())


if __name__ == "__main__":
    out = Path("CheckVAERS-clinician-brief.pdf")
    build_pdf(out)
    print(f"Wrote {out.resolve()}")
