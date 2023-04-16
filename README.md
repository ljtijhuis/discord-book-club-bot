# Discord book club bot

I used the Discord getting started bot as a starting point, see that documentation below.

## Features

The book club bot provides these features:
* Search for books leveraging Goodreads
* Keep track of a shortlist of books your club is interested in
* Start a vote using the books from the shortlist to decide your next pick
* Keep track of your book club events, listing dates and the book to be discussed

The whole app is centered around Goodreads. Since they don't allow API access any longer, the bot scrapes the public search results and basic book information from the book pages.

## Commands

Search:
* `/booksearch <query>` Returns the top 3 results from Goodreads search.

Shortlist:
* `/shortlist add <Goodreads URL>` Add a book to shortlist (hint: copy the Goodreads URL from the booksearch result).
* `/shortlist list` See all shortlisted books (including URLs).
* `/shortlist remove <number>` Removes a book from the shortlist. The number is the number reported through the `list` command.

Vote:
* `/startvote` This creates a new vote with all the books on the shortlist. Members can pick their favorites from the dropdown.

Event:
* `/bookevent add <date> <Goodreads URL>` Schedule the book provided through the Goodreads URL on the given date (e.g. `05-24-2023 21:00`).
* `/bookevent list` List all (future and past) events scheduled.
* `/bookevent remove <number>` Removes an event from the events list. The number is the number reported through the `list` command.

## Notes

* There are probably a couple of improvements to be made:
  * A vote never ends, but the select menu can only be found in the original message where it was started. Members will have to scroll there if they are late to the party.
  * The shortlist is not updated based on the vote or scheduled events. You will probably want to remove a book from the shortlist after it gets planned.
  * We require the Goodreads URL to be passed as a param in a couple of places. Whenever we get the URL, we retrieve information on the book through Goodreads. Hopefully there is never any discrepancies :)
  * I am sure I haven't found all bugs yet, but let's see what we run into!
  * Oh yeah, state is not server specific right now and file based. I.e. it won't scale well, but I don't expect this to be shared to any other servers (or even know how people would be able to find it).
  * Things could be nicer looking or better worded! There are definitely options with the "Message Components" Discord offers (e.g. the select menu for the vote). Suggestions are welcome!


---

# Getting Started app for Discord

This project contains a basic rock-paper-scissors-style Discord app written in JavaScript, built for the [getting started guide](https://discord.com/developers/docs/getting-started).

![Demo of app](/assets/getting-started-demo.gif?raw=true)

> ✨ A version of this code is also hosted **[on Glitch 🎏](https://glitch.com/~getting-started-discord)** and **[on Replit 🌀](https://replit.com/github/discord/discord-example-app)**

## Project structure
Below is a basic overview of the project structure:

```
├── examples    -> short, feature-specific sample apps
│   ├── app.js  -> finished app.js code
│   ├── button.js
│   ├── command.js
│   ├── modal.js
│   ├── selectMenu.js
├── .env.sample -> sample .env file
├── app.js      -> main entrypoint for app
├── commands.js -> slash command payloads + helpers
├── game.js     -> logic specific to RPS
├── utils.js    -> utility functions and enums
├── package.json
├── README.md
└── .gitignore
```

## Running app locally

Before you start, you'll need to install [NodeJS](https://nodejs.org/en/download/) and [create a Discord app](https://discord.com/developers/applications) with the proper permissions:
- `applications.commands`
- `bot` (with Send Messages enabled)


Configuring the app is covered in detail in the [getting started guide](https://discord.com/developers/docs/getting-started).

### Setup project

First clone the project:
```
git clone https://github.com/discord/discord-example-app.git
```

Then navigate to its directory and install dependencies:
```
cd discord-example-app
npm install
```
### Get app credentials

Fetch the credentials from your app's settings and add them to a `.env` file (see `.env.sample` for an example). You'll need your app ID (`APP_ID`), bot token (`DISCORD_TOKEN`), and public key (`PUBLIC_KEY`).

Fetching credentials is covered in detail in the [getting started guide](https://discord.com/developers/docs/getting-started).

> 🔑 Environment variables can be added to the `.env` file in Glitch or when developing locally, and in the Secrets tab in Replit (the lock icon on the left).

### Install slash commands

The commands for the example app are set up in `commands.js`. All of the commands in the `ALL_COMMANDS` array at the bottom of `commands.js` will be installed when you run the `register` command configured in `package.json`:

```
npm run register
```

### Run the app

After your credentials are added, go ahead and run the app:

```
node app.js
```

> ⚙️ A package [like `nodemon`](https://github.com/remy/nodemon), which watches for local changes and restarts your app, may be helpful while locally developing.

If you aren't following the [getting started guide](https://discord.com/developers/docs/getting-started), you can move the contents of `examples/app.js` (the finished `app.js` file) to the top-level `app.js`.

### Set up interactivity

The project needs a public endpoint where Discord can send requests. To develop and test locally, you can use something like [`ngrok`](https://ngrok.com/) to tunnel HTTP traffic.

Install ngrok if you haven't already, then start listening on port `3000`:

```
ngrok http 3000
```

You should see your connection open:

```
Tunnel Status                 online
Version                       2.0/2.0
Web Interface                 http://127.0.0.1:4040
Forwarding                    http://1234-someurl.ngrok.io -> localhost:3000
Forwarding                    https://1234-someurl.ngrok.io -> localhost:3000

Connections                  ttl     opn     rt1     rt5     p50     p90
                              0       0       0.00    0.00    0.00    0.00
```

Copy the forwarding address that starts with `https`, in this case `https://1234-someurl.ngrok.io`, then go to your [app's settings](https://discord.com/developers/applications).

On the **General Information** tab, there will be an **Interactions Endpoint URL**. Paste your ngrok address there, and append `/interactions` to it (`https://1234-someurl.ngrok.io/interactions` in the example).

Click **Save Changes**, and your app should be ready to run 🚀

## Other resources
- Read **[the documentation](https://discord.com/developers/docs/intro)** for in-depth information about API features.
- Browse the `examples/` folder in this project for smaller, feature-specific code examples
- Join the **[Discord Developers server](https://discord.gg/discord-developers)** to ask questions about the API, attend events hosted by the Discord API team, and interact with other devs.
- Check out **[community resources](https://discord.com/developers/docs/topics/community-resources#community-resources)** for language-specific tools maintained by community members.
