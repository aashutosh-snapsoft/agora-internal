export function extractProjectId(url: string): string | null {
    const regex = /projects\/([a-f0-9-]{36})/;
    const match = url.match(regex);
    return match ? match[1] : null;
}
