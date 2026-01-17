POLYVOX CONTEXT KERNEL (v1)

Polyvox is a civic engagement and governance platform designed to surface, structure, and aggregate citizen ideas and issues from the city level upward (city -> county -> state -> national).

CORE PRINCIPLES
1) Bottom-up governance: Ideas originate locally and propagate upward.
2) Issue convergence: Similar issues across jurisdictions indicate systemic problems.
3) Neutral infrastructure: Polyvox does not advocate positions; it structures input.
4) Write-in viability: The system supports alternative political pathways.

SYSTEM ARCHITECTURE
- Frontend: React / TypeScript (Next.js App Router)
- Backend: Supabase (Postgres + Auth + RLS)
- Core entities:
  - Jurisdiction (city, county, state, federal)
  - Issue (canonical issue + local instances)
  - Proposal (actionable idea tied to an issue)
  - Signal (support, concern, evidence)
  - Office (elected position)
  - Candidate (including write-in)

NON-NEGOTIABLES
- Jurisdiction hierarchy must be preserved.
- Data models must support cross-city aggregation.
- No hardcoded party logic.
- All logic must work at scale (top 200 counties).

CURRENT STATE
- Early schema design.
- Election law varies by state.
- Write-in rules are being modeled.

WHEN RESPONDING
- Assume this context is true.
- Ask before changing core assumptions.
- Optimize for clarity and longevity over cleverness.
