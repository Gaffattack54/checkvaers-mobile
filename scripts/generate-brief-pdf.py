"""
Generate the CheckVAERS clinician brief PDF.

A long-form, image-heavy walkthrough designed for a clinical / executive
audience. Builds the cover from canvas primitives, then assembles ~20
content pages via Platypus flowables.

Run:  python scripts/generate-brief-pdf.py
"""

from __future__ import annotations

from pathlib import Path
from PIL import Image as PILImage, ImageDraw, ImageFilter

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
    Image,
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
NAVY_LINE = colors.HexColor("#1F3463")
CYAN = colors.HexColor("#29C5F6")
CYAN_TINT = colors.HexColor("#E6F8FE")
TEXT = colors.HexColor("#1A2333")
MUTED = colors.HexColor("#5A6577")
RULE = colors.HexColor("#E5E7EB")
SOFT_BG = colors.HexColor("#F8FAFC")

PAGE_W, PAGE_H = LETTER
MARGIN_X = 0.75 * inch
MARGIN_Y_TOP = 0.85 * inch
MARGIN_Y_BOT = 0.7 * inch
CONTENT_W = PAGE_W - 2 * MARGIN_X
CONTENT_H = PAGE_H - MARGIN_Y_TOP - MARGIN_Y_BOT

REPO_URL = "https://github.com/Gaffattack54/checkvaers-mobile"
SITE_URL = "https://checkvaers-site.vercel.app"
APP_URL = "https://check-vaers.vercel.app"
RELEASE_URL = (
    "https://github.com/Gaffattack54/checkvaers-mobile/releases/tag/v0.1.1-data"
)
CONTACT = "hello@checkvaers.app"

SHOTS_DIR = Path("brief-shots")
PHONE_SHOTS_DIR = Path("C:/Users/admin/Downloads/brief-attachments")


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
    to = canv.beginText(x, y)
    to.setFont(font, size)
    if color is not None:
        to.setFillColor(color)
    to.setCharSpace(tracking)
    to.textOut(text)
    canv.drawText(to)


def img_dims(path: Path) -> tuple[int, int]:
    with PILImage.open(path) as im:
        return im.size  # (w, h)


# ---- screenshot post-processor --------------------------------- #

PROCESSED_DIR = Path("brief-shots/processed")
PROCESSED_DIR.mkdir(parents=True, exist_ok=True)


def process_screenshot(
    path: Path,
    *,
    is_iphone: bool = False,
    corner_radius_pct: float = 0.025,  # of min(w, h)
    shadow_opacity: int = 70,
    shadow_blur: int = 36,
    shadow_dy: int = 14,
    padding: int = 60,
) -> Path:
    """Process a screenshot for embedding: crop iOS chrome if asked,
    apply rounded corners and a soft drop shadow on a white canvas.
    Cached — subsequent calls with the same source return the cached
    output."""
    out = PROCESSED_DIR / path.name
    if out.exists() and out.stat().st_mtime >= path.stat().st_mtime:
        return out

    img = PILImage.open(path).convert("RGBA")
    w, h = img.size

    # iPhone 14 screenshot: 1170 × 2532 with iOS status bar at top and
    # the Safari URL/toolbar at bottom. Trim both so only the page
    # content remains.
    if is_iphone and (w, h) == (1170, 2532):
        img = img.crop((0, 170, 1170, 2532 - 440))
        w, h = img.size

    # Rounded corner mask.
    radius = max(12, int(min(w, h) * corner_radius_pct))
    mask = PILImage.new("L", (w, h), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, w, h), radius, fill=255)
    img.putalpha(mask)

    # Build a white canvas big enough for the shadow.
    canvas_w = w + padding * 2
    canvas_h = h + padding * 2
    canvas = PILImage.new("RGBA", (canvas_w, canvas_h), (255, 255, 255, 255))

    # Shadow: solid dark layer matching the rounded mask, then blurred.
    shadow_layer = PILImage.new("RGBA", (canvas_w, canvas_h), (255, 255, 255, 0))
    shadow_solid = PILImage.new("RGBA", (w, h), (0, 0, 0, shadow_opacity))
    # Apply the rounded mask to the shadow as well.
    shadow_solid.putalpha(
        PILImage.eval(mask, lambda v: int(v * shadow_opacity / 255))
    )
    shadow_layer.paste(shadow_solid, (padding, padding + shadow_dy), shadow_solid)
    shadow_layer = shadow_layer.filter(ImageFilter.GaussianBlur(shadow_blur))
    canvas.alpha_composite(shadow_layer)

    # The screenshot, on top of the shadow.
    canvas.alpha_composite(img, dest=(padding, padding))

    # Flatten onto pure white so reportlab handles it cleanly.
    final = PILImage.new("RGB", canvas.size, (255, 255, 255))
    final.paste(canvas, mask=canvas.split()[3])
    final.save(out, "PNG", optimize=True)
    return out


def fit_image(
    path: Path,
    *,
    max_w: float,
    max_h: float | None = None,
) -> Image:
    """Scale an image to fit max_w × max_h. Expects the source to be
    pre-processed (rounded + shadow + white background)."""
    w, h = img_dims(path)
    scale = max_w / w
    if max_h is not None:
        scale = min(scale, max_h / h)
    out_w, out_h = w * scale, h * scale
    return Image(str(path), width=out_w, height=out_h)


# -------------------------------------------------------------- #
# Paragraph styles                                               #
# -------------------------------------------------------------- #

_styles = getSampleStyleSheet()


