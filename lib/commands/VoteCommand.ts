import { Request, Response } from 'express';
import { BookClubState } from '../types/BookClubState.js';
import { ICommand, IGatewayCommand } from './CommandFactory.js';
import { InteractionResponseType } from 'discord-interactions';
import { Book } from '../types/Book.js';
import { Interaction } from 'discord.js';

export default class VoteCommand implements ICommand, IGatewayCommand {
    async executeGatewayCommand(
        interaction: Interaction,
        state: BookClubState,
    ): Promise<void> {
        if (!interaction.isChatInputCommand()) {
            return;
        }
        try {
            await interaction.deferReply();
            if (state.shortlist.books.length < 2) {
                await interaction.editReply('Before starting a poll, make sure you have at least two books on your shortlist! Check out the commands under `/shortlist` to do so.');
                return;
            }

            // Copy over shortlist to vote state
            this.updateVoteState(state);
            const data = this.composeVoteMessage(state);

            console.log('Sending data');
            console.dir(data, { depth: null });

            await interaction.editReply(data);
        } catch (error) {
            console.error('error', error);
            await interaction.editReply(
                'Something went wrong while starting the vote..',
            );
        }

    }
    async execute(
        req: Request,
        res: Response,
        state: BookClubState,
    ): Promise<Response> {
        try {
            if (state.shortlist.books.length < 2) {
                return res.send({
                    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                    data: {
                        content:
                            'Before starting a poll, make sure you have at least two books on your shortlist! Check out the commands under `/shortlist` to do so.',
                    },
                });
            }

            // Copy over shortlist to vote state
            this.updateVoteState(state);
            const data = this.composeVoteMessage(state);

            console.log('Sending data');
            console.dir(data, { depth: null });

            const result = await res.send({
                type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                data,
            });
            return result;
        } catch (error) {
            console.error(error);
            return res.send({
                type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                data: {
                    content: 'Yeah, no, something went wrong.',
                },
            });
        }
    }

    private composeVoteMessage(state: BookClubState) {
        return {
            content: 'Ok folks, cast your vote! The nominees are:\n',
            components: [
                {
                    type: 1,
                    components: [
                        {
                            type: 3,
                            custom_id: 'book_vote',
                            options: state.shortlist.books.map(
                                (book: Book) => ({
                                    label: book.title.substring(0, 99),
                                    value: book.id.substring(0, 99),
                                    description: `By ${book.author}`,
                                })
                            ),
                            placeholder: 'Pick your votes',
                            min_values: 1,
                            max_values: Math.min(
                                state.vote.books.length,
                                25
                            ),
                        },
                    ],
                },
            ],
        };
    }

    private updateVoteState(state: BookClubState) {
        state.vote = {
            books: [...state.shortlist.books],
            votes: [],
        };
    }
}
