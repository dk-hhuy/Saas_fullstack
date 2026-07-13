"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { generateInviteCode } from "@/lib/classroom-invite";
import { buildClassroomInviteEmail } from "@/lib/email/classroom-templates";
import { sendEmail } from "@/lib/email/resend";
import {
  canCreateMoreClassrooms,
  getClassroomLimit,
} from "@/lib/plan-access";
import { createAuthenticatedSupabaseClient } from "@/lib/supabase";

export type ClassroomInviteEmailResult =
  | { success: true }
  | { success: false; error: string };

export interface Classroom {
  id: string;
  teacher_id: string;
  name: string;
  invite_code: string;
  created_at: string;
}

export interface ClassroomMember {
  classroom_id: string;
  user_id: string;
  role: "student" | "teacher";
  joined_at: string;
  displayName?: string;
}

export interface ClassroomAssignment {
  id: string;
  classroom_id: string;
  companion_id: string;
  title: string;
  due_at: string | null;
  created_at: string;
  companion?: Pick<Companion, "id" | "name" | "subject" | "topic" | "duration">;
}

export interface StudentAssignment extends ClassroomAssignment {
  classroom_name: string;
}

export interface ClassroomMemberStats {
  user_id: string;
  session_count: number;
  total_minutes: number;
  last_session_at: string | null;
  displayName?: string;
}

async function requireUserId() {
  const { userId } = await auth();
  if (!userId) throw new Error("You must be signed in");
  return userId;
}

