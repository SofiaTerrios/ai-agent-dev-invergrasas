type StatsCardProps = {
  title: string;
  value: string;
  subtitle: string;
  trend?: "up" | "down" | "neutral";
};

export default function StatsCard({
  title,
  value,
  subtitle,
  trend = "neutral",
}: StatsCardProps) {
  const trendClass =
    trend === "up"
      ? "text-[#0F6E2E]"
      : trend === "down"
        ? "text-[#C86010]"
        : "text-[#486358]";

  return (
    <article className="rounded-2xl border border-[#E4ECE7] bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wider text-[#486358]">{title}</p>
      <p
        className="mt-2 text-3xl font-semibold text-[#1F2F27]"
        style={{ fontFamily: "'Playfair Display', serif" }}
      >
        {value}
      </p>
      <p className={`mt-2 text-sm ${trendClass}`}>{subtitle}</p>
    </article>
  );
}
