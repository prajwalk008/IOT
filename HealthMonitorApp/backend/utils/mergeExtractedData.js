function mergeExtractedData(resultsArray) {
  const merged = {
    diseases: [],
    allergies: [],
    operations: [],
    medications: [],
    summary: ""
  };

  for (const res of resultsArray) {
    if (!res || res.error) continue;
    if (Array.isArray(res.diseases)) merged.diseases.push(...res.diseases);
    if (Array.isArray(res.allergies)) merged.allergies.push(...res.allergies);
    if (Array.isArray(res.operations)) merged.operations.push(...res.operations);
    if (Array.isArray(res.medications)) merged.medications.push(...res.medications);
    if (typeof res.summary === "string") merged.summary += "\n" + res.summary;
  }

  // remove duplicates
  merged.diseases = [...new Set(merged.diseases)];
  merged.allergies = [...new Set(merged.allergies)];
  merged.operations = [...new Set(merged.operations)];
  merged.medications = [...new Set(merged.medications)];

  return merged;
}

module.exports = { mergeExtractedData };
