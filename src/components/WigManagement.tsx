import { useEffect, useState } from "react";
import type { LeadMeasure, Milestone, Wig } from "../types";
import {
  createLeadMeasure,
  createMilestone,
  createWig,
  deleteLeadMeasure,
  deleteWig,
  getLeadMeasures,
  getMilestones,
  toggleMilestone,
  updateLeadMeasure,
  updateWig,
} from "../services/api";
import { useApi } from "../hooks/useApi";
import Card from "./common/Card";
import Button from "./common/Button";
import Loading from "./common/Loading";
import EmptyState from "./common/EmptyState";

interface WigManagementProps {
  wigs: Wig[];
  loading: boolean;
  refreshWigs: () => Promise<void>;
}

const defaultForm = {
  title: "",
  measureType: "NUMERIC" as const,
  fromX: "",
  toY: "",
  unit: "",
  byWhen: "",
};

const WigManagement = ({ wigs, loading, refreshWigs }: WigManagementProps) => {
  const { run } = useApi();
  const [form, setForm] = useState(defaultForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [leadMeasuresByWig, setLeadMeasuresByWig] = useState<Record<number, LeadMeasure[]>>({});
  const [milestonesByWig, setMilestonesByWig] = useState<Record<number, Milestone[]>>({});
  const [leadDraft, setLeadDraft] = useState<Record<number, Omit<LeadMeasure, "id">>>({});
  const [milestoneDraft, setMilestoneDraft] = useState<Record<number, string>>({});

  const maxReached = wigs.length >= 2;

  useEffect(() => {
    const loadDetails = async () => {
      if (!wigs.length) {
        return;
      }
      try {
        const leadEntries = await Promise.all(
          wigs.map(async (wig) => [wig.id, await run(() => getLeadMeasures(wig.id))] as const)
        );
        const milestoneEntries = await Promise.all(
          wigs.map(async (wig) => [wig.id, await run(() => getMilestones(wig.id))] as const)
        );
        setLeadMeasuresByWig(Object.fromEntries(leadEntries));
        setMilestonesByWig(Object.fromEntries(milestoneEntries));
      } catch (error) {
        return;
      }
    };

    void loadDetails();
  }, [wigs, run]);

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      return;
    }
    const payload = {
      title: form.title,
      measureType: form.measureType,
      fromX: form.fromX,
      toY: form.toY,
      byWhen: form.byWhen,
      unit: form.measureType === "NUMERIC" ? form.unit : null,
    };
    try {
      if (editingId) {
        await run(() => updateWig(editingId, payload));
      } else {
        await run(() => createWig(payload));
      }
      setForm(defaultForm);
      setEditingId(null);
      await refreshWigs();
    } catch (error) {
      return;
    }
  };

  const handleEdit = (wig: Wig) => {
    setEditingId(wig.id);
    setForm({
      title: wig.title,
      measureType: wig.measureType,
      fromX: wig.fromX,
      toY: wig.toY,
      byWhen: wig.byWhen,
      unit: wig.unit ?? "",
    });
  };

  const handleDelete = async (wigId: number) => {
    try {
      await run(() => deleteWig(wigId));
      await refreshWigs();
    } catch (error) {
      return;
    }
  };

  const handleLeadChange = (wigId: number, field: keyof Omit<LeadMeasure, "id">, value: string) => {
    setLeadDraft((prev) => ({
      ...prev,
      [wigId]: {
        name: "",
        dailyTarget: 0,
        weeklyTarget: 0,
        unit: "",
        wigId,
        ...prev[wigId],
        [field]: field === "dailyTarget" || field === "weeklyTarget" ? Number(value) : value,
      },
    }));
  };

  const handleAddLead = async (wigId: number) => {
    const draft = leadDraft[wigId];
    if (!draft?.name) {
      return;
    }
    try {
      await run(() => createLeadMeasure({ ...draft, wigId }));
      const updated = await run(() => getLeadMeasures(wigId));
      setLeadMeasuresByWig((prev) => ({ ...prev, [wigId]: updated }));
      setLeadDraft((prev) => ({ ...prev, [wigId]: { ...draft, name: "" } }));
    } catch (error) {
      return;
    }
  };

  const handleUpdateLead = async (lead: LeadMeasure) => {
    try {
      await run(() => updateLeadMeasure(lead.id, lead));
      const updated = await run(() => getLeadMeasures(lead.wigId));
      setLeadMeasuresByWig((prev) => ({ ...prev, [lead.wigId]: updated }));
    } catch (error) {
      return;
    }
  };

  const handleDeleteLead = async (lead: LeadMeasure) => {
    try {
      await run(() => deleteLeadMeasure(lead.id));
      const updated = await run(() => getLeadMeasures(lead.wigId));
      setLeadMeasuresByWig((prev) => ({ ...prev, [lead.wigId]: updated }));
    } catch (error) {
      return;
    }
  };

  const handleAddMilestone = async (wigId: number) => {
    const name = milestoneDraft[wigId];
    if (!name?.trim()) {
      return;
    }
    try {
      await run(() =>
        createMilestone({
          name,
          completed: false,
          orderIndex: milestonesByWig[wigId]?.length ?? 0,
          wigId,
        })
      );
      const updated = await run(() => getMilestones(wigId));
      setMilestonesByWig((prev) => ({ ...prev, [wigId]: updated }));
      setMilestoneDraft((prev) => ({ ...prev, [wigId]: "" }));
    } catch (error) {
      return;
    }
  };

  const handleToggleMilestone = async (wigId: number, milestoneId: number) => {
    try {
      await run(() => toggleMilestone(milestoneId));
      const updated = await run(() => getMilestones(wigId));
      setMilestonesByWig((prev) => ({ ...prev, [wigId]: updated }));
    } catch (error) {
      return;
    }
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">WIG 관리</h2>
        <p className="text-sm text-slate-500">최대 2개의 WIG를 설정할 수 있습니다.</p>
      </div>

      <Card accent="border-blue-500">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              {editingId ? "WIG 수정" : "새 WIG 추가"}
            </h3>
            {editingId && (
              <Button variant="ghost" onClick={() => setEditingId(null)}>
                편집 취소
              </Button>
            )}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <input
              value={form.title}
              onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
              placeholder="제목"
              className="rounded-lg border border-slate-200 px-3 py-2"
            />
            <select
              value={form.measureType}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, measureType: event.target.value as "STATE" | "NUMERIC" }))
              }
              className="rounded-lg border border-slate-200 bg-white px-3 py-2"
            >
              <option value="NUMERIC">NUMERIC</option>
              <option value="STATE">STATE</option>
            </select>
            <input
              value={form.fromX}
              onChange={(event) => setForm((prev) => ({ ...prev, fromX: event.target.value }))}
              placeholder="fromX"
              className="rounded-lg border border-slate-200 px-3 py-2"
            />
            <input
              value={form.toY}
              onChange={(event) => setForm((prev) => ({ ...prev, toY: event.target.value }))}
              placeholder="toY"
              className="rounded-lg border border-slate-200 px-3 py-2"
            />
            {form.measureType === "NUMERIC" && (
              <input
                value={form.unit}
                onChange={(event) => setForm((prev) => ({ ...prev, unit: event.target.value }))}
                placeholder="단위 (kg, 회 등)"
                className="rounded-lg border border-slate-200 px-3 py-2"
              />
            )}
            <input
              type="date"
              value={form.byWhen}
              onChange={(event) => setForm((prev) => ({ ...prev, byWhen: event.target.value }))}
              className="rounded-lg border border-slate-200 px-3 py-2"
            />
          </div>
          <Button onClick={handleSubmit} disabled={maxReached && !editingId}>
            {maxReached && !editingId ? "WIG 최대 2개" : editingId ? "수정" : "추가"}
          </Button>
        </div>
      </Card>

      {!wigs.length ? (
        <EmptyState message="등록된 WIG가 없습니다." />
      ) : (
        <div className="space-y-6">
          {wigs.map((wig) => {
            const leads = leadMeasuresByWig[wig.id] ?? [];
            const milestones = milestonesByWig[wig.id] ?? [];
            const leadDraftForWig = leadDraft[wig.id] ?? {
              name: "",
              dailyTarget: 0,
              weeklyTarget: 0,
              unit: "",
              wigId: wig.id,
            };

            return (
              <Card key={wig.id} accent="border-indigo-400">
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold">{wig.title}</h3>
                      <p className="text-sm text-slate-500">
                        {wig.fromX} → {wig.toY} · {wig.byWhen}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="secondary" onClick={() => handleEdit(wig)}>
                        수정
                      </Button>
                      <Button variant="ghost" onClick={() => handleDelete(wig.id)}>
                        삭제
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-slate-700">Lead Measures</h4>
                    <div className="space-y-2">
                      {leads.length ? (
                        leads.map((lead) => (
                          <div
                            key={lead.id}
                            className="grid gap-2 rounded-lg border border-slate-200 bg-white p-3 text-sm md:grid-cols-5"
                          >
                            <input
                              value={lead.name}
                              onChange={(event) =>
                                setLeadMeasuresByWig((prev) => ({
                                  ...prev,
                                  [wig.id]: prev[wig.id].map((item) =>
                                    item.id === lead.id ? { ...item, name: event.target.value } : item
                                  ),
                                }))
                              }
                              className="rounded border border-slate-200 px-2 py-1"
                            />
                            <input
                              type="number"
                              value={lead.dailyTarget}
                              onChange={(event) =>
                                setLeadMeasuresByWig((prev) => ({
                                  ...prev,
                                  [wig.id]: prev[wig.id].map((item) =>
                                    item.id === lead.id
                                      ? { ...item, dailyTarget: Number(event.target.value) }
                                      : item
                                  ),
                                }))
                              }
                              className="rounded border border-slate-200 px-2 py-1"
                            />
                            <input
                              type="number"
                              value={lead.weeklyTarget}
                              onChange={(event) =>
                                setLeadMeasuresByWig((prev) => ({
                                  ...prev,
                                  [wig.id]: prev[wig.id].map((item) =>
                                    item.id === lead.id
                                      ? { ...item, weeklyTarget: Number(event.target.value) }
                                      : item
                                  ),
                                }))
                              }
                              className="rounded border border-slate-200 px-2 py-1"
                            />
                            <input
                              value={lead.unit}
                              onChange={(event) =>
                                setLeadMeasuresByWig((prev) => ({
                                  ...prev,
                                  [wig.id]: prev[wig.id].map((item) =>
                                    item.id === lead.id ? { ...item, unit: event.target.value } : item
                                  ),
                                }))
                              }
                              className="rounded border border-slate-200 px-2 py-1"
                            />
                            <div className="flex gap-2">
                              <Button variant="secondary" onClick={() => handleUpdateLead(lead)}>
                                저장
                              </Button>
                              <Button variant="ghost" onClick={() => handleDeleteLead(lead)}>
                                삭제
                              </Button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-slate-400">등록된 리드 지표가 없습니다.</p>
                      )}
                    </div>
                    <div className="grid gap-2 md:grid-cols-5">
                      <input
                        value={leadDraftForWig.name}
                        onChange={(event) => handleLeadChange(wig.id, "name", event.target.value)}
                        placeholder="리드 지표 이름"
                        className="rounded-lg border border-slate-200 px-2 py-1"
                      />
                      <input
                        type="number"
                        value={leadDraftForWig.dailyTarget}
                        onChange={(event) => handleLeadChange(wig.id, "dailyTarget", event.target.value)}
                        placeholder="일간 목표"
                        className="rounded-lg border border-slate-200 px-2 py-1"
                      />
                      <input
                        type="number"
                        value={leadDraftForWig.weeklyTarget}
                        onChange={(event) => handleLeadChange(wig.id, "weeklyTarget", event.target.value)}
                        placeholder="주간 목표"
                        className="rounded-lg border border-slate-200 px-2 py-1"
                      />
                      <input
                        value={leadDraftForWig.unit}
                        onChange={(event) => handleLeadChange(wig.id, "unit", event.target.value)}
                        placeholder="단위"
                        className="rounded-lg border border-slate-200 px-2 py-1"
                      />
                      <Button onClick={() => handleAddLead(wig.id)}>추가</Button>
                    </div>
                  </div>

                  {wig.measureType === "STATE" && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-slate-700">마일스톤</h4>
                      <div className="space-y-2">
                        {milestones.length ? (
                          milestones.map((milestone) => (
                            <label
                              key={milestone.id}
                              className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                            >
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={milestone.completed}
                                  onChange={() => handleToggleMilestone(wig.id, milestone.id)}
                                />
                                <span>{milestone.name}</span>
                              </div>
                              <span
                                className={`text-xs font-semibold ${
                                  milestone.completed ? "text-emerald-500" : "text-slate-400"
                                }`}
                              >
                                {milestone.completed ? "완료" : "진행 중"}
                              </span>
                            </label>
                          ))
                        ) : (
                          <p className="text-sm text-slate-400">등록된 마일스톤이 없습니다.</p>
                        )}
                      </div>
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <input
                          value={milestoneDraft[wig.id] ?? ""}
                          onChange={(event) =>
                            setMilestoneDraft((prev) => ({ ...prev, [wig.id]: event.target.value }))
                          }
                          placeholder="마일스톤 이름"
                          className="w-full rounded-lg border border-slate-200 px-3 py-2"
                        />
                        <Button onClick={() => handleAddMilestone(wig.id)}>추가</Button>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default WigManagement;
