"""
SEO AI Router — AI-Powered SEO Features using Claude
Phase 11.B: Generate meta, analyze content, extract keywords, generate alt text

Uses Emergent LLM Key for Claude Sonnet 4 access.
"""
import os
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Body
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

# Import auth dependencies
from core_utils import success_response, error_response
from db import get_db
from security import require_role, get_current_user

# Emergent Integrations for Claude
# No direct import - will import in functions

router = APIRouter()

# Pydantic Models
class GenerateMetaRequest(BaseModel):
    page_type: str = Field(..., description="Type of page: homepage, service, case, blog, career, etc")
    entity_id: Optional[str] = Field(None, description="ID of content entity if applicable")
    path: str = Field(..., description="URL path of the page")
    locale: str = Field(default="id", description="Language: id or en")
    content_payload: Dict[str, Any] = Field(..., description="Content to analyze: title, description, body, etc")

class AnalyzeContentRequest(BaseModel):
    path: str
    title: str
    description: str
    content: str
    locale: str = "id"

class KeywordsRequest(BaseModel):
    content: str
    locale: str = "id"
    max_keywords: int = 10

class AltTextRequest(BaseModel):
    filename: str
    caption: Optional[str] = None
    page_context: Optional[str] = None
    locale: str = "id"


# Helper: Call Claude using LlmChat
async def call_claude(prompt: str, session_id: str = "seo-ai") -> str:
    """Call Claude using Emergent integrations"""
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
    except Exception:
        raise HTTPException(status_code=503, detail="AI library unavailable")
    
    api_key = os.environ.get("EMERGENT_LLM_KEY", "sk-emergent-87e9d673b3cF1D9B63")
    
    chat = LlmChat(
        api_key=api_key,
        session_id=session_id,
        system_message="You are an expert SEO consultant. Always return responses as valid JSON."
    ).with_model("anthropic", "claude-sonnet-4-20250514")
    
    try:
        reply = await chat.send_message(UserMessage(text=prompt))
        return str(reply)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"AI error: {exc}")

