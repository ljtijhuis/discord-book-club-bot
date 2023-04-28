import config from '../config.js';
import { InteractionResponseType } from 'discord-interactions';
import { Request, Response } from 'express';
import { DiscordRequest } from '../utils.js';
import { getBookData } from '../goodreads/goodreads_search.js';
import { BookClubState } from '../types/BookClubState.js';
import { ICommand, IGatewayCommand } from './CommandFactory.js';
import { Interaction } from 'discord.js';
import { Book } from '../types/Book.js';

export default class BookEventCommand implements ICommand, IGatewayCommand {
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
                const eventsList = this.composeEventsList(state);
                interaction.editReply('These are the scheduled book club events:\n' +
                    eventsList,
                );
            } else if (subCommand === 'add') {

// TODO date and url

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
                throw new Error(`Missing subcommand implementation: ${subCommand}`);
            } else {

            throw new Error(`Missing subcommand implementation: ${subCommand}`);
            }

        } catch (error) {
            console.error('error', error);
            await interaction.editReply(
                'Something went wrong while getting your events..',
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
            return this.executeListCommand(res, state);
        } else if (subCommand === 'add') {
            return this.executeAddCommand(req, res, state);
        } else if (subCommand === 'remove') {
            return this.executeRemoveCommand(req,res,state);
        }

        throw new Error('Missing subcommand implementation');
    }

    private executeListCommand(res: Response, state: BookClubState) {
        const eventsList = this.composeEventsList(state);

        return res.send({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                content: 'These are the scheduled book club events:\n' +
                    eventsList,
            },
        });
    }

    private composeEventsList(state: BookClubState) {
        const events = state.events.map((event, i) => {
            const { book, date } = event;
            return (
                `#${i + 1} On ${date.toLocaleString()}, this book is scheduled:\n` +
                `${book.title} by ${book.author} (${book.url}).\n`
            );
        });

        const eventsList = events.length > 0
            ? events.join('\n')
            : 'There are no events scheduled! Add some with "/bookevent add <Date> <Goodreads url>"';
        return eventsList;
    }

    private async executeAddCommand(req:Request, res:Response, state: BookClubState) {
        const { data } = req.body;
        const dateStr = data.options[0].options[0].value;
            const date = new Date(dateStr);
            const url = data.options[0].options[1].value;

            const initialSend = res.send({
                type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                data: {
                    content: 'Request to add a new event received! Let me find some more data on the book..',
                },
            });

            const book = await getBookData(url);

            if (book !== null) {
                state.events.push({
                    date,
                    book,
                });

                const resultStr =
                    'The following event was added to the events list:\n' +
                    `On ${date.toLocaleString()}, we will discuss ${
                        book.title
                    } by ${book.author} (${
                        book.url
                    }). Get your Libby reservation now!`;

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
                        content:
                            "Mehhh.. I couldn't find the book you were trying to add.",
                    },
                });
            }
    }

    private async executeRemoveCommand(req:Request, res:Response, state: BookClubState) {
        const { data } = req.body;
        const removeIndex = data.options[0].options[0].value - 1;
        if (removeIndex >= 0 && removeIndex < state.events.length) {
            const [event] = state.events.splice(removeIndex, 1);
            const { book, date } = event;
            return res.send({
                type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                data: {
                    content:
                        'Removed this event from your scheduled events:\n' +
                        `${book.title} by ${
                            book.author
                        } which was scheduled for ${date.toLocaleString()}.`,
                },
            });
        } else {
            return res.send({
                type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                data: {
                    content:
                        "Uh, we don't have an event with that number in our scheduled events!",
                },
            });
        }
    }
}
