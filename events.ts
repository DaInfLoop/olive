const wait = (ms: number) => new Promise(res => setTimeout(res, ms));

import { EventEmitter } from "node:events";
import { webClient, userClient, botClient } from "./webclient";
import { HELP_MESSAGE, JOIN_T1_MESSAGE } from "./messages";
import type { BlockAction, BlockButtonAction, BlockElementAction, ButtonAction } from "@slack/bolt";
import type { Channel } from "@slack/web-api/dist/types/response/ConversationsInfoResponse";
import { startTyping } from ".";

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
        return await webClient.chat.postMessage({
            channel: event.channel,
            ...HELP_MESSAGE
        })
    }

    if (cmd === "typing") {
        await wait(1250); // for a total of 2000ms
        return await webClient.chat.postMessage({
            channel: event.channel,
            text: "okay!"
        })
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

async function getChannel(channelId: string) {
    const cacheHit = channelCache.get(channelId);

    if (cacheHit) return cacheHit;
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

    if (channel && channel.is_im) {
        const args = event.text.trim().split(/ +/g);
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