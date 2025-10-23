import prisma from "~/lib/prisma";

export default defineEventHandler(async (event) => {
  const { user } = await getUserSession(event);
  const query = getQuery(event);
  const dateFrom = typeof query.dateFrom === "string" && !isNaN(Date.parse(query.dateFrom)) ? new Date(query.dateFrom) : null;
  const dateTo =
    typeof query.dateTo === "string" && !isNaN(Date.parse(query.dateTo)) ? new Date(new Date(query.dateTo).setHours(23, 59, 59, 999)) : null;

  const appWhere = {
    projects: {
      none: {
        project: {
          isPartner: true,
        },
      },
      some: {
        project: {
          ...(dateFrom &&
            dateTo && {
              AND: [{ created_at: { gte: dateFrom } }, { created_at: { lte: dateTo } }],
            }),
          ...(query.managerId && {
            managerId: parseInt(query.managerId as string),
          }),
        },
      },
    },
    ...(query.counterparty && {
      counterparty: {
        title: {
          contains: query.counterparty as string,
          mode: "insensitive" as const,
        },
      },
    }),
    ...(query.legal && { legalEntityId: parseInt(query.legal as string) }),
  };

  const projectWhere = {
    ...(dateFrom &&
      dateTo && {
        AND: [{ created_at: { gte: dateFrom } }, { created_at: { lte: dateTo } }],
      }),
    ...(query.legal && { Legal_entity_id: parseInt(query.legal as string) }),
    ...(query.managerId && { managerId: parseInt(query.managerId as string) }),
    ...(query.counterparty && {
      counterparty: {
        title: {
          contains: query.counterparty as string,
          mode: "insensitive" as const,
        },
      },
    }),
    isPartner: false,
  };

  const income = await prisma.project.aggregate({
    where: {
      ...projectWhere,
    },
    _sum: { payed_sum: true },
  });

  const expenses = await prisma.application.findMany({
    where: {
      ...appWhere,
      isIncome: false,
      payStatus: { title: "Оплачен" },
    },
    select: {
      sum: true,
      accountDate: true,
    },
  });

  const totalIncome = income._sum?.payed_sum || 0;
  const totalExpense = expenses.reduce((sum, exp) => sum + (exp.sum || 0), 0);

  const projectsCount = await prisma.project.count({ where: projectWhere });
  const profit = Number(totalIncome) - Number(totalExpense);

  const monthlyStats: Record<string, { income: number; expense: number; profit: number }> = {};
  const monthsToShow = 6;
  const now = new Date();
  const monthsList: string[] = [];

  for (let i = monthsToShow - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthsList.push(key);
  }

  const projectsForMonthlyStats = await prisma.project.findMany({
    where: {
      ...projectWhere,
    },
    select: {
      payed_sum: true,
      created_at: true,
    },
  });

  projectsForMonthlyStats.forEach((project) => {
    const d = new Date(project.created_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

    if (!monthlyStats[key]) {
      monthlyStats[key] = { income: 0, expense: 0, profit: 0 };
    }

    monthlyStats[key].income += Number(project.payed_sum) || 0;
  });

  expenses.forEach((exp) => {
    const d = new Date(exp.accountDate);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

    if (!monthlyStats[key]) {
      monthlyStats[key] = { income: 0, expense: 0, profit: 0 };
    }

    monthlyStats[key].expense += Number(exp.sum) || 0;
  });

  for (const key in monthlyStats) {
    monthlyStats[key].profit = Math.max(monthlyStats[key].income - monthlyStats[key].expense, 0);
  }

  for (const key of monthsList) {
    if (!monthlyStats[key]) {
      monthlyStats[key] = { income: 0, expense: 0, profit: 0 };
    }
  }

  const filteredStats: typeof monthlyStats = {};
  for (const key of monthsList) {
    filteredStats[key] = monthlyStats[key];
  }

  const projects = await prisma.project.findMany({
    where: {
      ...projectWhere,
    },
    select: {
      id: true,
      title: true,
      sum: true,
      created_at: true,
      payed_sum: true,
      jobs: {
        select: {
          sum: true,
          ourSum: true,
        },
      },
      applications: {
        select: {
          id: true,
          application: {
            select: {
              isIncome: true,
              sum: true,
              payStatus: { select: { title: true } },
            },
          },
        },
      },
      Project_status: { select: { title: true } },
      counterparty: { select: { title: true, id: true } },
    },
  });

  const projectsDetail = projects.map((p) => {
    const projectIncome = Number(p.payed_sum || 0);

    const projectExpense = p.applications
      .filter((a) => !a.application.isIncome && a.application.payStatus.title === "Оплачен")
      .reduce((sum, a) => sum + (Number(a.application.sum) || 0), 0);

    return {
      id: p.id,
      title: p.title,
      sum: Number(p.sum || 0),
      created_at: p.created_at,
      jobsCount: p.jobs.length,
      applicationsCount: p.applications.length,
      income: Math.max(projectIncome, 0),
      expense: Math.max(projectExpense, 0),
      profit: Math.max(projectIncome - projectExpense, 0),
      counterparty: p.counterparty,
      Project_status: p.Project_status,
    };
  });

  const statusBreakdown = projectsDetail.reduce<Record<string, number>>((acc, p) => {
    const status = p.Project_status?.title || "Без статуса";
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  let manager;

  if (query.managerId) {
    manager = await prisma.user.findUnique({
      where: {
        id: parseInt(query.managerId as string),
      },
    });
  }

  if (user && user?.email !== "admin@mail.ru" && event.node.req.headers["referer"]?.split("/").pop() === "statistics") {
    await prisma.action.create({
      data: {
        method: event.method,
        url: event.path,
        description: `Просматривал статистку ${query.managerId ? `менеджера ${manager?.full_name}` : ""}`,
        statusCode: event.node.res.statusCode,
        userId: user.id,
      },
    });
  }

  return {
    income: Math.max(totalIncome, 0),
    expense: Math.max(totalExpense, 0),
    profit: Math.max(profit, 0),
    projectsCount,
    monthlyStats: filteredStats,
    projectsDetail,
    statusBreakdown,
  };
});
