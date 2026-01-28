import type { Invite, Job, JobAction, Session, User } from "../types";

export type DataStore = {
  getUserByEmail(email: string): Promise<User | null>;
  getUserById(id: string): Promise<User | null>;
  createUser(user: User): Promise<User>;
  listUsers(): Promise<User[]>;
  updateUserEntitled(userId: string, entitled: boolean): Promise<void>;

  createSession(userId: string, expiresAt: string): Promise<Session>;
  getSession(id: string): Promise<Session | null>;
  deleteSession(id: string): Promise<void>;

  createInvite(invite: Invite): Promise<Invite>;
  getInvite(code: string): Promise<Invite | null>;
  useInvite(code: string): Promise<Invite | null>;
  listInvites(): Promise<Invite[]>;

  listJobs(): Promise<Job[]>;
  createJob(job: Job): Promise<Job>;
  deleteJob(jobId: string): Promise<void>;

  listJobActions(userId: string): Promise<JobAction[]>;
  upsertJobAction(action: JobAction): Promise<JobAction>;
};
