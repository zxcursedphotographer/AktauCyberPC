import { NextResponse } from "next/server";
import { getPresetCounts, getComponentCounts } from "@/app/actions";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") || "";
  const city = searchParams.get("city") || "";
  const componentType = searchParams.get("componentType") || "";

  // Для готовых ПК: считаем компоненты
  if (componentType) {
    try {
      const counts = await getComponentCounts(componentType, city);
      return NextResponse.json({ counts });
    } catch (e) {
      return NextResponse.json({ counts: {}, error: String(e?.message || e) }, { status: 500 });
    }
  }

  // Для GPU/CPU категорий: считаем по modelPreset
  if (!category) {
    return NextResponse.json({ counts: {} });
  }

  try {
    const counts = await getPresetCounts(category, city);
    return NextResponse.json({ counts });
  } catch (e) {
    return NextResponse.json({ counts: {}, error: String(e?.message || e) }, { status: 500 });
  }
}