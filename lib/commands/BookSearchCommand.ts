import { InteractionResponseType } from 'discord-interactions';
import { Request, Response } from 'express';
import { searchBooks } from '../goodreads/goodreads_search.js';
import { BookClubState } from '../types/BookClubState.js';
import { ICommand, IGatewayCommand } from './CommandFactory.js';
import { Interaction } from 'discord.js';

export default class BookSearchCommand implements ICommand, IGatewayCommand {
    async executeGatewayCommand(
        interaction: Interaction,
        _state: BookClubState,
    ): Promise<void> {
        if (!interaction.isChatInputCommand()) {
            return;
        }
        try {
            await interaction.deferReply();
            const searchQuery = interaction.options.getString('query');
            if (searchQuery == null) {
                console.error('Received searchQuery with value null');
                await interaction.editReply(
                    'Could not use that input for a search..',
                );
                return;
            }
            const summary = await this.getResultsSummary(searchQuery);
            await interaction.editReply(
                `You searched for "${searchQuery}". The top results I got:\n` +
                    (summary.length > 0 ? summary.join('\n') : 'No results!'),
            );
        } catch (error) {
            console.error('error', error);
            await interaction.editReply(
                'Something went wrong while searching..',
            );
        }
    }

    async execute(
        req: Request,
        res: Response,
        _state: BookClubState,
    ): Promise<Response> {
        const { data } = req.body;
        try {
            const searchQuery = data.options[0].value;
            const summary = await this.getResultsSummary(searchQuery);

            return res.send({
                type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                data: {
                    content:
                        `You searched for "${searchQuery}". The top results I got:\n` +
                        (summary.length > 0
                            ? summary.join('\n')
                            : 'No results!'),
                },
            });
        } catch (error) {
            console.error('error', error);
            return res.send({
                type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                data: {
                    content:
                        'Ugh, my creator failed and some error happened...',
                },
            });
        }
    }

    private async getResultsSummary(searchQuery: string) {
        const books = await searchBooks(searchQuery);
        const summary = books.map((book, i) => {
            return `${i + 1}) ${book.title} by ${
                book.author
            } can be found at: ${book.url}`;
        });
        return summary;
    }
}
