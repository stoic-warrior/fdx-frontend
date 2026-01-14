import axios from "axios";
import type {
  Commitment,
  CommitmentRate,
  DailyData,
  LeadMeasure,
  Milestone,
  MilestoneProgress,
  WeeklyData,
  Wig,
} from "../types";

export const api = axios.create({
  baseURL: "http://localhost:8080",
  headers: {
    "Content-Type": "application/json",
  },
});

export const getWigs = async () => (await api.get<Wig[]>("/api/wigs")).data;
export const getWigCount = async () => (await api.get<number>("/api/wigs/count")).data;
export const createWig = async (payload: Omit<Wig, "id">) =>
  (await api.post<Wig>("/api/wigs", payload)).data;
export const updateWig = async (id: number, payload: Partial<Wig>) =>
  (await api.put<Wig>(`/api/wigs/${id}`, payload)).data;
export const deleteWig = async (id: number) =>
  (await api.delete<void>(`/api/wigs/${id}`)).data;

export const getLeadMeasures = async (wigId: number) =>
  (await api.get<LeadMeasure[]>(`/api/wigs/${wigId}/lead-measures`)).data;
export const createLeadMeasure = async (payload: Omit<LeadMeasure, "id">) =>
  (await api.post<LeadMeasure>("/api/lead-measures", payload)).data;
export const updateLeadMeasure = async (id: number, payload: Partial<LeadMeasure>) =>
  (await api.put<LeadMeasure>(`/api/lead-measures/${id}`, payload)).data;
export const deleteLeadMeasure = async (id: number) =>
  (await api.delete<void>(`/api/lead-measures/${id}`)).data;

export const getMilestones = async (wigId: number) =>
  (await api.get<Milestone[]>(`/api/wigs/${wigId}/milestones`)).data;
export const getMilestoneProgress = async (wigId: number) =>
  (await api.get<MilestoneProgress>(`/api/wigs/${wigId}/milestones/progress`)).data;
export const createMilestone = async (payload: Omit<Milestone, "id">) =>
  (await api.post<Milestone>("/api/milestones", payload)).data;
export const updateMilestone = async (id: number, payload: Partial<Milestone>) =>
  (await api.put<Milestone>(`/api/milestones/${id}`, payload)).data;
export const toggleMilestone = async (id: number) =>
  (await api.patch<Milestone>(`/api/milestones/${id}/toggle`)).data;
export const deleteMilestone = async (id: number) =>
  (await api.delete<void>(`/api/milestones/${id}`)).data;

export const getCommitments = async (wigId: number) =>
  (await api.get<Commitment[]>(`/api/wigs/${wigId}/commitments`)).data;
export const getCommitmentsByWeek = async (wigId: number, week: string) =>
  (await api.get<Commitment[]>(`/api/wigs/${wigId}/commitments/week/${week}`)).data;
export const getCommitmentRate = async (wigId: number, week: string) =>
  (await api.get<CommitmentRate>(`/api/wigs/${wigId}/commitments/week/${week}/rate`)).data;
export const createCommitment = async (payload: Omit<Commitment, "id">) =>
  (await api.post<Commitment>("/api/commitments", payload)).data;
export const updateCommitment = async (id: number, payload: Partial<Commitment>) =>
  (await api.put<Commitment>(`/api/commitments/${id}`, payload)).data;
export const toggleCommitment = async (id: number) =>
  (await api.patch<Commitment>(`/api/commitments/${id}/toggle`)).data;
export const deleteCommitment = async (id: number) =>
  (await api.delete<void>(`/api/commitments/${id}`)).data;

export const getWeeklyData = async (wigId: number) =>
  (await api.get<WeeklyData[]>(`/api/wigs/${wigId}/weekly-data`)).data;
export const getWeeklyDataByWeek = async (wigId: number, week: string) =>
  (await api.get<WeeklyData>(`/api/wigs/${wigId}/weekly-data/${week}`)).data;
export const createWeeklyData = async (payload: Omit<WeeklyData, "id">) =>
  (await api.post<WeeklyData>("/api/weekly-data", payload)).data;
export const updateWeeklyData = async (id: number, payload: Partial<WeeklyData>) =>
  (await api.put<WeeklyData>(`/api/weekly-data/${id}`, payload)).data;
export const deleteWeeklyData = async (id: number) =>
  (await api.delete<void>(`/api/weekly-data/${id}`)).data;

export const getDailyData = async (wigId: number) =>
  (await api.get<DailyData[]>(`/api/wigs/${wigId}/daily-data`)).data;
export const getDailyDataByWeek = async (wigId: number, week: string) =>
  (await api.get<DailyData[]>(`/api/wigs/${wigId}/daily-data/week/${week}`)).data;
export const getDailyDataRange = async (wigId: number, startDate: string, endDate: string) =>
  (
    await api.get<DailyData[]>(
      `/api/wigs/${wigId}/daily-data/range?startDate=${startDate}&endDate=${endDate}`
    )
  ).data;
export const createDailyData = async (payload: Omit<DailyData, "id">) =>
  (await api.post<DailyData>("/api/daily-data", payload)).data;
export const updateDailyData = async (id: number, payload: Partial<DailyData>) =>
  (await api.put<DailyData>(`/api/daily-data/${id}`, payload)).data;
export const deleteDailyData = async (id: number) =>
  (await api.delete<void>(`/api/daily-data/${id}`)).data;
