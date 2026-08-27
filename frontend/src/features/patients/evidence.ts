export function evidenceTargetId(evidenceId: string) {
  return "evidence-" + evidenceId.replace(/[^a-zA-Z0-9_-]/g, "-");
}

export function focusEvidence(evidenceId: string) {
  const directTarget = document.getElementById(evidenceTargetId(evidenceId));
  const groupedTarget = Array.from(
    document.querySelectorAll<HTMLElement>("[data-evidence-ids]"),
  ).find((element) => element.dataset.evidenceIds?.split(" ").includes(evidenceId));
  const target = directTarget ?? groupedTarget;
  if (!target) return false;

  target.scrollIntoView({ behavior: "smooth", block: "center" });
  target.classList.remove("evidence-highlight");
  window.requestAnimationFrame(() => target.classList.add("evidence-highlight"));
  window.setTimeout(() => target.classList.remove("evidence-highlight"), 2600);
  return true;
}
