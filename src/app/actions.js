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

const captchaOk = (f) => Number(f.get("a")) + Number(f.get("b")) === Number(f.get("answer"));

export async function login(_, f) {
  if (!(await allow(`login:${ip()}`, 15, 900))) return { error: "Слишком много попыток входа. Подождите 15 минут" };
  if (!captchaOk(f)) return { error: "Неверный ответ на капчу" };
  const u = await prisma.user.findUnique({ where: { email: String(f.get("email")).toLowerCase() } });
  if (!u || !(await bcrypt.compare(String(f.get("password")), u.passwordHash))) return { error: "Неверная почта или пароль" };
  if (u.status === "BANNED") return { error: "Аккаунт заблокирован" };
  await setSession(u.id); redirect("/");
}

export async function register(_, f) {
  if (!(await allow(`reg:${ip()}`, 5, 3600))) return { error: "Слишком много регистраций с вашего адреса. Попробуйте позже" };
  if (!captchaOk(f)) return { error: "Неверный ответ на капчу" };
  const email = String(f.get("email")).toLowerCase(), username = String(f.get("username")).trim();
  if (!email || username.length < 3 || String(f.get("password")).length < 8) return { error: "Ник от 3 символов, пароль от 8" };
  if (await prisma.user.findFirst({ where: { OR: [{ email }, { username }] } })) return { error: "Почта или ник уже заняты" };
  const u = await prisma.user.create({ data: {
    email, username, passwordHash: await bcrypt.hash(String(f.get("password")), 10),
    city: f.get("city") || null, district: f.get("district") || null, emailVerified: !process.env.SMTP_HOST } });
  if (process.env.SMTP_HOST) await sendVerify(u);
  await setSession(u.id); redirect("/");
}

export async function logout() { cookies().delete("s"); redirect("/"); }

// ---------- Чат ----------
export async function sendMessage(f) {
  const me = await getUser(); if (!me) redirect("/login");
  const text = String(f.get("text")).trim().slice(0, 2000); if (!text) return;
  if (!mailOk(me) || !(await allow(`msg:${me.id}`, 20, 60))) return;
  const receiverId = f.get("receiverId");
  const blocked = await prisma.block.findFirst({
    where: { OR: [{ blockerId: receiverId, blockedId: me.id }, { blockerId: me.id, blockedId: receiverId }] },
  });
  if (blocked) return;
  await prisma.message.create({ data: { senderId: me.id, receiverId, listingId: f.get("listingId") || null, text } });
  revalidatePath(`/listing/${f.get("listingId")}`);
  revalidatePath("/chat");
}

export async function editMessage(f) {
  const me = await getUser(); if (!me) return;
  const id = f.get("id"), text = String(f.get("text")).trim().slice(0, 2000);
  if (!text) return;
  const m = await prisma.message.findUnique({ where: { id } });
  if (!m || m.senderId !== me.id) return;
  await prisma.message.update({ where: { id }, data: { text, editedAt: new Date() } });
  revalidatePath("/chat");
}

export async function deleteMessage(f) {
  const me = await getUser(); if (!me) return;
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
  const me = await getUser(); if (!me) return;
  const listingId = f.get("listingId") || null;
  const otherId = f.get("otherId");
  if (!otherId) return;
  const where = {
    OR: [
      { senderId: me.id, receiverId: otherId },
      { senderId: otherId, receiverId: me.id },
    ],
    ...(listingId ? { listingId } : {}),
  };
  const msgs = await prisma.message.findMany({ where });
  for (const m of msgs) {
    if (m.senderId === me.id && !m.deletedForSender) {
      await prisma.message.update({ where: { id: m.id }, data: { deletedForSender: true } });
    } else if (m.receiverId === me.id && !m.deletedForReceiver) {
      await prisma.message.update({ where: { id: m.id }, data: { deletedForReceiver: true } });
    }
  }
  revalidatePath("/chat");
  redirect("/chat");
}

