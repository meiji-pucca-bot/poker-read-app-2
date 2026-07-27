"use client";

import type {
  TournamentChartPoint,
} from "@/lib/stats";
import { formatStatNumber } from "@/lib/stats";

type HeroBbChartProps = {
  data: TournamentChartPoint[];
};

type ProgressChartProps = {
  label: string;
  value: number;
  maximum?: number;
  displayValue: string;
  note: string;
  icon: string;
};

export function HeroBbChart({
  data,
}: HeroBbChartProps) {
  if (data.length === 0) {
    return null;
  }

  const width = 720;
  const height = 300;
  const paddingLeft = 48;
  const paddingRight = 24;
  const paddingTop = 24;
  const paddingBottom = 48;
  const chartWidth =
    width - paddingLeft - paddingRight;
  const chartHeight =
    height - paddingTop - paddingBottom;

  const highestValue = Math.max(
    10,
    ...data.map((point) => point.value),
  );
  const maxValue =
    Math.ceil(highestValue / 10) * 10;

  const points = data.map((point, index) => {
    const x =
      data.length === 1
        ? paddingLeft + chartWidth / 2
        : paddingLeft +
          (index / (data.length - 1)) * chartWidth;

    const y =
      paddingTop +
      chartHeight -
      (point.value / maxValue) * chartHeight;

    return {
      ...point,
      x,
      y,
    };
  });

  const polyline = points
    .map((point) => `${point.x},${point.y}`)
    .join(" ");

  const areaPath = [
    `M ${points[0].x} ${paddingTop + chartHeight}`,
    ...points.map(
      (point) => `L ${point.x} ${point.y}`,
    ),
    `L ${points[points.length - 1].x} ${
      paddingTop + chartHeight
    }`,
    "Z",
  ].join(" ");

  const gridValues = [
    maxValue,
    maxValue * 0.75,
    maxValue * 0.5,
    maxValue * 0.25,
    0,
  ];

  return (
    <section className="rounded-3xl border border-emerald-300/15 bg-gradient-to-br from-emerald-400/[0.08] to-transparent p-5 shadow-xl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black tracking-[0.16em] text-emerald-300">
            STACK TREND
          </p>
          <h2 className="mt-1 text-xl font-black">
            📈 終了時Hero BB推移
          </h2>
          <p className="mt-2 text-xs font-medium leading-5 text-white/40">
            直近{data.length}大会の終了時スタックを古い順に表示
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-300/15 bg-black/20 px-4 py-3 text-right">
          <p className="text-[10px] font-black tracking-wider text-white/35">
            LATEST
          </p>
          <p className="mt-1 text-xl font-black text-emerald-300">
            {formatStatNumber(
              data[data.length - 1].value,
            )} BB
          </p>
        </div>
      </div>

      <div className="mt-5 overflow-x-auto rounded-2xl border border-white/10 bg-black/20 p-2">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-auto min-w-[560px] w-full"
          role="img"
          aria-label="終了時Hero BBの推移グラフ"
        >
          <defs>
            <linearGradient
              id="hero-bb-area"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop
                offset="0%"
                stopColor="rgb(52 211 153)"
                stopOpacity="0.34"
              />
              <stop
                offset="100%"
                stopColor="rgb(52 211 153)"
                stopOpacity="0"
              />
            </linearGradient>
          </defs>

          {gridValues.map((value) => {
            const y =
              paddingTop +
              chartHeight -
              (value / maxValue) * chartHeight;

            return (
              <g key={value}>
                <line
                  x1={paddingLeft}
                  x2={width - paddingRight}
                  y1={y}
                  y2={y}
                  stroke="rgba(255,255,255,0.08)"
                  strokeWidth="1"
                />
                <text
                  x={paddingLeft - 10}
                  y={y + 4}
                  textAnchor="end"
                  fill="rgba(255,255,255,0.35)"
                  fontSize="12"
                  fontWeight="700"
                >
                  {formatStatNumber(value, 0)}
                </text>
              </g>
            );
          })}

          <path
            d={areaPath}
            fill="url(#hero-bb-area)"
          />

          <polyline
            points={polyline}
            fill="none"
            stroke="rgb(52 211 153)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {points.map((point) => (
            <g key={point.id}>
              <circle
                cx={point.x}
                cy={point.y}
                r="7"
                fill="rgb(7 21 15)"
                stroke="rgb(110 231 183)"
                strokeWidth="4"
              />
              <text
                x={point.x}
                y={height - 18}
                textAnchor="middle"
                fill="rgba(255,255,255,0.4)"
                fontSize="11"
                fontWeight="700"
              >
                {point.date}
              </text>
              <title>
                {point.tournamentName}:{" "}
                {formatStatNumber(point.value)} BB
              </title>
            </g>
          ))}
        </svg>
      </div>
    </section>
  );
}

export function ProgressChart({
  label,
  value,
  maximum = 100,
  displayValue,
  note,
  icon,
}: ProgressChartProps) {
  const percentage =
    maximum > 0
      ? Math.min(
          100,
          Math.max(0, (value / maximum) * 100),
        )
      : 0;

  return (
    <article className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black tracking-[0.15em] text-white/40">
            {label}
          </p>
          <p className="mt-2 text-3xl font-black">
            {displayValue}
          </p>
        </div>

        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-black/20 text-2xl">
          {icon}
        </div>
      </div>

      <div
        className="mt-5 h-3 overflow-hidden rounded-full bg-black/30"
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={maximum}
        aria-valuenow={value}
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-[width] duration-700"
          style={{ width: `${percentage}%` }}
        />
      </div>

      <p className="mt-3 text-xs font-medium leading-5 text-white/35">
        {note}
      </p>
    </article>
  );
}
