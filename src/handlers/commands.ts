import { mentionUser } from '@grammyjs/parse-mode'

import * as kb from './keyboard'
import type { Context } from 'grammy'

export async function start(ctx: Context) {
  const user = ctx.from!

  const mention = mentionUser(user.first_name, user.id)

  await ctx.reply(`Welcome ${mention}!`, { reply_markup: kb.defaultKeyboard })
}
