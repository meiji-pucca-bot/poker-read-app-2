type StatCardProps = {
  icon: string;
  label: string;
  value: string;
  note?: string;
};

export default function StatCard({
  icon,
  label,
  value,
  note,
}: StatCardProps) {
  return (
    <article className="rounded-3xl border border-white/10 bg-white/[0.05] p-5 shadow-xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black tracking-[0.15em] text-white/45">
            {label}
          </p>

          <p className="mt-3 text-3xl font-black tracking-tight text-white">
            {value}
          </p>

          {note && (
            <p className="mt-2 text-xs font-bold leading-5 text-white/35">
              {note}
            </p>
          )}
        </div>

        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-black/20 text-2xl">
          {icon}
        </div>
      </div>
    </article>
  );
}
