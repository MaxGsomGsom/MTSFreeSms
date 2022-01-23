export function normalizePhone(value: string): string {
    let normalized = value.trim().replace(/[^\d\+]/g, '');
    if (normalized[0] === '7') {
        normalized = '+' + normalized;
    } else if (normalized[0] === '8') {
        normalized = '+7' + normalized.substring(1);
    }
    return normalized;
}
