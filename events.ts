const wait = (ms: number) => new Promise(res => setTimeout(res, ms));

import { EventEmitter } from "node:events";
import { webClient, userClient, botClient } from "./webclient";
import { HELP_MESSAGE, JOIN_T1_MESSAGE } from "./messages";
import type { BlockAction, BlockButtonAction, BlockElementAction, ButtonAction } from "@slack/bolt";
import type { Channel } from "@slack/web-api/dist/types/response/ConversationsInfoResponse";
import { startTyping } from ".";
import { parseTarget } from "./utils";

const ev = new EventEmitter();

let me: string;

ev.on('open', async () => {
    const authTest = await webClient.auth.test();

    if (authTest.ok) {
        me = authTest.user_id!
        console.log(`Connected to RTM API as ${authTest.user} (${authTest.user_id})!`)
    }
});

const messageSubtypes = [
    "file_share",
    "me_message",
    "thread_broadcast",
    undefined
] as const;

async function handleMessage(cmd: string, args: string[], event: any) {
    startTyping(event.channel);
    await wait(750);

    if (cmd === "help") {
        for (let i = 0; i < HELP_MESSAGE.length; i++) {
            const message = HELP_MESSAGE[i]!;

            await webClient.chat.postMessage({
                channel: event.channel,
                ...message
            });

            if (i < HELP_MESSAGE.length - 1) {
                startTyping(event.channel);
                await wait(750);
            }
        }

        return;
    }

    if (cmd === "typing") {
        await wait(1250); // for a total of 2000ms
        return await webClient.chat.postMessage({
            channel: event.channel,
            text: "okay!"
        })
    }

    if (cmd === "msg") {
        if (event.user !== "U07KVMBHH4L") {
            return await webClient.chat.postMessage({
                channel: event.channel,
                text: "nuh uh!"
            })
        }

        if (args.length < 2) {
            return await webClient.chat.postMessage({
                channel: event.channel,
                text: "hey! you gotta tell me where to post stuff! and what to post..."
            })
        }

        const args0 = args.shift()!;
        const target = parseTarget(args0);

        if (target === null) {
            return await webClient.chat.postMessage({
                channel: event.channel,
                text: "mmm... i don't know where that is!"
            })
        }

        if (target.type !== "message") {
            if (target.type === "user") {
                const userIm = await webClient.conversations.open({
                    users: target.channel
                });

                if (userIm.ok && userIm.channel)
                    target.channel = userIm.channel.id!
            }

            try {
                await webClient.chat.postMessage({
                    channel: target.channel,
                    text: args.join(' ')
                });

                await webClient.reactions.add({
                    channel: event.channel,
                    timestamp: event.ts,
                    name: 'white_check_mark'
                })
            } catch (err) {
                console.error(err)
                let e = err ?? "Unknown Error"

                await webClient.reactions.add({
                    channel: event.channel,
                    timestamp: event.ts,
                    name: 'x'
                })

                await webClient.chat.postMessage({
                    channel: event.channel,
                    thread_ts: event.ts,
                    reply_broadcast: true,
                    text: e.toString()
                })
            }
        } else {
            try {
                const history = await webClient.conversations.history({
                    channel: target.channel,
                    latest: target.ts,
                    oldest: target.ts,
                    inclusive: true,
                    limit: 1
                });

                if (!history.ok ||
                    !history.messages ||
                    history.messages.length < 1) throw new Error('Could not find message')

                const targetTs = history.messages[0]?.thread_ts ?? target.ts

                await webClient.chat.postMessage({
                    channel: target.channel,
                    thread_ts: targetTs,
                    text: args.join(' ')
                });

                await webClient.reactions.add({
                    channel: event.channel,
                    timestamp: event.ts,
                    name: 'white_check_mark'
                })
            } catch (err) {
                console.error(err)
                let e = err ?? "Unknown Error"

                await webClient.reactions.add({
                    channel: event.channel,
                    timestamp: event.ts,
                    name: 'x'
                })

                await webClient.chat.postMessage({
                    channel: event.channel,
                    thread_ts: event.ts,
                    reply_broadcast: true,
                    text: e.toString()
                })
            }
        }

        return;
    }

    await webClient.chat.postMessage({
        channel: event.channel,
        text: "mmm.... i don't know what that's meant to mean!"
    });

    startTyping(event.channel);
    await wait(750);

    await webClient.chat.postMessage({
        channel: event.channel,
        text: "if you want to know what i _can_ do, send `help`!"
    })
}

