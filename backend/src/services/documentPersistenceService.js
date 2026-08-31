import prisma from '../config/prisma.js';

const VALID_PRIORITIES = ['HIGH', 'MEDIUM', 'LOW'];
const VALID_SEVERITIES = ['HIGH', 'MEDIUM', 'LOW'];

function normalizePriority(value) {
  if (!value) return null;
  const normalized = String(value).trim().toUpperCase();
  return VALID_PRIORITIES.includes(normalized) ? normalized : null;
}

function normalizeSeverity(value) {
  if (!value) return null;
  const normalized = String(value).trim().toUpperCase();
  return VALID_SEVERITIES.includes(normalized) ? normalized : null;
}

function normalizePageNumber(value) {
  if (value === null || value === undefined) return null;
  const num = parseInt(value, 10);
  return Number.isInteger(num) && num >= 1 ? num : null;
}

function normalizeString(value) {
  if (value === null || value === undefined) return null;
  const str = String(value).trim();
  return str.length > 0 ? str : null;
}

function isValidTask(task) {
  if (!task || typeof task !== 'object') return false;
  const title = normalizeString(task.title);
  return title !== null && title.length >= 3;
}

function isValidRisk(risk) {
  if (!risk || typeof risk !== 'object') return false;
  const title = normalizeString(risk.title);
  return title !== null && title.length >= 3;
}

function isValidDecision(decision) {
  if (!decision || typeof decision !== 'object') return false;
  const title = normalizeString(decision.title);
  return title !== null && title.length >= 3;
}

function mapTask(task, documentId) {
  return {
    documentId,
    title: normalizeString(task.title),
    description: normalizeString(task.description),
    owner: normalizeString(task.owner),
    deadline: normalizeString(task.deadline),
    priority: normalizePriority(task.priority),
    sourcePageNumber: normalizePageNumber(task.source?.pageNumber),
    sourceEvidence: normalizeString(task.source?.evidence)
  };
}

function mapRisk(risk, documentId) {
  return {
    documentId,
    title: normalizeString(risk.title),
    description: normalizeString(risk.description),
    severity: normalizeSeverity(risk.severity),
    sourcePageNumber: normalizePageNumber(risk.source?.pageNumber),
    sourceEvidence: normalizeString(risk.source?.evidence)
  };
}

function mapDecision(decision, documentId) {
  return {
    documentId,
    title: normalizeString(decision.title),
    description: normalizeString(decision.description),
    sourcePageNumber: normalizePageNumber(decision.source?.pageNumber),
    sourceEvidence: normalizeString(decision.source?.evidence)
  };
}

/**
 * Save complete document intelligence in a single Prisma transaction.
 * Returns the saved document with all related data.
 */
export async function saveDocumentIntelligence({ fileMetadata, aiResponse, validatedIntelligence }) {
  const documentData = {
    originalName: normalizeString(fileMetadata.originalName),
    storedFilename: normalizeString(fileMetadata.storedFilename),
    mimeType: normalizeString(fileMetadata.mimeType) || 'application/pdf',
    fileSize: parseInt(fileMetadata.fileSize, 10) || 0,
    pageCount: parseInt(aiResponse.pageCount, 10) || 0
  };

  if (!documentData.originalName || !documentData.storedFilename) {
    throw new Error('Missing required document metadata');
  }

  const validTasks = Array.isArray(validatedIntelligence?.tasks)
    ? validatedIntelligence.tasks.filter(isValidTask)
    : [];

  const validRisks = Array.isArray(validatedIntelligence?.risks)
    ? validatedIntelligence.risks.filter(isValidRisk)
    : [];

  const validDecisions = Array.isArray(validatedIntelligence?.decisions)
    ? validatedIntelligence.decisions.filter(isValidDecision)
    : [];

  const result = await prisma.$transaction(async (tx) => {
    const document = await tx.document.create({ data: documentData });

    const tasks = [];
    for (const task of validTasks) {
      const created = await tx.task.create({ data: mapTask(task, document.id) });
      tasks.push(created);
    }

    const risks = [];
    for (const risk of validRisks) {
      const created = await tx.risk.create({ data: mapRisk(risk, document.id) });
      risks.push(created);
    }

    const decisions = [];
    for (const decision of validDecisions) {
      const created = await tx.decision.create({ data: mapDecision(decision, document.id) });
      decisions.push(created);
    }

    return { document, tasks, risks, decisions };
  });

  return result;
}
