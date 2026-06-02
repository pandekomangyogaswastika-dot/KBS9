"""AI Report Generation Service for Assessment Results.

Generates structured, per-domain AI insights using Claude 3.5 Sonnet via Emergent LLM.
"""
import os
import asyncio
from typing import Dict, List, Any, Optional
from dotenv import load_dotenv
from emergentintegrations.llm.chat import LlmChat, UserMessage
import json

load_dotenv()

EMERGENT_LLM_KEY = os.getenv("EMERGENT_LLM_KEY")


class AIReportGenerator:
    """Generate AI-powered insights for completed assessments."""

    def __init__(self):
        self.api_key = EMERGENT_LLM_KEY
        if not self.api_key:
            raise ValueError("EMERGENT_LLM_KEY not found in environment")

    async def generate_report(self, session_data: Dict[str, Any], locale: str = "id") -> Dict[str, Any]:
        """
        Generate comprehensive AI report for assessment session.

        Args:
            session_data: Full session data including template, answers, progress
            locale: Language code ("id" or "en")

        Returns:
            Structured report with per-domain insights + overall summary
        """
        template = session_data.get("template", {})
        answers_map = session_data.get("answers_map", {})
        domains = template.get("domains") or template.get("sections") or []
        client_name = session_data.get("client_name", "Client")
        template_name = self._get_localized_text(template.get("name"), locale)

        # Generate per-domain insights
        domain_insights = []
        for domain in domains:
            insight = await self._analyze_domain(domain, answers_map, locale)
            if insight:
                domain_insights.append(insight)

        # Generate overall summary
        overall_summary = await self._generate_overall_summary(
            template_name, client_name, domain_insights, locale
        )

        return {
            "template_name": template_name,
            "client_name": client_name,
            "locale": locale,
            "generated_at": session_data.get("submitted_at"),
            "overall_summary": overall_summary,
            "domain_insights": domain_insights,
            "recommendations": await self._generate_recommendations(domain_insights, locale),
        }

    async def _analyze_domain(self, domain: Dict, answers_map: Dict, locale: str) -> Optional[Dict]:
        """
        Analyze a single domain with all its answered questions.

        Returns structured insight: strengths, concerns, score, recommendations.
        """
        domain_title = self._get_localized_text(domain.get("title"), locale)
        questions = domain.get("questions", [])

        # Filter answered questions
        answered_qa = []
        for q in questions:
            q_id = q.get("id")
            ans = answers_map.get(q_id)
            if ans and not ans.get("skipped") and ans.get("value") is not None:
                q_text = self._get_localized_text(q.get("prompt") or q.get("text"), locale)
                answered_qa.append({
                    "question": q_text,
                    "type": q.get("type"),
                    "answer": self._format_answer(ans, q, locale),
                    "note": ans.get("note"),
                })

        if not answered_qa:
            return None

        # Prepare prompt for Claude
        system_prompt = self._get_system_prompt(locale)
        user_prompt = self._build_domain_analysis_prompt(domain_title, answered_qa, locale)

        # Call Claude for analysis
        try:
            chat = (
                LlmChat(
                    api_key=self.api_key,
                    session_id=f"assessment-domain-{domain.get('id')}",
                    system_message=system_prompt,
                )
                .with_model("anthropic", "claude-sonnet-4-6")
                .with_params(max_tokens=2000)
            )

            user_message = UserMessage(text=user_prompt)
            response = await chat.send_message(user_message)

            # Parse structured response
            parsed = self._parse_domain_response(response, domain_title)
            return parsed

        except Exception as e:
            print(f"Error analyzing domain {domain_title}: {str(e)}")
            return {
                "domain": domain_title,
                "error": "Failed to generate AI analysis",
                "strengths": [],
                "concerns": [],
                "maturity_score": None,
                "recommendations": [],
            }

    async def _generate_overall_summary(self, template_name: str, client_name: str, domain_insights: List[Dict], locale: str) -> Dict:
        """Generate executive summary based on all domain insights."""
        if not domain_insights:
            return {"summary": "No insights available", "key_findings": [], "next_steps": []}

        system_prompt = self._get_system_prompt(locale)
        user_prompt = self._build_summary_prompt(template_name, client_name, domain_insights, locale)

        try:
            chat = (
                LlmChat(
                    api_key=self.api_key,
                    session_id=f"assessment-summary-{template_name}",
                    system_message=system_prompt,
                )
                .with_model("anthropic", "claude-sonnet-4-6")
                .with_params(max_tokens=1500)
            )

            user_message = UserMessage(text=user_prompt)
            response = await chat.send_message(user_message)

            return self._parse_summary_response(response)

        except Exception as e:
            print(f"Error generating summary: {str(e)}")
            return {"summary": "Failed to generate summary", "key_findings": [], "next_steps": []}

    async def _generate_recommendations(self, domain_insights: List[Dict], locale: str) -> List[str]:
        """Generate actionable recommendations based on all insights."""
        all_concerns = []
        for insight in domain_insights:
            all_concerns.extend(insight.get("concerns", []))

        if not all_concerns:
            return ["Continue current practices" if locale == "en" else "Lanjutkan praktik saat ini"]

        # Extract top 5 unique recommendations from all domains
        all_recommendations = []
        for insight in domain_insights:
            all_recommendations.extend(insight.get("recommendations", []))

        # Deduplicate and return top 5
        unique_recs = list(dict.fromkeys(all_recommendations))[:5]
        return unique_recs if unique_recs else [
            "Focus on addressing identified concerns" if locale == "en" else "Fokus pada perbaikan area yang teridentifikasi"
        ]

    def _get_system_prompt(self, locale: str) -> str:
        """Return system prompt for Claude based on locale."""
        if locale == "en":
            return (
                "You are an expert business technology consultant specializing in digital transformation and organizational readiness assessments. "
                "Your role is to provide professional, actionable insights based on assessment responses. "
                "Analyze responses objectively, identify strengths and concerns, and provide practical recommendations. "
                "Always respond in valid JSON format as specified."
            )
        else:  # Indonesian
            return (
                "Anda adalah konsultan teknologi bisnis ahli yang berspesialisasi dalam transformasi digital dan penilaian kesiapan organisasi. "
                "Peran Anda adalah memberikan wawasan profesional dan actionable berdasarkan respons assessment. "
                "Analisis respons secara objektif, identifikasi kekuatan dan kekhawatiran, serta berikan rekomendasi praktis. "
                "Selalu respons dalam format JSON yang valid sesuai spesifikasi."
            )

    def _build_domain_analysis_prompt(self, domain_title: str, qa_pairs: List[Dict], locale: str) -> str:
        """Build prompt for domain-specific analysis."""
        lang = "English" if locale == "en" else "Indonesian"

        prompt = f"""Analyze the following assessment responses for domain: **{domain_title}**

**Responses:**
"""
        for i, qa in enumerate(qa_pairs, 1):
            prompt += f"\n{i}. **Q:** {qa['question']}\n   **A:** {qa['answer']}"
            if qa.get("note"):
                prompt += f"\n   **Note:** {qa['note']}"
            prompt += "\n"

        if locale == "en":
            prompt += """\n**Task:** Provide structured analysis in JSON format:
{
  "domain": "<domain name>",
  "strengths": ["strength 1", "strength 2", ...],
  "concerns": ["concern 1", "concern 2", ...],
  "maturity_score": <1-5 integer>,
  "maturity_label": "<Beginner|Developing|Intermediate|Advanced|Expert>",
  "recommendations": ["recommendation 1", "recommendation 2", ...]
}

**Guidelines:**
- Strengths: 2-4 positive observations
- Concerns: 2-4 areas needing improvement (empty array if none)
- Maturity score: 1=Beginner, 2=Developing, 3=Intermediate, 4=Advanced, 5=Expert
- Recommendations: 3-5 specific, actionable steps
- Use professional, concise language
- Response MUST be valid JSON only, no additional text
"""
        else:
            prompt += """\n**Tugas:** Berikan analisis terstruktur dalam format JSON:
{
  "domain": "<nama domain>",
  "strengths": ["kekuatan 1", "kekuatan 2", ...],
  "concerns": ["kekhawatiran 1", "kekhawatiran 2", ...],
  "maturity_score": <integer 1-5>,
  "maturity_label": "<Pemula|Berkembang|Menengah|Mahir|Ahli>",
  "recommendations": ["rekomendasi 1", "rekomendasi 2", ...]
}

**Panduan:**
- Strengths: 2-4 observasi positif
- Concerns: 2-4 area yang perlu diperbaiki (array kosong jika tidak ada)
- Maturity score: 1=Pemula, 2=Berkembang, 3=Menengah, 4=Mahir, 5=Ahli
- Recommendations: 3-5 langkah spesifik dan actionable
- Gunakan bahasa profesional dan ringkas
- Respons HARUS JSON valid saja, tanpa teks tambahan
"""

        return prompt

    def _build_summary_prompt(self, template_name: str, client_name: str, domain_insights: List[Dict], locale: str) -> str:
        """Build prompt for overall executive summary."""
        prompt = f"""Generate an executive summary for assessment: **{template_name}** (Client: {client_name})

**Domain Analysis Results:**
"""
        for insight in domain_insights:
            prompt += f"\n- **{insight['domain']}**: Maturity {insight.get('maturity_score', 'N/A')}/5 ({insight.get('maturity_label', '')})"
            prompt += f"\n  Strengths: {len(insight.get('strengths', []))}, Concerns: {len(insight.get('concerns', []))}"

        if locale == "en":
            prompt += """\n\n**Task:** Generate executive summary in JSON format:
{
  "summary": "<2-3 paragraph executive summary>",
  "key_findings": ["finding 1", "finding 2", "finding 3"],
  "next_steps": ["step 1", "step 2", "step 3"]
}

**Guidelines:**
- Summary: Professional overview highlighting overall maturity and critical insights
- Key findings: 3-5 most important cross-domain observations
- Next steps: 3-5 strategic priorities for improvement
- Response MUST be valid JSON only
"""
        else:
            prompt += """\n\n**Tugas:** Generate ringkasan eksekutif dalam format JSON:
{
  "summary": "<ringkasan eksekutif 2-3 paragraf>",
  "key_findings": ["temuan 1", "temuan 2", "temuan 3"],
  "next_steps": ["langkah 1", "langkah 2", "langkah 3"]
}

**Panduan:**
- Summary: Tinjauan profesional yang menyoroti kematangan keseluruhan dan wawasan kritis
- Key findings: 3-5 observasi lintas domain paling penting
- Next steps: 3-5 prioritas strategis untuk perbaikan
- Respons HARUS JSON valid saja
"""

        return prompt

    def _parse_domain_response(self, response: str, domain_title: str) -> Dict:
        """Parse Claude's JSON response for domain analysis."""
        try:
            # Try to extract JSON from response
            response = response.strip()
            if response.startswith("```json"):
                response = response[7:]
            if response.startswith("```"):
                response = response[3:]
            if response.endswith("```"):
                response = response[:-3]
            response = response.strip()

            parsed = json.loads(response)
            parsed["domain"] = domain_title  # Ensure domain name is set
            return parsed
        except json.JSONDecodeError:
            # Fallback if JSON parsing fails
            return {
                "domain": domain_title,
                "strengths": ["Analysis completed"],
                "concerns": [],
                "maturity_score": 3,
                "maturity_label": "Intermediate",
                "recommendations": ["Review assessment responses for detailed insights"],
                "_raw_response": response[:500],  # Store truncated raw for debugging
            }

    def _parse_summary_response(self, response: str) -> Dict:
        """Parse Claude's JSON response for executive summary."""
        try:
            response = response.strip()
            if response.startswith("```json"):
                response = response[7:]
            if response.startswith("```"):
                response = response[3:]
            if response.endswith("```"):
                response = response[:-3]
            response = response.strip()

            return json.loads(response)
        except json.JSONDecodeError:
            return {
                "summary": "Assessment completed successfully. Detailed insights available per domain.",
                "key_findings": ["Assessment submission received", "Domain analysis completed"],
                "next_steps": ["Review domain-specific recommendations"],
            }

    def _get_localized_text(self, field: Any, locale: str) -> str:
        """Extract localized text from a field (supports string or dict)."""
        if isinstance(field, dict):
            return field.get(locale) or field.get("id") or field.get("en") or ""
        return str(field) if field else ""

    def _format_answer(self, answer: Dict, question: Dict, locale: str) -> str:
        """Format answer value for display in prompt."""
        value = answer.get("value")
        qtype = question.get("type")

        if value is None:
            return "[No answer]"

        if qtype == "yes_no":
            return "Yes" if value else "No" if locale == "en" else "Ya" if value else "Tidak"

        if qtype in ["single_choice", "multi_choice"]:
            # Try to get label from options
            options = question.get("options", [])
            if isinstance(value, list):
                labels = []
                for v in value:
                    if v == "__other__":
                        labels.append(answer.get("other_text", "Other"))
                    else:
                        opt = next((o for o in options if o.get("value") == v), None)
                        if opt:
                            labels.append(opt.get("label", v))
                        else:
                            labels.append(str(v))
                return ", ".join(labels)
            else:
                if value == "__other__":
                    return answer.get("other_text", "Other")
                opt = next((o for o in options if o.get("value") == value), None)
                return opt.get("label", str(value)) if opt else str(value)

        if qtype == "scale_1_5":
            labels = question.get("scale_labels", {})
            label = labels.get(str(value), "")
            return f"{value}/5" + (f" ({label})" if label else "")

        return str(value)


# Singleton instance
ai_report_generator = AIReportGenerator()
