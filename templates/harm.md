<br>
<div class="harm-title">
Harm
</div>
<br>

```yaml
harm: 20
harm_max: 20
```

```meta-bind-js-view
{harm} as harm
{harm_max} as harm_max
---
const mb = engine.getPlugin("obsidian-meta-bind-plugin").api;

const value = Number(context.bound.harm) || 0;
const maximum = Number(context.bound.harm_max) || 0;

const percentage = maximum > 0
    ? Math.min((value / maximum) * 100, 100)
    : 0;

/* =========================================
   DETERMINE HARM STATUS
   ========================================= */

let status;

if (value >= maximum * 0.80) {
    status = "high";
} else if (
    value > 4 &&
    value > maximum * 0.45
) {
    status = "medium";
} else {
    status = "low";
}

/* =========================================
   MAIN TRACKER ROW
   ========================================= */

const row = document.createElement("div");

row.className = "harm-tracker-row";

/* =========================================
   HEAL BUTTON
   ========================================= */

const healContainer = document.createElement("div");

healContainer.className = "harm-tracker-button";

row.appendChild(healContainer);

const healButton = mb.createButtonMountable(
    context.file.path,
    {
        declaration: {
            label: "Heal",
            style: "default",
            class: "harm-heal-button",
            action: {
                type: "inlineJS",
                code: `
                    const mb =
                        engine.getPlugin("obsidian-meta-bind-plugin").api;

                    const target =
                        mb.parseBindTarget("harm", context.file.path);

                    mb.updateMetadata(
                        target,
                        value => Math.max(Number(value) - 1, 0)
                    );
                `
            }
        },
        isPreview: false
    }
);

healButton.mount(healContainer);

component.register(() => healButton.unmount());

/* =========================================
   METER COLUMN
   ========================================= */

const meterColumn = document.createElement("div");

meterColumn.className = "harm-meter-column";

row.appendChild(meterColumn);

/* =========================================
   METER
   ========================================= */

const meter = document.createElement("div");

meter.className = `harm-meter harm-meter-${status}`;

meterColumn.appendChild(meter);

/* =========================================
   CURRENT HARM FILL
   ========================================= */

const fill = document.createElement("div");

fill.className = `harm-meter-fill harm-fill-${status}`;

fill.style.width = `${percentage}%`;

meter.appendChild(fill);

/* =========================================
   LEFT LABEL
   ========================================= */

/* Always 0 */

const minimum = document.createElement("span");

minimum.className = "harm-meter-min";

minimum.textContent = "0";

meter.appendChild(minimum);

/* =========================================
   CURRENT HARM LABEL
   ========================================= */

const currentLabel = document.createElement("span");

currentLabel.className = "harm-current-label";

currentLabel.textContent = `CURRENT HARM: ${value}`;

meter.appendChild(currentLabel);

/* =========================================
   RIGHT LABEL
   ========================================= */

/* Always harm_max */

const maximumLabel = document.createElement("span");

maximumLabel.className = "harm-meter-max";

maximumLabel.textContent = String(maximum);

meter.appendChild(maximumLabel);

/* =========================================
   HARM BUTTON
   ========================================= */

const harmContainer = document.createElement("div");

harmContainer.className = "harm-tracker-button";

row.appendChild(harmContainer);

const harmButton = mb.createButtonMountable(
    context.file.path,
    {
        declaration: {
            label: "Harm",
            style: "default",
            class: "harm-harm-button",
            action: {
                type: "inlineJS",
                code: `
                    const mb =
                        engine.getPlugin("obsidian-meta-bind-plugin").api;

                    const harmTarget =
                        mb.parseBindTarget("harm", context.file.path);

                    const maxTarget =
                        mb.parseBindTarget("harm_max", context.file.path);

                    const current =
                        Number(mb.getMetadata(harmTarget)) || 0;

                    const maximum =
                        Number(mb.getMetadata(maxTarget)) || 0;

                    mb.updateMetadata(
                        harmTarget,
                        () => Math.min(current + 1, maximum)
                    );
                `
            }
        },
        isPreview: false
    }
);

harmButton.mount(harmContainer);

component.register(() => harmButton.unmount());

/* =========================================
   RETURN COMPLETE TRACKER
   ========================================= */

return row;
```
