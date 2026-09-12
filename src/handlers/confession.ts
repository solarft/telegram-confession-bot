import { InlineKeyboard, type Context, type SessionFlavor } from 'grammy'
import { redis } from '..'
import { broadcastToAdmin } from '../services/broadcast'
import { defaultKeyboard } from './keyboard'
import type { Conversation, ConversationFlavor } from '@grammyjs/conversations'

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
    await broadcastToAdmin(`🗣️ ${confessionText}`)
    await ctx.reply('Your confession has been sent for approval!', {
      reply_markup: defaultKeyboard,
    })
  } catch {
    await ctx.reply('amalakkkk. sum ting went rong la. try agen leter ok', {
      reply_markup: defaultKeyboard,
    })
  }
}

export async function replyConfession(
  conversation: BotConversation,
  ctx: InnerContext,
) {
  const replySelectionKeyboard = new InlineKeyboard()

  const confessions: string[] = await redis.lrange('recent_confessions', 0, 49)

  confessions.forEach((confession, i) => {
    const lastReply = confession.includes('💬')
      ? confession.slice(confession.lastIndexOf('💬')).trim()
      : confession
    replySelectionKeyboard.text(`${lastReply.slice(0, 32)}...`, String(i)).row()
  })

  await ctx.reply('Please select the confession you want to reply to', {
    reply_markup: replySelectionKeyboard,
  })

  const callbackCtx = await conversation.waitFor('callback_query')
  const selectedIndex = Number(callbackCtx.callbackQuery.data)
  const selectedConfession = confessions[selectedIndex]

  await ctx.reply(`Replying to: "${selectedConfession}"\n\nSend your reply:`)
  const replyCtx = await conversation.waitFor('message:text')
  const replyText = replyCtx.message.text

  await broadcastToAdmin(`${selectedConfession}\n\n💬 ${replyText}`)
}
