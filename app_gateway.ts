// Require the necessary discord.js classes
import { Client, Events, GatewayIntentBits } from 'discord.js';
import fs from 'fs';
import * as fsPromise from 'fs/promises';

import config from './lib/config.js';
import CommandFactory from './lib/commands/CommandFactory.js';
import { BookClubState } from './lib/types/BookClubState.js';
import MessageActionFactory from './lib/message_actions/MessageActionFactory.js';

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

const writeState = async function () {
    const json = JSON.stringify(bookClubState);
    await fsPromise.writeFile(stateFileName, json);
};

// Create a new client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// When the client is ready, run this code (only once)
// We use 'c' for the event parameter to keep it separate from the already defined 'client'
client.once(Events.ClientReady, (c) => {
    console.log(`Ready! Logged in as ${c.user.tag}`);
});

// Log in to Discord with your client's token
client.login(config.DISCORD_TOKEN);

client.on(Events.InteractionCreate, async (interaction) => {
    console.log('InteractionCreate event', interaction);

    if (interaction.isChatInputCommand()) {
        const name = interaction.commandName;

        const command = CommandFactory.getGatewayCommand(name);
        await command.executeGatewayCommand(interaction, bookClubState);

        if (!interaction.replied && !interaction.deferred) {
            console.warn('Not replied to chat input?', interaction);
        }
        writeState();
        return;
    }

    if (interaction.isMessageComponent()) {
        const customId = interaction.customId;
        const action = MessageActionFactory.getGatewayAction(customId);
        await action.executeGatewayAction(interaction, bookClubState);

        if (!interaction.replied && !interaction.deferred) {
            console.warn('Not replied to message component?', interaction);
        }
        writeState();
        return;
    }

    console.warn('Unhandled interaction', interaction);
});
