# TradeX Solana Wallet Telegram Bot

A Bun + TypeScript Telegram bot for basic Solana wallet operations.

The bot currently supports:

- Creating a new Solana keypair per Telegram user session
- Airdropping 0.5 SOL on local/dev validator networks
- Viewing wallet public address
- Sending SOL to an existing on-chain recipient account

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [How It Works](#how-it-works)
- [Implemented Features](#implemented-features)
- [Planned or Partially Wired Features](#planned-or-partially-wired-features)
- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Setup](#setup)
- [Run the Bot](#run-the-bot)
- [User Flow](#user-flow)
- [Security Notes](#security-notes)
- [Error Handling and Operational Notes](#error-handling-and-operational-notes)
- [Development Notes](#development-notes)
- [Troubleshooting](#troubleshooting)
- [Roadmap Suggestions](#roadmap-suggestions)
- [License](#license)

## Overview

This project is a Telegram bot that connects users to Solana wallet actions via inline buttons and chat prompts.

It uses:

- `telegraf` for Telegram bot interactions
- `@solana/web3.js` for wallet and transaction operations
- Bun runtime for development execution

The core entry point is `index.ts`, where all bot logic is currently implemented.

## Tech Stack

- Runtime: Bun
- Language: TypeScript (strict mode)
- Telegram SDK: Telegraf `^4.16.3`
- Solana SDK: `@solana/web3.js` `^1.98.4`

## Project Structure

```text
.
├── index.ts        # Main bot implementation
├── package.json    # Dependencies and package metadata
├── tsconfig.json   # TypeScript compiler configuration
└── README.md
```

## How It Works

At runtime, the bot initializes:

1. Telegram bot instance using `TG_BOT_TOKEN`
2. Solana RPC connection using `SOLANA_LOCAL_RPC`
3. In-memory stores:
   - `USERS`: maps Telegram user IDs to generated keypairs
   - `PENDING_REQUESTS`: tracks multi-step actions (currently SOL send flow)

The `send SOL` operation is implemented as a stateful two-step chat flow:

1. User taps "Send SOL"
2. Bot asks recipient address
3. Bot asks amount
4. Bot validates amount and available balance
5. Bot validates recipient account existence on-chain
6. Bot constructs, signs, sends, and confirms a transfer transaction

## Implemented Features

- `/start` welcome screen with inline keyboard
- Generate wallet (`Keypair.generate()`)
- Request airdrop (`0.5 SOL`) for generated wallet
- View generated wallet address
- Send SOL with transaction confirmation

## Planned or Partially Wired Features

These options exist in UI text/buttons but are not fully implemented in current code:

- `check_balance` callback handler
- `transaction_history` callback handler
- `export_private_key` callback handler
- `send_token` callback handler (SPL token transfer flow)

If you click these buttons now, no corresponding action handler exists.

## Prerequisites

Install the following on your machine:

- Bun (recommended runtime for this project)
- A Telegram bot token from BotFather
- A reachable Solana RPC endpoint

For local development with airdrops, run against a local validator or devnet-compatible endpoint where airdrops are allowed.

## Environment Variables

Create a `.env` file in the project root with:

```env
TG_BOT_TOKEN=your_telegram_bot_token
SOLANA_LOCAL_RPC=http://127.0.0.1:8899
```

Variable details:

- `TG_BOT_TOKEN`: Telegram Bot API token
- `SOLANA_LOCAL_RPC`: Solana JSON-RPC endpoint URL

Important: The current code does not validate env vars before use. Missing or invalid values can crash startup.

## Setup

Install dependencies:

```bash
bun install
```

## Run the Bot

Start directly from entry file:

```bash
bun run index.ts
```

When startup succeeds, the bot launches with allowed updates:

- `message`
- `callback_query`

## User Flow

1. Send `/start` to the bot.
2. Click `Generate Wallet`.
3. Bot creates a keypair and requests airdrop.
4. Use `View Address` to see public key.
5. Click `Send SOL` and follow prompts:
   - Enter recipient address
   - Enter amount in SOL

## Security Notes

Current implementation is suitable for local development and testing, not production custody.

- Wallets are stored in-process memory only
- Data is lost on restart
- Private key export/encryption is not implemented despite welcome text
- No persistent encrypted storage exists
- No authentication beyond Telegram chat identity

Do not use this bot to manage meaningful funds in production in its current form.

## Error Handling and Operational Notes

Current behavior includes:

- User-friendly failure messages for wallet generation and transaction failures
- Recipient account existence check before transfer
- Basic balance + fee buffer check before send

Known operational caveats:

- Invalid recipient public key format can throw before friendly handling
- Airdrop can fail on RPCs that disallow faucet requests
- Some UI actions are present but not implemented

## Development Notes

TypeScript config highlights:

- Strict mode enabled
- `noUncheckedIndexedAccess` enabled
- Bundler-oriented module resolution
- `noEmit: true` (runtime execution via Bun)

Dependencies from `package.json`:

- Runtime: `@solana/web3.js`, `telegraf`
- Dev: `@types/bun`, `typescript` (peer)

## Troubleshooting

### Bot does not start

- Ensure `TG_BOT_TOKEN` is set and valid
- Ensure `SOLANA_LOCAL_RPC` is reachable
- Check runtime logs for startup errors

### Wallet generated but airdrop fails

- Use a local validator or an RPC/faucet that supports airdrop
- Verify RPC URL and cluster compatibility

### Send SOL fails

- Verify recipient account exists on-chain
- Ensure amount is positive and balance covers amount + fees

## Roadmap Suggestions

- Add env validation at boot (fail fast with clear messages)
- Add persistent encrypted wallet storage
- Implement missing callback handlers
- Add SPL token transfer flow
- Add transaction history query
- Add tests for flow/state management
- Split `index.ts` into modules (`bot`, `wallet`, `tx`, `handlers`)

## License

No license file is currently included in this repository.
Add a `LICENSE` file to define usage terms.
