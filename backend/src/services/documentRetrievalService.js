import prisma from '../config/prisma.js';

/**
 * Get all documents with summary counts.
 * Supports pagination and sorting.
 */
export async function getAllDocuments({ userId, page = 1, limit = 10, sort = 'desc' }) {
  const skip = (page - 1) * limit;
  const orderBy = { createdAt: sort === 'asc' ? 'asc' : 'desc' };

  const [documents, totalCount] = await Promise.all([
    prisma.document.findMany({
      where: { userId },
      skip,
      take: limit,
      orderBy,
      select: {
        id: true,
        originalName: true,
        mimeType: true,
        fileSize: true,
        pageCount: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { tasks: true, risks: true, decisions: true }
        }
      }
    }),
    prisma.document.count({ where: { userId } })
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  return {
    documents: documents.map(doc => ({
      id: doc.id,
      originalName: doc.originalName,
      mimeType: doc.mimeType,
      fileSize: doc.fileSize,
      pageCount: doc.pageCount,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      taskCount: doc._count.tasks,
      riskCount: doc._count.risks,
      decisionCount: doc._count.decisions
    })),
    pagination: {
      currentPage: page,
      totalPages,
      totalCount,
      limit,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    }
  };
}

/**
 * Get a single document with all its intelligence (tasks, risks, decisions).
 */
export async function getDocumentById(id, userId) {
  const document = await prisma.document.findUnique({
    where: { id, userId },
    include: {
      tasks: {
        orderBy: { createdAt: 'desc' }
      },
      risks: {
        orderBy: { createdAt: 'desc' }
      },
      decisions: {
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  return document;
}

/**
 * Get tasks for a specific document.
 */
export async function getDocumentTasks(documentId, { page = 1, limit = 50 } = {}) {
  const skip = (page - 1) * limit;

  const [tasks, totalCount] = await Promise.all([
    prisma.task.findMany({
      where: { documentId },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.task.count({ where: { documentId } })
  ]);

  return {
    tasks,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
      totalCount,
      limit
    }
  };
}

/**
 * Get risks for a specific document.
 */
export async function getDocumentRisks(documentId, { page = 1, limit = 50 } = {}) {
  const skip = (page - 1) * limit;

  const [risks, totalCount] = await Promise.all([
    prisma.risk.findMany({
      where: { documentId },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.risk.count({ where: { documentId } })
  ]);

  return {
    risks,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
      totalCount,
      limit
    }
  };
}

/**
 * Get decisions for a specific document.
 */
export async function getDocumentDecisions(documentId, { page = 1, limit = 50 } = {}) {
  const skip = (page - 1) * limit;

  const [decisions, totalCount] = await Promise.all([
    prisma.decision.findMany({
      where: { documentId },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.decision.count({ where: { documentId } })
  ]);

  return {
    decisions,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
      totalCount,
      limit
    }
  };
}
