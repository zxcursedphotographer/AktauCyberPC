import { writeFile, mkdir } from "fs/promises";
import path from "path";

const MAX_SIZE = 5 * 1024 * 1024; // 5 МБ
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

// Есть SUPABASE_SERVICE_KEY -> Supabase Storage (бакет "uploads"),
// иначе локальная папка public/uploads
export async function saveFile(file) {
  if (!file || typeof file === "string" || !file.size) return null;
  if (!file.type?.startsWith("image/")) return null;
  if (!ALLOWED_TYPES.includes(file.type)) return null;
  if (file.size > MAX_SIZE) throw new Error("Файл больше 5 МБ");

  const ext = (file.name.split(".").pop() || "jpg")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 5) || "jpg";
  const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const buf = Buffer.from(await file.arrayBuffer());

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;

  if (base && key) {
    const headers = {
      apikey: key,
      "Content-Type": file.type,
      "x-upsert": "false",
    };
    if (!key.startsWith("sb_")) headers.Authorization = `Bearer ${key}`;
    const r = await fetch(`${base}/storage/v1/object/uploads/${name}`, {
      method: "POST",
      headers,
      body: buf,
    });
    if (!r.ok) throw new Error("Не удалось загрузить файл в хранилище");
    return `${base}/storage/v1/object/public/uploads/${name}`;
  }

  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), buf);
  return "/uploads/" + name;
}