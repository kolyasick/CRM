import type {
  Action,
  BankAccount,
  Counterparty,
  Counterparty_contact,
  Job,
  JobDetail,
  Legal_entity,
  Pay_status,
  Position,
  PrimaryDocument,
  Project,
  Project_document,
  Project_status,
  ProjectApplications,
  User,
} from "@prisma/client";
import type { Application, AdminStatus } from "@prisma/client";

export type CounterParty = Counterparty & {
  project?: IProject[];
  application?: IApplication[];
  counterparty_contact?: Counterparty_contact[];
  legalEntity?: Legal_entity;
  bankAccount?: BankAccount;
  manager?: User;
};

export interface IJob extends Job {
  counterParty?: Counterparty;
  details?: (JobDetail & { counterparty?: CounterParty })[];
}

export type IProject = Project & {
  Project_status: Project_status;
  counterparty: CounterParty;
  Legal_entity: Legal_entity;
  project_document: Project_document[];
  hidden?: boolean;
  applications?: IApplication[];
  manager?: User;
  deadline: Date | null;
};

export interface IProjectApplications extends ProjectApplications {
  project?: IProject;
  application?: IApplication;
}

export interface IApplication extends Application {
  legalEntity?: Legal_entity;
  adminStatus?: AdminStatus;
  counterparty?: CounterParty;
  payStatus?: Pay_status;
  sum: number;
  project?: IProject;
  positions?: Position[];
  jobs?: IJob[];
  moderator?: User;
  partSum?: number;
  projectId?: number;
}

export interface IAction extends Action {
  user?: User;
}

export interface IPrimaryDocument extends PrimaryDocument {
  manager?: User;
  counterParty?: CounterParty;
  legalEntity?: Legal_entity;
  project?: Project;
  application?: IApplication;
}
