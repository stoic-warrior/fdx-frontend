import { useCallback, useEffect, useMemo, useState } from "react";
import type { Commitment, CommitmentRate, Wig } from "../types";
import {
  createCommitment,
  getCommitmentRate,
  getCommitmentsByWeek,
  toggleCommitment,
} from "../services/api";
import { useApi } from "../hooks/useApi";
import Card from "./common/Card";
import EmptyState from "./common/EmptyState";
import Button from "./common/Button";

const CURRENT_WEEK = "W5";
const PREVIOUS_WEEK = "W4";

interface CommitmentsProps {
  wigs: Wig[];
  selectedWigIds: number[];
}

const Commitments = ({ wigs, selectedWigIds }: CommitmentsProps) => {
  const { run } = useApi();
  const [currentCommitments, setCurrentCommitments] = useState<Commitment[]>([]);
  const [previousCommitments, setPreviousCommitments] = useState<Commitment[]>([]);
  const [rate, setRate] = useState<CommitmentRate | null>(null);
  const [newCommitment, setNewCommitment] = useState("");

  const activeWig = useMemo(() => {
    const selected = wigs.find((wig) => selectedWigIds.includes(wig.id));
    return selected ?? wigs[0];
  }, [wigs, selectedWigIds]);

  const loadCommitments = useCallback(async () => {
    if (!activeWig) {
      return;
    }
    try {
      const [current, previous, completionRate] = await Promise.all([
        run(() => getCommitmentsByWeek(activeWig.id, CURRENT_WEEK)),
        run(() => getCommitmentsByWeek(activeWig.id, PREVIOUS_WEEK)),
        run(() => getCommitmentRate(activeWig.id, CURRENT_WEEK)),
      ]);
      setCurrentCommitments(current);
      setPreviousCommitments(previous);
      setRate(completionRate);
    } catch (error) {
      return;
    }
  }, [activeWig, run]);

  useEffect(() => {
    void loadCommitments();
  }, [loadCommitments]);

  if (!activeWig) {
    return <EmptyState message="주간 약속을 보려면 WIG를 선택해 주세요." />;
  }

  const handleToggle = async (id: number) => {
    try {
      await run(() => toggleCommitment(id));
      await loadCommitments();
    } catch (error) {
      return;
    }
  };

  const handleAdd = async () => {
    if (!newCommitment.trim()) {
      return;
    }
    try {
      await run(() =>
        createCommitment({
          text: newCommitment,
          week: CURRENT_WEEK,
          completed: false,
          wigId: activeWig.id,
        })
      );
      setNewCommitment("");
      await loadCommitments();
    } catch (error) {
      return;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">주간 약속</h2>
        <p className="text-sm text-slate-500">선택된 WIG 기준으로 이번 주 약속을 관리합니다.</p>
      </div>

      <Card accent="border-blue-500">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold">{activeWig.title}</h3>
              <p className="text-sm text-slate-500">이번 주 {CURRENT_WEEK}</p>
            </div>
            <div className="rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-600">
              이행률 {rate ? `${rate.completionRate}%` : "-"}
            </div>
          </div>

          <div className="space-y-2">
            {currentCommitments.length ? (
              currentCommitments.map((commitment) => (
                <label
                  key={commitment.id}
                  className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm"
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={commitment.completed}
                      onChange={() => handleToggle(commitment.id)}
                    />
                    <span
                      className={commitment.completed ? "text-slate-400 line-through" : "text-slate-700"}
                    >
                      {commitment.text}
                    </span>
                  </div>
                </label>
              ))
            ) : (
              <p className="text-sm text-slate-400">이번 주 약속이 없습니다.</p>
            )}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              value={newCommitment}
              onChange={(event) => setNewCommitment(event.target.value)}
              placeholder="새 약속을 입력하세요"
              className="w-full rounded-lg border border-slate-200 px-3 py-2"
            />
            <Button onClick={handleAdd}>추가</Button>
          </div>
        </div>
      </Card>

      <Card accent="border-slate-300">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">지난 주 {PREVIOUS_WEEK} 결과</h3>
          </div>
          {previousCommitments.length ? (
            <ul className="space-y-2 text-sm">
              {previousCommitments.map((commitment) => (
                <li
                  key={commitment.id}
                  className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3"
                >
                  <span>{commitment.text}</span>
                  <span
                    className={`text-xs font-semibold ${
                      commitment.completed ? "text-emerald-500" : "text-rose-500"
                    }`}
                  >
                    {commitment.completed ? "완료" : "미완료"}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-400">지난 주 약속이 없습니다.</p>
          )}
        </div>
      </Card>
    </div>
  );
};

export default Commitments;
