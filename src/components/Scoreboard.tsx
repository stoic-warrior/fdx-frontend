import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DailyData, LeadMeasure, MilestoneProgress, WeeklyData, Wig } from "../types";
import {
  getDailyDataByWeek,
  getLeadMeasures,
  getMilestoneProgress,
  getWeeklyData,
} from "../services/api";
import { useApi } from "../hooks/useApi";
import WigSelector from "./common/WigSelector";
import Card from "./common/Card";
import EmptyState from "./common/EmptyState";

const CURRENT_WEEK = "W5";

interface ScoreboardProps {
  wigs: Wig[];
  selectedWigIds: number[];
  onToggleWig: (id: number) => void;
}

const Scoreboard = ({ wigs, selectedWigIds, onToggleWig }: ScoreboardProps) => {
  const { run } = useApi();
  const [selectedWeek, setSelectedWeek] = useState(CURRENT_WEEK);
  const [chartType, setChartType] = useState<"line" | "bar">("line");
  const [leadView, setLeadView] = useState<"daily" | "weekly">("weekly");
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([]);
  const [dailyData, setDailyData] = useState<DailyData[]>([]);
  const [leadMeasures, setLeadMeasures] = useState<LeadMeasure[]>([]);
  const [milestoneProgress, setMilestoneProgress] = useState<MilestoneProgress | null>(null);

  const activeWig = useMemo(() => {
    const selected = wigs.find((wig) => selectedWigIds.includes(wig.id));
    return selected ?? wigs[0];
  }, [wigs, selectedWigIds]);

  useEffect(() => {
    const load = async () => {
      if (!activeWig) {
        return;
      }
      try {
        const [weekly, daily, leads, progress] = await Promise.all([
          run(() => getWeeklyData(activeWig.id)),
          run(() => getDailyDataByWeek(activeWig.id, selectedWeek)),
          run(() => getLeadMeasures(activeWig.id)),
          activeWig.measureType === "STATE" ? run(() => getMilestoneProgress(activeWig.id)) : null,
        ]);
        setWeeklyData(weekly);
        setDailyData(daily);
        setLeadMeasures(leads);
        setMilestoneProgress(progress);
      } catch (error) {
        return;
      }
    };

    void load();
  }, [activeWig, selectedWeek, run]);

  if (!wigs.length) {
    return <EmptyState message="등록된 WIG가 없습니다. WIG를 먼저 추가해 주세요." />;
  }

  if (!activeWig) {
    return <EmptyState message="스코어보드를 보려면 WIG를 선택해 주세요." />;
  }

  const lastWeekly = weeklyData[weeklyData.length - 1];
  const actual = lastWeekly?.actual ?? 0;
  const target = lastWeekly?.target ?? 0;
  const numericFrom = Number(activeWig.fromX);
  const numericTo = Number(activeWig.toY);
  const isDecrease = numericFrom > numericTo;

  const lagIsWin = activeWig.measureType === "STATE"
    ? (milestoneProgress?.progressRate ?? 0) >= 50
    : isDecrease
    ? actual <= target
    : actual >= target;

  const leadChartData = leadView === "weekly"
    ? weeklyData.map((item) => ({
        name: item.week,
        lead1: item.lead1 ?? 0,
        lead2: item.lead2 ?? 0,
      }))
    : dailyData.map((item) => ({
        name: item.dayOfWeek,
        lead1: item.lead1 ?? 0,
        lead2: item.lead2 ?? 0,
      }));

  const LagChart = chartType === "line" ? LineChart : BarChart;

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h2 className="text-xl font-semibold">스코어보드</h2>
        <WigSelector wigs={wigs} selectedIds={selectedWigIds} onToggle={onToggleWig} />
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <label className="flex items-center gap-2">
            주차 선택
            <select
              value={selectedWeek}
              onChange={(event) => setSelectedWeek(event.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2"
            >
              {["W1", "W2", "W3", "W4", "W5", "W6", "W7", "W8", "W9", "W10", "W11", "W12"].map(
                (week) => (
                  <option key={week} value={week}>
                    {week}
                  </option>
                )
              )}
            </select>
          </label>
          <button
            className="rounded-full border border-slate-200 px-3 py-2 font-semibold text-slate-600"
            onClick={() => setChartType((prev) => (prev === "line" ? "bar" : "line"))}
          >
            차트 타입: {chartType === "line" ? "선" : "막대"}
          </button>
          <button
            className="rounded-full border border-slate-200 px-3 py-2 font-semibold text-slate-600"
            onClick={() => setLeadView((prev) => (prev === "weekly" ? "daily" : "weekly"))}
          >
            리드 지표: {leadView === "weekly" ? "주간" : "일간"}
          </button>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              lagIsWin ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-600"
            }`}
          >
            {lagIsWin ? "🏆 승리 중" : "⚠️ 목표 미달"}
          </span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card accent="border-indigo-500">
          <h3 className="mb-4 text-sm font-semibold text-slate-700">Lag Measure</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LagChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Legend />
                {chartType === "line" ? (
                  <>
                    <Line type="monotone" dataKey="actual" name="Actual" stroke="#2563eb" />
                    <Line type="monotone" dataKey="target" name="Target" stroke="#f97316" />
                  </>
                ) : (
                  <>
                    <Bar dataKey="actual" name="Actual" fill="#2563eb" />
                    <Bar dataKey="target" name="Target" fill="#f97316" />
                  </>
                )}
                <ReferenceLine y={target} stroke="#f97316" strokeDasharray="4 4" />
              </LagChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 text-sm text-slate-600">
            최근 Actual: {actual} {activeWig.unit ?? ""} / Target: {target} {activeWig.unit ?? ""}
          </div>
        </Card>

        {activeWig.measureType === "STATE" ? (
          <Card accent="border-emerald-500">
            <h3 className="mb-4 text-sm font-semibold text-slate-700">STATE 마일스톤 진행률</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={weeklyData.map((item) => ({
                    week: item.week,
                    progress: item.milestoneProgress ?? 0,
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="progress" stroke="#10b981" />
                  <ReferenceLine y={50} stroke="#0f172a" strokeDasharray="4 4" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 text-sm text-slate-600">
              완료: {milestoneProgress?.completed ?? 0} / {milestoneProgress?.total ?? 0} ({
                milestoneProgress?.progressRate ?? 0
              }%)
            </div>
          </Card>
        ) : (
          <Card accent="border-slate-300">
            <h3 className="mb-2 text-sm font-semibold text-slate-700">STATE 마일스톤 진행률</h3>
            <p className="text-sm text-slate-500">NUMERIC 타입 WIG는 마일스톤 차트가 없습니다.</p>
          </Card>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {["lead1", "lead2"].map((leadKey, index) => {
          const leadMeasure = leadMeasures[index];
          const leadName = leadMeasure ? leadMeasure.name : `Lead Measure ${index + 1}`;
          const leadTarget = leadMeasure
            ? leadView === "weekly"
              ? leadMeasure.weeklyTarget
              : leadMeasure.dailyTarget
            : leadView === "weekly"
            ? 10
            : 2;
          return (
            <Card key={leadKey} accent="border-blue-400">
              <h3 className="mb-4 text-sm font-semibold text-slate-700">{leadName}</h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  {chartType === "line" ? (
                    <LineChart data={leadChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey={leadKey} stroke="#6366f1" />
                      <ReferenceLine y={leadTarget} stroke="#0ea5e9" strokeDasharray="4 4" />
                    </LineChart>
                  ) : (
                    <BarChart data={leadChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey={leadKey} fill="#6366f1" />
                      <ReferenceLine y={leadTarget} stroke="#0ea5e9" strokeDasharray="4 4" />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default Scoreboard;
