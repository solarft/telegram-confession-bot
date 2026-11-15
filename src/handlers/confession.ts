import { InlineKeyboard, type Context, type SessionFlavor } from 'grammy'
import { redis } from '..'
import { broadcastToAdmin } from '../services/broadcast'
import { clearApprovalMarkup, defaultKeyboard } from './keyboard'
import type { Conversation, ConversationFlavor } from '@grammyjs/conversations'
import type { Message } from 'grammy/types'

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
    // Cut by code points (Array.from), not UTF-16 code units: an emoji is a
    // surrogate pair, and slicing mid-pair produces half an emoji — invalid
    // UTF-8 that Telegram rejects ("button text must be encoded in UTF-8").
    const chars = Array.from(lastReply)
    const label =
      chars.length > 32 ? `${chars.slice(0, 32).join('')}...` : lastReply
    keyboard.text(label, String(offset + i)).row()
  })

  if (offset > 0) keyboard.text('⬅️ Prev', 'prev')
  if (confessions.length === PAGE_SIZE) keyboard.text('➡️ Next', 'next')
  keyboard.text('❌ Cancel', 'cancel')

  return { keyboard, confessions }
}

const cancelMarkup = new InlineKeyboard().text('❌ Cancel', 'cancel')

/**
 * grammY's collapsed Message type doesn't narrow through `in` checks, so
 * this runtime predicate carries the narrowing for the conversation waits.
 */
function isConfessionPayload(
  msg: unknown,
): msg is Message.TextMessage | Message.PhotoMessage {
  return (
    typeof (msg as Message.TextMessage | undefined)?.text === 'string' ||
    Array.isArray((msg as Message.PhotoMessage | undefined)?.photo)
  )
}

/**
 * Waits for the next confession payload (text or photo). Returns null when
 * the user presses ❌ Cancel — the prompt is then edited to confirm. Any
 * other update type (stickers, voice notes, …) is silently ignored while
 * the flow keeps waiting.
 */
async function waitForConfessionOrCancel(
  conversation: BotConversation,
): Promise<Message.TextMessage | Message.PhotoMessage | null> {
  while (true) {
    const update = await conversation.wait()
    if (update.callbackQuery?.data === 'cancel') {
      await update.answerCallbackQuery()
      await update.editMessageText('❌ Cancelled.', {
        reply_markup: clearApprovalMarkup,
      })
      return null
    }
    const msg = update.message
    if (isConfessionPayload(msg)) {
      return msg
    }
  }
}

export async function submitConfession(
  conversation: BotConversation,
  ctx: InnerContext,
) {
  await ctx.reply(
    'Send your confession — a text message or a photo (with caption)',
    { reply_markup: cancelMarkup },
  )
  const confession = await waitForConfessionOrCancel(conversation)
  if (!confession) return

  try {
    await broadcastToAdmin(confession)
    await ctx.reply('Your confession has been sent for approval!', {
      reply_markup: defaultKeyboard,
    })
  } catch (error) {
    console.error(
      'broadcastToAdmin failed:',
      error,
      '\ncause:',
      (error as Error & { cause?: unknown }).cause,
    )
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

    if (data === 'cancel') {
      await callbackCtx.editMessageText('❌ Cancelled.', {
        reply_markup: clearApprovalMarkup,
      })
      return
    }
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

  await ctx.reply(
    `<b>Replying to:</b>\n\n${selectedConfession}\n\nSend your reply — a text message or a photo (with caption):`,
    { parse_mode: 'HTML', reply_markup: cancelMarkup },
  )

  const replyMsg = await waitForConfessionOrCancel(conversation)
  if (!replyMsg) return
  // A caption-less photo reply still needs something in the quoted text,
  // otherwise the stored confession ends with a dangling "💬 ".
  const replyText =
    'photo' in replyMsg
      ? (replyMsg.caption ?? '').trim() || '(User sent a photo)'
      : replyMsg.text

  try {
    await broadcastToAdmin(replyMsg, `${selectedConfession}\n\n💬 ${replyText}`)
    await ctx.reply('Your reply has been sent for approval!', {
      reply_markup: defaultKeyboard,
    })
  } catch (error) {
    console.error(
      'broadcastToAdmin failed:',
      error,
      '\ncause:',
      (error as Error & { cause?: unknown }).cause,
    )
    await ctx.reply('amalakkkk. sum ting went rong la. try agen leter ok', {
      reply_markup: defaultKeyboard,
    })
  }
}
