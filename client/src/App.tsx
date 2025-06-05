import { useEffect } from "react";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { cleanupSocket } from "./hooks/useSocket";
import Game from "./pages/Game";
import Landing from "./pages/Landing";
import Waiting from "./pages/Waiting";

function App() {
  useEffect(() => {
    // Cleanup socket when app unmounts (e.g., page refresh)
    return () => {
      cleanupSocket();
    };
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/waiting" element={<Waiting />} />
        <Route path="/game" element={<Game />} />
      </Routes>
    </Router>
  );
}

export default App;
