export const HELP_MESSAGE = {
    text: "(soon)",
    blocks: [
        {
            type: 'section',
            text: {
                type: 'mrkdwn',
                text: '(soon)'
            }
        }
    ]
};

const T1_JOIN_MESSAGES = [
    "hmm... oh! hi there, {}! :kitty-heart:",
    "welcome welcome, {}! :kitty-heart:",
    "woah! a wild {} spawned! :kitty-awe:"
];

export const JOIN_T1_MESSAGE = (event: any) => {
    const message = T1_JOIN_MESSAGES[Math.floor(Math.random() * T1_JOIN_MESSAGES.length)] ?? T1_JOIN_MESSAGES[0]!;
    const formatted = message.replaceAll("{}", `<@${event.user}>`);

    return {
        text: formatted,
        blocks: [
            {
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text: formatted
                }
            }
        ]
    }
};