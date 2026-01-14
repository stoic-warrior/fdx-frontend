import { NavLink, Route, Routes } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import Dashboard from "./components/Dashboard";
import Scoreboard from "./components/Scoreboard";
import Commitments from "./components/Commitments";
import WigManagement from "./components/WigManagement";
import { getWigs } from "./services/api";
import type { Wig } from "./types";
import { useApi } from "./hooks/useApi";

const tabs = [
  { path: "/", label: "대시보드" },
  { path: "/scoreboard", label: "스코어보드" },
  { path: "/commitments", label: "주간 약속" },
  { path: "/wigs", label: "WIG 관리" },
];

const App = () => {
  const { run } = useApi();
  const [wigs, setWigs] = useState<Wig[]>([]);
  const [selectedWigIds, setSelectedWigIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  const refreshWigs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await run(() => getWigs());
      setWigs(data);
      setSelectedWigIds((prev) => prev.filter((id) => data.some((wig) => wig.id === id)));
    } catch (error) {
      return;
    } finally {
      setLoading(false);
    }
  }, [run]);

  useEffect(() => {
    void refreshWigs();
  }, [refreshWigs]);

  const handleToggleWig = (id: number) => {
    setSelectedWigIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((wigId) => wigId !== id);
      }
      if (prev.length >= 2) {
        return prev;
      }
      return [...prev, id];
    });
  };

  return (
    <div className="min-h-screen bg-slate-50">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">WIG Tracker</h1>
              <p className="text-sm text-slate-500">4 Disciplines of Execution</p>
            </div>
            <nav className="flex flex-wrap gap-3">
              {tabs.map((tab) => (
                <NavLink
                  key={tab.path}
                  to={tab.path}
                  end
                  className={({ isActive }) =>
                    `rounded-full px-4 py-2 text-sm font-semibold transition ${
                      isActive
                        ? "bg-blue-600 text-white"
                        : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
                    }`
                  }
                >
                  {tab.label}
                </NavLink>
              ))}
            </nav>
          </div>
        </header>

        <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-8">
          <Routes>
            <Route
              path="/"
              element={
                <Dashboard
                  wigs={wigs}
                  selectedWigIds={selectedWigIds}
                  onToggleWig={handleToggleWig}
                  loading={loading}
                />
              }
            />
            <Route
              path="/scoreboard"
              element={
                <Scoreboard
                  wigs={wigs}
                  selectedWigIds={selectedWigIds}
                  onToggleWig={handleToggleWig}
                />
              }
            />
            <Route
              path="/commitments"
              element={<Commitments wigs={wigs} selectedWigIds={selectedWigIds} />} 
            />
            <Route
              path="/wigs"
              element={<WigManagement wigs={wigs} loading={loading} refreshWigs={refreshWigs} />}
            />
          </Routes>
        </main>
    </div>
  );
};

export default App;
