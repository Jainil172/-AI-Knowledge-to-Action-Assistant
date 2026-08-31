"""
Project intelligence validation and normalization service.
Validates AI-extracted data and ensures clean, reliable output.
"""

from typing import List, Dict, Any, Optional
from app.schemas.project_intelligence import (
    Task, Risk, Decision, SourceInfo, ProjectIntelligence,
    ValidationSummary, ValidatedIntelligence
)


def _normalize_text(text: Optional[str]) -> Optional[str]:
    """Normalize text by removing excess whitespace."""
    if text is None:
        return None
    text = text.strip()
    if not text:
        return None
    # Normalize internal whitespace
    import re
    text = re.sub(r"\s+", " ", text)
    return text


def _validate_source(source: Optional[Dict]) -> Optional[SourceInfo]:
    """Validate and normalize source information."""
    if not source:
        return None

    page_number = source.get("pageNumber")
    evidence = source.get("evidence")

    # Validate page number
    if page_number is not None:
        try:
            page_number = int(page_number)
            if page_number < 1:
                page_number = None
        except (ValueError, TypeError):
            page_number = None

    # Validate evidence
    if evidence is not None:
        evidence = _normalize_text(evidence)
        if evidence and len(evidence) > 200:
            evidence = evidence[:197] + "..."

    if page_number is None and evidence is None:
        return None

    return SourceInfo(pageNumber=page_number, evidence=evidence)


def _validate_task(task_data: Dict[str, Any]) -> Optional[Task]:
    """Validate and normalize a single task."""
    title = task_data.get("title")
    if not title or not str(title).strip():
        return None

    title = _normalize_text(str(title))
    if not title:
        return None

    source = _validate_source(task_data.get("source"))

    try:
        task = Task(
            title=title,
            description=_normalize_text(task_data.get("description")),
            owner=_normalize_text(task_data.get("owner")),
            deadline=_normalize_text(task_data.get("deadline")),
            priority=task_data.get("priority"),
            source=source
        )
        return task
    except Exception:
        return None


def _validate_risk(risk_data: Dict[str, Any]) -> Optional[Risk]:
    """Validate and normalize a single risk."""
    title = risk_data.get("title")
    if not title or not str(title).strip():
        return None

    title = _normalize_text(str(title))
    if not title:
        return None

    source = _validate_source(risk_data.get("source"))

    try:
        risk = Risk(
            title=title,
            description=_normalize_text(risk_data.get("description")),
            severity=risk_data.get("severity"),
            source=source
        )
        return risk
    except Exception:
        return None


def _validate_decision(decision_data: Dict[str, Any]) -> Optional[Decision]:
    """Validate and normalize a single decision."""
    title = decision_data.get("title")
    if not title or not str(title).strip():
        return None

    title = _normalize_text(str(title))
    if not title:
        return None

    source = _validate_source(decision_data.get("source"))

    try:
        decision = Decision(
            title=title,
            description=_normalize_text(decision_data.get("description")),
            source=source
        )
        return decision
    except Exception:
        return None


def _remove_task_duplicates(tasks: List[Task]) -> List[Task]:
    """Remove duplicate tasks conservatively."""
    if not tasks:
        return []

    seen = set()
    unique_tasks = []

    for task in tasks:
        # Create a key based on title and owner (case-insensitive)
        title_key = task.title.lower().strip() if task.title else ""
        owner_key = task.owner.lower().strip() if task.owner else ""
        key = f"{title_key}|{owner_key}"

        if key not in seen:
            seen.add(key)
            unique_tasks.append(task)

    return unique_tasks


def _remove_risk_duplicates(risks: List[Risk]) -> List[Risk]:
    """Remove duplicate risks conservatively."""
    if not risks:
        return []

    seen = set()
    unique_risks = []

    for risk in risks:
        title_key = risk.title.lower().strip() if risk.title else ""
        if title_key not in seen:
            seen.add(title_key)
            unique_risks.append(risk)

    return unique_risks


def _remove_decision_duplicates(decisions: List[Decision]) -> List[Decision]:
    """Remove duplicate decisions conservatively."""
    if not decisions:
        return []

    seen = set()
    unique_decisions = []

    for decision in decisions:
        title_key = decision.title.lower().strip() if decision.title else ""
        if title_key not in seen:
            seen.add(title_key)
            unique_decisions.append(decision)

    return unique_decisions