def style(
    name,
    *,
    parent="Normal",
    fontName="Helvetica",
    fontSize=10,
    leading=None,
    spaceBefore=0,
    spaceAfter=0,
    textColor=TEXT,
    alignment=TA_LEFT,
    leftIndent=0,
    firstLineIndent=0,
    bulletIndent=0,
    tracking=0,
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
        kwargs["charSpace"] = tracking
    return ParagraphStyle(**kwargs)


STY_EYEBROW = style(
    "Eyebrow",
    fontName="Helvetica-Bold",
    fontSize=8,
    textColor=CYAN,
    spaceAfter=4,
    tracking=2.5,
)
STY_PAGE_TITLE = style(
    "PageTitle",
    fontName="Helvetica-Bold",
    fontSize=24,
    leading=28,
    textColor=NAVY,
    spaceAfter=4,
)
STY_H2 = style(
    "H2",
    fontName="Helvetica-Bold",
    fontSize=14,
    leading=18,
    textColor=NAVY,
    spaceBefore=14,
    spaceAfter=4,
)
STY_H3 = style(
    "H3",
    fontName="Helvetica-Bold",
    fontSize=10.5,
    leading=14,
    textColor=NAVY,
    spaceBefore=8,
    spaceAfter=2,
)
STY_BODY = style(
    "Body",
    fontSize=10.5,
    leading=15.5,
    spaceAfter=8,
)
STY_LEAD = style(
    "Lead",
    fontSize=12,
    leading=18,
    textColor=NAVY,
    spaceAfter=10,
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
STY_CALLOUT_HEAD = style(
    "CalloutHead",
    fontName="Helvetica-Bold",
    fontSize=13,
    leading=18,
    textColor=NAVY,
    leftIndent=12,
)
STY_CALLOUT_BODY = style(
    "CalloutBody",
    fontSize=9.5,
    leading=13,
    textColor=MUTED,
    leftIndent=12,
    spaceAfter=2,
)
STY_TABLE_HEAD = style(
    "TableHead",
    fontName="Helvetica-Bold",
    fontSize=9,
    leading=11,
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
STY_CAPTION = style(
    "Caption",
    fontSize=8.5,
    leading=12,
    textColor=MUTED,
    spaceBefore=4,
    spaceAfter=10,
)
STY_TOC_ROW = style(
    "TOCRow",
    fontSize=11,
    leading=18,
    textColor=NAVY,
    spaceAfter=0,
)
STY_COVER_TAGLINE = style(
    "CoverTagline",
    fontSize=15,
    leading=22,
    textColor=colors.HexColor("#C9D4E8"),
    alignment=TA_LEFT,
)


def mono(text: str) -> str:
    return f'<font face="Courier" color="#0B1B3B">{text}</font>'


def link(text: str, href: str) -> str:
    return f'<link href="{href}"><font color="#29C5F6">{text}</font></link>'


def section_rule(width: float = 1.5 * inch) -> HRFlowable:
    return HRFlowable(
        width=width,
        thickness=2,
        color=CYAN,
        spaceBefore=2,
        spaceAfter=10,
        hAlign="LEFT",
    )


def page_header(eyebrow: str, title: str) -> list:
    return [
        Paragraph(eyebrow, STY_EYEBROW),
        Paragraph(title, STY_PAGE_TITLE),
        section_rule(),
    ]


def callout(headline: str, body: str | None = None) -> Table:
    cells = [[Paragraph(headline, STY_CALLOUT_HEAD)]]
    if body:
        cells.append([Paragraph(body, STY_CALLOUT_BODY)])
    t = Table(cells, colWidths=[CONTENT_W], hAlign="LEFT")
    t.setStyle(
        TableStyle(
            [
                ("LEFTPADDING", (0, 0), (-1, -1), 16),
                ("RIGHTPADDING", (0, 0), (-1, -1), 14),
                ("TOPPADDING", (0, 0), (0, 0), 12),
                ("BOTTOMPADDING", (0, -1), (-1, -1), 12),
                ("BACKGROUND", (0, 0), (-1, -1), CYAN_TINT),
                ("LINEBEFORE", (0, 0), (0, -1), 3, CYAN),
            ]
        )
    )
    return t


def bullets(items: list[str], *, tight: bool = False) -> list:
    sty = STY_LIST_TIGHT if tight else STY_LIST
    return [
        Paragraph(
            f'<font color="#29C5F6">●</font>&nbsp;&nbsp;{item}',
            sty,
        )
        for item in items
    ]


def numbered(items: list[str], *, tight: bool = True) -> list:
    sty = STY_LIST_TIGHT if tight else STY_LIST
    return [
        Paragraph(
            f'<font color="#29C5F6"><b>{i}.</b></font>&nbsp;&nbsp;{item}',
            sty,
        )
        for i, item in enumerate(items, 1)
    ]


def kv_table(rows: list[tuple[str, str]], *, label_w: float = 1.6 * inch) -> Table:
    data = [
        [Paragraph(k, STY_TABLE_LABEL), Paragraph(v, STY_TABLE_CELL)] for k, v in rows
    ]
    t = Table(data, colWidths=[label_w, CONTENT_W - label_w], hAlign="LEFT")
    cmds = [
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("LINEBELOW", (0, 0), (-1, -2), 0.5, RULE),
        ("BACKGROUND", (0, 0), (0, -1), SOFT_BG),
    ]
    for i in range(len(data)):
        if i % 2 == 1:
            cmds.append(("BACKGROUND", (1, i), (1, i), SOFT_BG))
    t.setStyle(TableStyle(cmds))
    return t


def three_col_table(
    header: tuple[str, str, str], rows: list[tuple[str, str, str]]
) -> Table:
    head = [Paragraph(c, STY_TABLE_HEAD) for c in header]
    data = [head]
    for r in rows:
        data.append(
            [
                Paragraph(f"<b>{r[0]}</b>", STY_TABLE_LABEL),
                Paragraph(r[1], STY_TABLE_CELL),
                Paragraph(r[2], STY_TABLE_CELL),
            ]
        )
    col1 = 1.1 * inch
    col2 = 3.3 * inch
    t = Table(
        data,
        colWidths=[col1, col2, CONTENT_W - col1 - col2],
        hAlign="LEFT",
    )
    cmds = [
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
            cmds.append(("BACKGROUND", (0, i), (-1, i), SOFT_BG))
    t.setStyle(TableStyle(cmds))
    return t


def image_with_caption(
    image_path: Path,
    caption: str,
    *,
    max_w: float | None = None,
    max_h: float | None = None,
    is_iphone: bool = False,
) -> list:
    if max_w is None:
        max_w = CONTENT_W
    processed = process_screenshot(image_path, is_iphone=is_iphone)
    flow = [fit_image(processed, max_w=max_w, max_h=max_h)]
    flow.append(Paragraph(caption, STY_CAPTION))
    return flow


def _grid_images(
    paths_with_meta: list[tuple[Path, bool]],
    *,
    captions: list[str] | None = None,
    gap: float = 0.18 * inch,
) -> list:
    """N-up image grid. paths_with_meta is list of (path, is_iphone)."""
    n = len(paths_with_meta)
    cell_w = (CONTENT_W - (n - 1) * gap) / n
    cells = []
    for p, is_iphone in paths_with_meta:
        proc = process_screenshot(p, is_iphone=is_iphone)
        w, h = img_dims(proc)
        scale = cell_w / w
        cells.append(Image(str(proc), width=w * scale, height=h * scale))
    col_widths = [cell_w + 1] * n
    t = Table([cells], colWidths=col_widths, hAlign="LEFT")
    cmds = [
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
    ]
    for i in range(1, n):
        cmds.append(("LEFTPADDING", (i, 0), (i, 0), gap))
    t.setStyle(TableStyle(cmds))
    out = [t]
    if captions:
        cap_cells = [[Paragraph(c, STY_CAPTION) for c in captions]]
        ct = Table(cap_cells, colWidths=col_widths, hAlign="LEFT")
        ccmds = [
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LEFTPADDING", (0, 0), (-1, -1), 0),
            ("RIGHTPADDING", (0, 0), (-1, -1), 0),
            ("TOPPADDING", (0, 0), (-1, -1), 2),
        ]
        for i in range(1, n):
            ccmds.append(("LEFTPADDING", (i, 0), (i, 0), gap))
        ct.setStyle(TableStyle(ccmds))
        out.append(ct)
    return out


def side_by_side_images(
    left: Path,
    right: Path,
    *,
    left_caption: str = "",
    right_caption: str = "",
    left_iphone: bool = False,
    right_iphone: bool = False,
    gap: float = 0.25 * inch,
) -> list:
    captions = [left_caption, right_caption] if (left_caption or right_caption) else None
    return _grid_images(
        [(left, left_iphone), (right, right_iphone)],
        captions=captions,
        gap=gap,
    )


def three_phone_row(
    paths: list[Path], *, captions: list[str] | None = None
) -> list:
    """Three user-supplied iPhone screenshots in a 3-up grid."""
    return _grid_images(
        [(p, True) for p in paths],
        captions=captions,
    )


def two_phone_row(
    paths: list[Path], *, captions: list[str] | None = None
) -> list:
    """Two iPhone screenshots side-by-side — larger and clearer than 3-up."""
    return _grid_images(
        [(p, True) for p in paths],
        captions=captions,
        gap=0.4 * inch,
    )


# -------------------------------------------------------------- #
# Cover                                                          #
# -------------------------------------------------------------- #


def draw_cover(canv: canvas.Canvas, doc) -> None:
    canv.saveState()
    canv.setFillColor(NAVY)
    canv.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)

    # Soft cyan glow in the upper right.
    glow_cx = PAGE_W - 1.4 * inch
    glow_cy = PAGE_H - 1.6 * inch
    for i in range(14, 0, -1):
        r = i * 12
        t = 1 - i / 14
        col = colors.Color(
            (NAVY.red * (1 - t) + CYAN.red * t * 0.18),
            (NAVY.green * (1 - t) + CYAN.green * t * 0.18),
            (NAVY.blue * (1 - t) + CYAN.blue * t * 0.18),
        )
        canv.setStrokeColor(col)
        canv.setLineWidth(0.4)
        canv.circle(glow_cx, glow_cy, r, stroke=1, fill=0)

    text_x = 0.85 * inch
    text_w = PAGE_W - text_x - 0.85 * inch

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
    canv.setStrokeColor(NAVY_LINE)
    canv.setLineWidth(0.6)
    canv.line(text_x, PAGE_H - 1.32 * inch, text_x + 1.2 * inch, PAGE_H - 1.32 * inch)

    word_y = PAGE_H - 3.3 * inch
    to = canv.beginText(text_x, word_y)
    to.setFillColor(colors.white)
    to.setFont("Helvetica-Bold", 64)
    to.setCharSpace(-0.5)
    to.textOut("CheckVAERS")
    canv.drawText(to)
    canv.setFillColor(CYAN)
    canv.rect(text_x, word_y - 0.32 * inch, 1.4 * inch, 0.05 * inch, fill=1, stroke=0)

    tagline = Paragraph(
        "An on-device search interface<br/>to the public VAERS COVID-19 dataset.",
        STY_COVER_TAGLINE,
    )
    tagline.wrapOn(canv, text_w, 3 * inch)
    tagline.drawOn(canv, text_x, word_y - 1.45 * inch)

    bottom_y = 1.55 * inch
    canv.setStrokeColor(NAVY_LINE)
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

    canv.setFillColor(colors.HexColor("#7F8CA6"))
    canv.setFont("Helvetica", 9)
    canv.drawString(text_x, 0.75 * inch, "checkvaers-site.vercel.app")
    canv.setFillColor(colors.HexColor("#5C6A82"))
    canv.setFont("Helvetica", 9)
    canv.drawRightString(PAGE_W - text_x, 0.75 * inch, "v0.1.1 — May 2026")

    canv.restoreState()


# -------------------------------------------------------------- #
# Content chrome                                                 #
# -------------------------------------------------------------- #


def draw_content_chrome(canv: canvas.Canvas, doc) -> None:
    canv.saveState()
    page = canv.getPageNumber()
    display = page - 1

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

    canv.setStrokeColor(RULE)
    canv.setLineWidth(0.5)
    canv.line(MARGIN_X, 0.55 * inch, PAGE_W - MARGIN_X, 0.55 * inch)
    canv.setFillColor(MUTED)
    canv.setFont("Helvetica", 8.5)
    canv.drawString(MARGIN_X, 0.4 * inch, "CheckVAERS · checkvaers-site.vercel.app")
    canv.drawRightString(PAGE_W - MARGIN_X, 0.4 * inch, f"{display}")
    canv.restoreState()


# -------------------------------------------------------------- #
# Page helpers — each returns a list of flowables ending in PageBreak
# -------------------------------------------------------------- #


def shot(name: str) -> Path:
    return SHOTS_DIR / f"{name}.png"


def phone(name: str) -> Path:
    return PHONE_SHOTS_DIR / f"{name}.png"


# -------------------------------------------------------------- #
# Content                                                        #
# -------------------------------------------------------------- #


def build_story() -> list:
    story: list = []

    # ---------- COVER ----------
    story.append(Spacer(1, 1))
    story.append(NextPageTemplate("content"))
    story.append(PageBreak())

    # ---------- TABLE OF CONTENTS ----------
    story += page_header("CONTENTS", "What's in this brief")
    story.append(
        Paragraph(
            "Twenty-one short sections, mostly visual. The reader who only "
            "scans the screenshots should still come away with the gist; "
            "the reader who wants the matcher spec or the regulatory "
            "posture will find it.",
            STY_BODY,
        )
    )

    toc = [
        ("01", "In one sentence", 3),
        ("02", "Why CheckVAERS exists", 4),
        ("03", "Product walkthrough — the marketing site", 5),
        ("04", "Site at a glance — hero, stats, how-it-works", 6),
        ("05", "Site features and FAQ", 7),
        ("06", "The mobile-installable PWA", 8),
        ("07", "Side-by-side: site vs. app", 9),
        ("08", "Check flow — landing and state picker", 10),
        ("09", "Check flow — sex, DOB, dose dates", 11),
        ("10", "Check flow — review and result", 12),
        ("11", "Result page anatomy", 13),
        ("12", "Learn tab — content depth", 14),
        ("13", "Report tab — guided VAERS reporting", 15),
        ("14", "History tab — local-only persistence", 16),
        ("15", "Data: source, coverage, refresh", 17),
        ("16", "Matching algorithm", 18),
        ("17", "Privacy and regulatory posture", 19),
        ("18", "Technical architecture", 20),
        ("19", "Known limits and tradeoffs", 21),
        ("20", "Roadmap", 22),
        ("21", "Appendix and references", 23),
    ]
    rows = []
    for num, title, page in toc:
        rows.append(
            [
                Paragraph(
                    f'<font color="#29C5F6"><b>{num}</b></font>',
                    STY_TOC_ROW,
                ),
                Paragraph(title, STY_TOC_ROW),
                Paragraph(
                    f'<font color="#5A6577">{page}</font>',
                    style(
                        "tocPage",
                        fontSize=11,
                        leading=18,
                        textColor=MUTED,
                        alignment=2,  # right
                    ),
                ),
            ]
        )
    toc_t = Table(rows, colWidths=[0.5 * inch, CONTENT_W - 1.0 * inch, 0.5 * inch])
    toc_t.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("LEFTPADDING", (0, 0), (-1, -1), 4),
                ("RIGHTPADDING", (0, 0), (-1, -1), 4),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                ("LINEBELOW", (0, 0), (-1, -2), 0.4, RULE),
            ]
        )
    )
    story.append(toc_t)
    story.append(PageBreak())

    # ---------- 01 — In one sentence ----------
    story += page_header("01 · OVERVIEW", "In one sentence.")
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

    story.append(Spacer(1, 16))
    story.append(
        callout(
            "Two front doors, one engine.",
            "checkvaers-site.vercel.app is the marketing site (desktop-first, image-heavy, written for first-time visitors). check-vaers.vercel.app is the same product packaged as a mobile-installable PWA. Both share 100% of the matcher, data layer, and check flow.",
        )
    )
    story.append(PageBreak())

    # ---------- 02 — Why it exists ----------
    story += page_header("02 · CONTEXT", "Why CheckVAERS exists.")
    story.append(
        Paragraph(
            f"The public VAERS dataset is released as a ~700 MB bundle of "
            f"CSVs at {link('vaers.hhs.gov/data/datasets.html', 'https://vaers.hhs.gov/data/datasets.html')}. "
            f"Three files per year — <i>VAERSDATA</i>, <i>VAERSVAX</i>, "
            f"<i>VAERSSYMPTOMS</i> — joined on {mono('VAERS_ID')}. "
            f"For a researcher this is fine; for a patient who asks "
            f"<i>“is my report in there?”</i> it is unusable.",
            STY_BODY,
        )
    )
    story.append(
        Paragraph(
            "The official lookup tool, CDC WONDER, is built for population-"
            "level queries — counts of events by age band, manufacturer, or "
            "outcome — not for one-off self-queries by an individual. The "
            "patient with a printed vaccination card has nowhere reasonable "
            "to go.",
            STY_BODY,
        )
    )
    story.append(Paragraph("What CheckVAERS contributes", STY_H2))
    story += bullets(
        [
            "A four-question interface that matches the patient's own card data against the same federal dataset.",
            "An honest result page that surfaces either matching <b>VAERS_ID</b>s or partial matches for the patient to review.",
            "A deep link from each match into CDC WONDER for the canonical full report.",
            "Plain-language education on the regulatory environment (PREP Act, CICP, VICP) so the patient knows what their match — or non-match — actually means.",
        ]
    )
    story.append(Spacer(1, 8))
    story.append(
        callout(
            "“No PHI processed, no server, no account.”",
            "What the rest of this brief is structured to defend. Every architectural choice flows from that statement.",
        )
    )
    story.append(PageBreak())

    # ---------- 03 — Product walkthrough — marketing site ----------
    story += page_header(
        "03 · PRODUCT", "The marketing site, end-to-end."
    )
    story.append(
        Paragraph(
            "checkvaers-site.vercel.app is desktop-first and responsive. "
            "Below: the hero on a 1440 × 900 laptop. The phone mockup on "
            "the right hand side renders an actual result-page summary "
            "for a CA / Female / age 45 / 2021-03-11 query.",
            STY_BODY,
        )
    )
    story += image_with_caption(
        shot("site_dt_home"),
        "Site landing, desktop. <b>checkvaers-site.vercel.app</b>. Headline is the same question that brought the patient to the site; CTAs split between starting a check and reading background.",
        max_w=CONTENT_W,
    )
    story.append(PageBreak())

    # ---------- 04 — Site at a glance ----------
    story += page_header("04 · SITE", "At a glance, on a phone.")
    story.append(
        Paragraph(
            "The same site at iPhone 14 width — the most common form factor for first-touch traffic in the patient population.",
            STY_BODY,
        )
    )
    story += three_phone_row(
        [phone("IMG_3018"), phone("IMG_3019"), phone("IMG_3020")],
        captions=[
            "Hero — headline + dual CTAs + four trust bullets.",
            "Stats band — dataset scale at a glance.",
            "How it works (1 of 4) — geographic narrowing.",
        ],
    )
    story.append(Spacer(1, 14))
    story += three_phone_row(
        [phone("IMG_3021"), phone("IMG_3022"), phone("IMG_3023")],
        captions=[
            "How it works (4 of 4) + start of features.",
            "Features — privacy, real data, PWA.",
            "Features — offline, no accounts, open source.",
        ],
    )
    story.append(PageBreak())

    # ---------- 05 — Site features + FAQ ----------
    story += page_header("05 · SITE", "Features and FAQ, full content.")
    story.append(
        Paragraph(
            "Six feature tiles structure the value proposition in roughly "
            "the order a clinician reviewer would ask about: privacy, "
            "data provenance, mobile install path, offline behaviour, "
            "no-account posture, and source-code transparency.",
            STY_BODY,
        )
    )
    story += image_with_caption(
        shot("site_dt_home"),
        "Above the fold on desktop — visible without scrolling.",
        max_w=CONTENT_W * 0.72,
    )
    story.append(Spacer(1, 8))
    story += three_phone_row(
        [phone("IMG_3024"), phone("IMG_3025"), phone("IMG_3029")],
        captions=[
            "FAQ — “What is VAERS?” opens first.",
            "CTA band — “Ready to check?”",
            "Footer — links + privacy reaffirmation.",
        ],
    )
    story.append(PageBreak())

    # ---------- 06 — The mobile-installable PWA ----------
    story += page_header("06 · APP", "The mobile-installable PWA.")
    story.append(
        Paragraph(
            "check-vaers.vercel.app is the same product packaged as a "
            "Progressive Web App. Installable to the iOS or Android home "
            "screen; behaves like a native app afterwards — no browser "
            "chrome, persistent home tab bar, offline after the dataset "
            "downloads on first launch.",
            STY_BODY,
        )
    )
    story += image_with_caption(
        shot("app_mo_check"),
        "Check tab — landing screen on iPhone 14 width. First-launch disclaimer banner explains privacy in a single line; bottom tab bar provides constant access to Check / Learn / Report / History.",
        max_w=3.0 * inch,
    )
    story.append(PageBreak())

    # ---------- 07 — Side-by-side: site vs. app ----------
    story += page_header(
        "07 · COMPARISON", "Site and app, the same content."
    )
    story.append(
        Paragraph(
            "Both deployments build from the same monorepo. A single "
            f"{mono('NEXT_PUBLIC_VARIANT')} env var picks between the "
            "rich marketing landing (site) and the minimal app landing "
            "(app). Every functional route — check flow, learn, report, "
            "history, about, privacy — is identical across both.",
            STY_BODY,
        )
    )
    story += side_by_side_images(
        shot("site_dt_learn"),
        shot("app_mo_learn"),
        left_caption="Site /learn — desktop. Eyebrow + 4xl headline + lead, accordion below.",
        right_caption="App /learn — mobile. Centered icon hero, full-width accordion.",
    )
    story.append(Spacer(1, 12))
    story += side_by_side_images(
        shot("site_dt_report"),
        shot("app_mo_report"),
        left_caption="Site /report — desktop. Two-column: checklist + notes left, tips + CTA right.",
        right_caption="App /report — mobile. Single-column flow optimised for thumb scrolling.",
    )
    story.append(PageBreak())

    # ---------- 08 — Check flow part 1 ----------
    story += page_header(
        "08 · FLOW", "The four-question check — landing + state."
    )
    story.append(
        Paragraph(
            "The check flow is the product. Six screens total: a landing "
            "with a step preview, four input steps, a review, then a "
            "loading + result page. Each step is a dedicated route so the "
            "back button works as expected and links into the flow are "
            "shareable.",
            STY_BODY,
        )
    )
    story += side_by_side_images(
        shot("site_dt_check"),
        shot("site_dt_check-state"),
        left_caption="Check landing (desktop). Eyebrow + headline + 4-step preview cards + dual CTA. Mirrors the marketing pattern on the home page.",
        right_caption="State picker. Searchable list of 56 US states &amp; territories — typing narrows.",
    )
    story.append(PageBreak())

    # ---------- 09 — Check flow part 2 ----------
    story += page_header(
        "09 · FLOW", "Sex, date of birth, dose dates."
    )
    story.append(
        Paragraph(
            "Steps 2 through 4 collect the remaining inputs. Each step "
            "lives on its own route. The draft is auto-saved to "
            f"{mono('sessionStorage')} so a refresh mid-flow does not "
            "wipe the patient's progress.",
            STY_BODY,
        )
    )
    story.append(Spacer(1, 6))
    story.append(Paragraph("Sex picker", STY_H3))
    story.append(
        Paragraph(
            "Three options matching the VAERS schema enumeration "
            f"({mono('M')} / {mono('F')} / {mono('U')}). The “Prefer "
            "not to say” option maps to {mono('U')} — the same way "
            "VAERS records absent or refused sex.",
            STY_BODY,
        )
    )
    story.append(Paragraph("Date of birth", STY_H3))
    story.append(
        Paragraph(
            "Native HTML date picker. The computed age is shown inline "
            "(<i>“You are 47 years old”</i>) so the patient confirms the "
            "value before continuing. Validation: not future-dated, "
            "year ≥ today − 130. We never transmit the DOB; the matcher "
            f"consumes only the derived integer {mono('ageYears')}.",
            STY_BODY,
        )
    )
    story.append(Paragraph("Dose dates", STY_H3))
    story.append(
        Paragraph(
            "1 to 5 date inputs with add/remove controls. The matcher "
            "evaluates each user dose date against each VAERS record's "
            f"{mono('VAX_DATE')}; <b>any</b> dose within ±7 days qualifies "
            "as exact (±30 days as potential). This handles primary, "
            "booster, and bivalent doses without forcing the patient to "
            "pick one.",
            STY_BODY,
        )
    )
    story.append(PageBreak())

    # ---------- 10 — Check flow part 3 ----------
    story += page_header(
        "10 · FLOW", "Review and result."
    )
    story.append(
        Paragraph(
            "Step 5 is a single-screen review. Each row is a deep link "
            "back into its edit step. The “Check VAERS” CTA is only "
            "enabled when every row passes Zod validation.",
            STY_BODY,
        )
    )
    story.append(Paragraph("Result phase", STY_H3))
    story.append(
        Paragraph(
            "On submit the page transitions to a branded loading state "
            "(<i>“Searching VAERS database…”</i>). The matcher actually "
            "completes in under 10 ms — the 700 ms artificial delay "
            "exists to make the work visible and avoid a flash. The "
            "result then renders as one of three outcome variants.",
            STY_BODY,
        )
    )
    story.append(three_col_table(
        ("OUTCOME", "WHEN", "PRESENTATION"),
        [
            (
                "YES",
                "One or more records met the exact bucket.",
                "Emerald header with count, summary panel (manufacturer breakdown + top symptoms), paginated list with VAERS_ID and CDC WONDER deep link per record. Share Result button at the bottom.",
            ),
            (
                "MAYBE",
                "Zero exact, one or more potential matches.",
                "Cyan header with count, list of up to 20 potential matches sorted by combined age+date delta ascending. Each card expandable to show coded symptoms and a VAERS_ID lookup link.",
            ),
            (
                "NO",
                "Both buckets empty.",
                "Neutral header, plain-language explanation that absence of a match does not imply absence of a report. Two CTAs: File a VAERS report (deep-links to vaers.hhs.gov/reportevent.html) and Learn more.",
            ),
        ],
    ))
    story.append(PageBreak())

    # ---------- 11 — Result anatomy ----------
    story += page_header(
        "11 · RESULT", "Result page anatomy."
    )
    story.append(
        Paragraph(
            "Every result page leads with a YES / MAYBE / NO declarative "
            "headline so the patient can read the answer in one second, "
            "then offers the supporting detail.",
            STY_BODY,
        )
    )
    story.append(Paragraph("Above the cards", STY_H3))
    story += bullets(
        [
            "<b>YES — 3 matching reports.</b> (Or “Maybe — 12 partial matches.” / “No matching report found.”)",
            "Dataset metadata line: <i>“Searched 889,521 public COVID-19 VAERS reports (2020–2025). Nothing left your device.”</i>",
            "Freshness badge: <i>“Dataset generated May 30, 2026 · loaded from cache.”</i>",
        ],
        tight=True,
    )
    story.append(Paragraph("Summary panel (YES variant)", STY_H3))
    story += bullets(
        [
            "<b>By manufacturer</b> — horizontal bars per manu with count and percent: <i>Pfizer/BioNTech 58% · Moderna 34% · Janssen 8%</i>.",
            "<b>Most commonly reported symptoms</b> — pill chips with frequency counts.",
        ],
        tight=True,
    )
    story.append(Paragraph("Per-record card", STY_H3))
    story += bullets(
        [
            f"Header: VAERS_ID + manufacturer name. Tap to expand.",
            "Expanded: state, age at dose, manufacturer, vaccinated date, top 3 coded symptoms.",
            "Footer link: <i>“View full report on CDC WONDER (lookup by VAERS ID).”</i>",
        ],
        tight=True,
    )
    story.append(PageBreak())

    # ---------- 12 — Learn tab ----------
    story += page_header("12 · LEARN", "Plain-language background.")
    story.append(
        Paragraph(
            "The Learn tab is the brief's first answer to the patient's "
            "follow-on questions: <i>what is VAERS, who reports, what "
            "should I expect to find, am I eligible for compensation.</i> "
            "Eight expandable cards, each with a primary HHS / HRSA / CDC "
            "source link.",
            STY_BODY,
        )
    )
    story += three_phone_row(
        [phone("IMG_3027"), phone("IMG_3028"), phone("IMG_3030")],
        captions=[
            "Top of Learn — “What is VAERS?” opened by default.",
            "Mid-Learn — Reportable events, Provider Agreement, PREP Act, CICP cards.",
            "Hamburger menu (mobile) — global nav across the site.",
        ],
    )
    story.append(Spacer(1, 12))
    story.append(Paragraph("Card titles, in order", STY_H3))
    story += numbered(
        [
            "<b>What is VAERS?</b> — early-warning surveillance, not causation.",
            "<b>Who is required to report?</b> — the COVID-19 vs. non-COVID distinction.",
            "<b>Reportable events for non-COVID vaccines</b> — abbreviated VICP injury table.",
            "<b>The Vaccine Provider Agreement</b> — what providers commit to.",
            "<b>The PREP Act and COVID-19 vaccines</b> — why liability is different.",
            "<b>CICP — the COVID-19 compensation program.</b>",
            "<b>VICP — the older vaccine injury program</b> (for non-COVID).",
            "<b>How current is this data?</b> — dataset scope and freshness.",
        ]
    )
    story.append(PageBreak())

    # ---------- 13 — Report tab ----------
    story += page_header(
        "13 · REPORT", "Filing a report yourself."
    )
    story.append(
        Paragraph(
            "CheckVAERS does not submit VAERS reports — only HHS can "
            "accept them. What the Report tab does is help the patient "
            "prepare, then deep-link to the official intake form.",
            STY_BODY,
        )
    )
    story += side_by_side_images(
        shot("site_dt_report"),
        shot("app_mo_report"),
        left_caption="Desktop /report. Two-column: checklist + notes textarea on the left, tips card + CTAs on the right.",
        right_caption="Mobile /report. Single-column flow. Same checklist, same official-form CTA.",
    )
    story.append(Spacer(1, 8))
    story += bullets(
        [
            "<b>7-item readiness checklist</b> — vaccine + manufacturer + lot, dose dates, symptoms with onset, treatment + outcome, provider contact, your contact, medical history.",
            "<b>Free-text notes textarea</b> — auto-saved to IndexedDB on blur.",
            "<b>Official VAERS form CTA</b> — opens vaers.hhs.gov/reportevent.html in a new tab.",
            "<b>Reset checklist</b> — clears local draft.",
        ],
        tight=True,
    )
    story.append(PageBreak())

    # ---------- 14 — History tab ----------
    story += page_header(
        "14 · HISTORY", "Local-only persistence."
    )
    story.append(
        Paragraph(
            "Every completed check writes a small record to the device's "
            "IndexedDB store. The patient can revisit a prior result, "
            "delete an individual entry, or wipe the entire local store. "
            "No history record ever leaves the device.",
            STY_BODY,
        )
    )
    story += side_by_side_images(
        shot("site_dt_history"),
        shot("app_mo_history"),
        left_caption="Desktop /history — empty state. Becomes a grid of past-check cards once the patient has runs.",
        right_caption="Mobile /history — same empty state, with the bottom tab bar visible.",
    )
    story.append(Paragraph("Storage detail", STY_H3))
    story += bullets(
        [
            f"Dexie wrapper over IndexedDB. Schema v2.",
            f"Three stores: {mono('checks')}, {mono('reports')}, {mono('dataCache')}.",
            f"Each {mono('checks')} row holds the input snapshot + the full {mono('MatchResult')} — re-opening a past check shows what the patient saw at the time, even if the upstream dataset has refreshed since.",
            "Clearing browser data (or uninstalling the PWA) removes everything CheckVAERS knows about that patient.",
        ],
        tight=True,
    )
    story.append(PageBreak())

    # ---------- 15 — Data ----------
    story += page_header("15 · DATA", "Source, coverage, refresh.")
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
                    "15 MB gzipped (≈60 MB uncompressed). Served same-origin via an edge proxy to satisfy browser CORS constraints on the upstream GitHub-hosted release.",
                ),
                (
                    "Prep pipeline",
                    f"{mono('scripts/prepare-vaers-data.ts')} — Node.js CLI, streams the three per-year CSVs, filters to COVID-19, joins on VAERS_ID, trims to the matcher-essential fields, gzips. Reproducible and tested.",
                ),
            ]
        )
    )
    story.append(PageBreak())

    # ---------- 16 — Matching algorithm ----------
    story += page_header(
        "16 · ALGORITHM", "Matching, in spec form."
    )
    story.append(
        Paragraph(
            f"<b>Input.</b> {mono('state')} (USPS 2-letter), {mono('sex')} "
            f"(M / F / U), {mono('dob → ageYears')}, "
            f"{mono('vaccineDates[]')} (1–5 ISO {mono('YYYY-MM-DD')} dates).",
            STY_BODY,
        )
    )
    story.append(
        three_col_table(
            ("BUCKET", "RULES", "NOTE"),
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
            ],
        )
    )
    story.append(Spacer(1, 8))
    story.append(
        Paragraph(
            "Records are stratified by a state-keyed index built once at "
            "data-load time. Per-check latency on the full 900k-record "
            "dataset is <b>under 10 ms on a phone CPU</b>, well below one "
            "frame. The 700 ms loading state on the result page exists "
            "for perceptual reasons, not performance.",
            STY_BODY,
        )
    )
    story.append(Paragraph("Tested", STY_H3))
    story.append(
        Paragraph(
            f"20 unit tests in {mono('lib/vaers/__tests__/matcher.test.ts')} "
            "cover the bucket boundaries (off-by-one on the ±7 / ±30 day "
            "windows), state/sex equality, age delta edges, the cap-at-20 "
            "sort order, and the empty-state and missing-input edge cases. "
            "Mock dataset is in-tree.",
            STY_BODY,
        )
    )
    story.append(PageBreak())

    # ---------- 17 — Privacy posture ----------
    story += page_header(
        "17 · PRIVACY", "Why HIPAA does not attach."
    )
    story.append(
        callout(
            "“We do not store PHI in the first place.”",
            "The defensible answer to a reviewer asking how PHI is encrypted at rest.",
        )
    )
    story.append(Spacer(1, 8))
    story += bullets(
        [
            "<b>No PHI is processed.</b> The dataset is de-identified by HHS before release; we read only that copy.",
            "<b>HIPAA does not attach.</b> CheckVAERS is a consumer-facing search tool, not a covered entity or business associate. The Privacy Rule does not apply to a consumer's voluntary self-query against public data.",
            "<b>User inputs never leave the device.</b> State, sex, DOB, and dose dates stay in the browser. Matching runs entirely in client-side JavaScript.",
            "<b>Local-only persistence.</b> Completed checks save to IndexedDB on the user's device. There is no server-side database.",
            "<b>HTTPS-only.</b> Snapshot is ETag-validated on first launch and cached for offline use.",
            "<b>No accounts. No tracking. No analytics. No third-party scripts.</b>",
        ]
    )
    story.append(Spacer(1, 8))
    story.append(Paragraph("What this lets a reviewer say", STY_H3))
    story.append(
        Paragraph(
            "“We use HHS-published, already-de-identified VAERS data. "
            "No protected health information is processed, stored, or "
            "transmitted by this service. HIPAA does not apply because "
            "there is no covered-entity relationship and no PHI to "
            "protect.” &mdash; defensible verbatim.",
            STY_BODY,
        )
    )
    story.append(PageBreak())

    # ---------- 18 — Technical architecture ----------
    story += page_header(
        "18 · ENGINEERING", "Architecture in one paragraph (and one diagram)."
    )
    story.append(
        Paragraph(
            f"Next.js 14 (App Router, TypeScript), deployed as two Vercel "
            f"projects from the same monorepo. A {mono('NEXT_PUBLIC_VARIANT')} "
            f"env var picks between the marketing-rich site build and the "
            f"PWA-installable app build. The client matcher is an "
            f"in-browser state-indexed scan. Persistence is Dexie over "
            f"IndexedDB (check history, report draft, data cache). The "
            f"dataset is prepared by a Node script from raw HHS year CSVs "
            f"and published as a GitHub Release asset; the client fetches "
            f"it via a same-origin {mono('/api/vaers-data')} edge route "
            f"that follows the upstream redirects server-side "
            f"(release-assets.githubusercontent.com does not send CORS "
            f"headers, so a direct browser fetch would fail). A service "
            f"worker caches the app shell and the data file for offline "
            f"use.",
            STY_BODY,
        )
    )
    story.append(Spacer(1, 8))
    story.append(Paragraph("Component map", STY_H3))
    story.append(
        kv_table(
            [
                ("Frontend", "Next.js 14 App Router, TypeScript, Tailwind + shadcn primitives."),
                ("Forms", "React Hook Form + Zod schemas (lib/validation/schemas.ts)."),
                ("State", "Zustand for the in-progress check draft (sessionStorage-backed)."),
                ("Persistence", "Dexie / IndexedDB. 3 stores: checks, reports, dataCache."),
                ("Data fetch", "Same-origin /api/vaers-data → upstream GitHub Release asset."),
                ("Matcher", "Pure TypeScript. State-indexed map built once at load."),
                ("PWA", "Custom service worker + Next.js manifest. Icons generated from a single SVG via sharp."),
                ("Hosting", "Vercel (both projects). Edge runtime for the data proxy route."),
            ]
        )
    )
    story.append(PageBreak())

    # ---------- 19 — Known limits ----------
    story += page_header("19 · LIMITS", "Known tradeoffs.")
    story.append(
        Paragraph(
            "Every architectural decision creates a constraint. The "
            "ones a clinical reviewer should hear about up front:",
            STY_BODY,
        )
    )
    story.append(Paragraph("Dataset is a snapshot, not a live mirror", STY_H3))
    story.append(
        Paragraph(
            "VAERS publishes the public CSVs on a refresh cadence that "
            "lags the live system. CheckVAERS additionally only refreshes "
            "when we re-run the prep pipeline. There can be hours-to-days "
            "between a report being filed and being matchable here.",
            STY_BODY,
        )
    )
    story.append(Paragraph("Record detail is intentionally trimmed", STY_H3))
    story.append(
        Paragraph(
            f"To fit the in-browser object graph inside iOS Safari's per-"
            f"tab memory ceiling we drop {mono('SYMPTOM_TEXT')} (the "
            f"narrative field), {mono('RECVDATE')}, {mono('NUMDAYS')}, "
            f"and the 4th–5th {mono('SYMPTOM')} codes. The result card "
            f"links out to CDC WONDER for the full record.",
            STY_BODY,
        )
    )
    story.append(Paragraph("COVID-19 only", STY_H3))
    story.append(
        Paragraph(
            "The first release covers COVID-19 vaccines only. The prep "
            "pipeline and matcher are generic — a flu or MMR variant is "
            "a configuration change, not a rewrite.",
            STY_BODY,
        )
    )
    story.append(Paragraph("Matcher thresholds are not personalised", STY_H3))
    story.append(
        Paragraph(
            f"The ±1-year / ±7-day exact window and the ±5-year / ±30-day "
            f"potential window are global constants. A patient with "
            f"genuinely unusual reporting patterns may need to widen "
            f"these — currently a code change, not a setting.",
            STY_BODY,
        )
    )
    story.append(PageBreak())

    # ---------- 20 — Roadmap ----------
    story += page_header("20 · ROADMAP", "What comes next.")

    story.append(Paragraph("Near-term", STY_H3))
    story += bullets(
        [
            "<b>Per-state lazy loading.</b> The API endpoint returns only the user's state slice on demand. Drops first-load payload from 15 MB to 1–3 MB and removes the mobile memory ceiling entirely.",
            f"<b>Detail-on-demand.</b> A {mono('/api/vaers-detail/[id]')} route restores the narrative, days-to-onset, and receive-date fields per match — without re-bloating the in-browser dataset.",
            "<b>Result-page export.</b> Generate a PDF of the result page for sharing with a provider.",
        ],
        tight=True,
    )

    story.append(Paragraph("Medium-term", STY_H3))
    story += bullets(
        [
            "<b>Beyond COVID-19.</b> Flu, MMR, HPV, etc., using the same prep pipeline and matcher.",
            "<b>VICP / CICP eligibility flowchart</b> on the Learn tab.",
            "<b>Configurable thresholds</b> — let a clinician widen the matching window per query.",
            "<b>Optional opt-in Plausible analytics</b> for usage metrics — privacy-respecting, no cross-site cookies.",
        ],
        tight=True,
    )

    story.append(Paragraph("Open questions", STY_H3))
    story += bullets(
        [
            "Whether a clinician-facing variant (with full record fields client-side, desktop memory budget assumed) is worth a separate build.",
            "Whether to support symptom-based search (start from the symptom, surface candidate VAERS_IDs) in addition to demographic-based search.",
            "Whether to translate the Learn tab content into Spanish for first-launch parity.",
        ],
        tight=True,
    )
    story.append(PageBreak())

    # ---------- 21 — Appendix / References ----------
    story += page_header(
        "21 · APPENDIX", "References and contact."
    )

    story.append(Paragraph("Live", STY_H3))
    link_table = [
        ["Site (marketing)", link(SITE_URL, SITE_URL)],
        ["App (PWA)", link(APP_URL, APP_URL)],
        ["Source code", link(REPO_URL, REPO_URL)],
        ["Current data snapshot", link(RELEASE_URL, RELEASE_URL)],
        ["Contact", f"<font color='#29C5F6'>{CONTACT}</font>"],
    ]
    rows = [
        [Paragraph(label, STY_TABLE_LABEL), Paragraph(val, STY_TABLE_CELL)]
        for label, val in link_table
    ]
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

    story.append(Paragraph("Source materials", STY_H3))
    src_rows = [
        ["VAERS public dataset", link("vaers.hhs.gov/data/datasets.html", "https://vaers.hhs.gov/data/datasets.html")],
        ["VAERS report submission form", link("vaers.hhs.gov/reportevent.html", "https://vaers.hhs.gov/reportevent.html")],
        ["CDC WONDER VAERS interface", link("wonder.cdc.gov/vaers.html", "https://wonder.cdc.gov/vaers.html")],
        ["HRSA Vaccine Injury Table (VICP)", link("hrsa.gov/vaccine-compensation/vaccine-injury-table", "https://www.hrsa.gov/vaccine-compensation/vaccine-injury-table")],
        ["HRSA CICP program", link("hrsa.gov/cicp", "https://www.hrsa.gov/cicp")],
        ["PREP Act declaration", link("phe.gov/Preparedness/legal/prepact", "https://www.phe.gov/Preparedness/legal/prepact/Pages/default.aspx")],
    ]
    rows = [
        [Paragraph(label, STY_TABLE_LABEL), Paragraph(val, STY_TABLE_CELL)]
        for label, val in src_rows
    ]
    t = Table(rows, colWidths=[2.4 * inch, CONTENT_W - 2.4 * inch], hAlign="LEFT")
    t.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 10),
                ("RIGHTPADDING", (0, 0), (-1, -1), 10),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ("LINEBELOW", (0, 0), (-1, -2), 0.5, RULE),
            ]
        )
    )
    story.append(t)

    story.append(Spacer(1, 14))
    story.append(
        Paragraph(
            "<i>CheckVAERS operates on HHS-published, de-identified VAERS "
            "data. No PHI is processed. Not affiliated with the CDC, FDA, "
            "or HHS. Not medical advice. — </i>" + CONTACT,
            STY_CAPTION,
        )
    )

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
        topMargin=MARGIN_Y_TOP,
        bottomMargin=MARGIN_Y_BOT,
        title="CheckVAERS — Clinician Brief",
        author="CheckVAERS",
        subject="Clinician brief for stakeholder review",
        creator="reportlab",
    )

    cover_frame = Frame(
        0, 0, PAGE_W, PAGE_H, leftPadding=0, rightPadding=0,
        topPadding=0, bottomPadding=0, showBoundary=0,
    )
    content_frame = Frame(
        MARGIN_X, MARGIN_Y_BOT,
        CONTENT_W, CONTENT_H,
        leftPadding=0, rightPadding=0,
        topPadding=0, bottomPadding=0, showBoundary=0,
    )

    doc.addPageTemplates(
        [
            PageTemplate(id="cover", frames=[cover_frame], onPage=draw_cover),
            PageTemplate(id="content", frames=[content_frame], onPage=draw_content_chrome),
        ]
    )
    doc.build(build_story())


if __name__ == "__main__":
    out = Path("CheckVAERS-clinician-brief.pdf")
    build_pdf(out)
    print(f"Wrote {out.resolve()}")
