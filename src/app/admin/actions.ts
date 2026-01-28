"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { getDataStore } from "@/lib/store";
import { createId, createInviteCode } from "@/lib/crypto";
import type { Job } from "@/lib/types";

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    throw new Error("无权限");
  }
  return user;
}

export async function createInviteAction(formData: FormData) {
  const admin = await requireAdmin();
  const count = Math.max(1, Number(formData.get("count") || 1));
  const store = await getDataStore();

  for (let i = 0; i < count; i += 1) {
    await store.createInvite({
      code: createInviteCode(),
      used: false,
      createdAt: new Date().toISOString(),
      createdBy: admin.id,
    });
  }

  revalidatePath("/admin");
}

export async function toggleEntitledAction(formData: FormData) {
  await requireAdmin();
  const userId = String(formData.get("userId") || "");
  const entitled = String(formData.get("entitled") || "false") === "true";
  if (!userId) return;
  const store = await getDataStore();
  await store.updateUserEntitled(userId, entitled);
  revalidatePath("/admin");
}

export async function createJobAction(formData: FormData) {
  await requireAdmin();
  const store = await getDataStore();
  const job: Job = {
    id: createId(),
    title: String(formData.get("title") || "").trim(),
    company: String(formData.get("company") || "").trim(),
    city: String(formData.get("city") || "").trim(),
    salary: String(formData.get("salary") || "").trim(),
    tags: String(formData.get("tags") || "")
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean),
    publishedAt: new Date().toISOString(),
    link: String(formData.get("link") || "#").trim(),
    status: "open",
    category: "事业单位",
    region: "华东",
    province: String(formData.get("city") || "").trim() || "未知",
    views: 0,
    applyLink: String(formData.get("link") || "#").trim(),
    sourceLink: String(formData.get("link") || "#").trim(),
  };

  if (!job.title || !job.company) return;
  await store.createJob(job);
  revalidatePath("/admin");
  revalidatePath("/job");
}

export async function deleteJobAction(formData: FormData) {
  await requireAdmin();
  const jobId = String(formData.get("jobId") || "");
  if (!jobId) return;
  const store = await getDataStore();
  await store.deleteJob(jobId);
  revalidatePath("/admin");
  revalidatePath("/job");
}