def validate_project_intelligence(raw_data: Dict[str, Any]) -> ValidatedIntelligence:
    """
    Validate and normalize AI-extracted project intelligence.

    Args:
        raw_data: Raw AI output dictionary

    Returns:
        ValidatedIntelligence with clean, validated data
    """
    warnings = []
    summary = ValidationSummary()

    # Check if raw_data is valid
    if not raw_data or not isinstance(raw_data, dict):
        return ValidatedIntelligence(
            success=False,
            message="Invalid or empty AI response",
            warnings=["No valid data to validate"]
        )

    # Extract and validate text fields
    summary_text = _normalize_text(raw_data.get("summary"))
    project_context = _normalize_text(raw_data.get("projectContext"))

    # Validate tasks
    raw_tasks = raw_data.get("tasks", [])
    if not isinstance(raw_tasks, list):
        raw_tasks = []
        warnings.append("Tasks field was not a list, treated as empty")

    summary.totalTasksExtracted = len(raw_tasks)
    valid_tasks = []
    for task_data in raw_tasks:
        if isinstance(task_data, dict):
            task = _validate_task(task_data)
            if task is not None:
                valid_tasks.append(task)
            else:
                summary.invalidTasksRemoved += 1

    # Remove duplicates
    tasks_before = len(valid_tasks)
    valid_tasks = _remove_task_duplicates(valid_tasks)
    summary.duplicatesRemoved += tasks_before - len(valid_tasks)
    summary.validTasks = len(valid_tasks)

    # Validate risks
    raw_risks = raw_data.get("risks", [])
    if not isinstance(raw_risks, list):
        raw_risks = []
        warnings.append("Risks field was not a list, treated as empty")

    summary.totalRisksExtracted = len(raw_risks)
    valid_risks = []
    for risk_data in raw_risks:
        if isinstance(risk_data, dict):
            risk = _validate_risk(risk_data)
            if risk is not None:
                valid_risks.append(risk)
            else:
                summary.invalidRisksRemoved += 1

    # Remove duplicates
    risks_before = len(valid_risks)
    valid_risks = _remove_risk_duplicates(valid_risks)
    summary.duplicatesRemoved += risks_before - len(valid_risks)
    summary.validRisks = len(valid_risks)

    # Validate decisions
    raw_decisions = raw_data.get("decisions", [])
    if not isinstance(raw_decisions, list):
        raw_decisions = []
        warnings.append("Decisions field was not a list, treated as empty")

    summary.totalDecisionsExtracted = len(raw_decisions)
    valid_decisions = []
    for decision_data in raw_decisions:
        if isinstance(decision_data, dict):
            decision = _validate_decision(decision_data)
            if decision is not None:
                valid_decisions.append(decision)
            else:
                summary.invalidDecisionsRemoved += 1

    # Remove duplicates
    decisions_before = len(valid_decisions)
    valid_decisions = _remove_decision_duplicates(valid_decisions)
    summary.duplicatesRemoved += decisions_before - len(valid_decisions)
    summary.validDecisions = len(valid_decisions)

    # Validate list fields
    key_topics = raw_data.get("keyTopics", [])
    if not isinstance(key_topics, list):
        key_topics = []
    key_topics = [_normalize_text(t) for t in key_topics if t]
    key_topics = [t for t in key_topics if t]

    people_mentioned = raw_data.get("peopleMentioned", [])
    if not isinstance(people_mentioned, list):
        people_mentioned = []
    people_mentioned = [_normalize_text(p) for p in people_mentioned if p]
    people_mentioned = [p for p in people_mentioned if p]

    important_points = raw_data.get("importantPoints", [])
    if not isinstance(important_points, list):
        important_points = []
    important_points = [_normalize_text(ip) for ip in important_points if ip]
    important_points = [ip for ip in important_points if ip]

    missing_info = raw_data.get("missingOrUnclearInformation", [])
    if not isinstance(missing_info, list):
        missing_info = []
    missing_info = [_normalize_text(mi) for mi in missing_info if mi]
    missing_info = [mi for mi in missing_info if mi]

    # Build validated intelligence
    intelligence = ProjectIntelligence(
        summary=summary_text,
        projectContext=project_context,
        tasks=valid_tasks,
        risks=valid_risks,
        decisions=valid_decisions,
        keyTopics=key_topics,
        peopleMentioned=people_mentioned,
        importantPoints=important_points,
        missingOrUnclearInformation=missing_info
    )

    # Determine success message
    total_items = summary.validTasks + summary.validRisks + summary.validDecisions
    total_invalid = summary.invalidTasksRemoved + summary.invalidRisksRemoved + summary.invalidDecisionsRemoved

    if total_items == 0 and (summary.totalTasksExtracted > 0 or summary.totalRisksExtracted > 0 or summary.totalDecisionsExtracted > 0):
        message = "All extracted items were invalid and removed"
        warnings.append("No valid project intelligence could be extracted")
    elif total_invalid > 0:
        message = f"Validated successfully. Removed {total_invalid} invalid items."
    else:
        message = "Project intelligence validated successfully"

    return ValidatedIntelligence(
        success=True,
        message=message,
        intelligence=intelligence,
        validationSummary=summary,
        warnings=warnings
    )
