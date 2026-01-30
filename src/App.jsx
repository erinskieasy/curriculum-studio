import { useMemo, useState } from "react";

const STAGES = [
  {
    id: 1,
    label: "Topic input",
    description: "Enter an academic focus area.",
  },
  {
    id: 2,
    label: "Gathering links",
    description: "Indexing scholarly and industry sources.",
  },
  {
    id: 3,
    label: "Pulling insights",
    description: "Synthesizing key concepts and outcomes.",
  },
  {
    id: 4,
    label: "Generating curriculum",
    description: "Drafting the program structure and TOC.",
  },
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export default function App() {
  const [topic, setTopic] = useState("");
  const [stage, setStage] = useState(1);
  const [curriculum, setCurriculum] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [adminCode, setAdminCode] = useState("");
  const [isFullPageMode, setIsFullPageMode] = useState(false);

  // apiKey moved to server-side (process.env.OPENAI_API_KEY)
  const secretCode = import.meta.env.VITE_ADMIN_CODE || "CURRICULUM2026";
  const stageIndex = useMemo(
    () => STAGES.findIndex((item) => item.id === stage),
    [stage]
  );

  const stageMessage = useMemo(() => {
    const current = STAGES.find((item) => item.id === stage);
    return current ? current.description : "";
  }, [stage]);

  const handleAdminSubmit = () => {
    if (adminCode.trim() === secretCode) {
      setIsFullPageMode(true);
      setIsAdminOpen(false);
      setAdminCode("");
      setError("");
    } else {
      setError("Invalid admin code.");
    }
  };

  const generateCurriculum = async () => {
    if (!topic.trim()) {
      setError("Please enter a topic to continue.");
      return;
    }

    setIsLoading(true);
    setError("");
    setCurriculum("");

    try {
      // API key check moved to server-side

      const stageFlow = async () => {
        setStage(2);
        await sleep(1300);
        setStage(3);
        await sleep(1500);
        setStage(4);
      };

      const requestCurriculum = async () => {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ topic }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Server error: ${response.status}`);
        }

        const data = await response.json();
        return (
          data?.choices?.[0]?.message?.content ||
          "No curriculum returned. Try again."
        );
      };

      const [content] = await Promise.all([requestCurriculum(), stageFlow()]);
      setCurriculum(content);
    } catch (err) {
      setError(err?.message || "Something went wrong. Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isFullPageMode) {
    return (
      <div className="fullpage">
        <div className="fullpage-content">
          <p className="eyebrow">Admin Experience</p>
          <h1>Full Page Curriculum Console</h1>
          <p className="subtitle">
            You are now in the immersive view. This mode showcases the full
            pipeline experience.
          </p>
          <button className="secondary" onClick={() => setIsFullPageMode(false)}>
            Exit full page mode
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <button className="admin-button" onClick={() => setIsAdminOpen(true)}>
        Admin
      </button>
      <header className="hero">
        <div>
          <p className="eyebrow">Curriculum Studio</p>
          <h1>Design a rigorous curriculum with an academic pipeline.</h1>
          <p className="subtitle">
            A prestige-grade workflow to research, synthesize, and assemble
            course structures.
          </p>
        </div>
        <div className="hero-card">
          <h2>Topic input</h2>
          <p>What academic focus should the program center on?</p>
          <div className="input-row">
            <input
              type="text"
              placeholder="e.g. Human-Centered AI Systems"
              value={topic}
              onChange={(event) => setTopic(event.target.value)}
              disabled={isLoading}
            />
            <button onClick={generateCurriculum} disabled={isLoading}>
              {isLoading ? "Generating..." : "Generate"}
            </button>
          </div>
        </div>
      </header>

      <section className="pipeline">
        <div className="pipeline-header">
          <h2>Research Orchestration</h2>
          <p>{stageMessage}</p>
        </div>
        <div className="stage-grid">
          {STAGES.map((item, index) => {
            const status =
              stageIndex > index
                ? "complete"
                : stageIndex === index
                  ? "active"
                  : "idle";
            return (
              <div key={item.id} className={`stage-card ${status}`}>
                <div className="stage-index">{String(item.id).padStart(2, "0")}</div>
                <div>
                  <h3>{item.label}</h3>
                  <p>{item.description}</p>
                </div>
                <div className="stage-pulse" />
              </div>
            );
          })}
        </div>
        <div className="progress-track">
          <div
            className="progress-bar"
            style={{ width: `${((stageIndex + 1) / STAGES.length) * 100}%` }}
          />
        </div>
      </section>

      <section className="results">
        <div className="results-header">
          <h2>Generated curriculum</h2>
        </div>
        {error && <div className="error">{error}</div>}
        <div className="output">
          {isLoading && <p className="loading">Generating curriculum...</p>}
          {!isLoading && !curriculum && (
            <p className="placeholder">
              Enter a topic and press Generate to see the outline here.
            </p>
          )}
          {curriculum && <pre>{curriculum}</pre>}
        </div>
      </section>
      {isAdminOpen && (
        <div className="modal-backdrop" onClick={() => setIsAdminOpen(false)}>
          <div
            className="modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <h3>Admin Access</h3>
              <button className="icon-button" onClick={() => setIsAdminOpen(false)}>
                ✕
              </button>
            </div>
            <p>Enter the secret code to enable full page mode.</p>
            <input
              type="password"
              placeholder="Secret code"
              value={adminCode}
              onChange={(event) => setAdminCode(event.target.value)}
            />
            <div className="modal-actions">
              <button className="secondary" onClick={() => setIsAdminOpen(false)}>
                Cancel
              </button>
              <button onClick={handleAdminSubmit}>Unlock</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
