"""
Pydantic schemas for project intelligence data.
Used for validation and normalization of AI-extracted project data.
"""

from typing import Optional, List
from pydantic import BaseModel, field_validator
import re


class SourceInfo(BaseModel):
    """Source information linking extracted items back to the document."""
    pageNumber: Optional[int] = None
    evidence: Optional[str] = None

    @field_validator("pageNumber")
    @classmethod
    def validate_page_number(cls, v):
        if v is not None:
            if not isinstance(v, int) or v < 1:
                return None
        return v

    @field_validator("evidence")
    @classmethod
    def validate_evidence(cls, v):
        if v is not None:
            # Normalize whitespace
            v = re.sub(r"\s+", " ", v).strip()
            # Truncate if too long (max 200 chars)
            if len(v) > 200:
                v = v[:197] + "..."
        return v


class Task(BaseModel):
    """Extracted task from project document."""
    title: str
    description: Optional[str] = None
    owner: Optional[str] = None
    deadline: Optional[str] = None
    priority: Optional[str] = None
    source: Optional[SourceInfo] = None

    @field_validator("title")
    @classmethod
    def validate_title(cls, v):
        if not v or not v.strip():
            return None
        return re.sub(r"\s+", " ", v).strip()

    @field_validator("description")
    @classmethod
    def validate_description(cls, v):
        if v is not None:
            v = re.sub(r"\s+", " ", v).strip()
        return v

    @field_validator("owner")
    @classmethod
    def validate_owner(cls, v):
        if v is not None:
            v = re.sub(r"\s+", " ", v).strip()
        return v

    @field_validator("deadline")
    @classmethod
    def validate_deadline(cls, v):
        if v is not None:
            v = v.strip()
        return v

    @field_validator("priority")
    @classmethod
    def validate_priority(cls, v):
        if v is None:
            return None
        # Normalize to lowercase
        v = v.strip().lower()
        # Map common variations
        priority_map = {
            "high": "high",
            "medium": "medium",
            "med": "medium",
            "low": "low",
            "critical": "high",
            "urgent": "high",
            "important": "high",
            "normal": "medium",
            "minor": "low",
        }
        normalized = priority_map.get(v)
        if normalized is None:
            # Invalid priority, return null
            return None
        return normalized


class Risk(BaseModel):
    """Extracted risk from project document."""
    title: str
    description: Optional[str] = None
    severity: Optional[str] = None
    source: Optional[SourceInfo] = None

    @field_validator("title")
    @classmethod
    def validate_title(cls, v):
        if not v or not v.strip():
            return None
        return re.sub(r"\s+", " ", v).strip()

    @field_validator("description")
    @classmethod
    def validate_description(cls, v):
        if v is not None:
            v = re.sub(r"\s+", " ", v).strip()
        return v

    @field_validator("severity")
    @classmethod
    def validate_severity(cls, v):
        if v is None:
            return None
        # Normalize to lowercase
        v = v.strip().lower()
        # Map common variations
        severity_map = {
            "high": "high",
            "medium": "medium",
            "med": "medium",
            "low": "low",
            "critical": "high",
            "severe": "high",
            "moderate": "medium",
            "minor": "low",
        }
        normalized = severity_map.get(v)
        if normalized is None:
            # Invalid severity, return null
            return None
        return normalized


class Decision(BaseModel):
    """Extracted decision from project document."""
    title: str
    description: Optional[str] = None
    source: Optional[SourceInfo] = None

    @field_validator("title")
    @classmethod
    def validate_title(cls, v):
        if not v or not v.strip():
            return None
        return re.sub(r"\s+", " ", v).strip()

    @field_validator("description")
    @classmethod
    def validate_description(cls, v):
        if v is not None:
            v = re.sub(r"\s+", " ", v).strip()
        return v


class ProjectIntelligence(BaseModel):
    """Complete project intelligence extracted from document."""
    summary: Optional[str] = None
    projectContext: Optional[str] = None
    tasks: List[Task] = []
    risks: List[Risk] = []
    decisions: List[Decision] = []
    keyTopics: List[str] = []
    peopleMentioned: List[str] = []
    importantPoints: List[str] = []
    missingOrUnclearInformation: List[str] = []


class ValidationSummary(BaseModel):
    """Summary of validation results."""
    totalTasksExtracted: int = 0
    validTasks: int = 0
    invalidTasksRemoved: int = 0
    totalRisksExtracted: int = 0
    validRisks: int = 0
    invalidRisksRemoved: int = 0
    totalDecisionsExtracted: int = 0
    validDecisions: int = 0
    invalidDecisionsRemoved: int = 0
    duplicatesRemoved: int = 0


class ValidatedIntelligence(BaseModel):
    """Validated and normalized project intelligence."""
    success: bool
    message: str
    intelligence: Optional[ProjectIntelligence] = None
    validationSummary: Optional[ValidationSummary] = None
    warnings: List[str] = []
