import { Hono } from 'hono'

import { GetFormatDate } from '@common/dayjs'

const app = new Hono<{ Bindings: HonoBindings }>().basePath('/server/')

app.get('/', (c) => {
  return c.json({
    time: GetFormatDate(),
    version: c.env.VERSION,
  })
})

export default app
