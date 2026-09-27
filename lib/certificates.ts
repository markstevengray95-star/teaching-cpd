export function certificateReference(userId: string, courseId: string, completedAt: string) {
  const input = `${userId}|${courseId}|${completedAt}`;
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const date = new Date(completedAt).toISOString().slice(0, 10).replace(/-/g, "");
  return `CPD-${date}-${(hash >>> 0).toString(36).toUpperCase().padStart(7, "0")}`;
}

export function normaliseCertificateReference(value: string) {
  return value.trim().toUpperCase();
}

export function isCertificateReference(value: string) {
  return /^CPD-[0-9]{8}-[A-Z0-9]{7,16}$/.test(normaliseCertificateReference(value));
}