export async function blockUser(f) {
  const me = await getUser(); if (!me) return;
  const blockedId = f.get("userId");
  if (!blockedId || blockedId === me.id) return;
  await prisma.block.upsert({
    where: { blockerId_blockedId: { blockerId: me.id, blockedId } },
    create: { blockerId: me.id, blockedId },
    update: {},
  });
  revalidatePath("/chat");
  redirect("/chat");
}

export async function unblockUser(f) {
  const me = await getUser(); if (!me) return;
  const blockedId = f.get("userId");
  await prisma.block.deleteMany({ where: { blockerId: me.id, blockedId } });
  revalidatePath("/chat");
}

// ---------- Жалобы ----------
export async function reportUser(f) {
  const me = await getUser(); if (!me) return { error: "Не авторизован" };
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
  revalidatePath("/admin");
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
  const me = await getUser(); if (me?.role !== "SUPER_ADMIN") throw new Error("Forbidden");
  const id = f.get("id");
  const l = await prisma.listing.findUnique({ where: { id } });
  if (!l || l.status !== "UNDER_REVIEW") return;
  await prisma.$transaction([
    prisma.listing.update({ where: { id }, data: { status: "PUBLISHED", moderationNote: null } }),
    prisma.adminLog.create({ data: { adminId: me.id, actionType: "APPROVE_LISTING", targetId: id, details: l.title } }),
    prisma.message.create({ data: { senderId: me.id, receiverId: l.userId, listingId: id, text: `✅ Ваше объявление «${l.title}» одобрено и опубликовано.` } }),
  ]);
  revalidatePath("/admin"); revalidatePath("/admin/listings"); revalidatePath("/"); revalidatePath(`/listing/${id}`); revalidatePath(`/u/${l.userId}`);
}

export async function requestListingChanges(f) {
  const me = await getUser(); if (me?.role !== "SUPER_ADMIN") throw new Error("Forbidden");
  const id = f.get("id");
  const note = String(f.get("note") || "").trim().slice(0, 500);
  if (note.length < 5) throw new Error("Укажите причину");
  const l = await prisma.listing.findUnique({ where: { id } });
  if (!l || l.status !== "UNDER_REVIEW") return;
  await prisma.$transaction([
    prisma.listing.update({ where: { id }, data: { status: "NEEDS_EDIT", moderationNote: note } }),
    prisma.adminLog.create({ data: { adminId: me.id, actionType: "REQUEST_EDIT", targetId: id, reason: note, details: l.title } }),
    prisma.message.create({ data: { senderId: me.id, receiverId: l.userId, listingId: id, text: `✏️ Ваше объявление «${l.title}» требует изменений.\n\nПричина: ${note}` } }),
  ]);
  revalidatePath("/admin"); revalidatePath("/admin/listings"); revalidatePath(`/listing/${id}`); revalidatePath(`/u/${l.userId}`);
}

export async function rejectListing(f) {
  const me = await getUser(); if (me?.role !== "SUPER_ADMIN") throw new Error("Forbidden");
  const id = f.get("id");
  const reason = REASONS[f.get("reason")] || "Без указания причины";
  const l = await prisma.listing.findUnique({ where: { id } });
  if (!l || l.status !== "UNDER_REVIEW") return;
  await prisma.$transaction([
    prisma.listing.update({ where: { id }, data: { status: "DELETED", deletedReason: reason, deletedAt: new Date(), moderationNote: null } }),
    prisma.adminLog.create({ data: { adminId: me.id, actionType: "REJECT_LISTING", targetId: id, reason, details: l.title } }),
    prisma.message.create({ data: { senderId: me.id, receiverId: l.userId, listingId: id, text: `❌ Ваше объявление «${l.title}» отклонено.\n\nПричина: ${reason}` } }),
  ]);
  revalidatePath("/admin"); revalidatePath("/admin/listings"); revalidatePath(`/u/${l.userId}`);
}

