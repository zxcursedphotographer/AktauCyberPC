"use server";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";
import { getUser, setSession, mailOk } from "@/lib/auth";
import { allow, ip } from "@/lib/limit";
import { sendMail } from "@/lib/mail";
import { saveFile } from "@/lib/upload";
import {
  CAT_TO_TYPE, COMPONENT_KEYS, MAX_PRICE, MAX_DESCRIPTION, MAX_TITLE, MAX_PHOTOS,
  PC_BUILD_COMPONENTS, CATS, CITIES, COMPONENT_PRESETS, COMPONENT_LABELS, CATEGORY_TO_COMPONENT,
} from "@/lib/constants";
import { checkCaptcha, makeCaptcha } from "@/lib/captcha";

const captchaOk = checkCaptcha;

const USERNAME_RE = /^[A-Za-z0-9_]{3,20}$/;
const isFile = (x) => x && typeof x === "object" && x.size > 0;
// Правки владельца возвращают опубликованное объявление на модерацию
const needsRemoderation = (l, me) => l.status === "PUBLISHED" && l.userId === me.id && me.role !== "SUPER_ADMIN";
const revalidateProfiles = () => revalidatePath("/u/[username]", "page");

// Клиент запрашивает свежую подписанную капчу
export async function newCaptcha() {
  return makeCaptcha();
}

// ---------- Аутентификация ----------
export async function login(_, f) {
  if (!(await allow(`login:${ip()}`, 15, 900))) return { error: "Слишком много попыток входа. Подождите 15 минут" };
  if (!captchaOk(f)) return { error: "Неверный ответ на капчу" };
  const u = await prisma.user.findUnique({ where: { email: String(f.get("email") || "").toLowerCase().trim() } });
  if (!u || !(await bcrypt.compare(String(f.get("password") || ""), u.passwordHash))) return { error: "Неверная почта или пароль" };
  if (u.status === "BANNED") return { error: "Аккаунт заблокирован" };
  await setSession(u.id);
  redirect("/");
}

export async function register(_, f) {
  if (!(await allow(`reg:${ip()}`, 5, 3600))) return { error: "Слишком много регистраций с вашего адреса. Попробуйте позже" };
  if (!captchaOk(f)) return { error: "Неверный ответ на капчу" };
  const email = String(f.get("email") || "").toLowerCase().trim();
  const username = String(f.get("username") || "").trim();
  const password = String(f.get("password") || "");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Введите корректную почту" };
  if (!USERNAME_RE.test(username)) return { error: "Ник: 3–20 символов, только латиница, цифры и _" };
  if (password.length < 8) return { error: "Пароль — минимум 8 символов" };
  const taken = await prisma.user.findFirst({
    where: { OR: [{ email }, { username: { equals: username, mode: "insensitive" } }] },
    select: { email: true },
  });
  if (taken) return { error: taken.email === email ? "Эта почта уже зарегистрирована" : "Этот ник уже занят" };
  const cityRaw = String(f.get("city") || "");
  const u = await prisma.user.create({
    data: {
      email,
      username,
      passwordHash: await bcrypt.hash(password, 10),
      city: CITIES.includes(cityRaw) ? cityRaw : null,
      district: String(f.get("district") || "").trim().slice(0, 100) || null,
      emailVerified: !process.env.SMTP_HOST,
    },
  });
  if (process.env.SMTP_HOST) await sendVerify(u);
  await setSession(u.id);
  redirect("/");
}

export async function logout() {
  cookies().delete("s");
  redirect("/");
}

// ---------- Чат ----------
export async function sendMessage(f) {
  const me = await getUser();
  if (!me) redirect("/login");
  const text = String(f.get("text") || "").trim().slice(0, 2000);
  if (!text) return { error: "Введите сообщение" };
  if (!mailOk(me)) return { error: "Подтвердите почту, чтобы писать в чат" };

  const receiverId = String(f.get("receiverId") || "");
  const listingId = f.get("listingId") ? String(f.get("listingId")) : null;
  if (!receiverId || receiverId === me.id) return { error: "Нельзя написать самому себе" };

  const receiver = await prisma.user.findUnique({ where: { id: receiverId }, select: { id: true, status: true } });
  if (!receiver || receiver.status === "BANNED") return { error: "Пользователь недоступен" };

  if (listingId) {
    const listing = await prisma.listing.findUnique({ where: { id: listingId }, select: { id: true, userId: true, status: true } });
    if (!listing) return { error: "Объявление не найдено" };
    if (listing.userId !== me.id && listing.userId !== receiverId) return { error: "Диалог возможен только с продавцом объявления" };
    if (listing.userId !== me.id && me.role !== "SUPER_ADMIN" && listing.status !== "PUBLISHED") {
      return { error: "Объявление недоступно для переписки" };
    }
  }

  const blocked = await prisma.block.findFirst({
    where: {
      OR: [
        { blockerId: receiverId, blockedId: me.id },
        { blockerId: me.id, blockedId: receiverId },
      ],
    },
  });
  if (blocked) return { error: "Отправка сообщений недоступна" };

  if (!(await allow(`msg:${me.id}`, 20, 60))) return { error: "Слишком много сообщений. Подождите минуту" };

  await prisma.message.create({ data: { senderId: me.id, receiverId, listingId, text } });
  if (listingId) revalidatePath(`/listing/${listingId}`);
  revalidatePath("/chat");
  return { ok: true };
}

export async function editMessage(f) {
  const me = await getUser();
  if (!me) return;
  const id = f.get("id");
  const text = String(f.get("text") || "").trim().slice(0, 2000);
  if (!text) return;
  const m = await prisma.message.findUnique({ where: { id } });
  if (!m || m.senderId !== me.id) return;
  await prisma.message.update({ where: { id }, data: { text, editedAt: new Date() } });
  revalidatePath("/chat");
}

export async function deleteMessage(f) {
  const me = await getUser();
  if (!me) return;
  const id = f.get("id");
  const m = await prisma.message.findUnique({ where: { id } });
  if (!m) return;
  if (m.senderId === me.id) {
    await prisma.message.update({ where: { id }, data: { deletedForSender: true } });
  } else if (m.receiverId === me.id) {
    await prisma.message.update({ where: { id }, data: { deletedForReceiver: true } });
  }
  revalidatePath("/chat");
}

