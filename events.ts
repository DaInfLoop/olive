import { EventEmitter } from "node:events";
import { webClient } from "./webclient";
import type { MessageEvent } from "@slack/web-api";

const ev = new EventEmitter();

let me: string;

ev.on('open', async () => {
    const authTest = await webClient.auth.test();

    if (authTest.ok) {
        me = authTest.user_id!
        console.log(`Connected to RTM API as ${authTest.user} (${authTest.user_id})!`)
    }
});

ev.on('message', async (ev) => {
    if (ev.user === me) return;

    if (ev.channel.startsWith('D')) {
        const channelInfo = await webClient.conversations.info({
            channel: ev.channel
        });

        if (!channelInfo.ok && !channelInfo.channel) return;

        if (channelInfo.channel!.is_im) {
            console.log(`${ev.user} -> ${ev.text}`)
            await webClient.chat.postMessage({
                channel: ev.channel,
                text: ev.text + " _(This message has been echoed back.)_",
                blocks: [
                    ...ev.blocks,
                    {
                        type: 'context',
                        elements: [
                            {
                                type: 'mrkdwn',
                                text: '_(This message has been echoed back.)_'
                            }
                        ]
                    }
                ]
            })
        }
    }
})

export default ev;