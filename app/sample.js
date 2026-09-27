// Example campaign shown the first time the keeper opens, so every template
// has something in it. Delete it from the dashboard once you start your own.

function sampleCampaign() {
  const now = Date.now();
  const e = (id, type, name, fields, extra = {}) => ({
    id, type, name, fields, tags: [], notes: "", created: now, updated: now, ...extra,
  });
  const cd = (steps, reached = -1) => ({ steps, reached });

  return {
    id: "example-campaign",
    name: "Example: Whispers in the Pines",
    created: now,
    entries: [
      e("ex-mystery", "mystery", "Whispers in the Pines", {
        status: "Active",
        concept: "Hikers in Hollow Creek State Forest are vanishing after hearing a loved one call their name from the trees. It's [[The Hollow Man]], feeding on grief.",
        hook: "A hunter's cousin, [[Dana Reyes]], phones in a panic: her husband walked into the woods last night answering her voice. She was asleep beside him.",
        threats: ["ex-monster", "ex-minion", "ex-phenomenon", "ex-villain", "ex-location", "ex-bystander"],
        countdown: cd([
          "A hiker vanishes near the ranger station.",
          "Search dogs refuse to enter the pines.",
          "[[Dana Reyes]] starts hearing her husband's voice.",
          "The Hush spreads to the edge of town.",
          "The Hollow Man takes a child from the campground.",
          "The Hollow Man walks out of the forest wearing a victim's face.",
        ], 1),
        clues: "• Every victim lost someone in the past year.\n• Pine needles found inside locked cars.\n• Ranger Holt's logbook is missing pages from 1987.",
        customMoves: "**Answer the Call:** when a hunter hears a lost loved one in the trees, roll +Cool. On a 10+ you resist. On 7–9 you take a step toward the voice before you stop yourself. On a miss, you follow it.",
      }, { tags: ["arc1", "woods"] }),

      e("ex-monster", "monster", "The Hollow Man", {
        image: "",
        type: "Tempter",
        motivation: "to tempt people into evil deeds",
        powers: "• Mimics the voice of anyone its victim has lost.\n• Can step between any two pine trees in the forest.\n• Victims it holds grow hollow and silent.",
        attacks: [
          { name: "Root grasp", harm: "2-harm", tags: "close, restrain" },
          { name: "Hollowing touch", harm: "3-harm", tags: "intimate, ignore-armour" },
        ],
        armour: 1,
        harm: { max: 8, taken: 0 },
        weakness: "Fire from a hearth that has held a funeral wake. Speaking its true name (carved under [[The Old Ranger Station]]) stops it moving for one round.",
        customMoves: "",
      }, { tags: ["arc1", "woods"] }),

      e("ex-minion", "minion", "The Hollowed", {
        image: "",
        type: "Plague",
        motivation: "to swarm and destroy",
        master: ["ex-monster"],
        attacks: [{ name: "Grasping hands", harm: "1-harm", tags: "close, group" }],
        armour: 0,
        harm: { max: 5, taken: 0 },
        customMoves: "They move only when no one is looking directly at them.",
      }, { tags: ["woods"] }),

      e("ex-phenomenon", "phenomenon", "The Hush", {
        image: "",
        type: "Rift",
        motivation: "to spit things out",
        effects: "Sound dies within a ring of pines. Radios and phones fail. Anyone inside hears only the voices of the dead.",
        howToStop: "Burn the heart-pine at its centre, or let the Hollow Man be destroyed.",
        customMoves: "",
      }, { tags: ["woods"] }),

      e("ex-villain", "villain", "Warden Ada Pike", {
        image: "",
        type: "Cult leader",
        motivation: "to bring her drowned daughter back",
        agenda: "Feed the Hollow Man enough grief that it returns one of the lost. She believes it will be her daughter.",
        resources: "Park service keys and records, a handful of grieving followers, the town's trust.",
        allies: ["ex-monster", "ex-minion"],
        powers: "Knows every trail. Carries a charm that keeps the Hollowed away from her.",
        attacks: [{ name: "Hunting rifle", harm: "3-harm", tags: "far, loud, reload" }],
        armour: 1,
        harm: { max: 7, taken: 0 },
        weakness: "Her daughter's music box. She won't let it be harmed.",
        countdown: cd(["Pike steers searchers away from the pines.", "", "", "", "", "Pike offers a hunter to the Hollow Man."]),
      }, { tags: ["arc1"] }),

      e("ex-location", "location", "The Old Ranger Station", {
        image: "",
        type: "Hub",
        motivation: "to reveal information",
        description: "Abandoned since 1987. Collapsed porch, a wood stove, a trapdoor under the rug.",
        features: "• The Hollow Man's true name is carved under the trapdoor.\n• Ranger Holt's last log entry: 'It sounded like Mom.'",
        inhabitants: ["ex-minion"],
      }, { tags: ["woods"] }),

      e("ex-bystander", "bystander", "Dana Reyes", {
        image: "",
        type: "Victim",
        motivation: "to put themselves in danger",
        description: "Night-shift nurse, stubborn, holding it together by a thread since her husband Marco went missing.",
        knows: "Marco found an old logbook at [[The Old Ranger Station]] a week before he vanished.",
        harm: { max: 7, taken: 0 },
      }),

      e("ex-session", "session", "Session 1: The Voice in the Trees", {
        date: new Date(now).toISOString().slice(0, 10),
        mystery: ["ex-mystery"],
        recap: "The hunters met [[Dana Reyes]] at the hospital, then searched the trailhead. They found Marco's car full of pine needles and heard a voice calling from [[The Hush]]. They retreated to [[The Old Ranger Station]] for the night.",
        gmNotes: "Warden Pike showed up too quickly. The Snoop is suspicious. Pay that off next session.",
      }),
    ],
  };
}
