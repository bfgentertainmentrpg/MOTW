<%*
let rows = [];

while (true) {
	const gearName = await tp.system.prompt("Gear Name (blank to finish):", "");
	if (!gearName) break;

	const gearType = await tp.system.suggester(
		["Armor", "Weapon"],
		["Armor", "Weapon"],
		false,
		"Armor or Weapon?"
	);

	const damageValue = await tp.system.prompt("Damage Value:", "");
	const damageLabel = gearType === "Armor" ? "Protection" : "Harm";
	const damageCell = `${damageValue} ${damageLabel}`;

	let features = [];
	while (true) {
		const feature = await tp.system.prompt("Feature (blank to finish this item):", "");
		if (!feature) break;
		features.push(feature);
	}
	const featuresCell = features.join("     ");

	rows.push(`<tr>\n<td>${gearName}</td>\n<td>${damageCell}</td>\n<td>${featuresCell}</td>\n</tr>`);
}

tR += `

<table class="gear-table">
<thead>
<tr>
<th>Name</th>
<th>Damage</th>
<th>Features</th>
</tr>
</thead>
<tbody>
${rows.join("\n")}
</tbody>
</table>
`;
-%>
