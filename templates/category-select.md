<%*
/* One-time category picker — shows human-readable labels, writes the
   matching mv-x cssclasses value into the note's EXISTING frontmatter
   (creating it if the note has none), same processFrontMatter merge
   technique as templates/harm.md. Leaves nothing visible in the note
   afterward, unlike a Meta Bind field, which would stay on the page
   as a permanent live widget. Re-run this template any time to change
   a note's category later.

   Simplified to just the 7 top-level-folder categories — Monster,
   Minion, Villain, Phenomena, Recurring NPC, and One Time NPC were
   eliminated; use Threat / NPC for any note that used to be one of
   those sub-types. */
const labels = [
    "Mystery",
    "Hunter",
    "Threat",
    "NPC",
    "Location",
    "Reference",
    "Asset"
];

const values = [
    "mv-mystery",
    "mv-hunter",
    "mv-threat",
    "mv-npc",
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
