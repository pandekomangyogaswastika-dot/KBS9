/**
 * Branching / conditional visibility helper untuk Assessment questionnaire.
 * Port dari KN3 Discovery module.
 *
 * Default-show: jika dependensi belum dijawab → pertanyaan tetap visible.
 * Hide hanya jika dependensi sudah dijawab DAN kondisi tidak terpenuhi.
 *
 * Operator yang didukung (sinkron dengan backend):
 *   equals | not_equals | in | not_in | includes | not_includes | is_truthy | is_falsy
 */
const ensureList = (x) => (Array.isArray(x) ? x : [x]);

export const shouldShowQuestion = (question, answersMap) => {
  const rule = question?.show_if;
  if (!rule) return true;
  const targetId = rule.question_id;
  if (!targetId) return true;
  const ans = (answersMap || {})[targetId];
  // Default-show kalau dependensi belum dijawab/di-skip
  if (!ans || ans.skipped === true) return true;
  const actual = ans.value;
  if (actual === null || actual === undefined || actual === "" || (Array.isArray(actual) && actual.length === 0)) {
    return true;
  }
  const op = (rule.operator || "equals").toLowerCase();
  const expectedSingle = rule.value;
  const expectedList = rule.values || [];

  switch (op) {
    case "equals":
      return actual === expectedSingle;
    case "not_equals":
      return actual !== expectedSingle;
    case "in":
      return expectedList.includes(actual);
    case "not_in":
      return !expectedList.includes(actual);
    case "includes":
      return expectedList.some((v) => ensureList(actual).includes(v));
    case "not_includes":
      return !expectedList.some((v) => ensureList(actual).includes(v));
    case "is_truthy":
      return Boolean(actual);
    case "is_falsy":
      return !actual;
    default:
      return true; // unknown operator → safe default: show
  }
};

export const filterVisibleQuestions = (domain, answersMap) =>
  (domain?.questions || []).filter((q) => shouldShowQuestion(q, answersMap));

/** Get list of pertanyaan yang TER-HIDE oleh branching (untuk indicator info di UI). */
export const getHiddenQuestionIds = (domain, answersMap) =>
  (domain?.questions || [])
    .filter((q) => !shouldShowQuestion(q, answersMap))
    .map((q) => q.id);
