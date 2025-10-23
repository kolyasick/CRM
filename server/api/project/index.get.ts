import prisma from "~/lib/prisma";

export default defineEventHandler(async (event) => {
  const { id, limit, onlySearch, managerId, isArchived, q } = getQuery<{
    id?: string;
    limit?: string;
    onlySearch?: string;
    managerId?: string;
    isArchived?: string;
    q?: string;
  }>(event);

  try {
 
    let projects;
    if (onlySearch) {
      projects = await prisma.project.findMany({
        where: {
          isArchived: false,
        },
        select: {
          id: true,
          title: true,
          counterparty: {
            select: {
              title: true,
              id: true,
              form: true,
              inn: true,
              legalEntityId: true,
            },
          },
          manager: {
            select: {
              full_name: true,
            },
          },
          Legal_entity_id: true,
        },
      });
    } else {
      projects = await prisma.project.findMany({
        include: {
          Project_status: true,
          manager: {
            select: {
              id: true,
              full_name: true,
            },
          },
          counterparty: {
            select: {
              id: true,
              title: true,
              inn: true,
              form: true,
              isAgreed: true,
              legalEntityId: true,
            },
          },
          Legal_entity: {
            select: {
              id: true,
              title: true,
              dbName: true,
            },
          },
          project_document: true,
        },

        where: {
          id: id ? parseInt(id) : undefined,
          isArchived: isArchived ? Boolean(parseInt(isArchived)) : false,
          managerId: managerId ? parseInt(managerId) : undefined,
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
                {
                  manager: {
                    full_name: {
                      contains: q,
                      mode: "insensitive",
                    },
                  },
                },
              ]
            : undefined,
        },
        take: limit ? parseInt(limit) : undefined,
        orderBy: {
          created_at: "desc",
        },
      });
    }

    return projects;
  } catch (error) {
    console.error("Error fetching projects:", error);
    throw createError({
      statusCode: 500,
      message: "Failed to fetch projects",
    });
  }
});
