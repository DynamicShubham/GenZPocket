"""
PDF Generator Service — Generates Neo-Brutalist Ledger Monthly Statements (Task 6.3).

Outputs a PDF buffer with health score, total expenses, savings, and category breakdowns.
"""

from io import BytesIO
from datetime import date
from typing import Dict, Any


def generate_brutalist_pdf_statement(
    user_name: str,
    user_email: str,
    report_month: date,
    health_score: int,
    total_expenses: float,
    savings: float,
    overall_limit: float,
    category_breakdown: Dict[str, float],
) -> bytes:
    """
    Generates a PDF statement byte array styled with thick borders & high contrast.
    """
    try:
        from reportlab.lib.pagesizes import letter
        from reportlab.lib import colors
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

        buffer = BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36,
        )
        elements = []
        styles = getSampleStyleSheet()

        title_style = ParagraphStyle(
            "BrutalistTitle",
            parent=styles["Heading1"],
            fontName="Helvetica-Bold",
            fontSize=24,
            leading=28,
            textColor=colors.HexColor("#0f172a"),
        )
        subtitle_style = ParagraphStyle(
            "BrutalistSub",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=12,
            leading=16,
            textColor=colors.HexColor("#475569"),
        )

        month_str = report_month.strftime("%B %Y")
        elements.append(Paragraph(f"<b>GENZPOCKET</b> — Monthly Statement", title_style))
        elements.append(Paragraph(f"User: {user_name} ({user_email}) | Period: {month_str}", subtitle_style))
        elements.append(Spacer(1, 15))

        # Health Score & Summary Table
        summary_data = [
            ["Financial Health Score", "Total Spent", "Savings", "Budget Limit"],
            [f"{health_score} / 100", f"INR {total_expenses:,.2f}", f"INR {savings:,.2f}", f"INR {overall_limit:,.2f}"],
        ]
        summary_table = Table(summary_data, colWidths=[130, 130, 130, 130])
        summary_table.setStyle(
            TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#e2e8f0")),
                ("TEXTCOLOR", (0, 0), (-1, -1), colors.HexColor("#0f172a")),
                ("FONTNAME", (0, 0), (-1, -1), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 11),
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ("GRID", (0, 0), (-1, -1), 2, colors.HexColor("#0f172a")),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ])
        )
        elements.append(summary_table)
        elements.append(Spacer(1, 20))

        # Category Breakdown Table
        elements.append(Paragraph("<b>Category Spending Breakdown</b>", title_style))
        elements.append(Spacer(1, 10))

        cat_data = [["Category", "Amount Spent", "% of Total"]]
        for cat, amt in category_breakdown.items():
            pct = (amt / total_expenses * 100) if total_expenses > 0 else 0.0
            cat_data.append([cat.upper(), f"INR {amt:,.2f}", f"{pct:.1f}%"])

        if len(cat_data) == 1:
            cat_data.append(["No expenses logged", "INR 0.00", "0.0%"])

        cat_table = Table(cat_data, colWidths=[200, 160, 160])
        cat_table.setStyle(
            TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#cbd5e1")),
                ("TEXTCOLOR", (0, 0), (-1, -1), colors.HexColor("#0f172a")),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
                ("ALIGN", (1, 0), (-1, -1), "RIGHT"),
                ("GRID", (0, 0), (-1, -1), 1.5, colors.HexColor("#0f172a")),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ])
        )
        elements.append(cat_table)

        doc.build(elements)
        buffer.seek(0)
        return buffer.getvalue()
    except ImportError:
        # Fallback raw text representation if reportlab is not installed
        report_text = f"""
=====================================================
GENZPOCKET MONTHLY LEDGER STATEMENT
=====================================================
User: {user_name} ({user_email})
Period: {report_month.strftime('%B %Y')}
Health Score: {health_score}/100
Total Spent: INR {total_expenses:,.2f}
Savings: INR {savings:,.2f}
Budget Limit: INR {overall_limit:,.2f}

Category Breakdown:
"""
        for cat, amt in category_breakdown.items():
            report_text += f" - {cat}: INR {amt:,.2f}\n"

        return report_text.encode("utf-8")