export async function deleteChat(f) {
  const me = await getUser();
  if (!me) return;
  const listingId = f.get("listingId") || null;
  const otherId = f.get("otherId");
  if (!otherId || otherId === me.id) return;

  const where = {
    OR: [
      { senderId: me.id, receiverId: otherId },
      { senderId: otherId, receiverId: me.id },
    ],
    ...(listingId ? { listingId } : {}),
  };
  const msgs = await prisma.message.findMany({ where, select: { id: true, senderId: true, receiverId: true, deletedForSender: true, deletedForReceiver: true } });
  const updates = [];
  for (const m of msgs) {
    if (m.senderId === me.id && !m.deletedForSender) {
      updates.push(prisma.message.update({ where: { id: m.id }, data: { deletedForSender: true } }));
    } else if (m.receiverId === me.id && !m.deletedForReceiver) {
      updates.push(prisma.message.update({ where: { id: m.id }, data: { deletedForReceiver: true } }));
    }
  }
  if (updates.length) await prisma.$transaction(updates);
  revalidatePath("/chat");
  redirect("/chat");
}

export async function blockUser(f) {
  const me = await getUser();
  if (!me) return;
  const blockedId = f.get("userId");
  if (!blockedId || blockedId === me.id) return;
  const target = await prisma.user.findUnique({ where: { id: blockedId }, select: { id: true } });
  if (!target) return;
  await prisma.block.upsert({
    where: { blockerId_blockedId: { blockerId: me.id, blockedId } },
    create: { blockerId: me.id, blockedId },
    update: {},
  });
  revalidatePath("/chat");
  redirect("/chat");
}

export async function unblockUser(f) {
  const me = await getUser();
  if (!me) return;
  const blockedId = f.get("userId");
  if (!blockedId) return;
  await prisma.block.deleteMany({ where: { blockerId: me.id, blockedId } });
  revalidatePath("/chat");
}

// ---------- Жалобы ----------
export async function reportUser(f) {
  const me = await getUser();
  if (!me) return { error: "Не авторизован" };
  const targetUserId = f.get("targetUserId");
  const listingId = f.get("listingId") || null;
  const reasonText = String(f.get("reason") || "").trim().slice(0, 500);
  if (!targetUserId || !reasonText) return { error: "Выберите причину" };
  if (targetUserId === me.id) return { error: "Нельзя жаловаться на себя" };
  if (!(await allow(`rep:${me.id}`, 5, 3600))) return { error: "Слишком много жалоб. Подождите" };

  const recent = await prisma.report.findFirst({
    where: { reporterId: me.id, targetUserId, createdAt: { gt: new Date(Date.now() - 86400e3) } },
  });
  if (recent) return { error: "Вы уже жаловались на этого пользователя за последние 24 часа" };

  await prisma.report.create({ data: { reporterId: me.id, targetUserId, listingId, reason: reasonText } });
  revalidatePath("/admin/reports");
  return { ok: true };
}

const REASONS = {
  1: "Не соответствует проверкам / недействительные тесты",
  2: "Неправильное оформление объявления",
  3: "Мошенничество или неадекватное поведение",
};

// ---------- Модерация объявлений ----------
export async function approveListing(f) {
  const me = await getUser();
  if (me?.role !== "SUPER_ADMIN") throw new Error("Forbidden");
  const id = f.get("id");
  const l = await prisma.listing.findUnique({ where: { id } });
  if (!l || l.status !== "UNDER_REVIEW") return;
  await prisma.$transaction([
    prisma.listing.update({ where: { id }, data: { status: "PUBLISHED", moderationNote: null } }),
    prisma.adminLog.create({ data: { adminId: me.id, actionType: "APPROVE_LISTING", targetId: id, details: l.title } }),
    prisma.message.create({
      data: { senderId: me.id, receiverId: l.userId, listingId: id, text: `✅ Ваше объявление «${l.title}» одобрено и опубликовано.` },
    }),
  ]);
  revalidatePath("/admin/listings");
  revalidatePath("/");
  revalidatePath(`/listing/${id}`);
  revalidateProfiles();
}

export async function requestListingChanges(f) {
  const me = await getUser();
  if (me?.role !== "SUPER_ADMIN") throw new Error("Forbidden");
  const id = f.get("id");
  const note = f.getAll("note").map((x) => String(x || "").trim()).filter(Boolean).join(" — ").slice(0, 500);
  if (note.length < 5) throw new Error("Укажите причину (минимум 5 символов)");
  const l = await prisma.listing.findUnique({ where: { id } });
  if (!l || l.status !== "UNDER_REVIEW") return;
  await prisma.$transaction([
    prisma.listing.update({ where: { id }, data: { status: "NEEDS_EDIT", moderationNote: note } }),
    prisma.adminLog.create({ data: { adminId: me.id, actionType: "REQUEST_EDIT", targetId: id, reason: note, details: l.title } }),
    prisma.message.create({
      data: {
        senderId: me.id,
        receiverId: l.userId,
        listingId: id,
        text: `✏️ Ваше объявление «${l.title}» требует изменений.\n\nПричина: ${note}\n\nИсправьте и отправьте на проверку снова.`,
      },
    }),
  ]);
  revalidatePath("/admin/listings");
  revalidatePath(`/listing/${id}`);
  revalidateProfiles();
}

export async function rejectListing(f) {
  const me = await getUser();
  if (me?.role !== "SUPER_ADMIN") throw new Error("Forbidden");
  const id = f.get("id");
  const reason = REASONS[f.get("reason")] || "Без указания причины";
  const l = await prisma.listing.findUnique({ where: { id } });
  if (!l || l.status !== "UNDER_REVIEW") return;
  await prisma.$transaction([
    prisma.listing.update({ where: { id }, data: { status: "DELETED", deletedReason: reason, deletedAt: new Date(), moderationNote: null } }),
    prisma.adminLog.create({ data: { adminId: me.id, actionType: "REJECT_LISTING", targetId: id, reason, details: l.title } }),
    prisma.message.create({
      data: {
        senderId: me.id,
        receiverId: l.userId,
        listingId: id,
        text: `❌ Ваше объявление «${l.title}» отклонено.\n\nПричина: ${reason}\n\nВы можете подать апелляцию в профиле → Удалённые.`,
      },
    }),
  ]);
  revalidatePath("/admin/listings");
  revalidateProfiles();
}