async function getClassroomOrThrow(classroomId: string) {
  const supabase = createAuthenticatedSupabaseClient();
  const { data, error } = await supabase
    .from("classrooms")
    .select("*")
    .eq("id", classroomId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("Classroom not found");
  return data as Classroom;
}

async function assertClassroomTeacher(classroomId: string, userId: string) {
  const classroom = await getClassroomOrThrow(classroomId);
  if (classroom.teacher_id !== userId) {
    throw new Error("Only the classroom teacher can perform this action");
  }
  return classroom;
}

async function resolveDisplayNames(userIds: string[]) {
  const unique = [...new Set(userIds)];
  const names = new Map<string, string>();

  try {
    const client = await clerkClient();
    await Promise.all(
      unique.map(async (id) => {
        try {
          const user = await client.users.getUser(id);
          const name = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
          names.set(id, name || `Student ${id.slice(0, 8)}`);
        } catch {
          names.set(id, `Student ${id.slice(0, 8)}`);
        }
      })
    );
  } catch {
    for (const id of unique) {
      names.set(id, `Student ${id.slice(0, 8)}`);
    }
  }

  return names;
}

export async function listTeacherClassrooms() {
  const userId = await requireUserId();
  const supabase = createAuthenticatedSupabaseClient();

  const { data, error } = await supabase
    .from("classrooms")
    .select("*")
    .eq("teacher_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as Classroom[];
}

export async function listStudentClassrooms() {
  const userId = await requireUserId();
  const supabase = createAuthenticatedSupabaseClient();

  const { data: memberships, error: memberError } = await supabase
    .from("classroom_members")
    .select("classroom_id")
    .eq("user_id", userId)
    .eq("role", "student");

  if (memberError) throw new Error(memberError.message);

  const classroomIds = (memberships ?? []).map((row) => row.classroom_id);
  if (classroomIds.length === 0) return [];

  const { data, error } = await supabase
    .from("classrooms")
    .select("*")
    .in("id", classroomIds)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as Classroom[];
}

export async function getClassroom(classroomId: string) {
  const userId = await requireUserId();
  const classroom = await getClassroomOrThrow(classroomId);

  const supabase = createAuthenticatedSupabaseClient();
  const { data: membership, error } = await supabase
    .from("classroom_members")
    .select("role")
    .eq("classroom_id", classroomId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw new Error(error.message);

  const isTeacher = classroom.teacher_id === userId;
  const isStudent = Boolean(membership);

  if (!isTeacher && !isStudent) {
    throw new Error("Classroom not found or access denied");
  }

  return {
    ...classroom,
    isTeacher,
    isStudent,
  };
}

export async function createClassroom(name: string) {
  const userId = await requireUserId();
  const trimmed = name.trim();
  if (trimmed.length < 2) {
    throw new Error("Classroom name must be at least 2 characters");
  }

  const existing = await listTeacherClassrooms();
  const canCreate = await canCreateMoreClassrooms(existing.length);
  if (!canCreate) {
    const limit = await getClassroomLimit();
    throw new Error(
      limit === 0
        ? "Upgrade to Core Learner or Pro to create classrooms"
        : `Your plan allows up to ${limit} classroom`
    );
  }

  const supabase = createAuthenticatedSupabaseClient();
  let lastError: string | null = null;

  for (let attempt = 0; attempt < 5; attempt++) {
    const inviteCode = generateInviteCode();
    const { data, error } = await supabase.rpc("create_classroom", {
      p_name: trimmed,
      p_invite_code: inviteCode,
    });

    if (!error && data) {
      revalidatePath("/classroom");
      return data as Classroom;
    }

    if (error?.message?.includes("duplicate key") || error?.code === "23505") {
      lastError = error.message;
      continue;
    }

    throw new Error(error?.message ?? "Failed to create classroom");
  }

  throw new Error(lastError ?? "Failed to generate unique invite code");
}

export async function deleteClassroom(classroomId: string) {
  const userId = await requireUserId();
  await assertClassroomTeacher(classroomId, userId);

  const supabase = createAuthenticatedSupabaseClient();
  const { error } = await supabase.from("classrooms").delete().eq("id", classroomId);

  if (error) throw new Error(error.message);
  revalidatePath("/classroom");
}

export async function joinClassroomByCode(code: string) {
  const userId = await requireUserId();
  const trimmed = code.trim();
  if (!trimmed) throw new Error("Enter an invite code");

  const supabase = createAuthenticatedSupabaseClient();
  const { data, error } = await supabase.rpc("join_classroom_by_code", {
    p_invite_code: trimmed,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/classroom");
  revalidatePath("/");
  return data as string;
}

export async function listClassroomMembers(classroomId: string) {
  const userId = await requireUserId();
  await getClassroom(classroomId);

  const supabase = createAuthenticatedSupabaseClient();
  const { data, error } = await supabase
    .from("classroom_members")
    .select("*")
    .eq("classroom_id", classroomId)
    .order("joined_at", { ascending: true });

  if (error) throw new Error(error.message);

  const members = (data ?? []) as ClassroomMember[];
  const names = await resolveDisplayNames(members.map((member) => member.user_id));

  return members.map((member) => ({
    ...member,
    displayName: names.get(member.user_id),
  }));
}

export async function removeClassroomMember(classroomId: string, memberUserId: string) {
  const userId = await requireUserId();
  await assertClassroomTeacher(classroomId, userId);

  const supabase = createAuthenticatedSupabaseClient();
  const { error } = await supabase
    .from("classroom_members")
    .delete()
    .eq("classroom_id", classroomId)
    .eq("user_id", memberUserId);

  if (error) throw new Error(error.message);
  revalidatePath(`/classroom/${classroomId}`);
}

export async function listClassroomAssignments(classroomId: string) {
  await getClassroom(classroomId);

  const supabase = createAuthenticatedSupabaseClient();
  const { data, error } = await supabase
    .from("classroom_assignments")
    .select(
      "id, classroom_id, companion_id, title, due_at, created_at, companions:companion_id (id, name, subject, topic, duration)"
    )
    .eq("classroom_id", classroomId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => {
    const companion = Array.isArray(row.companions)
      ? row.companions[0]
      : row.companions;

    return {
      id: row.id,
      classroom_id: row.classroom_id,
      companion_id: row.companion_id,
      title: row.title,
      due_at: row.due_at,
      created_at: row.created_at,
      companion: companion as ClassroomAssignment["companion"],
    } satisfies ClassroomAssignment;
  });
}

export async function createClassroomAssignment(
  classroomId: string,
  companionId: string,
  title: string,
  dueAt?: string | null
) {
  const userId = await requireUserId();
  await assertClassroomTeacher(classroomId, userId);

  const trimmedTitle = title.trim();
  if (trimmedTitle.length < 2) {
    throw new Error("Assignment title must be at least 2 characters");
  }

  const supabase = createAuthenticatedSupabaseClient();
  const { data: companion, error: companionError } = await supabase
    .from("companions")
    .select("id, author, is_public")
    .eq("id", companionId)
    .maybeSingle();

  if (companionError) throw new Error(companionError.message);
  if (!companion) throw new Error("Companion not found");
  if (companion.author !== userId && !companion.is_public) {
    throw new Error("You can only assign your own companions or public tutors");
  }

  const { error } = await supabase.from("classroom_assignments").insert({
    classroom_id: classroomId,
    companion_id: companionId,
    title: trimmedTitle,
    due_at: dueAt || null,
  });

  if (error) throw new Error(error.message);

  revalidatePath(`/classroom/${classroomId}`);
  revalidatePath("/");
}

export async function deleteClassroomAssignment(assignmentId: string) {
  const userId = await requireUserId();
  const supabase = createAuthenticatedSupabaseClient();

  const { data: assignment, error: fetchError } = await supabase
    .from("classroom_assignments")
    .select("id, classroom_id")
    .eq("id", assignmentId)
    .maybeSingle();

  if (fetchError) throw new Error(fetchError.message);
  if (!assignment) throw new Error("Assignment not found");

  await assertClassroomTeacher(assignment.classroom_id, userId);

  const { error } = await supabase
    .from("classroom_assignments")
    .delete()
    .eq("id", assignmentId);

  if (error) throw new Error(error.message);

  revalidatePath(`/classroom/${assignment.classroom_id}`);
  revalidatePath("/");
}

export async function getStudentAssignments(): Promise<StudentAssignment[]> {
  const userId = await requireUserId();
  const supabase = createAuthenticatedSupabaseClient();

  const { data: memberships, error: memberError } = await supabase
    .from("classroom_members")
    .select("classroom_id")
    .eq("user_id", userId)
    .eq("role", "student");

  if (memberError) throw new Error(memberError.message);

  const classroomIds = (memberships ?? []).map((row) => row.classroom_id);
  if (classroomIds.length === 0) return [];

  const { data, error } = await supabase
    .from("classroom_assignments")
    .select(
      "id, classroom_id, companion_id, title, due_at, created_at, classrooms:classroom_id (name), companions:companion_id (id, name, subject, topic, duration)"
    )
    .in("classroom_id", classroomIds)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => {
    const classroom = Array.isArray(row.classrooms)
      ? row.classrooms[0]
      : row.classrooms;
    const companion = Array.isArray(row.companions)
      ? row.companions[0]
      : row.companions;

    return {
      id: row.id,
      classroom_id: row.classroom_id,
      companion_id: row.companion_id,
      title: row.title,
      due_at: row.due_at,
      created_at: row.created_at,
      classroom_name: (classroom as { name: string } | null)?.name ?? "Classroom",
      companion: companion as ClassroomAssignment["companion"],
    };
  });
}

export async function getClassroomMemberStats(
  classroomId: string
): Promise<ClassroomMemberStats[]> {
  const userId = await requireUserId();
  await assertClassroomTeacher(classroomId, userId);

  const supabase = createAuthenticatedSupabaseClient();
  const { data, error } = await supabase.rpc("get_classroom_member_stats", {
    p_classroom_id: classroomId,
  });

  if (error) throw new Error(error.message);

  const stats = (data ?? []) as ClassroomMemberStats[];
  const names = await resolveDisplayNames(stats.map((row) => row.user_id));

  return stats.map((row) => ({
    ...row,
    session_count: Number(row.session_count ?? 0),
    total_minutes: Number(row.total_minutes ?? 0),
    displayName: names.get(row.user_id),
  }));
}

export async function sendClassroomInviteEmail(
  classroomId: string,
  email: string
): Promise<ClassroomInviteEmailResult> {
  try {
    const userId = await requireUserId();
    const classroom = await assertClassroomTeacher(classroomId, userId);

    const trimmedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      return { success: false, error: "Enter a valid email address" };
    }

    let teacherName = "Your teacher";
    try {
      const client = await clerkClient();
      const user = await client.users.getUser(userId);
      const name = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
      if (name) teacherName = name;
    } catch {
      // keep default
    }

    const { subject, html, text } = buildClassroomInviteEmail({
      classroomName: classroom.name,
      inviteCode: classroom.invite_code,
      teacherName,
    });

    const result = await sendEmail({
      to: trimmedEmail,
      subject,
      html,
      text,
    });

    if (result.skipped) {
      return {
        success: false,
        error:
          "Email is not configured on this site. Share the invite code manually instead.",
      };
    }

    if (!result.sent) {
      return {
        success: false,
        error: result.error ?? "Failed to send invite email. Try again or share the code.",
      };
    }

    return { success: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to send invite email";

    if (message.includes("signed in")) {
      return { success: false, error: "Sign in to send classroom invites." };
    }

    if (message.includes("Only the classroom teacher")) {
      return { success: false, error: message };
    }

    return {
      success: false,
      error: "Could not send invite email. Share the invite code manually instead.",
    };
  }
}
