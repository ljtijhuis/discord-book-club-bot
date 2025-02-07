import config from './config.js';
import fetch from 'node-fetch';
import { verifyKey } from 'discord-interactions';
import { Request, Response } from 'express';

export function VerifyDiscordRequest(clientKey: string) {
    return function (req: Request, res: Response, buf: any, _encoding: any) {
        const signature = req.get('X-Signature-Ed25519');
        const timestamp = req.get('X-Signature-Timestamp');

        if (signature === undefined || timestamp === undefined) {
            res.status(401).send('Bad request signature');
            throw new Error('Bad request signature');
        }

        const isValidRequest = verifyKey(buf, signature, timestamp, clientKey);
        if (!isValidRequest) {
            res.status(401).send('Bad request signature');
            throw new Error('Bad request signature');
        }
    };
}

export async function DiscordRequest(endpoint: string, options: any) {
    // append endpoint to root API URL
    const url = 'https://discord.com/api/v10/' + endpoint;
    // Stringify payloads
    if (options.body) options.body = JSON.stringify(options.body);
    // Use node-fetch to make requests
    const res = await fetch(url, {
        headers: {
            Authorization: `Bot ${config.DISCORD_TOKEN}`,
            'Content-Type': 'application/json; charset=UTF-8',
            'User-Agent':
                'DiscordBot (https://github.com/discord/discord-example-app, 1.0.0)',
        },
        ...options,
    });
    // throw API errors
    if (!res.ok) {
        const data = await res.json();
        console.log(res.status);
        throw new Error(JSON.stringify(data));
    }
    // return original response
    return res;
}

export async function InstallGlobalCommands(appId: string, commands: any) {
    // API endpoint to overwrite global commands
    const endpoint = `applications/${appId}/commands`;

    try {
        // This is calling the bulk overwrite endpoint: https://discord.com/developers/docs/interactions/application-commands#bulk-overwrite-global-application-commands
        const response = await DiscordRequest(endpoint, {
            method: 'PUT',
            body: commands,
        });
        console.log('Response status:', response.status);
    } catch (err) {
        console.error(err);
    }
}

// Simple method that returns a random emoji from list
export function getRandomEmoji() {
    const emojiList = [
        '😭',
        '😄',
        '😌',
        '🤓',
        '😎',
        '😤',
        '🤖',
        '😶‍🌫️',
        '🌏',
        '📸',
        '💿',
        '👋',
        '🌊',
        '✨',
    ];
    return emojiList[Math.floor(Math.random() * emojiList.length)];
}
