import { bot } from '../bot'
import { ADMIN_GROUP_ID } from '../env'
import { approvalKeyboard } from '../handlers/keyboard'
import { startBallot } from './voting'
import type { Message } from 'grammy/types'

export const confessionPrefix = '📝 wei wei wei ada confession baru\n\n'

export async function broadcastToAdmin(
  message: Message.TextMessage | Message.PhotoMessage,
  text?: string,
) {
  let sent: Message.TextMessage | Message.PhotoMessage

  if ('photo' in message) {
    sent = await bot.api.sendPhoto(
      ADMIN_GROUP_ID,
      message.photo.at(-1)!.file_id,
      {
        caption: `${confessionPrefix}${text ?? `🗣️ ${message.caption ?? ''}`}`,
        parse_mode: 'HTML',
        reply_markup: approvalKeyboard(),
      },
    )
  } else {
    sent = await bot.api.sendMessage(
      ADMIN_GROUP_ID,
      `${confessionPrefix}${text ?? `🗣️ ${message.text}`}`,
      { parse_mode: 'HTML', reply_markup: approvalKeyboard() },
    )
  }

  // The ballot exists from the moment the message with the buttons exists —
  // a fresh, zero-vote ballot must be distinguishable from an expired one.
  await startBallot(sent.message_id)
  return sent
}
