"use client";
// Сжимает фото в браузере до 1600px (Vercel принимает не больше ~4.5 МБ за запрос)
export default function ImageInput({ max = 1600, ...props }) {
  async function onChange(e) {
    const input = e.target, out = new DataTransfer();
    for (const f of input.files) {
      if (!f.type.startsWith("image/") || f.type === "image/gif") { out.items.add(f); continue; }
      try {
        const bmp = await createImageBitmap(f), k = Math.min(1, max / Math.max(bmp.width, bmp.height));
        const c = document.createElement("canvas"); c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
        c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height);
        const blob = await new Promise((r) => c.toBlob(r, "image/jpeg", 0.82));
        out.items.add(new File([blob], f.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" }));
      } catch { out.items.add(f); }
    }
    input.files = out.files;
  }
  return <input type="file" accept="image/*" onChange={onChange} {...props} />;
}
