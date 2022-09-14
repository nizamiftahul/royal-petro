import { login } from 'platform'

export default login(async ({ db, req, reply, ext }) => {
  let user = {} as any
  if (req.body.from_web === true) {
    user = await db.p_user.findFirst({
      where: {
        username: req.body.username,
      },
      include: {
        p_role: true,
      },
    })
  } else {
    user = await db.p_user.findFirst({
      where: {
        username: req.body.username,
        id_role: 14,
      },
      include: {
        p_role: true,
      },
    })
  }
  if (!!user) {
    if (ext.Password.verify(req.body.password, user.password)) {
      const u = {} as any
      for (let [k, v] of Object.entries(user)) {
        if (k !== 'password') u[k] = v
      }
      u.role = user.p_role.id
      u.from_web = req.body.from_web

      for (let [key, value] of Object.entries(u)) {
        req.session[key] = value
      }

      reply.send(u)
      return
    }
  }
  reply.code(403).send({
    reason: 'Username and/or password does not found',
  })
})