export async function setTestResult(f) {
  const me = await getUser();
  if (me?.role !== "SUPER_ADMIN") throw new Error("Forbidden");
  const testId = f.get("testId");
  const result = f.get("result") === "FAILED" ? "FAILED" : "PASSED";
  const test = await prisma.componentTest.findUnique({ where: { id: testId }, include: { listing: true } });
  if (!test) return;
  await prisma.componentTest.update({ where: { id: testId }, data: { resultStatus: result } });
  await prisma.adminLog.create({ data: { adminId: me.id, actionType: "SET_TEST_RESULT", targetId: testId, details: `${test.testTitle}: ${result}` } });
  revalidatePath(`/listing/${test.listingId}`);
  revalidatePath("/admin/listings");
}

export async function resubmitListing(f) {
  const me = await getUser();
  if (!me) return;
  const id = f.get("id");
  const l = await prisma.listing.findUnique({ where: { id } });
  if (!l || l.userId !== me.id || l.status !== "NEEDS_EDIT") return;
  const admin = await prisma.user.findFirst({ where: { role: "SUPER_ADMIN" }, select: { id: true } });
  await prisma.$transaction([
    prisma.listing.update({ where: { id }, data: { status: "UNDER_REVIEW", moderationNote: null } }),
    ...(admin
      ? [prisma.message.create({ data: { senderId: me.id, receiverId: admin.id, listingId: id, text: `🔄 Объявление «${l.title}» исправлено и отправлено на повторную проверку.` } })]
      : []),
  ]);
  revalidatePath("/admin/listings");
  revalidatePath(`/u/${me.username}`);
  revalidatePath(`/listing/${id}`);
}

export async function deleteListing(f) {
  const me = await getUser();
  if (me?.role !== "SUPER_ADMIN") throw new Error("Forbidden");
  const id = f.get("id");
  const reason = REASONS[f.get("reason")];
  if (!reason) throw new Error("Укажите причину");
  const l = await prisma.listing.findUnique({ where: { id } });
  if (!l) return;
  await prisma.$transaction([
    prisma.adminLog.create({ data: { adminId: me.id, actionType: "DELETE_LISTING", targetId: id, reason, details: l.title } }),
    prisma.listing.update({ where: { id }, data: { status: "DELETED", deletedReason: reason, deletedAt: new Date() } }),
    ...(l.userId !== me.id
      ? [prisma.message.create({
          data: {
            senderId: me.id,
            receiverId: l.userId,
            listingId: id,
            text: `🗑 Ваше объявление «${l.title}» удалено администрацией.\n\nПричина: ${reason}\n\nВы можете подать апелляцию в профиле → Удалённые.`,
          },
        })]
      : []),
  ]);
  revalidatePath("/admin/listings");
  revalidatePath("/");
  revalidateProfiles();
  if (f.get("back")) redirect(f.get("back"));
}

export async function restoreListing(f) {
  const me = await getUser();
  if (me?.role !== "SUPER_ADMIN") throw new Error("Forbidden");
  const id = f.get("id");
  const l = await prisma.listing.findUnique({ where: { id } });
  if (!l) return;
  await prisma.$transaction([
    prisma.adminLog.create({ data: { adminId: me.id, actionType: "RESTORE_LISTING", targetId: id, details: l.title } }),
    prisma.listing.update({ where: { id }, data: { status: "PUBLISHED", deletedReason: null, deletedAt: null, moderationNote: null } }),
  ]);
  revalidatePath("/admin/listings");
  revalidatePath("/");
  revalidateProfiles();
}

// ---------- Апелляции ----------
export async function appealListing(f) {
  const me = await getUser();
  if (!me) return { error: "Не авторизован" };
  const id = f.get("id");
  const message = String(f.get("message") || "").trim().slice(0, 500);
  const l = await prisma.listing.findUnique({ where: { id } });
  if (!l || l.userId !== me.id) return { error: "Объявление не найдено" };
  if (l.status !== "DELETED") return { error: "Апелляция доступна только для удалённых объявлений" };
  if (l.deletedReason === "Удалено владельцем") {
    return { error: "Объявление удалено вами. Апелляция недоступна. Восстановите из профиля → Удалённые." };
  }
  if (message.length < 10) return { error: "Опишите, что вы исправили (минимум 10 символов)" };
  if (!(await allow(`appeal:${me.id}`, 3, 3600))) return { error: "Слишком много апелляций. Подождите час." };

  const data = {
    status: "APPEAL",
    appealMessage: message,
    appealAt: new Date(),
    previousReason: l.deletedReason,
  };
  const title = String(f.get("title") || "").trim();
  const description = String(f.get("description") || "").trim();
  const price = Math.min(MAX_PRICE, Math.max(0, Math.round(+f.get("price") || 0)));
  if (title && title !== l.title) data.title = title.slice(0, MAX_TITLE);
  if (description && description !== l.description) data.description = description.slice(0, MAX_DESCRIPTION);
  if (price && price !== l.price) data.price = price;

  const newPhotos = (await Promise.all((f.getAll("photos") || []).map(saveFile))).filter(Boolean);

  await prisma.$transaction([
    prisma.listing.update({ where: { id }, data }),
    ...(newPhotos.length > 0
      ? [prisma.listingImage.createMany({ data: newPhotos.map((url, i) => ({ listingId: id, url, order: 100 + i })) })]
      : []),
    prisma.adminLog.create({ data: { adminId: me.id, actionType: "APPEAL_SENT", targetId: id, details: message } }),
  ]);

  const admin = await prisma.user.findFirst({ where: { role: "SUPER_ADMIN" }, select: { id: true } });
  if (admin) {
    await prisma.message.create({
      data: { senderId: me.id, receiverId: admin.id, listingId: id, text: `📩 Апелляция по объявлению «${l.title}»:\n\n${message}` },
    });
  }
  revalidatePath("/admin/listings");
  revalidatePath(`/u/${me.username}`);
  revalidatePath(`/listing/${id}`);
  return { ok: true };
}

