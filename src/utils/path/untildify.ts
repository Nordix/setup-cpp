import { join } from "path"
import untildify from "untildify"
import { isRoot } from "../env/sudo"

export function untildify_user(path: string) {
  if (isRoot() && typeof process.env.SUDO_USER === "string") {
    // use the user profile even if root
    if (process.platform === "darwin") {
      return join("/Users/", process.env.SUDO_USER, path)
    } else {
      return join("/home/", process.env.SUDO_USER, path)
    }
  } else {
    return untildify(`~/${path}`)
  }
}
