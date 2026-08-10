<%*
const moveName = await tp.system.prompt("Move Name:", "");
const moveDescription = await tp.system.prompt(
	"Move Description:",
	""
);
const high = await tp.system.prompt(
	"10 or Higher:",
	""
);
const mid = await tp.system.prompt(
	"7 to 9:",
	""
);
const low = await tp.system.prompt(
	"6 or Lower:",
	""
);

tR += `

- [ ] <span class="move-heading">${moveName}</span>

<span class="move-note">
${moveDescription}
</span>

<table class="move-table">
<thead>
<tr>
<th>Roll</th>
<th>Results</th>
</tr>
</thead>
<tbody>
<tr>
<th>10 or Higher</th>
<td>${high}</td>
</tr>
<tr>
<th>7 to 9</th>
<td>${mid}</td>
</tr>
<tr>
<th>6 or Lower</th>
<td>${low}</td>
</tr>
</tbody>
</table>
`;
-%>