export async function approveAppeal(f) {
  const me = await getUser();
  if (me?.role !== "SUPER_ADMIN") throw new Error("Forbidden");
  const id = f.get("id");
  const l = await prisma.listing.findUnique({ where: { id } });
  if (!l || l.status !== "APPEAL") return;
  await prisma.$transaction([
    prisma.listing.update({
      where: { id },
      data: { status: "PUBLISHED", deletedReason: null, deletedAt: null, appealMessage: null, appealAt: null, previousReason: null },
    }),
    prisma.adminLog.create({ data: { adminId: me.id, actionType: "APPEAL_APPROVED", targetId: id, details: l.title } }),
    prisma.message.create({
      data: { senderId: me.id, receiverId: l.userId, listingId: id, text: `✅ Ваша апелляция по объявлению «${l.title}» одобрена.` },
    }),
  ]);
  revalidatePath("/admin/listings");
  revalidatePath("/");
  revalidatePath(`/listing/${id}`);
  revalidateProfiles();
}

export async function rejectAppeal(f) {
  const me = await getUser();
  if (me?.role !== "SUPER_ADMIN") throw new Error("Forbidden");
  const id = f.get("id");
  const reason = REASONS[f.get("reason")] || "Апелляция отклонена без указания причины";
  const l = await prisma.listing.findUnique({ where: { id } });
  if (!l || l.status !== "APPEAL") return;
  await prisma.$transaction([
    prisma.listing.update({
      where: { id },
      data: { status: "DELETED", deletedReason: reason, deletedAt: new Date(), appealMessage: null, appealAt: null },
    }),
    prisma.adminLog.create({ data: { adminId: me.id, actionType: "APPEAL_REJECTED", targetId: id, reason, details: l.title } }),
    prisma.message.create({
      data: { senderId: me.id, receiverId: l.userId, listingId: id, text: `❌ Ваша апелляция по объявлению «${l.title}» отклонена.\n\nПричина: ${reason}` },
    }),
  ]);
  revalidatePath("/admin/listings");
  revalidateProfiles();
}

export async function setAccountStatus(f) {
  const me = await getUser();
  if (me?.role !== "SUPER_ADMIN") throw new Error("Forbidden");
  const status = f.get("status");
  const id = f.get("id");
  if (!["ACTIVE", "UNDER_REVIEW", "BANNED"].includes(status)) return;
  if (id === me.id) return;
  await prisma.$transaction([
    prisma.user.update({ where: { id }, data: { status } }),
    prisma.adminLog.create({ data: { adminId: me.id, actionType: `ACCOUNT_${status}`, targetId: id } }),
  ]);
  revalidatePath("/admin/users");
}

export async function resolveReport(f) {
  const me = await getUser();
  if (me?.role !== "ADMIN" && me?.role !== "SUPER_ADMIN") throw new Error("Forbidden");
  const r = await prisma.report.findUnique({ where: { id: f.get("id") } });
  if (!r || r.status !== "PENDING") return;
  const ok = f.get("verdict") === "confirm";
  await prisma.$transaction([
    prisma.report.update({ where: { id: r.id }, data: { status: ok ? "RESOLVED" : "REJECTED" } }),
    ...(ok ? [prisma.user.update({ where: { id: r.targetUserId }, data: { status: "UNDER_REVIEW" } })] : []),
    prisma.adminLog.create({ data: { adminId: me.id, actionType: ok ? "REPORT_CONFIRMED" : "REPORT_REJECTED", targetId: r.id } }),
  ]);
  revalidatePath("/admin/reports");
}

// ---------- Профили, траст, отзывы ----------
export async function updateProfile(f) {
  const me = await getUser();
  const id = String(f.get("id") || "");
  if (!me || (me.id !== id && me.role !== "SUPER_ADMIN")) throw new Error("Forbidden");
  const target = await prisma.user.findUnique({ where: { id }, select: { username: true } });
  if (!target) return;
  const cityRaw = String(f.get("city") || "").trim();
  const data = {
    bio: String(f.get("bio") || "").trim().slice(0, 500),
    city: CITIES.includes(cityRaw) ? cityRaw : null,
    district: String(f.get("district") || "").trim().slice(0, 100) || null,
  };
  let uploadError = false;
  try {
    const av = await saveFile(f.get("avatar"));
    if (av) data.avatarUrl = av;
    const bn = await saveFile(f.get("banner"));
    if (bn) data.bannerUrl = bn;
  } catch {
    uploadError = true;
  }
  if (uploadError) redirect(`/u/${target.username}?err=upload#edit`);
  const u = await prisma.user.update({ where: { id }, data });
  revalidatePath(`/u/${u.username}`);
  revalidatePath("/");
}

export async function updateUsername(f) {
  const me = await getUser();
  if (!me) redirect("/login");
  const username = String(f.get("username") || "").trim();
  if (username === me.username) return;
  if (!USERNAME_RE.test(username)) redirect(`/u/${me.username}?err=username#edit`);
  const taken = await prisma.user.findFirst({
    where: { username: { equals: username, mode: "insensitive" }, NOT: { id: me.id } },
    select: { id: true },
  });
  if (taken) redirect(`/u/${me.username}?err=taken#edit`);
  if (!(await allow(`rn:${me.id}`, 3, 86400))) redirect(`/u/${me.username}?err=rate#edit`);
  await prisma.user.update({ where: { id: me.id }, data: { username } });
  revalidatePath("/");
  redirect(`/u/${username}`);
}

export async function removeMedia(f) {
  const me = await getUser();
  const id = f.get("id");
  const field = f.get("field");
  if (!me || (me.id !== id && me.role !== "SUPER_ADMIN") || !["avatarUrl", "bannerUrl"].includes(field)) throw new Error("Forbidden");
  const u = await prisma.user.update({ where: { id }, data: { [field]: null } });
  revalidatePath(`/u/${u.username}`);
}

export async function setTrust(f) {
  const me = await getUser();
  if (me?.role !== "SUPER_ADMIN") throw new Error("Forbidden");
  const score = Math.min(100, Math.max(1, Math.round(+f.get("score") || 1)));
  const u = await prisma.user.update({ where: { id: f.get("id") }, data: { trustScore: score } });
  await prisma.adminLog.create({ data: { adminId: me.id, actionType: "SET_TRUST", targetId: u.id, details: String(score) } });
  revalidatePath(`/u/${u.username}`);
  revalidatePath("/admin/users");
}

