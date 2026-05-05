// n8n Code Node: Process medical patient data
//
// Expected input items (as $input.all()):
//   [{ json: { patient_id, blood_pressure: "140/90", heart_rate, last_visit } }, ...]
//
// Output items follow the n8n item structure:
//   [{ json: { patient_id, blood_pressure, systolic, diastolic,
//              heart_rate, last_visit, hypertension_risk, priority_score } }, ...]

// Map a heart rate value to a 1-10 priority score (higher HR => higher priority).
// Anchors: HR <= 60 -> 1, HR >= 150 -> 10, linear interpolation in between.
function computePriorityScore(heartRate) {
  const hr = Number(heartRate);
  if (!Number.isFinite(hr)) {
    return 1;
  }
  const minHr = 60;
  const maxHr = 150;
  const clamped = Math.min(Math.max(hr, minHr), maxHr);
  const score = 1 + ((clamped - minHr) / (maxHr - minHr)) * 9;
  return Math.max(1, Math.min(10, Math.round(score)));
}

// Parse a blood pressure string like "140/90" into numeric systolic/diastolic values.
function parseBloodPressure(bp) {
  if (typeof bp !== 'string') {
    return { systolic: null, diastolic: null };
  }
  const parts = bp.split('/');
  if (parts.length !== 2) {
    return { systolic: null, diastolic: null };
  }
  const systolic = parseInt(parts[0].trim(), 10);
  const diastolic = parseInt(parts[1].trim(), 10);
  return {
    systolic: Number.isFinite(systolic) ? systolic : null,
    diastolic: Number.isFinite(diastolic) ? diastolic : null,
  };
}

const items = $input.all();

const results = items.map((item) => {
  const data = item.json || {};
  const { systolic, diastolic } = parseBloodPressure(data.blood_pressure);

  const hypertensionRisk =
    (systolic !== null && systolic > 130) || (diastolic !== null && diastolic > 80)
      ? 'High'
      : 'Normal';

  const priorityScore = computePriorityScore(data.heart_rate);

  return {
    json: {
      patient_id: data.patient_id,
      blood_pressure: data.blood_pressure,
      systolic,
      diastolic,
      heart_rate: data.heart_rate,
      last_visit: data.last_visit,
      hypertension_risk: hypertensionRisk,
      priority_score: priorityScore,
    },
  };
});

return results;
