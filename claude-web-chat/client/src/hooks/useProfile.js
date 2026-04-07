import { useState, useCallback } from "react";

export default function useProfile(token) {
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [agents, setAgents] = useState([]);

  const headers = { Authorization: `Bearer ${token}` };

  const fetchProfile = useCallback(async () => {
    setProfileLoading(true);
    try {
      const res = await fetch("/api/profile", { headers });
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      }
    } finally {
      setProfileLoading(false);
    }
  }, [token]);

  const saveProfile = useCallback(async (data) => {
    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      setProfile(data);
    }
    return res.ok;
  }, [token]);

  const addGoal = useCallback(async (goalData) => {
    const res = await fetch("/api/goals", {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify(goalData),
    });
    if (res.ok) {
      const goal = await res.json();
      setProfile((prev) => ({ ...prev, goals: [...(prev.goals || []), goal] }));
      return goal;
    }
    return null;
  }, [token]);

  const updateGoal = useCallback(async (id, updates) => {
    const res = await fetch(`/api/goals/${id}`, {
      method: "PUT",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    if (res.ok) {
      const updated = await res.json();
      setProfile((prev) => ({
        ...prev,
        goals: (prev.goals || []).map((g) => (g.id === id ? updated : g)),
      }));
      return updated;
    }
    return null;
  }, [token]);

  const deleteGoal = useCallback(async (id) => {
    const res = await fetch(`/api/goals/${id}`, { method: "DELETE", headers });
    if (res.ok) {
      setProfile((prev) => ({
        ...prev,
        goals: (prev.goals || []).filter((g) => g.id !== id),
      }));
    }
    return res.ok;
  }, [token]);

  const fetchAgents = useCallback(async () => {
    const res = await fetch("/api/agents", { headers });
    if (res.ok) setAgents(await res.json());
  }, [token]);

  return { profile, profileLoading, fetchProfile, saveProfile, addGoal, updateGoal, deleteGoal, agents, fetchAgents };
}