export async function addReview(f) {
  const me = await getUser();
  const id = f.get("id");
  if (!me || me.id === id) return;
  const deal =
    me.role === "SUPER_ADMIN" ||
    (await prisma.listing.count({ where: { userId: id, buyerId: me.id, status: "SOLD" } })) > 0;
  if (!deal || !mailOk(me) || !(await allow(`rev:${me.id}`, 10, 3600))) return;
  const rating = Math.min(10, Math.max(1, Math.round(+f.get("rating") || 10)));
  const reviewText = String(f.get("text") || "").trim().slice(0, 500);
  if (!reviewText) return;
  await prisma.review.deleteMany({ where: { authorId: me.id, targetId: id } });
  await prisma.review.create({
    data: { authorId: me.id, targetId: id, rating, pinned: me.role === "SUPER_ADMIN", text: reviewText },
  });
  const { _avg } = await prisma.review.aggregate({ where: { targetId: id }, _avg: { rating: true } });
  const u = await prisma.user.update({ where: { id }, data: { rating: _avg.rating || 0 } });
  revalidatePath(`/u/${u.username}`);
}

// ---------- Объявления ----------
async function guardListingOwner(id) {
  const me = await getUser();
  const l = await prisma.listing.findUnique({ where: { id } });
  if (!me || !l || (l.userId !== me.id && me.role !== "SUPER_ADMIN")) throw new Error("Forbidden");
  return l;
}

function parseMetrics(s) {
  if (!s) return {};
  if (typeof s === "object") return s;
  return Object.fromEntries(
    String(s || "")
      .split("\n")
      .map((line) => line.split(/:(.*)/s))
      .filter((p) => p[0]?.trim() && p[1]?.trim())
      .map(([k, v]) => [k.trim(), isNaN(+v) ? v.trim() : +v])
  );
}

// Проверка «бренд + модель» по пресетам из constants
const validComponent = (type, brand, model) =>
  Boolean(COMPONENT_PRESETS[type]?.[brand]?.includes(model));

function readComponents(f, category) {
  if (category === "Готовые ПК") {
    const components = [];
    for (const type of PC_BUILD_COMPONENTS) {
      const brand = String(f.get(`pc_${type}_brand`) || "").trim();
      const model = String(f.get(`pc_${type}_model`) || "").trim();
      if (!validComponent(type, brand, model)) {
        return { error: `Для готового ПК выберите: ${COMPONENT_LABELS[type]}` };
      }
      components.push({ type, brand, model });
    }
    return { components, brand: null, modelPreset: null };
  }
  const type = CATEGORY_TO_COMPONENT[category];
  if (type && COMPONENT_PRESETS[type]) {
    const brand = String(f.get("brand") || "").trim();
    const model = String(f.get("modelPreset") || "").trim();
    if (!validComponent(type, brand, model)) {
      return { error: `Выберите ${COMPONENT_LABELS[type].toLowerCase()} из списка (бренд и модель)` };
    }
    return { components: [{ type, brand, model }], brand, modelPreset: model };
  }
  return { components: [], brand: null, modelPreset: null };
}

function readBasics(f, fallbackCity) {
  const title = String(f.get("title") || "").trim().slice(0, MAX_TITLE);
  const description = String(f.get("description") || "").trim().slice(0, MAX_DESCRIPTION);
  const category = String(f.get("category") || "");
  const price = Math.round(Number(f.get("price")));
  const cityRaw = String(f.get("city") || "");
  const city = CITIES.includes(cityRaw) ? cityRaw : fallbackCity || "Актау";
  const district = String(f.get("district") || "").trim().slice(0, 100);
  if (title.length < 5) return { error: "Заголовок — минимум 5 символов" };
  if (!CATS.includes(category)) return { error: "Выберите категорию" };
  if (!Number.isFinite(price) || price <= 0 || price > MAX_PRICE) return { error: "Укажите корректную цену (больше 0)" };
  if (description.length < 10) return { error: "Добавьте описание — минимум 10 символов" };
  return { data: { title, description, category, price, city, district } };
}

export async function updateListing(_, f) {
  const me = await getUser();
  if (!me) return { error: "Войдите в аккаунт" };
  const id = String(f.get("id") || "");
  const l = await prisma.listing.findUnique({ where: { id } });
  if (!l) return { error: "Объявление не найдено" };
  const isOwner = l.userId === me.id;
  const isAdmin = me.role === "SUPER_ADMIN";
  if (!isOwner && !isAdmin) return { error: "Нет доступа к этому объявлению" };
  if (!isAdmin && ["DELETED", "APPEAL", "SOLD"].includes(l.status)) {
    return { error: "Это объявление уже нельзя редактировать" };
  }

  const basics = readBasics(f, l.city);
  if (basics.error) return basics;
  const comp = readComponents(f, basics.data.category);
  if (comp.error) return comp;

  const data = { ...basics.data, brand: comp.brand, modelPreset: comp.modelPreset };
  if (needsRemoderation(l, me)) data.status = "UNDER_REVIEW";

  const testTitle = String(f.get("testTitle") || "").trim();
  const testMetrics = parseMetrics(f.get("testMetrics"));
  const componentType = CAT_TO_TYPE[data.category];

  let newTestImages = [];
  try {
    newTestImages = (await Promise.all(f.getAll("testImages").filter(isFile).slice(0, MAX_PHOTOS).map(saveFile))).filter(Boolean);
  } catch (e) {
    return { error: e?.message || "Не удалось загрузить изображения" };
  }

  await prisma.$transaction(async (tx) => {
    await tx.listing.update({ where: { id: l.id }, data });

    // Комплектующие обновляем целиком — фильтры на главной строятся по ним
    await tx.listingComponent.deleteMany({ where: { listingId: l.id } });
    if (comp.components.length) {
      await tx.listingComponent.createMany({ data: comp.components.map((c) => ({ ...c, listingId: l.id })) });
    }

    if (componentType && testTitle) {
      const existingTest = await tx.componentTest.findFirst({ where: { listingId: l.id, componentType } });
      if (existingTest) {
        await tx.componentTest.update({
          where: { id: existingTest.id },
          data: {
            testTitle,
            metrics: testMetrics,
            mediaUrls: newTestImages.length > 0 ? [...existingTest.mediaUrls, ...newTestImages] : existingTest.mediaUrls,
          },
        });
      } else {
        await tx.componentTest.create({
          data: { listingId: l.id, componentType, testTitle, resultStatus: "PASSED", metrics: testMetrics, mediaUrls: newTestImages },
        });
      }
    }
  });

  revalidatePath(`/listing/${l.id}`);
  revalidatePath("/admin/listings");
  revalidateProfiles();
  revalidatePath("/");
  return { ok: true, review: data.status === "UNDER_REVIEW" };
}

