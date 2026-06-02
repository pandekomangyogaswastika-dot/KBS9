"""Assessment engine — branching, progress, answer-filled logic.

Supports both 'domains' (KN3 format) and 'sections' (legacy format) in templates.
Type aliases: single_choice/select, multi_choice/multiselect, yes_no/yesno,
              scale_1_5/scale, text_short/text, text_long/textarea.
"""

OTHER_SENTINEL = "__other__"


def _get_domains(template: dict) -> list:
    """Return domains list, supporting both 'domains' and 'sections' keys."""
    return template.get("domains") or template.get("sections") or []


def _get_question_text(q: dict, locale: str = "id") -> str:
    """Return localised prompt/text from a question dict."""
    field = q.get("prompt") or q.get("text") or {}
    if isinstance(field, dict):
        return field.get(locale) or field.get("id") or field.get("en") or ""
    return str(field) if field else ""


TYPE_ALIASES = {
    "select": "single_choice",
    "multiselect": "multi_choice",
    "yesno": "yes_no",
    "scale": "scale_1_5",
    "text": "text_short",
    "textarea": "text_long",
}


def _normalize_type(qtype: str) -> str:
    return TYPE_ALIASES.get(qtype, qtype)


def evaluate_show_if(show_if, answers_map):
    """Return True if a question should be visible. DEFAULT-SHOW: if the
    dependency is unanswered/skipped, show the question."""
    if not show_if:
        return True
    target = show_if.get("question_id")
    if not target:
        return True
    ans = (answers_map or {}).get(target)
    if not ans or ans.get("skipped"):
        return True
    actual = ans.get("value")
    if actual is None or actual == "" or (isinstance(actual, list) and len(actual) == 0):
        return True
    operator = (show_if.get("operator") or "equals").lower()
    expected_single = show_if.get("value")
    expected_list = show_if.get("values") or []

    def _as_list(x):
        return x if isinstance(x, list) else [x]

    if operator == "equals":
        return actual == expected_single
    if operator == "not_equals":
        return actual != expected_single
    if operator == "in":
        return actual in expected_list
    if operator == "not_in":
        return actual not in expected_list
    if operator == "includes":
        return any(v in _as_list(actual) for v in expected_list)
    if operator == "not_includes":
        return not any(v in _as_list(actual) for v in expected_list)
    if operator == "is_truthy":
        return bool(actual)
    if operator == "is_falsy":
        return not bool(actual)
    return True


def filter_visible_questions(domain, answers_map):
    return [q for q in domain.get("questions", []) if evaluate_show_if(q.get("show_if"), answers_map)]


def is_answer_filled(answer):
    """Value-aware: a note alone does NOT count; 'Lainnya' needs other_text."""
    if not answer or answer.get("skipped"):
        return False
    value = answer.get("value")
    raw_other = answer.get("other_text")
    other_filled = bool(raw_other.strip()) if isinstance(raw_other, str) else bool(raw_other)
    if isinstance(value, list):
        if not value:
            return False
        non_sentinel = [v for v in value if v != OTHER_SENTINEL]
        if non_sentinel:
            return True
        return other_filled
    if value == OTHER_SENTINEL:
        return other_filled
    if value is None or value == "":
        return False
    if value is False:
        return True
    return True


def get_all_question_ids(template):
    return [q["id"] for d in _get_domains(template) for q in d.get("questions", [])]


def question_index(template):
    return {q["id"]: q for d in _get_domains(template) for q in d.get("questions", [])}


def get_total_questions(template):
    return sum(len(d.get("questions", [])) for d in _get_domains(template))


def compute_progress(template, answers_list):
    answers_map = {a["question_id"]: a for a in answers_list}
    answered_ids = {a["question_id"] for a in answers_list if is_answer_filled(a)}
    domains = []
    visible_total = 0
    visible_answered = 0
    for d in _get_domains(template):
        visible = filter_visible_questions(d, answers_map)
        ids = {q["id"] for q in visible}
        answered = len(answered_ids & ids)
        visible_total += len(ids)
        visible_answered += answered
        domains.append({
            "domain_id": d.get("id"),
            "code": d.get("code"),
            "title": d.get("title"),
            "answered": answered,
            "total": len(ids),
            "percent": round(answered / len(ids) * 100) if ids else 0,
            "status": "completed" if ids and answered == len(ids) else ("in_progress" if answered > 0 else "not_started"),
        })
    return {
        "answered": visible_answered,
        "total": visible_total,
        "percent": round(visible_answered / visible_total * 100) if visible_total else 0,
        "domains": domains,
    }


def get_required_question_ids(template):
    return {q["id"] for d in _get_domains(template) for q in d.get("questions", []) if q.get("required")}


def answers_list_to_map(answers_list: list) -> dict:
    """Convert list of answer dicts to {question_id: answer} map."""
    return {a["question_id"]: a for a in answers_list}


def domain_summary(template):
    out = []
    for d in _get_domains(template):
        out.append({k: v for k, v in d.items() if k != "questions"} | {"question_count": len(d.get("questions", []))})
    return out
