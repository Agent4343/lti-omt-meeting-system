/**
 * What counts as a reviewed isolation.
 *
 * This lived inside ReviewPage, which meant the meeting summary had no way to
 * ask the question and instead reported a hardcoded 95% "efficiency score"
 * regardless of how much had actually been filled in. Both screens now share
 * one definition, so the review page and the summary cannot disagree.
 */

/**
 * @param {Object} response - the questionnaire answers for one isolation
 * @returns {boolean} true when every field required for compliance is answered
 */
export const isIsolationComplete = (response) => {
  if (!response) return false;

  // Overall risk level.
  if (!response.riskLevel || response.riskLevel === 'N/A') return false;

  // Management of Change, and its number once it is required.
  if (!response.mocRequired || response.mocRequired === 'N/A') return false;
  if (response.mocRequired === 'Yes' && !response.mocNumber) return false;

  if (!response.actionRequired || response.actionRequired === 'N/A') return false;

  // The three hazards WMS Manual 7.5.1.22 requires the OMT team to consider.
  if (!response.corrosionRisk || response.corrosionRisk === 'N/A') return false;
  if (!response.deadLegsRisk || response.deadLegsRisk === 'N/A') return false;
  if (!response.automationLossRisk || response.automationLossRisk === 'N/A') return false;

  return true;
};

/**
 * Completion across a meeting.
 *
 * @param {Object[]} isolations - the isolations loaded for the meeting
 * @param {Object} responses - answers keyed by isolation id
 * @returns {{total: number, complete: number, incomplete: number, percent: number}}
 */
export const summarizeCompletion = (isolations, responses) => {
  const list = Array.isArray(isolations) ? isolations : [];
  const answers = responses && typeof responses === 'object' ? responses : {};

  const total = list.length;
  const complete = list.filter(i => isIsolationComplete(answers[i?.id])).length;

  return {
    total,
    complete,
    incomplete: total - complete,
    // No isolations means nothing outstanding, not 0% done.
    percent: total === 0 ? 100 : Math.round((complete / total) * 100)
  };
};