export async function removeTestImage(f) {
  const me = await getUser();
  if (!me) throw new Error("Unauthorized");
  const testId = String(f.get("testId") || "");
  const url = String(f.get("url") || "");
  const test = await prisma.componentTest.findUnique({ where: { id: testId }, include: { listing: true } });
  if (!test || (test.listing.userId !== me.id && me.role !== "SUPER_ADMIN")) throw new Error("Forbidden");
  const updated = test.mediaUrls.filter((u) => u !== url);
  await prisma.componentTest.update({ where: { id: testId }, data: { mediaUrls: updated } });
  if (needsRemoderation(test.listing, me)) {
    await prisma.listing.update({ where: { id: test.listingId }, data: { status: "UNDER_REVIEW" } });
    revalidatePath("/admin/listings");
    revalidatePath("/");
  }
  revalidatePath(`/listing/${test.listingId}`);
}

export async function deleteTest(f) {
  const me = await getUser();
  if (!me) throw new Error("Unauthorized");
  const testId = String(f.get("testId") || "");
  const test = await prisma.componentTest.findUnique({ where: { id: testId }, include: { listing: true } });
  if (!test || (test.listing.userId !== me.id && me.role !== "SUPER_ADMIN")) throw new Error("Forbidden");
  await prisma.componentTest.delete({ where: { id: testId } });
  if (needsRemoderation(test.listing, me)) {
    await prisma.listing.update({ where: { id: test.listingId }, data: { status: "UNDER_REVIEW" } });
    revalidatePath("/admin/listings");
    revalidatePath("/");
  }
  revalidatePath(`/listing/${test.listingId}`);
}

export async function addListingImage(_, f) {
  const me = await getUser();
  const l = me ? await prisma.listing.findUnique({ where: { id: String(f.get("id") || "") }, include: { _count: { select: { images: true } } } }) : null;
  if (!me || !l || (l.userId !== me.id && me.role !== "SUPER_ADMIN")) return { error: "Нет доступа" };
  if (l._count.images >= MAX_PHOTOS) return { error: `Максимум ${MAX_PHOTOS} фото. Удалите лишнее, чтобы добавить новое` };
  let url = null;
  try {
    url = await saveFile(f.get("photo"));
  } catch (e) {
    return { error: e?.message || "Не удалось загрузить фото" };
  }
  if (!url) return { error: "Не удалось обработать файл. Подойдут JPG, PNG, WEBP или GIF до 5 МБ" };
  const remod = needsRemoderation(l, me);
  await prisma.$transaction([
    prisma.listingImage.create({ data: { listingId: l.id, url, order: 99 } }),
    ...(remod ? [prisma.listing.update({ where: { id: l.id }, data: { status: "UNDER_REVIEW" } })] : []),
  ]);
  revalidatePath(`/listing/${l.id}`);
  if (remod) {
    revalidatePath("/admin/listings");
    revalidatePath("/");
  }
  return { ok: true, review: remod };
}

export async function removeListingImage(f) {
  const i = await prisma.listingImage.findUnique({ where: { id: String(f.get("id") || "") } });
  if (!i) return;
  await guardListingOwner(i.listingId);
  const left = await prisma.listingImage.count({ where: { listingId: i.listingId } });
  if (left <= 1) return; // у объявления всегда должно остаться хотя бы одно фото
  await prisma.listingImage.delete({ where: { id: i.id } });
  revalidatePath(`/listing/${i.listingId}`);
}

export async function createListing(_, f) {
  const me = await getUser();
  if (!me) redirect("/login");
  if (!mailOk(me)) return { error: "Подтвердите почту, чтобы публиковать объявления" };

  const basics = readBasics(f, me.city);
  if (basics.error) return basics;
  const { category } = basics.data;
  if (!basics.data.district) basics.data.district = me.district || "";

  const comp = readComponents(f, category);
  if (comp.error) return comp;

  const photoFiles = f.getAll("photos").filter(isFile);
  if (photoFiles.length === 0) return { error: "Загрузите хотя бы 1 фото товара" };
  if (photoFiles.length > MAX_PHOTOS) return { error: `Максимум ${MAX_PHOTOS} фото товара` };

  const shots = (t) => f.getAll(`t_${t}_shots`).filter(isFile);
  if (category === "Видеокарты" && shots("GPU").length < 2) return { error: "Для видеокарты нужно минимум 2 скриншота тестов" };
  if (category === "Процессоры" && shots("CPU").length < 2) return { error: "Для процессора нужно минимум 2 скриншота тестов" };
  if (category === "Готовые ПК" && shots("GPU").length < 2 && shots("CPU").length < 2) {
    return { error: "Для готового ПК нужно минимум 2 скриншота тестов видеокарты или процессора" };
  }

  if (!(await allow(`lst:${me.id}`, 10, 3600))) return { error: "Слишком много объявлений за час. Попробуйте позже" };

  let photos;
  const tests = [];
  try {
    photos = (await Promise.all(photoFiles.map(saveFile))).filter(Boolean);
    for (const t of COMPONENT_KEYS) {
      const tt = String(f.get(`t_${t}_title`) || "").trim().slice(0, 200);
      if (!tt) continue;
      const mediaUrls = (await Promise.all(shots(t).slice(0, MAX_PHOTOS).map(saveFile))).filter(Boolean);
      tests.push({
        componentType: t,
        testTitle: tt,
        resultStatus: "PASSED",
        metrics: parseMetrics(f.get(`t_${t}_metrics`)),
        mediaUrls,
      });
    }
  } catch (e) {
    return { error: e?.message || "Не удалось загрузить файлы. Попробуйте ещё раз" };
  }
  if (!photos.length) return { error: "Фото не удалось обработать. Подойдут JPG, PNG, WEBP или GIF до 5 МБ" };

  const l = await prisma.listing.create({
    data: {
      ...basics.data,
      brand: comp.brand,
      modelPreset: comp.modelPreset,
      userId: me.id,
      status: "UNDER_REVIEW",
      images: { create: photos.map((url, order) => ({ url, order })) },
      tests: { create: tests },
      components: { create: comp.components },
    },
  });
  revalidatePath("/admin/listings");
  revalidateProfiles();
  redirect(`/listing/${l.id}`);
}

