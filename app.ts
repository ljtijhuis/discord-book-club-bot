import config from './lib/config.js';
import express, { Express, NextFunction, Request, Response } from 'express';
import fs from 'fs';
import * as fsPromise from 'fs/promises';

import { InteractionType, InteractionResponseType } from 'discord-interactions';

import { VerifyDiscordRequest } from './lib/utils.js';

import { BookClubState } from './lib/types/BookClubState.js';
import CommandFactory from './lib/commands/CommandFactory.js';
import MessageActionFactory from './lib/message_actions/MessageActionFactory.js';

// Create an express app
const app: Express = express();
// Get port, or default to 3000
const PORT = config.PORT || 3000;
// Parse request body and verifies incoming requests using discord-interactions package
app.use(express.json({ verify: VerifyDiscordRequest(config.PUBLIC_KEY) }));

// We simply load state from a file (and write it after each request)
let bookClubState: BookClubState = {
    shortlist: {
        books: [],
    },
    vote: {
        books: [],
        votes: [],
    },
    events: [],
};

const stateFileName = './server_state.json';

// Loading the state only when the server boots
(function () {
    try {
        const stateJSON = fs.readFileSync(stateFileName, 'utf-8');
        bookClubState = JSON.parse(stateJSON);
    } catch (error) {
        console.error('Error loading state, starting blank', error);
    }
})();

const writeState = async function (
    _req: Request,
    _res: Response,
    next: NextFunction,
) {
    const json = JSON.stringify(bookClubState);
    await fsPromise.writeFile(stateFileName, json);
    next();
};

/**
 * Interactions endpoint URL where Discord will send HTTP requests
 */
app.post(
    '/interactions',
    async function (req: Request, res: Response, next: NextFunction) {
        // Interaction type and data
        const { type, data } = req.body;

        /**
         * Handle verification requests
         */
        if (type === InteractionType.PING) {
            res.send({ type: InteractionResponseType.PONG });
        }

        /**
         * Handle slash command requests
         * See https://discord.com/developers/docs/interactions/application-commands#slash-commands
         */
        if (type === InteractionType.APPLICATION_COMMAND) {
            const { name } = data;

            const command = CommandFactory.getCommand(name);
            await command.execute(req, res, bookClubState);
        }

        if (type === InteractionType.MESSAGE_COMPONENT) {
            // This is used for responses through our message UI components

            const { custom_id } = data;
            const action = MessageActionFactory.getAction(custom_id);
            await action.execute(req, res, bookClubState);
        }

        next();
        if (!res.headersSent) {
            console.warn('Unhandled request');
        }
    },
    writeState, // When calling next(), we persist the state in a file
);

app.listen(PORT, () => {
    console.log('Listening on port', PORT);
});
