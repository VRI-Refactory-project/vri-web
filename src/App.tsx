import { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL;

function App() {
  const [status, setStatus] = useState("checking...");

  useEffect(() => {
    fetch(`${API_URL}/admin/login/`)
      .then((res) =>
        setStatus(res.ok ? "backend connected" : `backend error ${res.status}`),
      )
      .catch(() => setStatus("cannot reach backend"));
  }, []);

  return <h1>VRI Web: {status}</h1>;
}

export default App;