// ---------- Подсчёт пресетов (для фильтра) ----------
export async function getPresetCounts(category, city) {
  const where = {
    status: "PUBLISHED",
    category,
    modelPreset: { not: null },
    user: { status: { not: "BANNED" } },
    ...(city && city !== "Весь Казахстан" ? { city } : {}),
  };

  const counts = await prisma.listing.groupBy({
    by: ["modelPreset"],
    where,
    _count: { _all: true },
  });

  return counts.reduce((acc, item) => {
    if (item.modelPreset) acc[item.modelPreset] = item._count._all;
    return acc;
  }, {});
}

// ---------- Подсчёт компонентов готовых ПК (для фильтра) ----------
export async function getComponentCounts(componentType, city) {
  const where = {
    listing: {
      status: "PUBLISHED",
      category: "Готовые ПК",
      user: { status: { not: "BANNED" } },
      ...(city && city !== "Весь Казахстан" ? { city } : {}),
    },
    type: componentType,
  };

  const counts = await prisma.listingComponent.groupBy({
    by: ["brand", "model"],
    where,
    _count: { _all: true },
  });

  return counts.reduce((acc, item) => {
    if (item.brand && item.model) {
      const key = `${item.brand} ${item.model}`;
      acc[key] = (acc[key] || 0) + item._count._all;
    }
    return acc;
  }, {});
}

// ---------- Проверка пользователей ----------
async function needSA() {
  const me = await getUser();
  if (me?.role !== "SUPER_ADMIN") throw new Error("Forbidden");
  return me;
}

export async function sendToReview(f) {
  const me = await needSA();
  const id = f.get("id");
  if (id === me.id) return;
  await prisma.$transaction([
    prisma.user.update({ where: { id }, data: { status: "UNDER_REVIEW" } }),
    prisma.message.create({ data: { senderId: me.id, receiverId: id, text: "Ваш аккаунт отправлен на проверку. Ответьте здесь на вопросы администрации." } }),
    prisma.adminLog.create({ data: { adminId: me.id, actionType: "SEND_TO_REVIEW", targetId: id } }),
  ]);
  revalidatePath("/admin/users");
  revalidatePath("/review");
}

export async function closeReview(f) {
  const me = await needSA();
  const id = f.get("id");
  await prisma.$transaction([
    prisma.user.update({ where: { id }, data: { status: "ACTIVE" } }),
    prisma.adminLog.create({ data: { adminId: me.id, actionType: "CLOSE_REVIEW", targetId: id } }),
  ]);
  revalidatePath("/admin/users");
  revalidatePath("/review");
}

export async function adjustTrust(f) {
  const me = await needSA();
  const id = f.get("id");
  const raw = f.get("delta");
  const d = Number(raw) === 5 ? 5 : Number(raw) === -5 ? -5 : 5;
  const u = await prisma.user.findUnique({ where: { id } });
  if (!u) return;
  const next = Math.min(100, Math.max(1, u.trustScore + d));
  await prisma.user.update({ where: { id: u.id }, data: { trustScore: next } });
  await prisma.adminLog.create({
    data: { adminId: me.id, actionType: d > 0 ? "PRAISE" : "WARN", targetId: u.id, details: `${d > 0 ? "+" : ""}${d} (${u.trustScore} → ${next})` },
  });
  revalidatePath("/admin/users");
  revalidatePath(`/u/${u.username}`);
}

export async function resetTrust(f) {
  const me = await needSA();
  const id = f.get("id");
  const u = await prisma.user.update({ where: { id }, data: { trustScore: 50 } });
  await prisma.adminLog.create({ data: { adminId: me.id, actionType: "RESET_TRUST", targetId: u.id, details: "50" } });
  revalidatePath("/admin/users");
  revalidatePath(`/u/${u.username}`);
}

export async function sendSupport(f) {
  const me = await getUser();
  if (!me) redirect("/login");
  const to = await prisma.user.findUnique({ where: { id: String(f.get("receiverId") || "") } });
  const text = String(f.get("text") || "").trim().slice(0, 2000);
  if (!text) return { error: "Введите сообщение" };
  if (!to || (me.role !== "SUPER_ADMIN" && to.role !== "SUPER_ADMIN")) return { error: "Получатель недоступен" };
  if (!(await allow(`sup:${me.id}`, 20, 60))) return { error: "Слишком много сообщений. Подождите минуту" };
  const blocked = await prisma.block.findFirst({
    where: { OR: [{ blockerId: to.id, blockedId: me.id }, { blockerId: me.id, blockedId: to.id }] },
  });
  if (blocked) return { error: "Отправка сообщений недоступна" };
  await prisma.message.create({ data: { senderId: me.id, receiverId: to.id, text } });
  revalidatePath("/review");
  revalidatePath("/support");
  return { ok: true };
}

// ---------- Почта, сброс пароля, продажа ----------
const SITE = () => process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

async function makeToken(userId, type, hours) {
  const token = randomBytes(24).toString("hex");
  await prisma.token.deleteMany({ where: { userId, type } });
  await prisma.token.create({ data: { userId, type, token, expiresAt: new Date(Date.now() + hours * 3600e3) } });
  return token;
}

async function sendVerify(u) {
  const t = await makeToken(u.id, "VERIFY", 48);
  await sendMail(u.email, "Подтвердите почту — AktauCyberPC", `<p>Здравствуйте, ${u.username}!</p><p><a href="${SITE()}/verify?token=${t}">Подтвердить почту</a></p>`);
}

export async function resendVerify() {
  const me = await getUser();
  if (!me || mailOk(me) || !(await allow(`ver:${me.id}`, 3, 3600))) return;
  await sendVerify(me);
}

export async function requestReset(f) {
  const email = String(f.get("email")).toLowerCase().trim();
  if (await allow(`rst:${ip()}`, 5, 3600)) {
    const u = await prisma.user.findUnique({ where: { email } });
    if (u) {
      const t = await makeToken(u.id, "RESET", 1);
      await sendMail(u.email, "Сброс пароля — AktauCyberPC", `<p><a href="${SITE()}/reset?token=${t}">Задать новый пароль</a></p><p>Ссылка действует 1 час.</p>`);
    }
  }
  redirect("/forgot?sent=1");
}

