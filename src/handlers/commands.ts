import { mentionUser } from '@grammyjs/parse-mode'

import { defaultKeyboard } from './keyboard'
import type { Context } from 'grammy'

export async function start(ctx: Context) {
  const user = ctx.from!

  const mention = mentionUser(user.first_name, user.id)

  await ctx.reply(`Welcome ${mention}!`, {
    parse_mode: 'HTML',
    reply_markup: defaultKeyboard,
  })
}
