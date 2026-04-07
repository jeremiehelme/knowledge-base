import { useState, useCallback } from "react";

export default function useProfile(token) {
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);

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

  return { profile, profileLoading, fetchProfile, saveProfile };
}