export async function resetPassword(f) {
  const token = String(f.get("token"));
  const pw = String(f.get("password"));
  const t = await prisma.token.findUnique({ where: { token } });
  if (!t || t.type !== "RESET" || t.expiresAt < new Date() || pw.length < 8) redirect(`/reset?token=${token}&e=1`);
  const passwordHash = await bcrypt.hash(pw, 10);
  await prisma.$transaction([
    prisma.user.update({ where: { id: t.userId }, data: { passwordHash, emailVerified: true } }),
    prisma.token.deleteMany({ where: { userId: t.userId } }),
  ]);
  redirect("/login");
}

export async function markSold(f) {
  const l = await guardListingOwner(f.get("id"));
  if (l.status !== "PUBLISHED") return;
  const buyerId = f.get("buyerId") || null;
  if (buyerId) {
    if (buyerId === l.userId) return;
    const talked = await prisma.message.count({
      where: {
        listingId: l.id,
        OR: [
          { senderId: buyerId, receiverId: l.userId },
          { senderId: l.userId, receiverId: buyerId },
        ],
      },
    });
    if (!talked) return; // покупатель должен был переписываться по этому объявлению
  }
  await prisma.listing.update({ where: { id: l.id }, data: { status: "SOLD", buyerId } });
  revalidatePath(`/listing/${l.id}`);
  revalidateProfiles();
  revalidatePath("/");
}

// ---------- Массовые действия владельца ----------
export async function hideListings(f) {
  const me = await getUser();
  if (!me) return;
  const ids = f.getAll("ids").filter(Boolean);
  if (!ids.length) return;
  await prisma.listing.updateMany({
    where: { id: { in: ids }, userId: me.id, status: { in: ["PUBLISHED", "DRAFT"] } },
    data: { status: "HIDDEN" },
  });
  revalidatePath(`/u/${me.username}`);
  revalidatePath("/");
}

export async function unhideListing(f) {
  const me = await getUser();
  if (!me) return;
  const id = f.get("id");
  const l = await prisma.listing.findUnique({ where: { id } });
  if (!l || l.userId !== me.id || l.status !== "HIDDEN") return;
  await prisma.listing.update({ where: { id }, data: { status: "PUBLISHED" } });
  revalidatePath(`/u/${me.username}`);
  revalidatePath("/");
}

export async function unhideManyListings(f) {
  const me = await getUser();
  if (!me) return;
  const ids = f.getAll("ids").filter(Boolean);
  if (!ids.length) return;
  await prisma.listing.updateMany({
    where: { id: { in: ids }, userId: me.id, status: "HIDDEN" },
    data: { status: "PUBLISHED" },
  });
  revalidatePath(`/u/${me.username}`);
  revalidatePath("/");
}

export async function deleteOwnListings(f) {
  const me = await getUser();
  if (!me) return;
  const ids = f.getAll("ids").filter(Boolean);
  if (!ids.length) return;
  const reason = "Удалено владельцем";
  await prisma.listing.updateMany({
    where: { id: { in: ids }, userId: me.id, status: { in: ["PUBLISHED", "DRAFT", "HIDDEN"] } },
    data: { status: "DELETED", deletedReason: reason, deletedAt: new Date() },
  });
  revalidatePath(`/u/${me.username}`);
  revalidatePath("/");
}

export async function restoreOwnListing(f) {
  const me = await getUser();
  if (!me) return;
  const id = String(f.get("id") || "");
  const l = await prisma.listing.findUnique({ where: { id } });
  // Восстановить можно только то, что удалил сам владелец (не решение модерации)
  if (!l || l.userId !== me.id || l.status !== "DELETED" || l.deletedReason !== "Удалено владельцем") return;
  await prisma.listing.update({ where: { id }, data: { status: "PUBLISHED", deletedReason: null, deletedAt: null } });
  revalidatePath(`/listing/${id}`);
  revalidatePath(`/u/${me.username}`);
  revalidatePath("/");
}

// Счётчик просмотров: вызывается один раз за сессию из ViewCounter, владелец не накручивает
export async function registerView(id) {
  const me = await getUser();
  await prisma.listing.updateMany({
    where: { id: String(id), status: "PUBLISHED", ...(me ? { NOT: { userId: me.id } } : {}) },
    data: { viewsCount: { increment: 1 } },
  });
}

// ---------- Гайды ----------
const DEFAULT_GUIDES = [
  { slug: "gpu", title: "Видеокарта", order: 1, videoUrl: "https://youtu.be/3MbZN8CyedM" },
  { slug: "cpu", title: "Процессор", order: 2 },
  { slug: "ram", title: "Оперативная память", order: 3 },
  { slug: "storage", title: "SSD / HDD", order: 4 },
  { slug: "psu", title: "Блок питания", order: 5 },
  { slug: "case", title: "Корпус и охлаждение", order: 6 },
];

export async function seedGuidesIfEmpty() {
  const count = await prisma.guideVideo.count();
  if (count > 0) return;
  await prisma.guideVideo.createMany({ data: DEFAULT_GUIDES, skipDuplicates: true });
}

export async function saveGuideVideo(f) {
  const me = await getUser();
  if (me?.role !== "SUPER_ADMIN") throw new Error("Forbidden");
  const id = f.get("id");
  const url = String(f.get("videoUrl") || "").trim();
  if (!url) throw new Error("Пустая ссылка");
  if (!/^https?:\/\//i.test(url)) throw new Error("Ссылка должна начинаться с http:// или https://");
  await prisma.guideVideo.update({ where: { id }, data: { videoUrl: url } });
  await prisma.adminLog.create({ data: { adminId: me.id, actionType: "SET_GUIDE_VIDEO", targetId: id, details: url } });
  revalidatePath("/guide");
}

export async function clearGuideVideo(f) {
  const me = await getUser();
  if (me?.role !== "SUPER_ADMIN") throw new Error("Forbidden");
  const id = f.get("id");
  await prisma.guideVideo.update({ where: { id }, data: { videoUrl: null } });
  await prisma.adminLog.create({ data: { adminId: me.id, actionType: "CLEAR_GUIDE_VIDEO", targetId: id } });
  revalidatePath("/guide");
}