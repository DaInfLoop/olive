import "dotenv/config";
import { WebClient } from "@slack/web-api";
import { App } from "@slack/bolt";

export const webClient = new WebClient(process.env.XOXC, {
    headers: {
        'Cookie': `d=${process.env.XOXD}`        
    }
});

export const userClient = new WebClient(process.env.XOXP);

export const botClient = new App({
    token: process.env.XOXB,
    signingSecret: process.env.SIGNING_SECRET,
    appToken: process.env.XAPP,
    socketMode: true
});

botClient.start().then(() => console.log("Bolt.JS client up!"));