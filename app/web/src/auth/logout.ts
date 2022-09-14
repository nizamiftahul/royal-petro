import { logout } from 'platform'

export default logout(async ({ req }) => {
  req.session.role = ''
  req.session.p_role = null
})
