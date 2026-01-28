export type Role = "admin" | "user";

export type User = {
  id: string;
  email: string;
  passwordHash: string;
  role: Role;
  entitled: boolean;
  createdAt: string;
};

export type Session = {
  id: string;
  userId: string;
  expiresAt: string;
};

export type Invite = {
  code: string;
  used: boolean;
  createdAt: string;
  usedAt?: string;
  createdBy?: string;
};

export type JobStatus = "open" | "closed";

export type Job = {
  id: string;
  title: string;
  company: string;
  city: string;
  district?: string;
  salary: string;
  tags: string[];
  publishedAt: string;
  link: string;
  status: JobStatus;
  category: string;
  region: string;
  province: string;
  views: number;
  applyLink: string;
  sourceLink: string;
};

export type JobAction = {
  userId: string;
  jobId: string;
  applied: boolean;
  note: string;
  updatedAt: string;
};
