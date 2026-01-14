import { useEffect, useMemo, useState } from "react";
import type { Milestone, WeeklyData, Wig } from "../types";
import {
  getCommitmentRate,
  getMilestones,
  getWeeklyData,
} from "../services/api";
import { useApi } from "../hooks/useApi";
import WigSelector from "./common/WigSelector";
import Card from "./common/Card";
import Loading from "./common/Loading";
import EmptyState from "./common/EmptyState";

const CURRENT_WEEK = "W5";

interface DashboardProps {
  wigs: Wig[];
  selectedWigIds: number[];
  onToggleWig: (id: number) => void;
  loading: boolean;
}

interface WigSnapshot {
  milestones: Milestone[];
  weeklyData: WeeklyData[];
  commitmentRate?: { total: number; completed: number; completionRate: number };
}

const Dashboard = ({ wigs, selectedWigIds, onToggleWig, loading }: DashboardProps) => {
  const { run } = useApi();
  const [snapshotMap, setSnapshotMap] = useState<Record<number, WigSnapshot>>({});
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    const loadSnapshots = async () => {
      if (!selectedWigIds.length) {
        return;
      }
      setFetching(true);
      try {
        const entries = await Promise.all(
          selectedWigIds.map(async (wigId) => {
            const [milestones, weeklyData, commitmentRate] = await Promise.all([
              run(() => getMilestones(wigId)),
              run(() => getWeeklyData(wigId)),
              run(() => getCommitmentRate(wigId, CURRENT_WEEK)),
            ]);
            return [wigId, { milestones, weeklyData, commitmentRate }] as const;
          })
        );
        setSnapshotMap((prev) => ({ ...prev, ...Object.fromEntries(entries) }));
      } catch (error) {
        return;
      } finally {
        setFetching(false);
      }
    };

    void loadSnapshots();
  }, [selectedWigIds, run]);

  const selectedWigs = useMemo(
    () => wigs.filter((wig) => selectedWigIds.includes(wig.id)),
    [wigs, selectedWigIds]
  );

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h2 className="text-xl font-semibold">핵심 목표 선택</h2>
        <WigSelector wigs={wigs} selectedIds={selectedWigIds} onToggle={onToggleWig} />
        <p className="text-sm text-slate-500">최대 2개의 WIG를 선택할 수 있어요.</p>
      </div>

      {!selectedWigs.length ? (
        <EmptyState message="선택된 WIG가 없습니다. WIG를 선택해 주세요." />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {selectedWigs.map((wig) => {
            const snapshot = snapshotMap[wig.id];
            const milestones = snapshot?.milestones ?? [];
            const weeklyData = snapshot?.weeklyData ?? [];
            const lastWeekly = weeklyData[weeklyData.length - 1];

            const numericFrom = Number(wig.fromX);
            const numericTo = Number(wig.toY);
            const actual = lastWeekly?.actual ?? 0;

            const progress = wig.measureType === "STATE"
              ? milestones.length
                ? Math.round(
                    (milestones.filter((milestone) => milestone.completed).length /
                      milestones.length) *
                      100
                  )
                : 0
              : Number.isFinite(numericFrom) && Number.isFinite(numericTo)
              ? Math.round(((numericFrom - actual) / (numericFrom - numericTo)) * 100)
              : 0;

            return (
              <Card key={wig.id} accent="border-blue-500">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-slate-500">WIG</p>
                    <h3 className="text-lg font-semibold text-slate-900">{wig.title}</h3>
                    <p className="text-sm text-slate-600">
                      {wig.fromX} → {wig.toY} · {wig.byWhen}
                    </p>
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between text-sm font-semibold">
                      <span>진행률</span>
                      <span>{Math.max(0, Math.min(progress, 100))}%</span>
                    </div>
                    <div className="h-3 w-full rounded-full bg-slate-100">
                      <div
                        className="h-3 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500"
                        style={{ width: `${Math.max(0, Math.min(progress, 100))}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-600 sm:grid-cols-2">
                    <div>
                      <p className="text-xs uppercase text-slate-400">현재 상태</p>
                      <p className="font-semibold text-slate-900">
                        {wig.measureType === "STATE"
                          ? `${milestones.filter((milestone) => milestone.completed).length} / ${
                              milestones.length
                            } 완료`
                          : `${actual} ${wig.unit ?? ""}`}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-slate-400">이번 주 약속 완료율</p>
                      <p className="font-semibold text-slate-900">
                        {snapshot?.commitmentRate
                          ? `${snapshot.commitmentRate.completionRate}%`
                          : "-"}
                      </p>
                    </div>
                  </div>

                  {wig.measureType === "STATE" && (
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-slate-700">마일스톤</p>
                      {milestones.length ? (
                        <ul className="space-y-2 text-sm text-slate-600">
                          {milestones.map((milestone) => (
                            <li
                              key={milestone.id}
                              className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2"
                            >
                              <span>{milestone.name}</span>
                              <span
                                className={`text-xs font-semibold ${
                                  milestone.completed ? "text-emerald-500" : "text-slate-400"
                                }`}
                              >
                                {milestone.completed ? "완료" : "진행 중"}
                              </span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-slate-400">등록된 마일스톤이 없습니다.</p>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {fetching && <Loading label="대시보드 데이터를 불러오는 중..." />}
    </div>
  );
};

export default Dashboard;
