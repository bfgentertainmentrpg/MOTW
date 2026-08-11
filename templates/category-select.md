<%*
/* One-time category picker — shows human-readable labels, writes the
   matching mv-x cssclasses value into the note's EXISTING frontmatter
   (creating it if the note has none), same processFrontMatter merge
   technique as templates/harm.md. Leaves nothing visible in the note
   afterward, unlike a Meta Bind field, which would stay on the page
   as a permanent live widget. Re-run this template any time to change
   a note's category later.

   Threat and NPC are generic, top-level-folder options — use them for
   a note filed directly in "03 - Threats" / "04 - NPCs" rather than
   Monster/Minion/Villain/Phenomena or Recurring/One Time specifically. */
const labels = [
    "Mystery",
    "Hunter",
    "Threat",
    "Monster",
    "Minion",
    "Villain",
    "Phenomena",
    "NPC",
    "Recurring NPC",
    "One Time NPC",
    "Location",
    "Reference",
    "Asset"
];

const values = [
    "mv-mystery",
    "mv-hunter",
    "mv-threat",
    "mv-monster",
    "mv-minion",
    "mv-villain",
    "mv-phenomena",
    "mv-npc",
    "mv-recurring",
    "mv-one-time",
    "mv-location",
    "mv-reference",
    "mv-asset"
];

const choice = await tp.system.suggester(labels, values, false, "Category:");

if (choice) {
    const file = app.workspace.getActiveFile();
    await app.fileManager.processFrontMatter(file, (fm) => {
        fm.cssclasses = choice;
    });
}
-%>
