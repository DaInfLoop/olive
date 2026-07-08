export type ParsedTarget = {
    type: 'user' | 'channel',
    channel: string
} | {
    type: 'message',
    channel: string,
    ts: string
} | null;

export function parseTarget(input: string): ParsedTarget {
    let match;

    // Matches local or workspace user IDs/mentions
    if (match = input.match(/^(?:<@)?([UW][A-Z0-9]+)>?$/m)) {
        return {
            type: 'user',
            channel: match[1]!
        }
    }

    // Matches channel IDs/mentions (with and without the piped name)
    if (match = input.match(/^(?:<#)?([CG][A-Z0-9]+)(?:\|[^>]+)?>?$/m)) {
        return {
            type: 'channel',
            channel: match[1]!
        }
    }

    // Matches message URLs
    if (match = input.match(/^<?(?:https?:\/\/)?[^\/]+\.slack\.com\/archives\/([CG][A-Z0-9]+)\/p(\d+)(?:\|[^>]+)?>?$/m)) {
        const seconds = match[2]!.slice(0, -6);
        const micros = match[2]!.slice(-6);
        const ts = `${seconds}.${micros}`;

        return {
            type: 'message',
            channel: match[1]!,
            ts
        }
    }

    return null;
}