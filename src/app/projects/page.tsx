/**
 * /projects — the real projects list + upload flow.
 *
 * Was ComposeProjectsListContainer (the Compose/v2-frontend hand-off, PR2 of the
 * May 2026 migration) — replaced per direct product decision: the actual
 * projects/upload UI the team wants live at the demo-staging route
 * (/demo/<token>, now removed) rather than in Compose. Promoted here as
 * ProjectsWorkspace; see its own doc comment for what was intentionally left
 * out (chat/processing screens — the Ares/Theia hand-off isn't wired up yet).
 */

import ProjectsWorkspace from "./ProjectsWorkspace";

export const dynamic = "force-dynamic";

export default function ProjectsPage() {
	return <ProjectsWorkspace />;
}
