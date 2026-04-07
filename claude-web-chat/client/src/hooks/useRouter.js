import { useState, useEffect, useCallback } from "react";

export default function useRouter() {
  const [route, setRoute] = useState(() => parseHash(window.location.hash));

  useEffect(() => {
    function onHashChange() {
      setRoute(parseHash(window.location.hash));
    }
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const navigate = useCallback((path) => {
    window.location.hash = path;
  }, []);

  return { route, navigate };
}

function parseHash(hash) {
  const path = hash.replace(/^#\/?/, "") || "dashboard";
  const segments = path.split("/");
  const name = segments[0];
  const params = segments.slice(1);
  return { name, params, path };
}
