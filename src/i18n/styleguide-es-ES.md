# Fibro — Translation Style Guide (Spanish, Spain)

Reference for translators working on `es-ES.json`. Read this before translating anything.

---

## Fixed English terms — never translate

| Term | Usage in copy |
|---|---|
| **Fibro** | The app name. Always capitalised, no article ("abre Fibro", never "abre la Fibro") |
| **Fibro Score** | Branded score. Keep exactly as written. |
| **Premium** | Subscription tier. Keep as-is. |
| **HRV** | Abbreviation kept. Spell out on first use: "HRV (variabilidad de la frecuencia cardíaca)" |
| **FIQ / FIQ-R** | Clinical instrument name. Keep in English. |

---

## Tone & voice

- Warm and direct — like a knowledgeable friend who also has fibromyalgia
- Never clinical, never alarming
- Be honest: if data looks bad, say so plainly. Don't dress everything up as encouragement
- Use real numbers when describing patterns: "tu dolor promedio fue 7/10", never "tu dolor ha estado alto"
- Never open with a diagnosis-sounding phrase ("parece que tienes…", "podrías estar…")
- Short sentences. No filler words. No exclamation marks on neutral UI copy.

---

## Form of address

- **Singular: tú** — always informal, never usted
- **Imperative: tú form** — "Registra", "Guarda", "Toca", "Pulsa"
- **Plural: avoid** — rephrase to singular wherever possible. If unavoidable, use "las personas con fibromialgia" rather than vosotros/ustedes. Digital apps in Spain avoid vosotros even though it exists — it reads as too formal or corporate.
- **Gendered agreement**: use "descansado/a", "cansado/a" for user-facing self-descriptions. Where a construction forces a choice and the user's biological sex is not known, default to feminine (fibromyalgia affects women disproportionately and the majority of users are likely female).

---

## Punctuation & formatting

- Inverted marks: **¿…?** and **¡…!** — always open and close
- Decimal separator: **coma** — "7,2/10", "5,1 horas"
- Thousands separator: **punto** — "1.000 pasos"
- Date format: DD/MM/AAAA — but most app dates use relative labels (Hoy, Ayer, Lunes) so this rarely comes up
- Ellipsis: use … (single character), not three separate dots
- Em dash: — (not a hyphen). Use sparingly.

---

## Glossary

### Clinical & health terms

| English | es-ES | Notes |
|---|---|---|
| Fibromyalgia | fibromialgia | Lowercase unless starting a sentence |
| Flare / flare-up | **brote** | The established patient-community term in Spain. Never "llamarada" (literal, unused). Never "crisis". |
| Active flare | brote activo | |
| Flare trigger | desencadenante | "Detonante" is understood but "desencadenante" is more clinical and consistent |
| Flare history | historial de brotes | |
| Log a flare | registrar un brote | |
| Brain fog | **niebla mental** | Well established in Spanish patient communities. Never "niebla cerebral". Don't leave it in English. |
| Fatigue | **fatiga** | Use "fatiga", not "cansancio". "Cansancio" implies ordinary tiredness; fatigue in fibromyalgia is a clinical symptom. |
| Morning stiffness | **rigidez matutina** | Standard clinical term. Fine to shorten to "rigidez" in UI labels. |
| Unrefreshed sleep | **sueño no reparador** | Standard clinical term. Never "mal sueño" or "sueño de mala calidad". |
| Post-exertional malaise | malestar post-esfuerzo (MPE) | Abbreviate to MPE on second mention |
| High sensitivity day | día de alta sensibilidad | |
| Central sensitisation | sensibilización central | |
| Pain | dolor | |
| Pain level | nivel de dolor | |
| Mood | estado de ánimo | "Humor" is technically valid but sounds odd in this context. "Ánimo" alone is acceptable in short labels. |
| Activity level | nivel de actividad | |
| Woke rested | me desperté descansado/a | Use the slash form or match biological sex if known |
| Period (menstrual) | **período** | Keep the accent |
| Barometric pressure | presión barométrica | Can shorten to "presión" in tight UI labels |
| HRV (Heart Rate Variability) | HRV (variabilidad de la frecuencia cardíaca) | Spell out in full on first occurrence; use HRV thereafter |

### App-specific terms

| English | es-ES | Notes |
|---|---|---|
| Log (noun) | **registro** | "Registro diario" for the full daily log |
| Log (verb) | **registrar** | "Anota cómo te encuentras" works well in onboarding copy |
| Daily check-in | **registro diario** | Don't use "check-in" — too English |
| Track (verb) | **hacer seguimiento de** | Noun form: "seguimiento" |
| Tracking | **seguimiento** | |
| Streak | **racha** | Very natural in Spanish. "Llevas X días seguidos" also works in longer copy. |
| Insights | **análisis** | "Tu análisis semanal". "Perspectivas" is technically correct but stiff. |
| Weekly insight report | **informe semanal** | |
| Nudges | **avisos** | "Alertas" is fine too but "avisos" matches the gentle, non-alarming tone better |
| Patterns | patrones | |
| Symptoms | síntomas | |
| Medication adherence | adherencia a la medicación | Clinical term, use it |
| Treatment | tratamiento | |
| Medications | medicamentos | "Medicación" is acceptable as a section header |
| Profile | perfil | |
| AI context / About you | **sobre ti** | Don't use "contexto de IA" — too technical for the UI |
| Share with my doctor | compartir con mi médico | Use "médico", not "doctor" — "doctor" is less formal and less common in this context |
| Report (PDF) | informe | |
| Diet triggers | alimentos desencadenantes | |
| Score | puntuación | In Fibro Score context, keep "Fibro Score" but "tu puntuación" in running copy |

### Severity & scale labels

| English | es-ES |
|---|---|
| Mild | leve |
| Moderate | moderado/a |
| Severe | severo/a |
| Low | bajo/a |
| High | alto/a |
| Great (mood) | Muy bien |
| Good (mood) | Bien |
| Okay (mood) | Regular |
| Low (mood) | Bajo/a |
| Very low (mood) | Muy bajo/a |
| Clean (diet) | Saludable |
| Mostly clean (diet) | Bastante bien |
| Mixed (diet) | Regular |
| Poor (diet) | Poco saludable |

### UI chrome

| English | es-ES |
|---|---|
| Save | Guardar |
| Cancel | Cancelar |
| Done | Listo |
| Next | Siguiente |
| Back | Atrás |
| Skip | Omitir |
| Edit | Editar |
| Delete | Eliminar |
| Retry | Intentar de nuevo |
| Loading… | Cargando… |
| Optional | Opcional |
| Required | Obligatorio |
| Get started | Empezar |
| Let's go | Vamos |
| Select all that apply | Selecciona todo lo que corresponda |
| Step X of Y | Paso X de Y |

---

## Common mistakes to avoid

- **Never** use "llamarada" for flare
- **Never** use "cansancio" for fatigue
- **Never** use "vosotros" — rephrase
- **Never** add an article before Fibro ("la Fibro", "el Fibro")
- **Never** use "crisis" for flare — use "brote"
- **Don't** over-punctuate UI strings with exclamation marks. The English has some; remove them in Spanish where they feel excessive.