export async function setTestResult(f) {
  const me = await getUser(); if (me?.role !== "SUPER_ADMIN") throw new Error("Forbidden");
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
  const me = await getUser(); if (!me) return;
  const id = f.get("id");
  const l = await prisma.listing.findUnique({ where: { id } });
  if (!l || l.userId !== me.id || l.status !== "NEEDS_EDIT") return;
  const admin = await prisma.user.findFirst({ where: { role: "SUPER_ADMIN" } });
  await prisma.$transaction([
    prisma.listing.update({ where: { id }, data: { status: "UNDER_REVIEW", moderationNote: null } }),
    ...(admin ? [prisma.message.create({ data: { senderId: me.id, receiverId: admin.id, listingId: id, text: `🔄 Объявление «${l.title}» исправлено и отправлено на повторную проверку.` } })] : []),
  ]);
  revalidatePath("/admin"); revalidatePath("/admin/listings"); revalidatePath(`/u/${me.username}`); revalidatePath(`/listing/${id}`);
}

export async function deleteListing(f) {
  const me = await getUser(); if (me?.role !== "SUPER_ADMIN") throw new Error("Forbidden");
  const id = f.get("id"), reason = REASONS[f.get("reason")]; if (!reason) throw new Error("Укажите причину");
  const l = await prisma.listing.findUnique({ where: { id } }); if (!l) return;
  await prisma.$transaction([
    prisma.adminLog.create({ data: { adminId: me.id, actionType: "DELETE_LISTING", targetId: id, reason, details: l.title } }),
    prisma.listing.update({ where: { id }, data: { status: "DELETED", deletedReason: reason, deletedAt: new Date() } }),
  ]);
  revalidatePath("/admin"); revalidatePath("/admin/listings"); revalidatePath("/"); revalidatePath(`/u/${l.userId}`);
  if (f.get("back")) redirect(f.get("back"));
}

export async function restoreListing(f) {
  const me = await getUser(); if (me?.role !== "SUPER_ADMIN") throw new Error("Forbidden");
  const id = f.get("id");
  const l = await prisma.listing.findUnique({ where: { id } }); if (!l) return;
  await prisma.$transaction([
    prisma.adminLog.create({ data: { adminId: me.id, actionType: "RESTORE_LISTING", targetId: id, details: l.title } }),
    prisma.listing.update({ where: { id }, data: { status: "PUBLISHED", deletedReason: null, deletedAt: null } }),
  ]);
  revalidatePath("/admin"); revalidatePath("/admin/listings"); revalidatePath("/"); revalidatePath(`/u/${l.userId}`);
}

// ---------- Апелляции ----------
export async function appealListing(f) {
  const me = await getUser(); if (!me) return { error: "Не авторизован" };
  const id = f.get("id");
  const message = String(f.get("message") || "").trim().slice(0, 500);
  const l = await prisma.listing.findUnique({ where: { id } });
  if (!l || l.userId !== me.id) return { error: "Объявление не найдено" };
  if (l.status !== "DELETED") return { error: "Апелляция доступна только для удалённых объявлений" };
  if (message.length < 10) return { error: "Опишите, что вы исправили (минимум 10 символов)" };
  if (!(await allow(`appeal:${me.id}`, 3, 3600))) return { error: "Слишком много апелляций. Подождите час." };

  const title = String(f.get("title") || "").trim();
  const description = String(f.get("description") || "").trim();
  const price = Math.min(2000000000, Math.max(0, Math.round(+f.get("price") || 0)));
  const data = { status: "APPEAL", appealMessage: message, appealAt: new Date(), previousReason: l.deletedReason };
  if (title && title !== l.title) data.title = title.slice(0, 120);
  if (description && description !== l.description) data.description = description.slice(0, 5000);
  if (price && price !== l.price) data.price = price;

  const newPhotos = (await Promise.all((f.getAll("photos") || []).map(saveFile))).filter(Boolean);

  await prisma.$transaction([
    prisma.listing.update({ where: { id }, data }),
    ...(newPhotos.length > 0 ? [prisma.listingImage.createMany({ data: newPhotos.map((url, i) => ({ listingId: id, url, order: 100 + i })) })] : []),
    prisma.adminLog.create({ data: { adminId: me.id, actionType: "APPEAL_SENT", targetId: id, details: message } }),
  ]);

  const admin = await prisma.user.findFirst({ where: { role: "SUPER_ADMIN" } });
  if (admin) {
    await prisma.message.create({
      data: { senderId: me.id, receiverId: admin.id, listingId: id, text: `📩 Апелляция по объявлению «${l.title}»:\n\n${message}` },
    });
  }
  revalidatePath("/admin"); revalidatePath("/admin/listings"); revalidatePath(`/u/${me.username}`); revalidatePath(`/listing/${id}`);
  return { ok: true };
}

