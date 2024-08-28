import { defaultExecOptions, execRootSync } from "admina"
import { getAptEnv } from "./apt-env.js"
import { aptTimeout } from "./apt-timeout.js"
import { getApt } from "./get-apt.js"
import { initAptMemoized } from "./init-apt.js"
import { isAptPackInstalled } from "./is-installed.js"
import { updateAptReposMemoized } from "./update.js"

export async function addAptRepository(repo: string, apt = getApt()) {
  await initAptMemoized(apt)
  await installAddAptRepo(apt)
  execRootSync("add-apt-repository", ["-y", "--no-update", repo], { ...defaultExecOptions, env: getAptEnv(apt) })

  // clear the cache
  updateAptReposMemoized.cache.keys = []
  updateAptReposMemoized.cache.values = []
  updateAptReposMemoized(apt)
}

export async function installAddAptRepo(apt: string) {
  if (await isAptPackInstalled("software-properties-common")) {
    return
  }
  execRootSync(
    apt,
    ["install", "-y", "--fix-broken", "-o", aptTimeout, "software-properties-common"],
    { ...defaultExecOptions, env: getAptEnv(apt) },
  )
}
