import { InteractionResponseType } from 'discord-interactions';
import { Request, Response } from 'express';
import { BookClubState } from '../types/BookClubState.js';
import { getRandomEmoji } from '../utils.js';
import { ICommand, IGatewayCommand } from './CommandFactory.js';
import { Interaction } from 'discord.js';

export default class TestCommand implements ICommand, IGatewayCommand {
    async executeGatewayCommand(
        interaction: Interaction,
        _state: BookClubState,
    ): Promise<void> {
        if (interaction.isRepliable()) {
            await interaction.reply('hello world ' + getRandomEmoji());
        }
    }
    async execute(
        req: Request,
        res: Response,
        _state: BookClubState,
    ): Promise<Response> {
        return res.send({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                // Fetches a random emoji to send from a helper function
                content: 'hello world ' + getRandomEmoji(),
            },
        });
    }
}
