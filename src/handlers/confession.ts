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

const PAGE_SIZE = 10

async function buildConfessionKeyboard(offset: number) {
  const confessions: string[] = await redis.lrange(
    'recent_confessions',
    offset,
    offset + PAGE_SIZE - 1,
  )

  if (confessions.length === 0 && offset === 0) {
    return { keyboard: null, confessions: [] }
  }

  const keyboard = new InlineKeyboard()

  confessions.forEach((confession, i) => {
    const lastReply = confession.includes('💬')
      ? confession.slice(confession.lastIndexOf('💬')).trim()
      : confession
    const label =
      lastReply.length > 32 ? `${lastReply.slice(0, 32)}...` : lastReply
    keyboard.text(label, String(offset + i)).row()
  })

  if (offset > 0) keyboard.text('⬅️ Prev', 'prev')
  if (confessions.length === PAGE_SIZE) keyboard.text('➡️ Next', 'next')

  return { keyboard, confessions }
}

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
  let offset = 0

  const { keyboard, confessions } = await buildConfessionKeyboard(offset)
  if (!keyboard) {
    await ctx.reply('No confessions available yet.', {
      reply_markup: defaultKeyboard,
    })
    return
  }

  await ctx.reply('Please select the confession you want to reply to', {
    reply_markup: keyboard,
  })

  let selectedConfession: string | undefined
  let currentConfessions = confessions

  while (!selectedConfession) {
    const callbackCtx = await conversation.waitFor('callback_query')
    const data = callbackCtx.callbackQuery.data
    await callbackCtx.answerCallbackQuery()

    if (data === 'prev') {
      offset = Math.max(0, offset - PAGE_SIZE)
    } else if (data === 'next') {
      offset += PAGE_SIZE
    } else {
      selectedConfession = currentConfessions[Number(data) - offset]
      continue
    }

    const result = await buildConfessionKeyboard(offset)
    if (!result.keyboard) break

    currentConfessions = result.confessions
    await callbackCtx.editMessageReplyMarkup({ reply_markup: result.keyboard })
  }

  if (!selectedConfession) {
    await ctx.reply('No confession selected.', {
      reply_markup: defaultKeyboard,
    })
    return
  }

  await ctx.reply(`Replying to: "${selectedConfession}"\n\nSend your reply:`)
  const replyCtx = await conversation.waitFor('message:text')
  const replyText = replyCtx.message.text

  try {
    await broadcastToAdmin(`${selectedConfession}\n\n💬 ${replyText}`)
    await ctx.reply('Your reply has been sent for approval!', {
      reply_markup: defaultKeyboard,
    })
  } catch {
    await ctx.reply('amalakkkk. sum ting went rong la. try agen leter ok', {
      reply_markup: defaultKeyboard,
    })
  }
}
