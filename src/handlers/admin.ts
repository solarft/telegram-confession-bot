import { redis } from '..'
import { CHANNEL_ID } from '../env'
import { confessionPrefix } from '../services/broadcast'
import { castVote, type VoteSide } from '../services/voting'
import { approvalKeyboard, clearApprovalMarkup } from './keyboard'
import type { BotContext } from './confession'
import type { Bot } from 'grammy'
import type { Message } from 'grammy/types'

const sideLabel = (side: VoteSide) =>
  side === 'approve' ? '✅ Approve' : '❌ Reject'

function confessionOf(msg: Message.TextMessage | Message.PhotoMessage) {
  if ('photo' in msg) {
    return {
      text: (msg.caption ?? '').replace(confessionPrefix, ''),
      fileId: msg.photo.at(-1)!.file_id,
    }
  }
  return { text: msg.text.replace(confessionPrefix, ''), fileId: undefined }
}

export function registerAdminHandlers(bot: Bot<BotContext>) {
  bot.callbackQuery(['approve', 'reject'], async (ctx) => {
    const msg = ctx.callbackQuery.message as
      | Message.TextMessage
      | Message.PhotoMessage
      | undefined
    if (!msg || !ctx.from) {
      await ctx.answerCallbackQuery()
      return
    }

    const data = ctx.callbackQuery.data
    if (data !== 'approve' && data !== 'reject') {
      await ctx.answerCallbackQuery()
      return
    }
    const side: VoteSide = data

    const result = await castVote(msg.message_id, ctx.from.id, side)

    switch (result.status) {
      case 'expired':
        await ctx.answerCallbackQuery({ text: 'This ballot has expired.' })
        return
      case 'already-voted':
        await ctx.answerCallbackQuery({
          text: `You already voted ${sideLabel(result.side)}.`,
        })
        return
      case 'decided':
        await ctx.answerCallbackQuery({
          text: `Voting closed — ${sideLabel(result.side)} won.`,
        })
        return
      case 'voted': {
        await ctx.answerCallbackQuery({
          text: result.switched
            ? `Vote changed to ${sideLabel(result.side)}.`
            : `Vote recorded ${sideLabel(result.side)}.`,
        })
        await ctx.editMessageReplyMarkup({
          reply_markup: approvalKeyboard(result.approves, result.rejects),
        })
        return
      }
      case 'claimed': {
        // Answer first: keeps the callback answered promptly, which deters
        // Telegram re-delivery — and the decided key already guards re-entry.
        await ctx.answerCallbackQuery({
          text: result.side === 'approve' ? 'Approved ✅' : 'Rejected ❌',
        })

        const { text: confessionText, fileId } = confessionOf(msg)

        if (result.side === 'approve') {
          if (fileId) {
            await ctx.api.sendPhoto(CHANNEL_ID, fileId, {
              caption: confessionText,
            })
          } else {
            await ctx.api.sendMessage(CHANNEL_ID, confessionText)
          }
          await redis.lpush('recent_confessions', confessionText)
          await redis.ltrim('recent_confessions', 0, 49)
        }

        const label =
          result.side === 'approve'
            ? '✅ <b>Approved:</b>\n\n'
            : '❌ <b>Rejected:</b>\n\n'
        if (fileId) {
          await ctx.editMessageCaption({
            caption: `${label}${confessionText}`,
            parse_mode: 'HTML',
            reply_markup: clearApprovalMarkup,
          })
        } else {
          await ctx.editMessageText(`${label}${confessionText}`, {
            parse_mode: 'HTML',
            reply_markup: clearApprovalMarkup,
          })
        }
        return
      }
    }
  })
}
