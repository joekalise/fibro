# Fibro — Translation Style Guide (Spanish, United States)

Reference for translators working on `es-US.json`. This locale targets Spanish speakers in the United States, drawing on broadly understood Latin American Spanish. Read this before translating anything.

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
- US Spanish users are accustomed to a mix of English loanwords in tech contexts — but for health and medical terms, always translate. Reserve anglicisms for UI chrome where natural (e.g. "app" is fine).

---

## Form of address

- **Singular: tú** — always informal, never usted
- **Imperative: tú form** — "Registra", "Guarda", "Toca"
- **Plural: ustedes** if a plural is unavoidable (no vosotros in Latin American Spanish)
- **Gendered agreement**: use "descansado/a", "cansado/a" for user-facing self-descriptions. Where a construction forces a choice and the user's biological sex is not known, default to feminine (fibromyalgia affects women disproportionately and the majority of users are likely female).

---

## Punctuation & formatting

- Inverted marks: **¿…?** and **¡…!** — always open and close
- Decimal separator: **punto** — "7.2/10", "5.1 horas" (US convention, even in Spanish)
- Thousands separator: **coma** — "1,000 pasos"
- Date format: MM/DD/AAAA — but most app dates use relative labels (Hoy, Ayer, Lunes) so this rarely comes up
- Ellipsis: use … (single character), not three separate dots
- Em dash: — (not a hyphen). Use sparingly.

---

## Glossary

### Clinical & health terms

| English | es-US | Notes |
|---|---|---|
| Fibromyalgia | fibromialgia | Lowercase unless starting a sentence |
| Flare / flare-up | **crisis** or **episodio** | "Crisis" is the most widely understood term across Latin American communities. "Episodio" is slightly more clinical. Either is acceptable; pick one and be consistent within a screen. Never "llamarada" (literal, unused clinically). |
| Active flare | crisis activa / episodio activo | Match whichever base term you chose |
| Flare trigger | desencadenante | "Detonante" is also well understood in Latin American Spanish |
| Flare history | historial de crisis | |
| Log a flare | registrar una crisis | |
| Brain fog | **niebla mental** | Established in patient communities. Don't leave it in English even though some US bilingual users know "brain fog". |
| Fatigue | **fatiga** | Use "fatiga", not "cansancio". "Cansancio" implies ordinary tiredness; fatigue in fibromyalgia is a clinical symptom. |
| Morning stiffness | **rigidez matutina** | Standard clinical term. Fine to shorten to "rigidez" in UI labels. |
| Unrefreshed sleep | **sueño no reparador** | Standard clinical term. Never "mal sueño". |
| Post-exertional malaise | malestar post-esfuerzo (MPE) | Abbreviate to MPE on second mention |
| High sensitivity day | día de alta sensibilidad | |
| Central sensitisation | sensibilización central | |
| Pain | dolor | |
| Pain level | nivel de dolor | |
| Mood | estado de ánimo | "Ánimo" alone is acceptable in short labels. Avoid "humor" in this context. |
| Activity level | nivel de actividad | |
| Woke rested | me desperté descansado/a | Use the slash form or match biological sex if known |
| Period (menstrual) | **periodo** | No accent — standard in Latin American usage |
| Barometric pressure | presión barométrica | Can shorten to "presión" in tight UI labels |
| HRV (Heart Rate Variability) | HRV (variabilidad de la frecuencia cardíaca) | Spell out in full on first occurrence; use HRV thereafter |

### App-specific terms

| English | es-US | Notes |
|---|---|---|
| Log (noun) | **registro** | "Registro diario" for the full daily log |
| Log (verb) | **registrar** | "Anota cómo te sientes" works well in onboarding copy |
| Daily check-in | **registro diario** | Don't use "check-in" even in a US market — translate it |
| Track (verb) | **monitorear** or **hacer seguimiento de** | "Monitorear" is widely used and natural in Latin American Spanish tech contexts |
| Tracking | **seguimiento** or **monitoreo** | |
| Streak | **racha** | Very natural. "Llevas X días seguidos" also works in longer copy. |
| Insights | **análisis** | "Tu análisis semanal". "Perspectivas" is technically correct but stiff. |
| Weekly insight report | **informe semanal** | |
| Nudges | **avisos** | "Alertas" is fine too — slightly more common in Latin American digital products |
| Patterns | patrones | |
| Symptoms | síntomas | |
| Medication adherence | adherencia a la medicación | Clinical term, use it |
| Treatment | tratamiento | |
| Medications | medicamentos | |
| Profile | perfil | |
| AI context / About you | **sobre ti** | Don't use "contexto de IA" — too technical |
| Share with my doctor | compartir con mi doctor | Use "doctor" — more natural than "médico" in this context |
| Report (PDF) | informe | |
| Diet triggers | alimentos desencadenantes | "Detonantes alimenticios" is also acceptable |
| Score | puntuación | In Fibro Score context, keep "Fibro Score" but "tu puntuación" in running copy |

### Severity & scale labels

| English | es-US |
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

| English | es-US |
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
| Get started | Comenzar |
| Let's go | Vamos |
| Select all that apply | Selecciona todo lo que aplique |
| Step X of Y | Paso X de Y |

---

## Common mistakes to avoid

- **Never** use "llamarada" for flare
- **Never** use "cansancio" for fatigue
- **Never** use "vosotros"
- **Never** add an article before Fibro ("la Fibro", "el Fibro")
- **Never** use "brote" for flare — use "crisis" or "episodio"
- **Don't** over-punctuate UI strings with exclamation marks. The English has some; remove them in Spanish where they feel excessive.
- **Don't** use anglicisms for medical terms just because it's a US market. "Brain fog" should still be "niebla mental", not left in English.