const channelCache = new Map<string, Channel>();

async function getChannel(channelId: string, force: boolean = false) {
    const cacheHit = channelCache.get(channelId);

    if (cacheHit && !force) return cacheHit;
    else {
        const channelInfo = await webClient.conversations.info({
            channel: channelId
        });

        if (!channelInfo.ok && !channelInfo.channel) return undefined;

        channelCache.set(channelId, channelInfo.channel!)
        return channelInfo.channel
    }
}

ev.on('message', async (event) => {
    if (event.user === me) return;

    if (event.hidden) return;

    await webClient.conversations.mark({
        channel: event.channel,
        ts: event.ts
    })

    if (!messageSubtypes.includes(event.subtype)) return;

    const channel = await getChannel(event.channel);

    if (channel && (channel.is_im || channel.is_mpim)) {
        const args = event.text.trim().split(/ +/g);

        if (args.length < 1) return;

        if (channel.is_mpim) {
            // Olive should only work in Group DMs if she's explicitly pinged
            const args0 = args[0];
            const parsed = parseTarget(args0);

            if (!parsed) return;
            if (parsed.type !== "user") return;
            if (parsed.channel !== me) return;

            args.shift();
        }

        const cmd = args.shift().toLowerCase();

        await handleMessage(cmd, args, event);
    }
});

const TIER_TO_CHANNEL = {
    "T1": "C06SY7X0ESK"
};

const CHANNEL_TO_TIER = Object.fromEntries(
    Object.entries(TIER_TO_CHANNEL).map(([tier, channel]) => [channel, tier])
) as Record<
    (typeof TIER_TO_CHANNEL)[keyof typeof TIER_TO_CHANNEL],
    keyof typeof TIER_TO_CHANNEL
>;

ev.on('member_joined_channel', async (event) => {
    const tier = CHANNEL_TO_TIER[event.channel as string];

    if (!tier) return;

    if (tier == "T1") {
        const parentMessage = await webClient.chat.postMessage({
            channel: event.channel,
            ...JOIN_T1_MESSAGE(event)
        });

        if (parentMessage.ok) {
            startTyping(event.channel, parentMessage.ts)

            await wait(750);

            await userClient.chat.postMessage({
                as_user: true,
                channel: event.channel,
                thread_ts: parentMessage.ts,
                text: "i\'m so glad you're here! here, have a cookie! :kitty-heart:",
                blocks: [
                    {
                        type: 'section',
                        text: {
                            type: 'mrkdwn',
                            text: "i\'m so glad you're here! here, have a cookie! :kitty-heart:",
                        }
                    },
                    {
                        type: 'actions',
                        elements: [
                            {
                                type: 'button',
                                action_id: 'cookie',
                                text: {
                                    type: 'plain_text',
                                    text: 'take the cookie :cookie:'
                                },
                                value: `${event.user}-${parentMessage.ts}`
                            }
                        ]
                    }
                ]
            })
        }
    }
});

botClient.action('cookie', async (ctx) => {
    await ctx.ack();

    const body = ctx.body as BlockAction<BlockElementAction>;
    const action = ctx.action as ButtonAction;

    await userClient.chat.update({
        channel: body.channel!.id,
        ts: body.message!.ts,
        text: "i\'m so glad you're here! here, have a cookie! :kitty-heart:",
        blocks: [
            {
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text: "i\'m so glad you're here! here, have a cookie! :kitty-heart:",
                }
            },
            {
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text: `<@${body.user.id}> took the cookie`,
                    verbatim: false
                }
            }
        ]
    })

    const [origUserId, thread_ts] = action.value!.split('-');

    startTyping(body.channel!.id, thread_ts)

    await wait(1000);

    if (origUserId !== body.user.id) {
        await webClient.chat.postMessage({
            channel: body.channel!.id,
            thread_ts,
            text: `hey! that wasn't your cookie, <@${body.user.id}>!!`
        })

        startTyping(body.channel!.id, thread_ts)

        await wait(750)

        await webClient.chat.postMessage({
            channel: body.channel!.id,
            thread_ts,
            text: `hmph... :kitty-facepalm:`
        })

        startTyping(body.channel!.id, thread_ts)

        await wait(750)

        await webClient.chat.postMessage({
            channel: body.channel!.id,
            thread_ts,
            text: `sorry about that, <@${origUserId}>...`
        })
    } else {
        await webClient.chat.postMessage({
            channel: body.channel!.id,
            thread_ts,
            text: `woohoo! enjoy your stay here!`
        })
    }
})

export default ev;