export async function approveAppeal(f) {
  const me = await getUser(); if (me?.role !== "SUPER_ADMIN") throw new Error("Forbidden");
  const id = f.get("id");
  const l = await prisma.listing.findUnique({ where: { id } });
  if (!l || l.status !== "APPEAL") return;
  await prisma.$transaction([
    prisma.listing.update({ where: { id }, data: { status: "PUBLISHED", deletedReason: null, deletedAt: null, appealMessage: null, appealAt: null, previousReason: null } }),
    prisma.adminLog.create({ data: { adminId: me.id, actionType: "APPEAL_APPROVED", targetId: id, details: l.title } }),
    prisma.message.create({ data: { senderId: me.id, receiverId: l.userId, listingId: id, text: `✅ Ваша апелляция по объявлению «${l.title}» одобрена.` } }),
  ]);
  revalidatePath("/admin"); revalidatePath("/admin/listings"); revalidatePath("/"); revalidatePath(`/listing/${id}`); revalidatePath(`/u/${l.userId}`);
}

export async function rejectAppeal(f) {
  const me = await getUser(); if (me?.role !== "SUPER_ADMIN") throw new Error("Forbidden");
  const id = f.get("id");
  const reason = REASONS[f.get("reason")] || "Апелляция отклонена без указания причины";
  const l = await prisma.listing.findUnique({ where: { id } });
  if (!l || l.status !== "APPEAL") return;
  await prisma.$transaction([
    prisma.listing.update({ where: { id }, data: { status: "DELETED", deletedReason: reason, deletedAt: new Date(), appealMessage: null, appealAt: null } }),
    prisma.adminLog.create({ data: { adminId: me.id, actionType: "APPEAL_REJECTED", targetId: id, reason, details: l.title } }),
    prisma.message.create({ data: { senderId: me.id, receiverId: l.userId, listingId: id, text: `❌ Ваша апелляция по объявлению «${l.title}» отклонена.\n\nПричина: ${reason}` } }),
  ]);
  revalidatePath("/admin"); revalidatePath("/admin/listings"); revalidatePath(`/u/${l.userId}`);
}

export async function setAccountStatus(f) {
  const me = await getUser(); if (me?.role !== "SUPER_ADMIN") throw new Error("Forbidden");
  const status = f.get("status"), id = f.get("id"); if (id === me.id) return;
  await prisma.$transaction([
    prisma.user.update({ where: { id }, data: { status } }),
    prisma.adminLog.create({ data: { adminId: me.id, actionType: `ACCOUNT_${status}`, targetId: id } }),
  ]);
  revalidatePath("/admin"); revalidatePath("/admin/users");
}

export async function resolveReport(f) {
  const me = await getUser(); if (me?.role !== "ADMIN" && me?.role !== "SUPER_ADMIN") throw new Error("Forbidden");
  const r = await prisma.report.findUnique({ where: { id: f.get("id") } }); if (!r) return;
  const ok = f.get("verdict") === "confirm";
  await prisma.$transaction([
    prisma.report.update({ where: { id: r.id }, data: { status: ok ? "RESOLVED" : "REJECTED" } }),
    ...(ok ? [prisma.user.update({ where: { id: r.targetUserId }, data: { status: "UNDER_REVIEW" } })] : []),
    prisma.adminLog.create({ data: { adminId: me.id, actionType: ok ? "REPORT_CONFIRMED" : "REPORT_REJECTED", targetId: r.id } }),
  ]);
  revalidatePath("/admin"); revalidatePath("/admin/reports");
}

