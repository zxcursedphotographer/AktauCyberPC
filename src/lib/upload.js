import { writeFile, mkdir } from "fs/promises";
import path from "path";
// Есть SUPABASE_SERVICE_KEY -> Supabase Storage (бакет "uploads"), иначе локальная папка public/uploads
export async function saveFile(file) {
  if (!file || typeof file === "string" || !file.size || !file.type.startsWith("image/")) return null;
  if (file.size > 5e6) throw new Error("Файл больше 5 МБ");
  const ext = (file.name.split(".").pop() || "jpg").replace(/\W/g, "").slice(0, 5);
  const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const buf = Buffer.from(await file.arrayBuffer());
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_KEY;
  if (base && key) {
    const r = await fetch(`${base}/storage/v1/object/uploads/${name}`, { method: "POST", headers: { apikey: key, ...(key.startsWith("sb_") ? {} : { Authorization: `Bearer ${key}` }), "Content-Type": file.type }, body: buf });
    if (!r.ok) throw new Error("Не удалось загрузить файл в хранилище");
    return `${base}/storage/v1/object/public/uploads/${name}`;
  }
  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), buf);
  return "/uploads/" + name;
}
