import 'next-auth'
import 'next-auth/jwt'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      username: string
      displayName: string
      avatar?: string | null
    }
  }

  interface User {
    id: string
    email: string
    username?: string
    displayName?: string
    avatar?: string | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    sub: string
  }
}
