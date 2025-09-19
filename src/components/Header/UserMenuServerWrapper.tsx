import type { User } from "next-auth"

import { UserMenu } from "./UserMenu"

export const UserMenuServerWrapper = ({ user }: { user: User | null }) => {
  return <UserMenu initialUser={user} />
}

