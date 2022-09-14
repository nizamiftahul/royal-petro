import { api } from 'web-init'

export default api(
    '/api/hashpassword',
    async ({ req, reply, ext, server, dirs, baseurl }) => {
        reply.send({ hashedPW: ext.Password.hash(req.body.password), message: 'Success' })
    }
)