import {
  Keypair,
  PublicKey,
  Connection,
  SystemProgram,
  LAMPORTS_PER_SOL,
  Transaction,
} from "@solana/web3.js";
import { Telegraf, Markup, Context } from "telegraf";
import { message } from "telegraf/filters";

const bot = new Telegraf(process.env.TG_BOT_TOKEN as string);

const connection = new Connection(process.env.SOLANA_LOCAL_RPC as string);

interface PendingRequestType {
  type: "SEND_SOL" | "SEND_TOKEN";
  amount?: number;
  to?: PublicKey | string;
}

const USERS: Record<string, Keypair> = {};
const PENDING_REQUESTS: Record<string, PendingRequestType> = {};

bot.start(async (ctx: Context) => {
  const userId = ctx.from?.id;
  if (!userId) return;

  let welcomeMessage =
    "<b>Welcome to TradeX Solana Wallet Bot!</b>\n\n" +
    "Your secure, easy-to-use Solana wallet manager.\n\n" +
    "<b>Features:</b>\n" +
    "• Generate new wallets\n" +
    "• Import existing wallets\n" +
    "• Check balances\n" +
    "• Send SOL and SPL tokens\n" +
    "• View transaction history\n" +
    "• Secure private key storage\n\n" +
    "<b>Security:</b>\n" +
    "• All private keys are encrypted\n" +
    "• Never share your private keys\n" +
    "• Use at your risk (testnet recommended)\n\n" +
    "Choose an option below to get started:";

  return ctx.reply(welcomeMessage, {
    parse_mode: "HTML",
    ...Markup.inlineKeyboard([
      [Markup.button.callback("🆕 Generate Wallet", "generate_wallet")],
      [
        Markup.button.callback("📍 View Address", "view_address"),
        Markup.button.callback("🔑 Export Private Key", "export_private_key"),
      ],
      [Markup.button.callback("💰 Check Balance", "check_balance")],
      [Markup.button.callback("📜 Transaction History", "transaction_history")],
      [
        Markup.button.callback("🚀 Send SOL", "send_sol"),
        Markup.button.callback("🪙 Send Token", "send_token"),
      ],
    ]),
  });
});

bot.action("generate_wallet", async (ctx) => {
  try {
    await ctx.answerCbQuery("Generating new wallet");

    const keypair = Keypair.generate();

    const userId = String(ctx.from?.id);
    USERS[userId] = keypair;
    const user = USERS[userId];

    const airdropSignature = await connection.requestAirdrop(
      user.publicKey,
      0.5 * LAMPORTS_PER_SOL,
    );

    await connection.confirmTransaction(airdropSignature, "confirmed");

    const balance = await connection.getBalance(user.publicKey);

    await ctx.editMessageText(
      "✅ <b>Wallet Created Successfully!</b>\n\n" +
        "🪙 Airdropped <code>0.5 SOL</code> to your wallet\n\n" +
        "📍 <b>Public Key:</b>\n" +
        `<code>${keypair.publicKey.toBase58()}</code>\n\n` +
        `Your current balance is: <code>${balance}</code>\n\n` +
        "Keep your private key safe!",
      {
        parse_mode: "HTML",
        ...Markup.inlineKeyboard([
          [
            Markup.button.callback("📍 View Address", "view_address"),
            Markup.button.callback(
              "🔑 Export Private Key",
              "export_private_key",
            ),
          ],
          [Markup.button.callback("💰 Check Balance", "check_balance")],
          [
            Markup.button.callback(
              "📜 Transaction History",
              "transaction_history",
            ),
          ],
          [
            Markup.button.callback("🚀 Send SOL", "send_sol"),
            Markup.button.callback("🪙 Send Token", "send_token"),
          ],
        ]),
      },
    );
  } catch (error) {
    console.error("Wallet error: ", error);
    await ctx.answerCbQuery("❌ Failed to generate wallet");
    return ctx.reply("❌ An error occurred. Please try again");
  }
});

bot.action("view_address", async (ctx) => {
  const userId = String(ctx.from?.id);
  const user = USERS[userId];

  if (!user) {
    return ctx.answerCbQuery("⚠️ Generate wallet first");
  }

  await ctx.answerCbQuery("Fetching address");

  return await ctx.reply(
    `📍 Your Address:\n<code>${user.publicKey.toBase58()}</code>`,
    {
      parse_mode: "HTML",
    },
  );
});

bot.action("send_sol", async (ctx) => {
  const userId = ctx.from?.id;
  await ctx.answerCbQuery(); // To not show any Loader popup
  await ctx.reply("Please share the address to send SOL");
  PENDING_REQUESTS[userId] = {
    type: "SEND_SOL",
  };
});

bot.on(message("text"), async (ctx) => {
  const userId = String(ctx.from?.id);
  const user = USERS[userId];

  if (!user) {
    return ctx.reply("⚠️ Generate wallet first");
  }

  const balance = await connection.getBalance(user?.publicKey);

  const request = PENDING_REQUESTS[userId];

  if (request?.type === "SEND_SOL") {
    if (request && !request.to) {
      request.to = ctx.message.text;
      await ctx.reply("How much SOL you want to send?");
    } else {
      const amount = Number(ctx.message.text);

      if (isNaN(amount) || amount <= 0) {
        return await ctx.reply("Please enter a valid transferable amount");
      }

      if (amount > balance) {
        return await ctx.reply("Insufficient balance");
      }

      const toAddress = request.to;

      if (!toAddress) {
        return await ctx.reply("❌ Invalid recipient address");
      }

      const toPubkey =
        typeof toAddress === "string" ? new PublicKey(toAddress) : toAddress;

      // Create Tx and forward it to Blockchain
      try {
        const ix = SystemProgram.transfer({
          fromPubkey: user.publicKey,
          toPubkey,
          lamports: amount * LAMPORTS_PER_SOL,
        });

        const tx = new Transaction().add(ix);

        const { blockhash } = await connection.getLatestBlockhash();
        tx.recentBlockhash = blockhash;
        tx.feePayer = user.publicKey;
        tx.sign(user);

        const signature = await connection.sendRawTransaction(tx.serialize());

        await connection.confirmTransaction(signature, "confirmed");

        await ctx.reply(
          `✅ Sent <code>${amount} SOL</code> to <code>${toPubkey}</code> successfully`,
          {
            parse_mode: "HTML",
          },
        );

        await ctx.editMessageText(
          `✅ Sent <code>${amount} SOL</code> to <code>${toPubkey}</code> successfully`,
          {
            parse_mode: "HTML",
            ...Markup.inlineKeyboard([
              [
                Markup.button.callback("📍 View Address", "view_address"),
                Markup.button.callback(
                  "🔑 Export Private Key",
                  "export_private_key",
                ),
              ],
              [Markup.button.callback("💰 Check Balance", "check_balance")],
              [
                Markup.button.callback(
                  "📜 Transaction History",
                  "transaction_history",
                ),
              ],
              [
                Markup.button.callback("🚀 Send SOL", "send_sol"),
                Markup.button.callback("🪙 Send Token", "send_token"),
              ],
            ]),
          },
        );
      } catch (error) {
        await ctx.reply("❌ Transaction failed");
      }

      delete PENDING_REQUESTS[userId];
    }
  }
  ctx.message.text;
});

async function startBot(): Promise<void> {
  try {
    await bot.launch({
      allowedUpdates: ["message", "callback_query"],
    });
  } catch (error) {
    console.error("Failed to start bot: ", error);
    process.exit(1);
  }
}

startBot();
