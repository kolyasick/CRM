import { Project_document } from "@prisma/client";
import prisma from "~/lib/prisma";

export default defineEventHandler(async (event) => {
  const { id } = event.context.params as { id: string };

  try {
    let files: {
      projectFiles: Project_document[] | [];
      actFiles: string[] | [];
    } = {
      projectFiles: [],
      actFiles: [],
    };
    const projectFiles = await prisma.project_document.findMany({
      where: {
        project_id: parseInt(id),
      },
    });
    const appFiles = await prisma.application.findMany({
      where: {
        AND: [
          {
            projects: {
              some: {
                projectId: parseInt(id),
              },
            },
          },
          {
            actDocument: {
              not: null,
            },
          },
        ],
      },
      select: {
        actDocument: true,
      },
    });
    // @ts-ignore
    if (projectFiles.length) projectFiles.map((p) => files.projectFiles.push(p));
    // @ts-ignore
    if (appFiles.length) appFiles.map((f) => files.actFiles.push(f.actDocument!));

    return files;
  } catch (e) {
    console.log(e);
  }
});