# Helper: Log AI interaction
def log_ai_interaction(db, endpoint: str, user_id: str, prompt: str, response: str, metadata: dict = None):
    """Log AI SEO interactions to seo_ai_logs collection"""
    log_entry = {
        "id": str(uuid.uuid4()),
        "endpoint": endpoint,
        "user_id": user_id,
        "prompt": prompt[:500],  # Truncate long prompts
        "response": response[:1000],  # Truncate long responses
        "metadata": metadata or {},
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    db.seo_ai_logs.insert_one(log_entry)


@router.post("/ai/generate-meta")
async def generate_meta(
    request: GenerateMetaRequest = Body(...),
    current_user: dict = Depends(require_role("admin", "staff"))
):
    """
    Generate SEO metadata using Claude AI
    
    Returns optimized:
    - title (50-60 chars)
    - description (140-160 chars)
    - og_title
    - og_description
    - keywords (array)
    """
    db = get_db()
    
    try:
        # Construct prompt for Claude
        content = request.content_payload
        lang = "Indonesian" if request.locale == "id" else "English"
        
        prompt = f"""You are an expert SEO consultant for Kubus Teknologi Indonesia (KTI), an enterprise technology solutions company.

Generate optimal SEO metadata in {lang} for the following page:

Page Type: {request.page_type}
URL Path: {request.path}
Content Title: {content.get('title', 'N/A')}
Content Description: {content.get('description', 'N/A')}
Content Body (excerpt): {str(content.get('body', ''))[:500]}

Generate the following SEO elements:

1. SEO Title (50-60 characters, include main keyword, compelling)
2. Meta Description (140-160 characters, action-oriented, include CTA)
3. Open Graph Title (can be slightly longer, more descriptive)
4. Open Graph Description (compelling for social shares)
5. Recommended Keywords (5-7 relevant keywords/phrases)

Requirements:
- Natural, human-readable {lang}
- Include "KTI" or "Kubus Teknologi" where appropriate
- Focus on business value and solutions
- Avoid keyword stuffing
- Be specific and compelling

Return ONLY a JSON object with these exact keys:
{{
  "title": "...",
  "description": "...",
  "og_title": "...",
  "og_description": "...",
  "keywords": ["keyword1", "keyword2", ...]
}}"""

        # Call Claude
        ai_response = await call_claude(prompt, f"seo-meta-{request.path}")
        
        # Parse JSON response (handle markdown code blocks)
        import json
        if "```json" in ai_response:
            json_str = ai_response.split("```json")[1].split("```")[0].strip()
        elif "```" in ai_response:
            json_str = ai_response.split("```")[1].split("```")[0].strip()
        else:
            json_str = ai_response
        
        result = json.loads(json_str)
        
        # Log interaction
        log_ai_interaction(
            db,
            endpoint="/api/seo/ai/generate-meta",
            user_id=current_user.get("id"),
            prompt=prompt,
            response=ai_response,
            metadata={"page_type": request.page_type, "path": request.path, "locale": request.locale}
        )
        
        # Save to seo_pages collection
        seo_page_data = {
            "id": str(uuid.uuid4()),
            "path": request.path,
            "page_type": request.page_type,
            "entity_id": request.entity_id,
            "locale": request.locale,
            "title": result.get("title"),
            "description": result.get("description"),
            "og_title": result.get("og_title"),
            "og_description": result.get("og_description"),
            "keywords": result.get("keywords", []),
            "generated_by": "ai",
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
        
        # Upsert by path + locale
        db.seo_pages.update_one(
            {"path": request.path, "locale": request.locale},
            {"$set": seo_page_data},
            upsert=True
        )
        
        return success_response(result)
        
    except Exception as e:
        return error_response("SEO_GENERATION_ERROR", f"Failed to generate SEO metadata: {str(e)}")


@router.post("/ai/analyze")
async def analyze_content(
    request: AnalyzeContentRequest = Body(...),
    current_user: dict = Depends(require_role("admin", "staff"))
):
    """
    Analyze content and provide SEO score + recommendations
    
    Returns:
    - score (0-100)
    - checks (array of check results)
    - recommendations (actionable improvements)
    """
    db = get_db()
    
    try:
        lang = "Indonesian" if request.locale == "id" else "English"
        
        prompt = f"""You are an SEO expert analyzer. Analyze the following webpage content and provide a comprehensive SEO assessment in {lang}.

URL Path: {request.path}
Title: {request.title}
Meta Description: {request.description}
Content Length: {len(request.content)} characters

Analyze these SEO factors:
1. Title optimization (length, keyword usage, clarity)
2. Meta description quality (length, CTA, relevance)
3. Content length and quality
4. Keyword usage and density
5. Readability and structure
6. Missing elements

Provide:
- Overall SEO Score (0-100)
- Specific checks with pass/fail status
- Actionable recommendations in {lang}

Return ONLY a JSON object:
{{
  "score": 85,
  "checks": [
    {{"name": "Title Length", "status": "pass", "message": "...", "score": 10}},
    {{"name": "Meta Description", "status": "warning", "message": "...", "score": 7}}
  ],
  "recommendations": [
    "Add more specific keywords to title",
    "Expand meta description to 150-160 characters"
  ]
}}"""

        ai_response = await call_claude(prompt, f"seo-analyze-{request.path}")
        
        # Parse JSON
        import json
        if "```json" in ai_response:
            json_str = ai_response.split("```json")[1].split("```")[0].strip()
        elif "```" in ai_response:
            json_str = ai_response.split("```")[1].split("```")[0].strip()
        else:
            json_str = ai_response
        
        result = json.loads(json_str)
        
        # Log interaction
        log_ai_interaction(
            db,
            endpoint="/api/seo/ai/analyze",
            user_id=current_user.get("id"),
            prompt=prompt,
            response=ai_response,
            metadata={"path": request.path, "locale": request.locale}
        )
        
        return success_response(result)
        
    except Exception as e:
        return error_response("SEO_ANALYSIS_ERROR", f"Failed to analyze content: {str(e)}")


@router.post("/ai/keywords")
async def extract_keywords(
    request: KeywordsRequest = Body(...),
    current_user: dict = Depends(require_role("admin", "staff"))
):
    """
    Extract relevant keywords from content using AI
    
    Returns:
    - primary (main keywords)
    - secondary (supporting keywords)
    - entities (named entities, brands, technologies)
    """
    db = get_db()
    
    try:
        lang = "Indonesian" if request.locale == "id" else "English"
        
        prompt = f"""You are an SEO keyword extraction expert. Analyze the following content in {lang} and extract relevant SEO keywords.

Content:
{request.content[:1000]}

Extract:
1. Primary Keywords (3-5 most important, high-value keywords)
2. Secondary Keywords (5-7 supporting keywords)
3. Named Entities (technologies, brands, concepts mentioned)

Focus on:
- Business-relevant terms
- Technology-specific keywords
- Industry terminology
- Search-friendly phrases

Return ONLY a JSON object:
{{
  "primary": ["keyword1", "keyword2", "keyword3"],
  "secondary": ["keyword4", "keyword5", ...],
  "entities": ["React", "MongoDB", "Cloud Infrastructure", ...]
}}"""

        ai_response = await call_claude(prompt, "seo-keywords")
        
        # Parse JSON
        import json
        if "```json" in ai_response:
            json_str = ai_response.split("```json")[1].split("```")[0].strip()
        elif "```" in ai_response:
            json_str = ai_response.split("```")[1].split("```")[0].strip()
        else:
            json_str = ai_response
        
        result = json.loads(json_str)
        
        # Log interaction
        log_ai_interaction(
            db,
            endpoint="/api/seo/ai/keywords",
            user_id=current_user.get("id"),
            prompt=prompt,
            response=ai_response,
            metadata={"locale": request.locale}
        )
        
        return success_response(result)
        
    except Exception as e:
        return error_response("KEYWORD_EXTRACTION_ERROR", f"Failed to extract keywords: {str(e)}")


@router.post("/ai/alt-text")
async def generate_alt_text(
    request: AltTextRequest = Body(...),
    current_user: dict = Depends(require_role("admin", "staff"))
):
    """
    Generate descriptive alt text for images
    
    Returns:
    - alt_text (descriptive, SEO-friendly)
    - confidence (high/medium/low)
    """
    db = get_db()
    
    try:
        lang = "Indonesian" if request.locale == "id" else "English"
        
        prompt = f"""You are an accessibility and SEO expert. Generate descriptive alt text in {lang} for an image.

Image Filename: {request.filename}
Caption: {request.caption or 'None'}
Page Context: {request.page_context or 'General KTI technology website'}

Generate alt text that:
1. Describes what's in the image clearly
2. Is concise (under 125 characters)
3. Includes relevant context
4. Avoids phrases like "image of" or "picture of"
5. Is natural in {lang}

Return ONLY a JSON object:
{{
  "alt_text": "...",
  "confidence": "high"
}}"""

        ai_response = await call_claude(prompt, "seo-alt-text")
        
        # Parse JSON
        import json
        if "```json" in ai_response:
            json_str = ai_response.split("```json")[1].split("```")[0].strip()
        elif "```" in ai_response:
            json_str = ai_response.split("```")[1].split("```")[0].strip()
        else:
            json_str = ai_response
        
        result = json.loads(json_str)
        
        # Log interaction
        log_ai_interaction(
            db,
            endpoint="/api/seo/ai/alt-text",
            user_id=current_user.get("id"),
            prompt=prompt,
            response=ai_response,
            metadata={"filename": request.filename, "locale": request.locale}
        )
        
        return success_response(result)
        
    except Exception as e:
        return error_response("ALT_TEXT_GENERATION_ERROR", f"Failed to generate alt text: {str(e)}")


@router.get("/pages")
async def list_seo_pages(
    current_user: dict = Depends(require_role("admin", "staff"))
):
    """List all SEO pages with metadata"""
    db = get_db()
    
    try:
        pages = list(db.seo_pages.find({}, {"_id": 0}).sort("updated_at", -1))
        return success_response(pages)
    except Exception as e:
        return error_response("SEO_LIST_ERROR", str(e))


@router.get("/pages/{path:path}")
async def get_seo_page(
    path: str,
    locale: str = "id"
):
    """Get SEO metadata for a specific path (public endpoint)"""
    db = get_db()
    
    try:
        page = db.seo_pages.find_one({"path": f"/{path}", "locale": locale}, {"_id": 0})
        if not page:
            return error_response("SEO_NOT_FOUND", "SEO metadata not found for this path")
        return success_response(page)
    except Exception as e:
        return error_response("SEO_GET_ERROR", str(e))


@router.post("/pages/{page_id}/score-snapshot")
async def save_score_snapshot(
    page_id: str,
    current_user: dict = Depends(require_role("admin", "staff"))
):
    """
    Save current SEO score to history (snapshot)
    Call this after analyzing a page to track score over time
    """
    db = get_db()
    
    try:
        # Get current page data
        page = db.seo_pages.find_one({"id": page_id}, {"_id": 0})
        if not page:
            return error_response("PAGE_NOT_FOUND", "Page not found")
        
        score = page.get("seo_score", 0)
        
        # Create snapshot
        snapshot = {
            "id": str(uuid.uuid4()),
            "page_id": page_id,
            "score": score,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        
        db.seo_score_history.insert_one(snapshot)
        
        return success_response(snapshot)
    except Exception as e:
        return error_response("SNAPSHOT_ERROR", str(e))


@router.get("/pages/{page_id}/score-history")
async def get_score_history(
    page_id: str,
    limit: int = 30,
    current_user: dict = Depends(require_role("admin", "staff"))
):
    """Get score history for a page (time series)"""
    db = get_db()
    
    try:
        history = list(
            db.seo_score_history
            .find({"page_id": page_id}, {"_id": 0})
            .sort("timestamp", -1)
            .limit(limit)
        )
        
        # Reverse to show oldest first for chart
        history.reverse()
        
        return success_response(history)
    except Exception as e:
        return error_response("HISTORY_ERROR", str(e))


@router.get("/report/pdf/{page_id}")
async def export_page_report_pdf(
    page_id: str,
    current_user: dict = Depends(require_role("admin", "staff"))
):
    """
    Export per-page SEO audit report as PDF
    Uses reportlab to generate professional PDF report
    """
    from fastapi.responses import Response
    from io import BytesIO
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import inch
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
    from reportlab.lib import colors
    
    db = get_db()
    
    try:
        # Get page data
        page = db.seo_pages.find_one({"id": page_id}, {"_id": 0})
        if not page:
            raise HTTPException(status_code=404, detail="Page not found")
        
        # Get score history
        history = list(db.seo_score_history.find({"page_id": page_id}, {"_id": 0}).sort("timestamp", -1).limit(10))
        
        # Create PDF in memory
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=0.75*inch, bottomMargin=0.75*inch)
        
        # Styles
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#1a1a2e'),
            spaceAfter=30,
        )
        heading_style = ParagraphStyle(
            'CustomHeading',
            parent=styles['Heading2'],
            fontSize=16,
            textColor=colors.HexColor('#4ecbaf'),
            spaceAfter=12,
        )
        
        # Build content
        story = []
        
        # Title
        story.append(Paragraph("SEO Audit Report", title_style))
        story.append(Paragraph(f"<b>Page:</b> {page.get('path', 'N/A')}", styles['Normal']))
        story.append(Paragraph(f"<b>Generated:</b> {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}", styles['Normal']))
        story.append(Spacer(1, 0.3*inch))
        
        # Metadata Section
        story.append(Paragraph("Metadata", heading_style))
        meta_data = [
            ["Field", "Value", "Status"],
            ["Title", page.get('title', '-')[:50], f"{len(page.get('title', ''))} chars"],
            ["Description", page.get('description', '-')[:80], f"{len(page.get('description', ''))} chars"],
            ["SEO Score", str(page.get('seo_score', 0)), ""],
            ["Page Type", page.get('page_type', '-'), ""],
            ["Locale", page.get('locale', '-'), ""],
        ]
        
        t = Table(meta_data, colWidths=[1.5*inch, 3*inch, 1.2*inch])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#4ecbaf')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 11),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ]))
        story.append(t)
        story.append(Spacer(1, 0.3*inch))
        
        # Keywords
        if page.get('keywords'):
            story.append(Paragraph("Keywords", heading_style))
            keywords_text = ", ".join(page.get('keywords', []))
            story.append(Paragraph(keywords_text, styles['Normal']))
            story.append(Spacer(1, 0.3*inch))
        
        # Score History
        if history:
            story.append(Paragraph("Score History (Last 10)", heading_style))
            history_data = [["Date", "Score"]]
            for h in history[:10]:
                date = datetime.fromisoformat(h['timestamp'].replace('Z', '+00:00')).strftime('%Y-%m-%d')
                history_data.append([date, str(h['score'])])
            
            h_table = Table(history_data, colWidths=[3*inch, 1.5*inch])
            h_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#4ecbaf')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ]))
            story.append(h_table)
        
        # Footer
        story.append(Spacer(1, 0.5*inch))
        story.append(Paragraph("Generated by Kubus Teknologi Indonesia SEO Dashboard", styles['Italic']))
        
        # Build PDF
        doc.build(story)
        
        # Return PDF
        buffer.seek(0)
        filename = f"seo-report-{page.get('path', 'page').replace('/', '-')}.pdf"
        
        return Response(
            content=buffer.getvalue(),
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
        
    except Exception as e:
        return error_response("PDF_ERROR", str(e))
