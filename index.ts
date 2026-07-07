import "dotenv/config";
import { webClient } from "./webclient";
import events from "./events";
import { WebSocket } from "node:http";

let reconnectionUrl: string | undefined;
async function getConnectionUrl() {
    if (reconnectionUrl) {
        const url = new URL(reconnectionUrl);
        url.searchParams.set('token', process.env.XOXC!)
        reconnectionUrl = undefined;
        return url
    } else {
        const websocketInfo = await webClient.apiCall('client.getWebSocketURL');

        if (!websocketInfo.ok) {
            throw new Error(`client.getWebSocketURL returned ok=false: ${JSON.stringify(websocketInfo)}`);
        }

        // @ts-expect-error The generic response type doesn't have primary websocket URLs
        const url = new URL(websocketInfo.primary_websocket_url);

        url.searchParams.set('token', process.env.XOXC!);

        return url;
    }
}

function createWebsocket(url: URL) {
    const rtmSocket = new WebSocket(url, {
        headers: {
            'Cookie': `d=${process.env.XOXD}`
        }
    }) as WebSocket & { 
        lastMsgId: number
    };

    rtmSocket.lastMsgId = 0;

    rtmSocket.addEventListener('open', () => {
        events.emit('open');
    })

    rtmSocket.addEventListener('message', (ev) => {
        const msg = JSON.parse(ev.data.toString())

        if (msg.type === "reconnect_url") {
            reconnectionUrl = msg.url;
            return;
        }

        events.emit(msg.type, msg)
        events.emit('*', msg)
    })

    rtmSocket.addEventListener('error', (ev) => {
        events.emit('error', ev)
    })

    rtmSocket.addEventListener('close', (ev) => {
        events.emit('close', ev)
    })

    return rtmSocket;
}

const url = await getConnectionUrl();
export const rtmSocket = createWebsocket(url);

export function startTyping(channel: string, thread_ts?: string) {
    rtmSocket.lastMsgId += 1;

    rtmSocket.send(JSON.stringify({
        id: rtmSocket.lastMsgId,
        type: 'typing',
        channel,
        thread_ts
    }))
}