// ---------- Профили, траст, отзывы ----------
export async function updateProfile(f) {
  const me = await getUser(), id = f.get("id");
  if (!me || (me.id !== id && me.role !== "SUPER_ADMIN")) throw new Error("Forbidden");
  const data = { bio: String(f.get("bio") || "").slice(0, 500), city: f.get("city") || null, district: f.get("district") || null };
  const av = await saveFile(f.get("avatar")); if (av) data.avatarUrl = av;
  const bn = await saveFile(f.get("banner")); if (bn) data.bannerUrl = bn;
  const u = await prisma.user.update({ where: { id }, data });
  revalidatePath(`/u/${u.username}`);
}

export async function updateUsername(f) {
  const me = await getUser(); if (!me) return;
  const username = String(f.get("username") || "").trim().toLowerCase();
  if (!/^[a-z0-9_]{3,20}$/.test(username)) return;
  if (username === me.username) return;
  const taken = await prisma.user.findUnique({ where: { username } });
  if (taken) return;
  await prisma.user.update({ where: { id: me.id }, data: { username } });
  revalidatePath("/"); revalidatePath(`/u/${username}`);
}

export async function removeMedia(f) {
  const me = await getUser(), id = f.get("id"), field = f.get("field");
  if (!me || (me.id !== id && me.role !== "SUPER_ADMIN") || !["avatarUrl", "bannerUrl"].includes(field)) throw new Error("Forbidden");
  const u = await prisma.user.update({ where: { id }, data: { [field]: null } });
  revalidatePath(`/u/${u.username}`);
}

export async function setTrust(f) {
  const me = await getUser(); if (me?.role !== "SUPER_ADMIN") throw new Error("Forbidden");
  const score = Math.min(100, Math.max(1, Math.round(+f.get("score") || 1)));
  const u = await prisma.user.update({ where: { id: f.get("id") }, data: { trustScore: score } });
  await prisma.adminLog.create({ data: { adminId: me.id, actionType: "SET_TRUST", targetId: u.id, details: String(score) } });
  revalidatePath(`/u/${u.username}`); revalidatePath("/admin/users");
}

export async function addReview(f) {
  const me = await getUser(), id = f.get("id"); if (!me || me.id === id) return;
  const deal = me.role === "SUPER_ADMIN" || (await prisma.listing.count({ where: { userId: id, buyerId: me.id, status: "SOLD" } })) > 0;
  if (!deal || !mailOk(me) || !(await allow(`rev:${me.id}`, 10, 3600))) return;
  const rating = Math.min(10, Math.max(1, +f.get("rating") || 10));
  await prisma.review.deleteMany({ where: { authorId: me.id, targetId: id } });
  await prisma.review.create({ data: { authorId: me.id, targetId: id, rating, pinned: me.role === "SUPER_ADMIN", text: String(f.get("text")).slice(0, 500) } });
  const { _avg } = await prisma.review.aggregate({ where: { targetId: id }, _avg: { rating: true } });
  const u = await prisma.user.update({ where: { id }, data: { rating: _avg.rating || 0 } });
  revalidatePath(`/u/${u.username}`);
}

