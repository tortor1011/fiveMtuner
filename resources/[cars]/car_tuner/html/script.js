/**
 * car_tuner/html/script.js
 * ═══════════════════════════════════════════════════════════════════════════
 * Vehicle Handling Editor — NUI front-end.
 *
 * This single file:
 *  1. Defines every CHandlingData field with metadata (type, range, step).
 *  2. Dynamically generates the tabbed UI from those definitions.
 *  3. Bridges slider / input changes to Lua via NUI fetch.
 *  4. Exports all current values as a complete handling.meta XML snippet.
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    // ─────────────────────────────────────────────────────────────────────────
    //  FIELD DEFINITIONS
    //  Each tab maps to a category of handling attributes.
    //  Field types: float | int | vector | subfloat | text
    // ─────────────────────────────────────────────────────────────────────────

    const TABS = [
        {
            id: 'engine',
            label: 'Engine & Gearbox',
            fields: [
                { key: 'fDriveBiasFront',                 label: 'Drive Bias Front',       type: 'float', min: 0.0,  max: 1.0,   step: 0.01,  hint: '0.0 = RWD · 0.5 = AWD · 1.0 = FWD' },
                { key: 'nInitialDriveGears',              label: 'Drive Gears',            type: 'int',   min: 1,    max: 8,     step: 1      },
                { key: 'fInitialDriveForce',              label: 'Initial Drive Force',    type: 'float', min: 0.01, max: 2.0,   step: 0.01   },
                { key: 'fDriveInertia',                   label: 'Drive Inertia',          type: 'float', min: 0.01, max: 3.0,   step: 0.01   },
                { key: 'fClutchChangeRateScaleUpShift',   label: 'Clutch Upshift Rate',    type: 'float', min: 0.1,  max: 10.0,  step: 0.1    },
                { key: 'fClutchChangeRateScaleDownShift', label: 'Clutch Downshift Rate',  type: 'float', min: 0.1,  max: 10.0,  step: 0.1    },
                { key: 'fInitialDriveMaxFlatVel',         label: 'Max Flat Velocity',      type: 'float', min: 10.0, max: 500.0, step: 1.0,   hint: 'km/h (in-game speed cap)' }
            ]
        },
        {
            id: 'brakes',
            label: 'Brakes & Steering',
            fields: [
                { key: 'fBrakeForce',      label: 'Brake Force',      type: 'float', min: 0.01, max: 3.0,  step: 0.01 },
                { key: 'fBrakeBiasFront',  label: 'Brake Bias Front', type: 'float', min: 0.0,  max: 1.0,  step: 0.01, hint: '0.0 = rear-biased · 1.0 = front-biased' },
                { key: 'fHandBrakeForce',  label: 'Handbrake Force',  type: 'float', min: 0.01, max: 5.0,  step: 0.01 },
                { key: 'fSteeringLock',    label: 'Steering Lock',    type: 'float', min: 10.0, max: 80.0, step: 0.5,  hint: 'Maximum steering angle in degrees' }
            ]
        },
        {
            id: 'traction',
            label: 'Traction & Tires',
            fields: [
                { key: 'fTractionCurveMax',           label: 'Traction Curve Max',        type: 'float', min: 0.5, max: 4.0, step: 0.01 },
                { key: 'fTractionCurveMin',           label: 'Traction Curve Min',        type: 'float', min: 0.5, max: 4.0, step: 0.01 },
                { key: 'fTractionCurveLateral',       label: 'Traction Curve Lateral',    type: 'float', min: 10.0, max: 30.0, step: 0.1 },
                { key: 'fTractionSpringDeltaMax',     label: 'Traction Spring Delta Max', type: 'float', min: 0.01, max: 1.0, step: 0.01 },
                { key: 'fLowSpeedTractionLossMult',   label: 'Low Speed Traction Loss',   type: 'float', min: 0.0, max: 2.0, step: 0.01 },
                { key: 'fCamberStiffnesss',           label: 'Camber Stiffness',          type: 'float', min: -1.0, max: 1.0, step: 0.01, hint: 'Note: triple "s" matches Rockstar schema' },
                { key: 'fTractionBiasFront',          label: 'Traction Bias Front',       type: 'float', min: 0.0, max: 1.0, step: 0.01 },
                { key: 'fTractionLossMult',           label: 'Traction Loss Mult',        type: 'float', min: 0.0, max: 5.0, step: 0.01 }
            ]
        },
        {
            id: 'suspension',
            label: 'Suspension',
            fields: [
                { key: 'fSuspensionForce',        label: 'Suspension Force',          type: 'float', min: 0.1,  max: 5.0, step: 0.01 },
                { key: 'fSuspensionCompDamp',     label: 'Compression Damping',       type: 'float', min: 0.1,  max: 5.0, step: 0.01 },
                { key: 'fSuspensionReboundDamp',  label: 'Rebound Damping',           type: 'float', min: 0.1,  max: 5.0, step: 0.01 },
                { key: 'fSuspensionUpperLimit',   label: 'Upper Limit',               type: 'float', min: -0.5, max: 0.5, step: 0.01 },
                { key: 'fSuspensionLowerLimit',   label: 'Lower Limit',               type: 'float', min: -0.5, max: 0.1, step: 0.01 },
                { key: 'fSuspensionRaise',        label: 'Suspension Raise',          type: 'float', min: -0.2, max: 0.5, step: 0.01 },
                { key: 'fSuspensionBiasFront',    label: 'Suspension Bias Front',     type: 'float', min: 0.0,  max: 1.0, step: 0.01 },
                { type: 'divider', label: 'Roll Bars & Centre' },
                { key: 'fAntiRollBarForce',       label: 'Anti-Roll Bar Force',       type: 'float', min: 0.0,  max: 5.0, step: 0.01 },
                { key: 'fAntiRollBarBiasFront',   label: 'Anti-Roll Bar Bias Front',  type: 'float', min: 0.0,  max: 1.0, step: 0.01 },
                { key: 'fRollCentreHeightFront',  label: 'Roll Centre Height Front',  type: 'float', min: -0.5, max: 1.0, step: 0.01 },
                { key: 'fRollCentreHeightRear',   label: 'Roll Centre Height Rear',   type: 'float', min: -0.5, max: 1.0, step: 0.01 }
            ]
        },
        {
            id: 'mass',
            label: 'Mass & Aero',
            fields: [
                { key: 'fMass',              label: 'Mass (kg)',           type: 'float', min: 100,  max: 10000, step: 10  },
                { key: 'fInitialDragCoeff',  label: 'Initial Drag Coeff', type: 'float', min: 0.1,  max: 200.0, step: 0.1 },
                { key: 'fPercentSubmerged',  label: 'Percent Submerged',  type: 'float', min: 10,   max: 100,   step: 1   },
                { type: 'divider', label: 'Centre of Mass Offset' },
                { key: 'vecCentreOfMassOffset.x', field: 'vecCentreOfMassOffset', axis: 'x', label: 'Centre of Mass X', type: 'vector', min: -5.0, max: 5.0, step: 0.01 },
                { key: 'vecCentreOfMassOffset.y', field: 'vecCentreOfMassOffset', axis: 'y', label: 'Centre of Mass Y', type: 'vector', min: -5.0, max: 5.0, step: 0.01 },
                { key: 'vecCentreOfMassOffset.z', field: 'vecCentreOfMassOffset', axis: 'z', label: 'Centre of Mass Z', type: 'vector', min: -5.0, max: 5.0, step: 0.01 },
                { type: 'divider', label: 'Inertia Multiplier' },
                { key: 'vecInertiaMultiplier.x', field: 'vecInertiaMultiplier', axis: 'x', label: 'Inertia Multiplier X', type: 'vector', min: 0.0, max: 5.0, step: 0.01 },
                { key: 'vecInertiaMultiplier.y', field: 'vecInertiaMultiplier', axis: 'y', label: 'Inertia Multiplier Y', type: 'vector', min: 0.0, max: 5.0, step: 0.01 },
                { key: 'vecInertiaMultiplier.z', field: 'vecInertiaMultiplier', axis: 'z', label: 'Inertia Multiplier Z', type: 'vector', min: 0.0, max: 5.0, step: 0.01 }
            ]
        },
        {
            id: 'damage',
            label: 'Damage & Fuel',
            fields: [
                { key: 'fCollisionDamageMult',    label: 'Collision Damage Mult',    type: 'float', min: 0.0, max: 10.0,  step: 0.01 },
                { key: 'fWeaponDamageMult',       label: 'Weapon Damage Mult',       type: 'float', min: 0.0, max: 10.0,  step: 0.01 },
                { key: 'fDeformationDamageMult',  label: 'Deformation Damage Mult',  type: 'float', min: 0.0, max: 10.0,  step: 0.01 },
                { key: 'fEngineDamageMult',       label: 'Engine Damage Mult',       type: 'float', min: 0.0, max: 10.0,  step: 0.01 },
                { type: 'divider', label: 'Fluids' },
                { key: 'fPetrolTankVolume',       label: 'Petrol Tank Volume',       type: 'float', min: 0.0, max: 200.0, step: 1.0  },
                { key: 'fOilVolume',              label: 'Oil Volume',               type: 'float', min: 0.0, max: 20.0,  step: 0.1  },
                { type: 'divider', label: 'Seat Offsets' },
                { key: 'fSeatOffsetDistX',        label: 'Seat Offset X',            type: 'float', min: -1.0, max: 1.0, step: 0.01 },
                { key: 'fSeatOffsetDistY',        label: 'Seat Offset Y',            type: 'float', min: -1.0, max: 1.0, step: 0.01 },
                { key: 'fSeatOffsetDistZ',        label: 'Seat Offset Z',            type: 'float', min: -1.0, max: 1.0, step: 0.01 }
            ]
        },
        {
            id: 'advanced',
            label: 'Advanced',
            fields: [
                { key: 'handlingName',      label: 'Handling Name',        type: 'text', placeholder: 'e.g. ADDER',   defaultVal: '' },
                { key: 'AIHandling',        label: 'AI Handling',          type: 'text', placeholder: 'e.g. AVERAGE', defaultVal: 'AVERAGE' },
                { key: 'nMonetaryValue',    label: 'Monetary Value',       type: 'int',  min: 0, max: 10000000, step: 100 },
                { type: 'divider', label: 'Flags (hex strings — XML export only)' },
                { key: 'strModelFlags',     label: 'Model Flags (hex)',    type: 'text', placeholder: '440010',   defaultVal: '0' },
                { key: 'strHandlingFlags',  label: 'Handling Flags (hex)', type: 'text', placeholder: '20002',    defaultVal: '0' },
                { key: 'strDamageFlags',    label: 'Damage Flags (hex)',   type: 'text', placeholder: '0',        defaultVal: '0' },
                { type: 'divider', label: 'SubHandlingData — CCarHandlingData' },
                { key: 'fBackEndPopUpCarImpulseMult',      label: 'Popup Car Impulse Mult',      type: 'subfloat', min: 0.0, max: 2.0, step: 0.001 },
                { key: 'fBackEndPopUpBuildingImpulseMult', label: 'Popup Building Impulse Mult', type: 'subfloat', min: 0.0, max: 2.0, step: 0.001 },
                { key: 'fBackEndPopUpMaxDeltaSpeed',       label: 'Popup Max Delta Speed',       type: 'subfloat', min: 0.0, max: 2.0, step: 0.001 }
            ]
        }
    ];

    // ── XML Export Order ─────────────────────────────────────────────────────
    // Defines the exact Rockstar ordering and output format for each field.
    //  xmlType: 'value'    → <field value="..." />
    //           'intvalue' → <field value="..." />  (integer, no decimals)
    //           'vector'   → <field x="..." y="..." z="..." />
    //           'text'     → <field>...</field>

    const XML_ORDER = [
        { key: 'handlingName',                     xmlType: 'text'     },
        { key: 'fMass',                            xmlType: 'value'    },
        { key: 'fInitialDragCoeff',                xmlType: 'value'    },
        { key: 'fPercentSubmerged',                xmlType: 'value'    },
        { key: 'vecCentreOfMassOffset',            xmlType: 'vector'   },
        { key: 'vecInertiaMultiplier',             xmlType: 'vector'   },
        { key: 'fDriveBiasFront',                  xmlType: 'value'    },
        { key: 'nInitialDriveGears',               xmlType: 'intvalue' },
        { key: 'fInitialDriveForce',               xmlType: 'value'    },
        { key: 'fDriveInertia',                    xmlType: 'value'    },
        { key: 'fClutchChangeRateScaleUpShift',    xmlType: 'value'    },
        { key: 'fClutchChangeRateScaleDownShift',  xmlType: 'value'    },
        { key: 'fInitialDriveMaxFlatVel',          xmlType: 'value'    },
        { key: 'fBrakeForce',                      xmlType: 'value'    },
        { key: 'fBrakeBiasFront',                  xmlType: 'value'    },
        { key: 'fHandBrakeForce',                  xmlType: 'value'    },
        { key: 'fSteeringLock',                    xmlType: 'value'    },
        { key: 'fTractionCurveMax',                xmlType: 'value'    },
        { key: 'fTractionCurveMin',                xmlType: 'value'    },
        { key: 'fTractionCurveLateral',            xmlType: 'value'    },
        { key: 'fTractionSpringDeltaMax',          xmlType: 'value'    },
        { key: 'fLowSpeedTractionLossMult',        xmlType: 'value'    },
        { key: 'fCamberStiffnesss',                xmlType: 'value'    },
        { key: 'fTractionBiasFront',               xmlType: 'value'    },
        { key: 'fTractionLossMult',                xmlType: 'value'    },
        { key: 'fSuspensionForce',                 xmlType: 'value'    },
        { key: 'fSuspensionCompDamp',              xmlType: 'value'    },
        { key: 'fSuspensionReboundDamp',           xmlType: 'value'    },
        { key: 'fSuspensionUpperLimit',            xmlType: 'value'    },
        { key: 'fSuspensionLowerLimit',            xmlType: 'value'    },
        { key: 'fSuspensionRaise',                 xmlType: 'value'    },
        { key: 'fSuspensionBiasFront',             xmlType: 'value'    },
        { key: 'fAntiRollBarForce',                xmlType: 'value'    },
        { key: 'fAntiRollBarBiasFront',            xmlType: 'value'    },
        { key: 'fRollCentreHeightFront',           xmlType: 'value'    },
        { key: 'fRollCentreHeightRear',            xmlType: 'value'    },
        { key: 'fCollisionDamageMult',             xmlType: 'value'    },
        { key: 'fWeaponDamageMult',                xmlType: 'value'    },
        { key: 'fDeformationDamageMult',           xmlType: 'value'    },
        { key: 'fEngineDamageMult',                xmlType: 'value'    },
        { key: 'fPetrolTankVolume',                xmlType: 'value'    },
        { key: 'fOilVolume',                       xmlType: 'value'    },
        { key: 'fSeatOffsetDistX',                 xmlType: 'value'    },
        { key: 'fSeatOffsetDistY',                 xmlType: 'value'    },
        { key: 'fSeatOffsetDistZ',                 xmlType: 'value'    },
        { key: 'nMonetaryValue',                   xmlType: 'intvalue' },
        { key: 'strModelFlags',                    xmlType: 'text'     },
        { key: 'strHandlingFlags',                 xmlType: 'text'     },
        { key: 'strDamageFlags',                   xmlType: 'text'     },
        { key: 'AIHandling',                       xmlType: 'text'     }
    ];

    const SUB_HANDLING_XML = [
        { key: 'fBackEndPopUpCarImpulseMult',      xmlType: 'value' },
        { key: 'fBackEndPopUpBuildingImpulseMult', xmlType: 'value' },
        { key: 'fBackEndPopUpMaxDeltaSpeed',       xmlType: 'value' }
    ];

    // ─────────────────────────────────────────────────────────────────────────
    //  STATE
    // ─────────────────────────────────────────────────────────────────────────

    const state = {};   // key → current value (number or string)

    // ─────────────────────────────────────────────────────────────────────────
    //  DOM REFERENCES
    // ─────────────────────────────────────────────────────────────────────────

    const container  = document.getElementById('tuner-container');
    const tabNav     = document.getElementById('tab-nav');
    const tabContent = document.getElementById('tab-content');
    const btnCopy    = document.getElementById('btn-copy-xml');
    const btnCopyLbl = document.getElementById('btn-copy-label');
    const btnClose   = document.getElementById('btn-close');
    const toastEl    = document.getElementById('toast');

    // ─────────────────────────────────────────────────────────────────────────
    //  HELPERS
    // ─────────────────────────────────────────────────────────────────────────

    function nuiUrl(endpoint) {
        const res = typeof GetParentResourceName === 'function' ? GetParentResourceName() : 'car_tuner';
        return `https://${res}/${endpoint}`;
    }

    function nuiPost(endpoint, body) {
        fetch(nuiUrl(endpoint), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json; charset=UTF-8' },
            body: JSON.stringify(body)
        }).catch(() => {});
    }

    /** Number of decimal places implied by a step value. */
    function decimalsFromStep(step) {
        const s = String(step);
        const dot = s.indexOf('.');
        return dot === -1 ? 0 : s.length - dot - 1;
    }

    /** Round a value to the precision implied by step. */
    function roundToStep(value, step) {
        const d = decimalsFromStep(step);
        return parseFloat(Number(value).toFixed(d));
    }

    let toastTimer = null;

    function showToast(msg) {
        toastEl.textContent = msg;
        toastEl.classList.add('visible');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toastEl.classList.remove('visible'), 2400);
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  UI GENERATION
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Generates the inner HTML for a single field card.
     * @param {object} f  Field definition from TABS.
     * @returns {string}  HTML string.
     */
    function fieldCardHtml(f) {
        if (f.type === 'divider') {
            return `<div class="section-divider"><span>${f.label}</span></div>`;
        }

        const tag = f.field ? `${f.field}.${f.axis}` : f.key;
        const dataAttrs = [
            `data-key="${f.key}"`,
            `data-type="${f.type}"`,
            f.field ? `data-field="${f.field}"` : '',
            f.axis  ? `data-axis="${f.axis}"`   : ''
        ].filter(Boolean).join(' ');

        if (f.type === 'text') {
            return `
                <div class="field-card" ${dataAttrs}>
                    <div class="field-header">
                        <span class="field-label">${f.label}</span>
                        <code class="field-tag">${f.key}</code>
                    </div>
                    <div class="field-control field-control--text">
                        <input type="text" class="field-text"
                               value="${f.defaultVal || ''}"
                               placeholder="${f.placeholder || ''}" />
                    </div>
                </div>`;
        }

        // float / int / vector / subfloat — slider + number input
        const mid = roundToStep((f.min + f.max) / 2, f.step);
        return `
            <div class="field-card" ${dataAttrs}>
                <div class="field-header">
                    <span class="field-label">${f.label}</span>
                    <code class="field-tag">${tag}</code>
                </div>
                <div class="field-control">
                    <input type="range" class="field-slider"
                           min="${f.min}" max="${f.max}" step="${f.step}" value="${mid}" />
                    <input type="number" class="field-number"
                           min="${f.min}" max="${f.max}" step="${f.step}" value="${mid}" />
                </div>
                ${f.hint ? `<div class="field-hint">${f.hint}</div>` : ''}
            </div>`;
    }

    /** Builds the entire tabbed interface. */
    function buildUI() {
        // Tab buttons
        tabNav.innerHTML = TABS.map((tab, i) =>
            `<button class="tab-btn${i === 0 ? ' active' : ''}" data-tab="${tab.id}">${tab.label}</button>`
        ).join('');

        // Tab panes
        tabContent.innerHTML = TABS.map((tab, i) =>
            `<div class="tab-pane${i === 0 ? ' active' : ''}" data-tab="${tab.id}">
                ${tab.fields.map(f => fieldCardHtml(f)).join('')}
             </div>`
        ).join('');

        // Wire tab clicks
        tabNav.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => switchTab(btn.dataset.tab));
        });

        // Wire field interactions
        tabContent.querySelectorAll('.field-card').forEach(card => {
            const key    = card.dataset.key;
            const type   = card.dataset.type;
            const slider = card.querySelector('.field-slider');
            const num    = card.querySelector('.field-number');
            const text   = card.querySelector('.field-text');

            // Initialise state from the default DOM value
            if (slider && num) {
                state[key] = parseFloat(slider.value);

                slider.addEventListener('input', () => {
                    num.value = slider.value;
                    state[key] = parseFloat(slider.value);
                    sendUpdate(card);
                });

                num.addEventListener('input', () => {
                    slider.value = num.value;
                    state[key] = parseFloat(num.value);
                    sendUpdate(card);
                });
            }

            if (text) {
                state[key] = text.value;
                text.addEventListener('input', () => {
                    state[key] = text.value;
                    // Text fields have no native setter — stored for XML export only.
                });
            }
        });

        // Horizontal mouse wheel scrolling for tab bar
        tabNav.addEventListener('wheel', (e) => {
            if (e.deltaY !== 0) {
                e.preventDefault();
                tabNav.scrollLeft += e.deltaY;
            }
        }, { passive: false });
    }

    function switchTab(tabId) {
        tabNav.querySelectorAll('.tab-btn').forEach(b => {
            const isActive = b.dataset.tab === tabId;
            b.classList.toggle('active', isActive);
            if (isActive) {
                b.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
            }
        });
        tabContent.querySelectorAll('.tab-pane').forEach(p =>
            p.classList.toggle('active', p.dataset.tab === tabId));
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  NUI COMMUNICATION
    // ─────────────────────────────────────────────────────────────────────────

    /** Posts a handling update to Lua for the given field card. */
    function sendUpdate(card) {
        const type = card.dataset.type;
        if (type === 'text') return;        // no runtime native

        const payload = { type: type, value: state[card.dataset.key] };

        if (type === 'vector') {
            payload.field = card.dataset.field;
            payload.axis  = card.dataset.axis;
        } else {
            payload.field = card.dataset.key;
        }

        nuiPost('updateHandling', payload);
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  MESSAGE HANDLER  (Lua → NUI)
    // ─────────────────────────────────────────────────────────────────────────

    window.addEventListener('message', (event) => {
        const data = event.data;
        if (data.action !== 'openUI') return;

        container.classList.remove('hidden');

        const vals = data.values || {};

        tabContent.querySelectorAll('.field-card').forEach(card => {
            const key    = card.dataset.key;
            const type   = card.dataset.type;
            const slider = card.querySelector('.field-slider');
            const num    = card.querySelector('.field-number');
            const text   = card.querySelector('.field-text');

            if (vals[key] !== undefined) {
                if (slider && num) {
                    const step = parseFloat(slider.step);
                    const v    = roundToStep(vals[key], step);
                    slider.value = v;
                    num.value    = v;
                    state[key]   = v;
                }
                if (text) {
                    text.value = String(vals[key]);
                    state[key] = String(vals[key]);
                }
            }
        });

        // Ensure first tab is shown on reopen
        switchTab(TABS[0].id);
    });

    // ─────────────────────────────────────────────────────────────────────────
    //  CLOSE
    // ─────────────────────────────────────────────────────────────────────────

    function closePanel() {
        container.classList.add('hidden');
        nuiPost('closeUI', {});
    }

    btnClose.addEventListener('click', closePanel);
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closePanel();
    });

    // ─────────────────────────────────────────────────────────────────────────
    //  XML EXPORT
    // ─────────────────────────────────────────────────────────────────────────

    function fmtFloat(v) {
        return Number(v || 0).toFixed(6);
    }

    function fmtInt(v) {
        return String(Math.round(Number(v || 0)));
    }

    /**
     * Builds a complete handling.meta XML snippet from current state.
     * @returns {string}
     */
    function buildCompleteXml() {
        const I  = '      ';   // 6-space indent for field lines
        const lines = [];

        lines.push('<?xml version="1.0" encoding="UTF-8"?>');
        lines.push('<CHandlingDataMgr>');
        lines.push('  <HandlingData>');
        lines.push('    <Item type="CHandlingData">');

        for (const entry of XML_ORDER) {
            const k = entry.key;

            switch (entry.xmlType) {
                case 'value':
                    lines.push(`${I}<${k} value="${fmtFloat(state[k])}" />`);
                    break;

                case 'intvalue':
                    lines.push(`${I}<${k} value="${fmtInt(state[k])}" />`);
                    break;

                case 'vector': {
                    const x = fmtFloat(state[k + '.x']);
                    const y = fmtFloat(state[k + '.y']);
                    const z = fmtFloat(state[k + '.z']);
                    lines.push(`${I}<${k} x="${x}" y="${y}" z="${z}" />`);
                    break;
                }

                case 'text':
                    lines.push(`${I}<${k}>${state[k] || ''}</${k}>`);
                    break;
            }
        }

        // SubHandlingData
        lines.push(`${I}<SubHandlingData>`);
        lines.push(`${I}  <Item type="CCarHandlingData">`);
        for (const entry of SUB_HANDLING_XML) {
            lines.push(`${I}    <${entry.key} value="${fmtFloat(state[entry.key])}" />`);
        }
        lines.push(`${I}  </Item>`);
        lines.push(`${I}</SubHandlingData>`);

        lines.push('    </Item>');
        lines.push('  </HandlingData>');
        lines.push('</CHandlingDataMgr>');

        return lines.join('\n');
    }

    btnCopy.addEventListener('click', () => {
        const xml = buildCompleteXml();

        navigator.clipboard.writeText(xml).then(() => {
            btnCopy.classList.add('copied');
            btnCopyLbl.textContent = 'Copied!';
            showToast('Copied handling XML to clipboard!');

            setTimeout(() => {
                btnCopy.classList.remove('copied');
                btnCopyLbl.textContent = 'Copy Complete XML';
            }, 2000);
        }).catch(() => {
            console.log('[CarTuner] XML output:\n' + xml);
            showToast('Copied to console (clipboard blocked)');
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    //  INIT
    // ─────────────────────────────────────────────────────────────────────────

    buildUI();

    // Auto-display in standalone browser preview (outside FiveM CEF environment)
    if (typeof GetParentResourceName !== 'function') {
        container.classList.remove('hidden');
    }

})();
