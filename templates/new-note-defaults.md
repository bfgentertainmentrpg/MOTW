<%*
/* Base frontmatter for every new note: page_type, cssclasses, harm,
   harm_max. Point this at Templater's Folder Templates (with
   "Trigger Templater on new file creation" enabled) so it runs
   automatically on note creation — see the vault setup notes for how.

   page_type is the friendly label ("Monster"); cssclasses is the
   technical mv-x value that actually drives the color theming in
   theme/motw-theme.css. Same picker as templates/category-select.md —
   re-run that template later if you need to change a note's category
   after creation, since this one only runs once, at creation.

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

const choice = await tp.system.suggester(labels, values, false, "Page Type:");
const label = choice ? labels[values.indexOf(choice)] : "";

const file = app.workspace.getActiveFile();
await app.fileManager.processFrontMatter(file, (fm) => {
    fm.page_type = label;
    fm.cssclasses = choice;
    fm.harm = 0;
    fm.harm_max = 7;
});
-%>
