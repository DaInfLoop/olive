import "dotenv/config";
import { WebClient } from "@slack/web-api";
import { WebSocket } from "node:http";

const webClient = new WebClient(process.env.XOXC, {
    headers: {
        'Cookie': `d=${process.env.XOXD}`
    }
});

const websocketInfo = await webClient.apiCall('client.getWebSocketURL');

if (!websocketInfo.ok) {
    throw new Error(`client.getWebSocketURL returned ok=false: ${JSON.stringify(websocketInfo)}`);
}

// @ts-expect-error The generic response type doesn't have primary websocket URLs
const rtmUrl = new URL(websocketInfo.primary_websocket_url);

rtmUrl.searchParams.set('token', process.env.XOXC!);

const rtmSocket = new WebSocket(rtmUrl, {
    headers: {
        'Cookie': `d=${process.env.XOXD}`        
    }
});

rtmSocket.addEventListener('open', () => {
    console.log('[OPEN]')
})

rtmSocket.addEventListener('message', (ev) => {
    console.log('[MSG]', ev.data.toString())
})

rtmSocket.addEventListener('error', (ev) => {
    console.log('[ERR]', ev.error)
})