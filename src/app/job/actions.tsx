"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { getDataStore } from "@/lib/store";

async function requireEntitled() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("未登录");
  }
  if (!user.entitled && user.role !== "admin") {
    throw new Error("无权限");
  }
  return user;
}

async function getExistingAction(
  store: Awaited<ReturnType<typeof getDataStore>>,
  userId: string,
  jobId: string
) {
  const actions = await store.listJobActions(userId);
  return actions.find((action) => action.jobId === jobId) || null;
}

export async function toggleAppliedAction(formData: FormData) {
  const user = await requireEntitled();
  const jobId = String(formData.get("jobId") || "");
  const applied = String(formData.get("applied") || "false") === "true";
  if (!jobId) return;
  const store = await getDataStore();
  const existing = await getExistingAction(store, user.id, jobId);
  await store.upsertJobAction({
    userId: user.id,
    jobId,
    applied,
    note: existing?.note ?? "",
    updatedAt: new Date().toISOString(),
  });
  revalidatePath("/job");
}

export async function updateNoteAction(formData: FormData) {
  const user = await requireEntitled();
  const jobId = String(formData.get("jobId") || "");
  const note = String(formData.get("note") || "").trim();
  if (!jobId) return;
  const store = await getDataStore();
  const existing = await getExistingAction(store, user.id, jobId);
  await store.upsertJobAction({
    userId: user.id,
    jobId,
    applied: existing?.applied ?? false,
    note,
    updatedAt: new Date().toISOString(),
  });
  revalidatePath("/job");
}
