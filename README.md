# Agentic SDLC Governance Laboratory

A Project Management Framework for Control and Quality Assurance in Autonomous Multi-Agent Software Development Life Cycles.

> **Academic Foundation**: Based on the Master of Engineering in Project Management Thesis:  
> *"Governing Agentic AI in the Software Development Life Cycle: A Project Management Framework for Control and Quality Assurance"*  
> **Author**: Muhammad Awais (Vaasan Ammattikorkeakoulu - VAMK University of Applied Sciences, 2026).

---

## 🌟 Core Architecture: Hub-and-Spoke Coordination

The system implements a centralized **Hub-and-Spoke** multi-agent model (Section 5.1):

1. **Central Coordinator Agent (Hub)**: Serves as the PM controller, managing session states, dispatching tasks to specialized worker agents, and enforcing that no story progresses to governance without clearing QA.
2. **StoryPlanner Agent (Spoke)**: Decomposes Epics into granular user stories, assigns **Fibonacci story points** ($1, 2, 3, 5, 8$), and classifies them as `FRONTEND` or `BACKEND`.
3. **Developer Agents (FE/BE Spokes)**: Implement UI components and API endpoints under a strict **No-Merge Constraint**.
4. **QA Agent (Spoke)**: Runs automated test suites, validates test coverage ($\ge 80\%$), and triggers the recursive **Self-Correction Loop (SCR)** upon test failure.
5. **PM Governance Agent (Spoke)**: Serves as the final release authority, enforcing behavioral guardrails and SAST security scanning (Bandit equivalent).

---

## 🛡️ Three Governance Modes (Section 3.5 & Chapter 4)

- **OFF Mode (Control)**: Maximum autonomy, no automated validation. Highest raw velocity but lowest QA stability and undetected security defects.
- **BASIC Mode**: Enforces presence of unit tests and basic functionality. Delivers the highest balanced **Agentic Velocity ($46.91\text{ feat/hr}$)**.
- **STRICT Mode (Scientific Guardrails)**: Full security scanning (Bandit equivalent) for hardcoded secrets, SQL injection, and architectural compliance. Yields **$100\%$ Governance Pass Rate** with zero escaped defects.

---

## 📐 Scientific KPIs & Mathematical Formulations (Section 3.6)

1. **Agentic Velocity (AV)**:
   $$\text{AV (Features/Hour)} = \frac{\text{Completed Stories}}{\text{Total Duration (seconds)} / 3600}$$
2. **Self-Correction Ratio (SCR)**:
   $$\text{SCR} = \frac{\text{QA Rejections}}{\text{Total Submissions (Pass + Fail)}}$$
3. **Governance Overhead (GO)**:
   $$\text{GO} = \sum (\text{GOV\_Approval Timestamp} - \text{QA\_PASS Timestamp})$$

---

## 🚀 Getting Started

### 1. Backend Service (FastAPI & Agent Engine)
```bash
# Install Python dependencies
pip install -r backend/requirements.txt

# Run CLI Single Epic Execution (Conforming to Snippet 1.1)
python backend/main.py --mode single --epic "Create a user login page with email validation" --governance STRICT

# Run Automated Sprints (Replicating Table 4 Comparison)
python backend/main.py --mode automated_sprints

# Run FastAPI Server
python -m uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000
```

### 2. Run Verification Test Suite
```bash
python backend/tests/test_governance_suite.py
```

### 3. Frontend React Dashboard & Visualizer
```bash
cd frontend
npm install
npm run dev
```
Open **[http://localhost:5173/](http://localhost:5173/)** in your browser.

---

## 📊 Enterprise Benchmarks Included

Contains benchmark data comparing the Agentic Laboratory against engineering teams at:
- **TechwareSoft UAE** (Hatim Baloch PM, Umar Hayat Dev, Muhammad Mujtaba Khan QA)
- **Wärtsilä Finland** (Aaro Ahola)
- **10Pearls Pakistan** (Abdul Raziq Advani)
- **Abu Dhabi Ports Group UAE** (Haider Ali Zaidi)
- **Hollywood Technologies Bahrain** (Muhammad Usman)
