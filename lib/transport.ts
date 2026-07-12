export type TransportOwner = "" | "ママ" | "パパ" | "自分" | "bus";

export const transportOwnerOptions: { value: TransportOwner; label: string; description: string }[] = [
  { value: "", label: "未定", description: "あとで決める" },
  { value: "ママ", label: "ママ", description: "ママが送迎する" },
  { value: "パパ", label: "パパ", description: "パパが送迎する" },
  { value: "自分", label: "自分", description: "自分で移動する" },
  { value: "bus", label: "バス", description: "バスで移動する" }
];

const legacyOwners: Record<string, TransportOwner> = {
  "銉炪優": "ママ",
  "銉戙儜": "パパ",
  "鑷垎": "自分"
};

export function normalizeTransportOwner(owner?: string): TransportOwner {
  if (!owner) return "";
  if (owner === "ママ" || owner === "パパ" || owner === "自分" || owner === "bus") return owner;
  return legacyOwners[owner] ?? "";
}

export function transportOwnerLabel(owner?: string) {
  const normalized = normalizeTransportOwner(owner);
  return transportOwnerOptions.find((option) => option.value === normalized)?.label ?? "未定";
}

export function isParentTransport(owner?: string) {
  const normalized = normalizeTransportOwner(owner);
  return normalized === "ママ" || normalized === "パパ";
}
