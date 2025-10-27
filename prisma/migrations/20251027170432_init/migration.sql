-- CreateTable
CREATE TABLE "public"."Counterparty" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(2550) NOT NULL,
    "comment" VARCHAR(4096),
    "lawyerComment" TEXT,
    "legalEntityId" INTEGER NOT NULL,
    "form" TEXT NOT NULL,
    "inn" TEXT NOT NULL,
    "kpp" TEXT NOT NULL,
    "ogrn" TEXT NOT NULL,
    "physicalAddress" TEXT NOT NULL,
    "legalAddress" TEXT,
    "isPhysicalAddressEq" BOOLEAN NOT NULL,
    "mailAddress" TEXT NOT NULL,
    "isMailAddressEq" BOOLEAN NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "isContractor" BOOLEAN NOT NULL DEFAULT false,
    "isAgreed" BOOLEAN NOT NULL DEFAULT false,
    "bankAccountId" INTEGER,
    "managerId" INTEGER,

    CONSTRAINT "Counterparty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BankAccount" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "bik" TEXT,
    "accountNumber" TEXT,
    "cAccount" TEXT,
    "city" TEXT,
    "address" TEXT,

    CONSTRAINT "BankAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Counterparty_contact" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "position" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "counterparty_id" TEXT NOT NULL,

    CONSTRAINT "Counterparty_contact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Legal_entity" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "form" TEXT NOT NULL,
    "inn" TEXT NOT NULL,
    "kpp" TEXT NOT NULL,
    "ogrn" TEXT NOT NULL,
    "tax" INTEGER,
    "physicalAddress" TEXT NOT NULL,
    "legalAddress" TEXT,
    "isPhysicalAddressEq" BOOLEAN NOT NULL,
    "mailAddress" TEXT NOT NULL,
    "isMailAddressEq" BOOLEAN NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "dbName" TEXT,
    "bankAccountId" INTEGER,

    CONSTRAINT "Legal_entity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Pay_status" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(255) NOT NULL,

    CONSTRAINT "Pay_status_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Closed_doc_status" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(255) NOT NULL,

    CONSTRAINT "Closed_doc_status_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Project" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" VARCHAR(255) NOT NULL,
    "sum" DOUBLE PRECISION NOT NULL,
    "payed_sum" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "counterparty_id" TEXT NOT NULL,
    "status_id" INTEGER NOT NULL,
    "managerId" INTEGER NOT NULL,
    "Legal_entity_id" INTEGER NOT NULL,
    "is_readed" BOOLEAN NOT NULL DEFAULT false,
    "isCorrection" BOOLEAN NOT NULL DEFAULT false,
    "precedent" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deadline" DATE,
    "isDisabled" BOOLEAN NOT NULL DEFAULT false,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "isPartner" BOOLEAN NOT NULL DEFAULT false,
    "isDocsEDO" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProjectApplications" (
    "id" SERIAL NOT NULL,
    "applicationId" INTEGER NOT NULL,
    "projectId" INTEGER NOT NULL,
    "sum" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "ProjectApplications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Application" (
    "id" SERIAL NOT NULL,
    "parentId" INTEGER,
    "document" TEXT,
    "actDocument" TEXT,
    "accountNumber" TEXT,
    "title" TEXT NOT NULL,
    "sum" DOUBLE PRECISION NOT NULL,
    "sumWithTax" DOUBLE PRECISION NOT NULL,
    "accountDate" TIMESTAMP(3) NOT NULL,
    "paymentDate" TIMESTAMP(3),
    "isIncome" BOOLEAN NOT NULL DEFAULT false,
    "isUrgent" BOOLEAN NOT NULL DEFAULT false,
    "counterpartyId" TEXT NOT NULL,
    "moderatorId" INTEGER NOT NULL,
    "taxPercent" INTEGER NOT NULL,
    "legalEntityId" INTEGER NOT NULL,
    "adminStatusId" INTEGER NOT NULL,
    "payStatusId" INTEGER NOT NULL,
    "comment" TEXT,
    "isPayed" BOOLEAN NOT NULL DEFAULT false,
    "isPaymentRequested" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Project_document" (
    "id" SERIAL NOT NULL,
    "url" VARCHAR(255) NOT NULL,
    "project_id" INTEGER NOT NULL,
    "status_id" INTEGER NOT NULL,

    CONSTRAINT "Project_document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Project_status" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(255) NOT NULL,

    CONSTRAINT "Project_status_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Role" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."User" (
    "id" SERIAL NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "realEmail" TEXT,
    "password" VARCHAR(255) NOT NULL,
    "full_name" VARCHAR(255) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "role_id" INTEGER NOT NULL,
    "token" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Position" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "qty" INTEGER NOT NULL,
    "unit" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "sum" DOUBLE PRECISION NOT NULL,
    "applicationId" INTEGER NOT NULL,

    CONSTRAINT "Position_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Job" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "qty" INTEGER NOT NULL,
    "unit" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "ourSum" DOUBLE PRECISION NOT NULL,
    "sum" DOUBLE PRECISION NOT NULL,
    "sumWithAk" DOUBLE PRECISION NOT NULL,
    "isAk" BOOLEAN NOT NULL DEFAULT false,
    "taxPercent" INTEGER NOT NULL DEFAULT 0,
    "counterPartyId" TEXT,
    "projectId" INTEGER NOT NULL,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."JobDetail" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "qty" INTEGER NOT NULL,
    "unit" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "jobId" INTEGER NOT NULL,
    "counterpartyId" TEXT,

    CONSTRAINT "JobDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AdminStatus" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,

    CONSTRAINT "AdminStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Action" (
    "id" SERIAL NOT NULL,
    "method" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "statusCode" INTEGER NOT NULL,
    "link" TEXT,
    "userId" INTEGER NOT NULL,
    "type" TEXT,
    "time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Action_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PrimaryDocument" (
    "id" SERIAL NOT NULL,
    "invoiceDate" TIMESTAMP(3) NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "paymentDate" TIMESTAMP(3),
    "amount" DOUBLE PRECISION NOT NULL,
    "legalEntityId" INTEGER NOT NULL,
    "counterpartyId" TEXT NOT NULL,
    "managerId" INTEGER NOT NULL,
    "projectId" INTEGER NOT NULL,
    "applicationId" INTEGER,
    "provisionDeadline" TIMESTAMP(3),
    "documentLink" TEXT,
    "status" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "isEmailed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PrimaryDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Counterparty_id_inn_idx" ON "public"."Counterparty"("id", "inn");

-- CreateIndex
CREATE INDEX "BankAccount_title_idx" ON "public"."BankAccount"("title");

-- CreateIndex
CREATE INDEX "Counterparty_contact_id_idx" ON "public"."Counterparty_contact"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Legal_entity_inn_key" ON "public"."Legal_entity"("inn");

-- CreateIndex
CREATE INDEX "Legal_entity_id_title_idx" ON "public"."Legal_entity"("id", "title");

-- CreateIndex
CREATE UNIQUE INDEX "Pay_status_title_key" ON "public"."Pay_status"("title");

-- CreateIndex
CREATE INDEX "Pay_status_title_idx" ON "public"."Pay_status"("title");

-- CreateIndex
CREATE UNIQUE INDEX "Closed_doc_status_title_key" ON "public"."Closed_doc_status"("title");

-- CreateIndex
CREATE INDEX "Closed_doc_status_title_idx" ON "public"."Closed_doc_status"("title");

-- CreateIndex
CREATE INDEX "Project_id_title_idx" ON "public"."Project"("id", "title");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectApplications_projectId_applicationId_key" ON "public"."ProjectApplications"("projectId", "applicationId");

-- CreateIndex
CREATE INDEX "Application_id_idx" ON "public"."Application"("id");

-- CreateIndex
CREATE INDEX "document_ibfk_1" ON "public"."Project_document"("project_id");

-- CreateIndex
CREATE UNIQUE INDEX "Project_status_title_key" ON "public"."Project_status"("title");

-- CreateIndex
CREATE INDEX "Project_status_title_idx" ON "public"."Project_status"("title");

-- CreateIndex
CREATE UNIQUE INDEX "Role_title_key" ON "public"."Role"("title");

-- CreateIndex
CREATE INDEX "Role_title_idx" ON "public"."Role"("title");

-- CreateIndex
CREATE UNIQUE INDEX "email" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "AdminStatus_title_key" ON "public"."AdminStatus"("title");

-- CreateIndex
CREATE INDEX "AdminStatus_title_idx" ON "public"."AdminStatus"("title");

-- CreateIndex
CREATE UNIQUE INDEX "PrimaryDocument_applicationId_key" ON "public"."PrimaryDocument"("applicationId");

-- AddForeignKey
ALTER TABLE "public"."Counterparty" ADD CONSTRAINT "Counterparty_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "public"."BankAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Counterparty" ADD CONSTRAINT "Counterparty_legalEntityId_fkey" FOREIGN KEY ("legalEntityId") REFERENCES "public"."Legal_entity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Counterparty" ADD CONSTRAINT "Counterparty_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Counterparty_contact" ADD CONSTRAINT "counterparty_contact_ibfk_2" FOREIGN KEY ("counterparty_id") REFERENCES "public"."Counterparty"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Legal_entity" ADD CONSTRAINT "Legal_entity_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "public"."BankAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Project" ADD CONSTRAINT "Project_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Project" ADD CONSTRAINT "project_ibfk_1" FOREIGN KEY ("counterparty_id") REFERENCES "public"."Counterparty"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Project" ADD CONSTRAINT "project_ibfk_2" FOREIGN KEY ("status_id") REFERENCES "public"."Project_status"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Project" ADD CONSTRAINT "project_ibfk_3" FOREIGN KEY ("Legal_entity_id") REFERENCES "public"."Legal_entity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProjectApplications" ADD CONSTRAINT "ProjectApplications_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProjectApplications" ADD CONSTRAINT "ProjectApplications_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "public"."Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Application" ADD CONSTRAINT "Application_counterpartyId_fkey" FOREIGN KEY ("counterpartyId") REFERENCES "public"."Counterparty"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Application" ADD CONSTRAINT "Application_payStatusId_fkey" FOREIGN KEY ("payStatusId") REFERENCES "public"."Pay_status"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Application" ADD CONSTRAINT "Application_adminStatusId_fkey" FOREIGN KEY ("adminStatusId") REFERENCES "public"."AdminStatus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Application" ADD CONSTRAINT "Application_legalEntityId_fkey" FOREIGN KEY ("legalEntityId") REFERENCES "public"."Legal_entity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Application" ADD CONSTRAINT "Application_moderatorId_fkey" FOREIGN KEY ("moderatorId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Project_document" ADD CONSTRAINT "project_document_ibfk_1" FOREIGN KEY ("project_id") REFERENCES "public"."Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Project_document" ADD CONSTRAINT "Project_document_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "public"."Closed_doc_status"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."User" ADD CONSTRAINT "User_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Position" ADD CONSTRAINT "Position_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "public"."Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Job" ADD CONSTRAINT "Job_counterPartyId_fkey" FOREIGN KEY ("counterPartyId") REFERENCES "public"."Counterparty"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Job" ADD CONSTRAINT "Job_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."JobDetail" ADD CONSTRAINT "JobDetail_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "public"."Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."JobDetail" ADD CONSTRAINT "JobDetail_counterpartyId_fkey" FOREIGN KEY ("counterpartyId") REFERENCES "public"."Counterparty"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Action" ADD CONSTRAINT "Action_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PrimaryDocument" ADD CONSTRAINT "PrimaryDocument_legalEntityId_fkey" FOREIGN KEY ("legalEntityId") REFERENCES "public"."Legal_entity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PrimaryDocument" ADD CONSTRAINT "PrimaryDocument_counterpartyId_fkey" FOREIGN KEY ("counterpartyId") REFERENCES "public"."Counterparty"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PrimaryDocument" ADD CONSTRAINT "PrimaryDocument_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PrimaryDocument" ADD CONSTRAINT "PrimaryDocument_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PrimaryDocument" ADD CONSTRAINT "PrimaryDocument_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "public"."Application"("id") ON DELETE SET NULL ON UPDATE CASCADE;
