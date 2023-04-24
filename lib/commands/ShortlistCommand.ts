import config from '../config.js';
import { InteractionResponseType } from 'discord-interactions';
import { Request, Response } from 'express';
import { DiscordRequest } from '../utils.js';
import { getBookData } from '../goodreads/goodreads_search.js';
import { BookClubState } from '../types/BookClubState.js';
import { ICommand, IGatewayCommand } from './CommandFactory.js';
import { Interaction } from 'discord.js';

export default class ShortlistCommand implements ICommand, IGatewayCommand {
    async executeGatewayCommand(
        interaction: Interaction,
        state: BookClubState,
    ): Promise<void> {
        if (!interaction.isChatInputCommand()) {
            return;
        }
        try {
            await interaction.deferReply();
            const subCommand = interaction.options.getSubcommand();
            if (subCommand === 'list') {
                const content = this.getBookListReply(state);
                await interaction.editReply(content);
            } else if (subCommand === 'add') {
                const book_url = interaction.options.getString('book_url');
                if (book_url == null) {
                    console.error('Received book_url with value null');
                    await interaction.editReply(
                        'Could not use that input to add a book to the shortlist..',
                    );
                    return;
                }

                const book = await getBookData(book_url);
                if (book !== null) {
                    state.shortlist.books.push({
                        id: book.id,
                        title: book.title,
                        author: book.author,
                        url: book.url,
                    });
                    const resultStr =
                        'The following book was added to the shortlist:\n' +
                        `${book.title} by ${book.author} (${book.url}).`;
                    await interaction.editReply(resultStr);
                } else {
                    await interaction.editReply("I couldn't find that book..");
                }
            } else if (subCommand === 'remove') {
                const entryNumber =
                    interaction.options.getInteger('entry_number');
                if (entryNumber == null) {
                    console.error('Received entryNumber with value null');
                    await interaction.editReply(
                        'Could not use that input to remove a book from the shortlist..',
                    );
                    return;
                }
                const removeIndex = entryNumber - 1;
                if (
                    removeIndex >= 0 &&
                    removeIndex < state.shortlist.books.length
                ) {
                    const [book] = state.shortlist.books.splice(removeIndex, 1);
                    await interaction.editReply(
                        'Removed this book from the shortlist:\n' +
                            `${book.title} by ${book.author} (${book.url}).`,
                    );
                } else {
                    await interaction.editReply(
                        "Uh, we don't have a book with that number on our shortlist!",
                    );
                }
            } else {
                throw new Error('Missing subcommand implementation');
            }
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
        state: BookClubState,
    ): Promise<Response> {
        const { data } = req.body;
        const subCommand = data.options[0].name;
        if (subCommand === 'list') {
            return this.executeListCommand(state, res);
        } else if (subCommand === 'add') {
            return this.executeAddCommand(req, res, state);
        } else if (subCommand === 'remove') {
            return this.executeRemoveCommand(req, res, state);
        }

        throw new Error('Missing subcommand implementation');
    }

    private executeListCommand(
        state: BookClubState,
        res: Response<any, Record<string, any>>,
    ) {
        const content = this.getBookListReply(state);

        return res.send({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                content,
            },
        });
    }

    private getBookListReply(state: BookClubState) {
        const books = state.shortlist.books.map((book, i) => {
            return `${i + 1}) ${book.title} by ${book.author} (${book.url}).`;
        });

        const booksList =
            books.length > 0
                ? books.join('\n')
                : 'No books in the shortlist yet! Add some with "/shortlist add <Goodreads url>"';

        return 'This is the current shortlist:\n' + booksList;
    }

    private async executeAddCommand(
        req: Request,
        res: Response,
        state: BookClubState,
    ): Promise<Response> {
        const { data } = req.body;
        const url = data.options[0].options[0].value;

        const initialSend = res.send({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                content:
                    'Request to add the book to the shortlist received! Let me find some more data..',
            },
        });

        const book = await getBookData(url);

        if (book !== null) {
            state.shortlist.books.push({
                id: book.id,
                title: book.title,
                author: book.author,
                url: book.url,
            });

            const resultStr =
                'The following book was added to the shortlist:\n' +
                `${book.title} by ${book.author} (${book.url}).`;

            const endpoint = `webhooks/${config.APP_ID}/${req.body.token}/messages/@original`;

            try {
                // Update ephemeral message
                await DiscordRequest(endpoint, {
                    method: 'PATCH',
                    body: {
                        content: resultStr,
                        components: [],
                    },
                });
                return initialSend;
            } catch (err) {
                console.error('Error sending message:', err);
                return initialSend;
            }
        } else {
            return res.send({
                type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                data: {
                    content: "Mehhh.. I couldn't find the book.",
                },
            });
        }
    }

    private async executeRemoveCommand(
        req: Request,
        res: Response,
        state: BookClubState,
    ): Promise<Response> {
        const { data } = req.body;
        const removeIndex = data.options[0].options[0].value - 1;
        if (removeIndex >= 0 && removeIndex < state.shortlist.books.length) {
            const [book] = state.shortlist.books.splice(removeIndex, 1);
            return res.send({
                type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                data: {
                    content:
                        'Removed this book from the shortlist:\n' +
                        `${book.title} by ${book.author} (${book.url}).`,
                },
            });
        } else {
            return res.send({
                type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                data: {
                    content:
                        "Uh, we don't have a book with that number on our shortlist!",
                },
            });
        }
    }
}