// ---------- Объявления ----------
async function guardListingOwner(id) {
  const me = await getUser(), l = await prisma.listing.findUnique({ where: { id } });
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

export async function updateListing(f) {
  const me = await getUser(); if (!me) return;
  const id = f.get("id");
  const l = await prisma.listing.findUnique({ where: { id } });
  if (!l) return;
  const isOwner = l.userId === me.id;
  const isAdmin = me.role === "SUPER_ADMIN";
  if (!isOwner && !isAdmin) throw new Error("Forbidden");

  const shouldResetStatus = isOwner && !isAdmin && l.status === "PUBLISHED";

  const data = {
    title: String(f.get("title") || "").slice(0, 120),
    description: String(f.get("description") || "").slice(0, 5000),
    price: Math.min(2000000000, Math.max(0, Math.round(+f.get("price") || 0))),
    category: String(f.get("category") || l.category),
    city: String(f.get("city") || l.city),
    district: String(f.get("district") || ""),
  };
  if (shouldResetStatus) data.status = "UNDER_REVIEW";

  const testTitle = String(f.get("testTitle") || "").trim();
  const testMetrics = parseMetrics(f.get("testMetrics"));

  const CAT_TO_TYPE = {
    "Видеокарты": "GPU", "Процессоры": "CPU", "Оперативная память": "RAM",
    "Накопители (SSD/HDD)": "STORAGE", "Материнские платы": "MOTHERBOARD",
  };
  const componentType = CAT_TO_TYPE[data.category];

  const rawTestImages = f.getAll("testImages") || [];
  const newTestImages = (
    await Promise.all(
      rawTestImages.filter((file) => file && typeof file === "object" && file.size > 0).map(saveFile)
    )
  ).filter(Boolean);

  await prisma.$transaction(async (tx) => {
    await tx.listing.update({ where: { id: l.id }, data });
    if (componentType && testTitle) {
      const existingTest = await tx.componentTest.findFirst({ where: { listingId: l.id, componentType } });
      if (existingTest) {
        await tx.componentTest.update({
          where: { id: existingTest.id },
          data: { testTitle, metrics: testMetrics, mediaUrls: newTestImages.length > 0 ? [...existingTest.mediaUrls, ...newTestImages] : existingTest.mediaUrls },
        });
      } else {
        await tx.componentTest.create({
          data: { listingId: l.id, componentType, testTitle, resultStatus: "PASSED", metrics: testMetrics, mediaUrls: newTestImages },
        });
      }
    }
  });

  revalidatePath(`/listing/${l.id}`); revalidatePath("/admin/listings"); revalidatePath(`/u/${me.username}`); revalidatePath("/");
}

export async function removeTestImage(f) {
  const me = await getUser(); if (!me) throw new Error("Unauthorized");
  const testId = String(f.get("testId") || "");
  const url = String(f.get("url") || "");
  const test = await prisma.componentTest.findUnique({ where: { id: testId }, include: { listing: true } });
  if (!test || (test.listing.userId !== me.id && me.role !== "SUPER_ADMIN")) throw new Error("Forbidden");
  const updated = test.mediaUrls.filter((u) => u !== url);
  await prisma.componentTest.update({ where: { id: testId }, data: { mediaUrls: updated } });
  revalidatePath(`/listing/${test.listingId}`);
}

export async function deleteTest(f) {
  const me = await getUser(); if (!me) throw new Error("Unauthorized");
  const testId = String(f.get("testId") || "");
  const test = await prisma.componentTest.findUnique({ where: { id: testId }, include: { listing: true } });
  if (!test || (test.listing.userId !== me.id && me.role !== "SUPER_ADMIN")) throw new Error("Forbidden");
  await prisma.componentTest.delete({ where: { id: testId } });
  revalidatePath(`/listing/${test.listingId}`);
}

export async function addListingImage(f) {
  const l = await guardListingOwner(f.get("id")), url = await saveFile(f.get("photo"));
  if (url) await prisma.listingImage.create({ data: { listingId: l.id, url, order: 99 } });
  revalidatePath(`/listing/${l.id}`);
}
export async function removeListingImage(f) {
  const i = await prisma.listingImage.findUnique({ where: { id: f.get("id") } }); if (!i) return;
  await guardListingOwner(i.listingId);
  await prisma.listingImage.delete({ where: { id: i.id } });
  revalidatePath(`/listing/${i.listingId}`);
}

export async function createListing(f) {
  const me = await getUser(); if (!me) redirect("/login");
  const title = String(f.get("title")).trim();
  if (!title || !mailOk(me) || !(await allow(`lst:${me.id}`, 10, 3600))) return;
  const photos = (await Promise.all(f.getAll("photos").map(saveFile))).filter(Boolean);
  const tests = [];
  for (const t of ["GPU", "CPU", "RAM", "STORAGE", "MOTHERBOARD"]) {
    const tt = String(f.get(`t_${t}_title`) || "").trim(); if (!tt) continue;
    const mediaUrls = (await Promise.all(f.getAll(`t_${t}_shots`).map(saveFile))).filter(Boolean);
    tests.push({ componentType: t, testTitle: tt, resultStatus: "PASSED", metrics: parseMetrics(f.get(`t_${t}_metrics`)), mediaUrls });
  }
  const l = await prisma.listing.create({ data: {
    title, description: String(f.get("description")), price: Math.min(2000000000, Math.max(0, Math.round(+f.get("price") || 0))), category: String(f.get("category")),
    city: String(f.get("city") || me.city || "Актау"), district: String(f.get("district") || me.district || ""), userId: me.id,
    status: "UNDER_REVIEW",
    images: { create: photos.map((url, order) => ({ url, order })) }, tests: { create: tests } } });
  redirect(`/listing/${l.id}`);
}

// ---------- Проверка пользователей, похвала/выговор ----------
async function needSA() { const me = await getUser(); if (me?.role !== "SUPER_ADMIN") throw new Error("Forbidden"); return me; }

export async function sendToReview(f) {
  const me = await needSA(), id = f.get("id"); if (id === me.id) return;
  await prisma.$transaction([
    prisma.user.update({ where: { id }, data: { status: "UNDER_REVIEW" } }),
    prisma.message.create({ data: { senderId: me.id, receiverId: id, text: "Ваш аккаунт отправлен на проверку." } }),
    prisma.adminLog.create({ data: { adminId: me.id, actionType: "SEND_TO_REVIEW", targetId: id } }),
  ]);
  revalidatePath("/admin"); revalidatePath("/admin/users"); revalidatePath("/review");
}

export async function closeReview(f) {
  const me = await needSA(), id = f.get("id");
  await prisma.$transaction([
    prisma.user.update({ where: { id }, data: { status: "ACTIVE" } }),
    prisma.adminLog.create({ data: { adminId: me.id, actionType: "CLOSE_REVIEW", targetId: id } }),
  ]);
  revalidatePath("/admin"); revalidatePath("/admin/users"); revalidatePath("/review");
}

export async function adjustTrust(f) {
  const me = await needSA(), id = f.get("id");
  const raw = f.get("delta");
  const d = Number(raw) === 5 ? 5 : Number(raw) === -5 ? -5 : 5;
  const u = await prisma.user.findUnique({ where: { id } });
  if (!u) return;
  const next = Math.min(100, Math.max(1, u.trustScore + d));
  await prisma.user.update({ where: { id: u.id }, data: { trustScore: next } });
  await prisma.adminLog.create({ data: { adminId: me.id, actionType: d > 0 ? "PRAISE" : "WARN", targetId: u.id, details: `${d > 0 ? "+" : ""}${d} (${u.trustScore} → ${next})` } });
  revalidatePath("/admin"); revalidatePath("/admin/users"); revalidatePath(`/u/${u.username}`);
}

export async function resetTrust(f) {
  const me = await needSA(), id = f.get("id");
  const u = await prisma.user.update({ where: { id }, data: { trustScore: 50 } });
  await prisma.adminLog.create({ data: { adminId: me.id, actionType: "RESET_TRUST", targetId: u.id, details: "50" } });
  revalidatePath("/admin"); revalidatePath("/admin/users"); revalidatePath(`/u/${u.username}`);
}

export async function sendSupport(f) {
  const me = await getUser(); if (!me) redirect("/login");
  const to = await prisma.user.findUnique({ where: { id: f.get("receiverId") } }), text = String(f.get("text")).trim().slice(0, 2000);
  if (!to || !text || (me.role !== "SUPER_ADMIN" && to.role !== "SUPER_ADMIN")) return;
  if (!(await allow(`sup:${me.id}`, 20, 60))) return;
  const blocked = await prisma.block.findFirst({
    where: { OR: [{ blockerId: to.id, blockedId: me.id }, { blockerId: me.id, blockedId: to.id }] },
  });
  if (blocked) return;
  await prisma.message.create({ data: { senderId: me.id, receiverId: to.id, text } });
  revalidatePath("/review"); revalidatePath("/support");
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
  const me = await getUser(); if (!me || mailOk(me) || !(await allow(`ver:${me.id}`, 3, 3600))) return;
  await sendVerify(me);
}
export async function requestReset(f) {
  const email = String(f.get("email")).toLowerCase().trim();
  if (await allow(`rst:${ip()}`, 5, 3600)) {
    const u = await prisma.user.findUnique({ where: { email } });
    if (u) {
      const t = await makeToken(u.id, "RESET", 1);
      await sendMail(u.email, "Сброс пароля — AktauCyberPC", `<p><a href="${SITE()}/reset?token=${t}">Задать новый пароль</a></p>`);
    }
  }
  redirect("/forgot?sent=1");
}
export async function resetPassword(f) {
  const token = String(f.get("token")), pw = String(f.get("password"));
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
  await prisma.listing.update({ where: { id: l.id }, data: { status: "SOLD", buyerId: f.get("buyerId") || null } });
  revalidatePath(`/listing/${l.id}`); revalidatePath("/");
}

// ---------- Массовые действия владельца ----------
export async function hideListings(f) {
  const me = await getUser(); if (!me) return;
  const ids = f.getAll("ids").filter(Boolean);
  if (!ids.length) return;
  await prisma.listing.updateMany({
    where: { id: { in: ids }, userId: me.id, status: { in: ["PUBLISHED", "DRAFT", "UNDER_REVIEW", "NEEDS_EDIT"] } },
    data: { status: "HIDDEN" },
  });
  revalidatePath(`/u/${me.username}`); revalidatePath("/");
}

export async function unhideListing(f) {
  const me = await getUser(); if (!me) return;
  const id = f.get("id");
  const l = await prisma.listing.findUnique({ where: { id } });
  if (!l || l.userId !== me.id || l.status !== "HIDDEN") return;
  await prisma.listing.update({ where: { id }, data: { status: "PUBLISHED" } });
  revalidatePath(`/u/${me.username}`); revalidatePath("/");
}

export async function unhideManyListings(f) {
  const me = await getUser(); if (!me) return;
  const ids = f.getAll("ids").filter(Boolean);
  if (!ids.length) return;
  await prisma.listing.updateMany({
    where: { id: { in: ids }, userId: me.id, status: "HIDDEN" },
    data: { status: "PUBLISHED" },
  });
  revalidatePath(`/u/${me.username}`); revalidatePath("/");
}

export async function deleteOwnListings(f) {
  const me = await getUser(); if (!me) return;
  const ids = f.getAll("ids").filter(Boolean);
  if (!ids.length) return;
  const reason = "Удалено владельцем";
  await prisma.listing.updateMany({
    where: { id: { in: ids }, userId: me.id, status: { in: ["PUBLISHED", "DRAFT", "UNDER_REVIEW", "NEEDS_EDIT", "HIDDEN"] } },
    data: { status: "DELETED", deletedReason: reason, deletedAt: new Date() },
  });
  revalidatePath(`/u/${me.username}`); revalidatePath("/");
}

// ---------- Гайды (видео) ----------
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
  await prisma.guideVideo.createMany({ data: DEFAULT_GUIDES });
}

export async function saveGuideVideo(f) {
  const me = await getUser(); if (me?.role !== "SUPER_ADMIN") throw new Error("Forbidden");
  const id = f.get("id");
  const url = String(f.get("videoUrl") || "").trim();
  if (!url) throw new Error("Пустая ссылка");
  if (!/^https?:\/\//i.test(url)) throw new Error("Ссылка должна начинаться с http:// или https://");
  await prisma.guideVideo.update({ where: { id }, data: { videoUrl: url } });
  await prisma.adminLog.create({ data: { adminId: me.id, actionType: "SET_GUIDE_VIDEO", targetId: id, details: url } });
  revalidatePath("/guide");
}

export async function clearGuideVideo(f) {
  const me = await getUser(); if (me?.role !== "SUPER_ADMIN") throw new Error("Forbidden");
  const id = f.get("id");
  await prisma.guideVideo.update({ where: { id }, data: { videoUrl: null } });
  await prisma.adminLog.create({ data: { adminId: me.id, actionType: "CLEAR_GUIDE_VIDEO", targetId: id } });
  revalidatePath("/guide");
}