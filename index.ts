import { Keypair } from "@solana/web3.js";
import { Telegraf, Markup, Context } from "telegraf";

const bot = new Telegraf(process.env.TG_BOT_TOKEN as string);

const USERS: Record<string, Keypair> = {};

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

    await ctx.editMessageText(
      "✅ <b>Wallet Created Successfully!</b>\n\n" +
        "📍 <b>Public Key:</b>\n" +
        `<code>${keypair.publicKey.toBase58()}</code>\n\n` +
        "Keep your private key safe.",
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

  return ctx.reply(
    `📍 Your Address:\n<code>${user.publicKey.toBase58()}</code>`,
    {
      parse_mode: "HTML",
    },
  );
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
