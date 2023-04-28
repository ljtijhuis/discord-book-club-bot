import { Request, Response } from 'express';
import { BookClubState } from '../types/BookClubState.js';
import { IAction, IGatewayAction } from './MessageActionFactory.js';
import { InteractionResponseType } from 'discord-interactions';
import { Interaction } from 'discord.js';

export default class BookVoteAction implements IAction, IGatewayAction {
    async executeGatewayAction(
        interaction: Interaction,
        state: BookClubState,
    ): Promise<void> {
        if (!interaction.isStringSelectMenu()) {
            return;
        }
        const user = interaction.member?.user.id;
        const name = interaction.member?.user.username;
        const values = interaction.values;

        this.storeVotes(state, user, values);
        const votes = this.listVotes(state);

        await interaction.reply(`${name}, your vote was registered! Current votes are:\n` +
            votes.join('\n'));
    }
    async execute(
        req: Request,
        res: Response,
        state: BookClubState,
    ): Promise<Response> {
        const { data, member } = req.body;
        const { values } = data;

        // id to make sure we don't let people vote more than once
        const user = member.user.id;
        const name = member.nick ?? member.user.username;

        this.storeVotes(state, user, values);
        const votes = this.listVotes(state);

        return res.send({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
                content:
                    `${name}, your vote was registered! Current votes are:\n` +
                    votes.join('\n'),
            },
        });
    }

    private listVotes(state: BookClubState) {
        return state.vote.books.map((book) => {
            const voteCount = state.vote.votes.filter(
                (vote) => vote.book.id === book.id
            ).length;
            return `${book.title} by ${book.author}: ${voteCount} ${voteCount === 1 ? 'vote' : 'votes'}`;
        });
    }

    private storeVotes(state: BookClubState, user: any, values: any) {
        // clear user's current votes
        state.vote.votes = state.vote.votes.filter(
            (vote) => vote.user !== user
        );

        // add new votes
        values.forEach((book_id: string) => {
            const book = state.vote.books.find((b) => b.id === book_id);
            if (book !== undefined) {
                state.vote.votes.push({
                    book,
                    user,
                });
            }
        });
    }
}
