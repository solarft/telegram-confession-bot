import { conversations, createConversation } from '@grammyjs/conversations'
import { Bot, InputFile, session } from 'grammy'
import { BOT_TOKEN } from './env'
import { registerAdminHandlers } from './handlers/admin'
import * as commands from './handlers/commands'
import {
  replyConfession,
  submitConfession,
  type BotContext,
} from './handlers/confession'
import { defaultKeyboard } from './handlers/keyboard'

export const bot = new Bot<BotContext>(BOT_TOKEN)

bot.use(session({ initial: () => ({}) }))
bot.use(conversations())
bot.use(createConversation(submitConfession, 'submitConfession'))
bot.use(createConversation(replyConfession, 'replyConfession'))

bot.command('start', commands.start)
bot.hears('🗣️ New confession', (ctx) =>
  ctx.conversation.enter('submitConfession'),
)
bot.hears('💬 Reply to a confession', (ctx) =>
  ctx.conversation.enter('replyConfession'),
)
bot.hears('❓ How to confess/reply', (ctx) =>
  ctx.replyWithPhoto(new InputFile('../assets/confession_info.png'), {
    caption:
      'Use the reply keyboard to begin submitting confessions for approval.\n\n💬 Reply:\nNo need to copy and paste a confession. Just click the reply button and select which confession you would like to reply to.',
    reply_markup: defaultKeyboard,
  }),
)
registerAdminHandlers(bot)
