import "dotenv/config";
import { WebClient } from "@slack/web-api";

export const webClient = new WebClient(process.env.XOXC, {
    headers: {
        'Cookie': `d=${process.env.XOXD}`        
    }
});