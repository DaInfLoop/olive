import { EventEmitter } from "node:events";
import { webClient } from "./webclient";

const ev = new EventEmitter();

let me: string;

ev.on('open', async () => {
    const authTest = await webClient.auth.test();

    if (authTest.ok) {
        me = authTest.user_id!
        console.log(`Connected to RTM API as ${authTest.user} (${authTest.user_id})!`)
    }
});

ev.on('message', async (event) => {
    if (event.user === me) return;

    await webClient.conversations.mark({
        channel: event.channel,
        ts: event.ts
    })

    if (event.channel.startsWith('D')) {
        const channelInfo = await webClient.conversations.info({
            channel: event.channel
        });

        if (!channelInfo.ok && !channelInfo.channel) return;

        if (channelInfo.channel!.is_im) {
            console.log(`${event.user} -> ${event.text}`)
            await webClient.chat.postMessage({
                channel: event.channel,
                text: event.text + " _(This message has been echoed back.)_",
                blocks: [
                    ...event.blocks,
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