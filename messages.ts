export const HELP_MESSAGE = [
    { text: "hi! i'm olive, nice to meet you!" },
    { text: "right now, i don't do too much..." },
    {
        text: "oh! but if you join <#C06SY7X0ESK>, i can give you a cookie! _(unless you're already in there...)_",
        blocks: [
            {
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text: 'oh! but if you join <#C06SY7X0ESK>, i can give you a cookie!'
                }
            },
            {
                type: 'context',
                elements: [
                    {
                        type: 'mrkdwn',
                        text: "_(unless you're already in there...)_"
                    }
                ]
            }
        ]
    }
];

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