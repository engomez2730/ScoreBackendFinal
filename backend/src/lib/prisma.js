import { PrismaClient } from "@prisma/client";

// Single shared Prisma client for the whole process. Every file used to
// instantiate its own `new PrismaClient()`, and each instance opens its own
// connection pool — with a dozen of them lazily warming up as more code
// paths got exercised over a session, requests started queueing for a
// Postgres connection instead of failing fast, which shows up as things
// "getting slower and slower" rather than an outright error.
const prisma = new PrismaClient();

export default prisma;
