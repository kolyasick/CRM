import prisma from "~/lib/prisma";

export default defineEventHandler(async (event) => {
  const { projectId, isCompleted, id, q, limit, offset, adminStatus, legalEntityId, payStatusId } = getQuery<{
    projectId?: string;
    isCompleted?: string;
    id?: string;
    q?: string;
    offset?: string;
    limit?: string;
    legalEntityId: string;
    payStatusId: string;
    adminStatus: string;
  }>(event);

  const applications = await prisma.application.findMany({
    where: {
      id: id ? parseInt(id) : undefined,
      OR: q
        ? [
            {
              title: {
                contains: q,
                mode: "insensitive",
              },
            },
            {
              counterparty: {
                title: {
                  contains: q,
                  mode: "insensitive",
                },
              },
            },
            q.length < 10 && !isNaN(Number(q))
              ? {
                  id: {
                    equals: Number(q),
                  },
                }
              : {},
          ]
        : undefined,
      isPayed: id ? undefined : isCompleted ? Boolean(parseInt(isCompleted)) : undefined,
      projects: {
        some: {
          projectId: projectId ? parseInt(projectId) : undefined,
        },
      },
      legalEntityId: legalEntityId ? parseInt(legalEntityId) : undefined,
      payStatusId: payStatusId ? parseInt(payStatusId) : undefined,
      adminStatus: adminStatus
        ? {
            title: adminStatus,
          }
        : undefined,
    },
    include: {
      legalEntity: {
        select: {
          id: true,
          title: true,
          dbName: true,
          inn: true,
        },
      },
      adminStatus: true,
      positions: true,
      counterparty: {
        include: {
          bankAccount: true,
          counterparty_contact: true,
        },
      },
      moderator: {
        select: {
          id: true,
          full_name: true,
        },
      },
      projects: {
        select: {
          sum: true,
          project: {
            select: {
              id: true,
              title: true,
              manager: {
                select: {
                  id: true,
                  full_name: true,
                  realEmail: true,
                },
              },
            },
          },
        },
      },

      payStatus: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: limit ? parseInt(limit) : undefined,
    skip: offset ? parseInt(offset) : undefined,
  });

  let mappedApplications = applications.map((a) => {
    return {
      ...a,
      partSum: projectId
        ? a.projects.find((p) => {
            return p.project.id === parseInt(projectId);
          })?.sum
        : a.projects[0].sum,
      project: projectId
        ? a.projects.find((p) => {
            return p.project.id === parseInt(projectId);
          })?.project
        : a.projects[0].project,
      projects: undefined,
    };
  });

  return mappedApplications;
});
