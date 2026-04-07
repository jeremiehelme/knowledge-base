import { useState, useCallback } from "react";

export default function useFiles(token) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  const headers = { Authorization: `Bearer ${token}` };

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/files", { headers });
      if (res.ok) setFiles(await res.json());
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchFileContent = useCallback(async (filePath) => {
    const res = await fetch(`/api/files/${encodeURIComponent(filePath)}/content`, { headers });
    if (!res.ok) return null;
    return res.json();
  }, [token]);

  const deleteFile = useCallback(async (filePath) => {
    const res = await fetch(`/api/files/${encodeURIComponent(filePath)}`, {
      method: "DELETE",
      headers,
    });
    if (res.ok) {
      setFiles((prev) => prev.filter((f) => f.path !== filePath));
    }
    return res.ok;
  }, [token]);

  return { files, loading, fetchFiles, fetchFileContent, deleteFile };
}
