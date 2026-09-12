import { broadcastToAdmin } from '../services/broadcast'
import { defaultKeyboard } from './keyboard'
import type { Conversation, ConversationFlavor } from '@grammyjs/conversations'
import type { Context, SessionFlavor } from 'grammy'

export type SessionData = Record<string, never>

export type BotContext = Context &
  SessionFlavor<SessionData> &
  ConversationFlavor<Context>

type InnerContext = Context & SessionFlavor<SessionData>

export type BotConversation = Conversation<BotContext, InnerContext>

export async function submitConfession(
  conversation: BotConversation,
  ctx: InnerContext,
) {
  await ctx.reply('Please send your confession text')
  const confessionCtx = await conversation.waitFor('message:text')
  const confessionText = confessionCtx.message.text

  try {
    await broadcastToAdmin(confessionText)
    await ctx.reply('Your confession has been sent for approval!', {
      reply_markup: defaultKeyboard,
    })
  } catch {
    await ctx.reply('amalakkkk. sum ting went rong la. try agen leter ok', {
      reply_markup: defaultKeyboard,
    })
  }
}
