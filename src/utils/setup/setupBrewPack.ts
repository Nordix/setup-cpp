/* eslint-disable require-atomic-updates */
import { info } from "@actions/core"
import execa from "execa"
import which from "which"
import { setupBrew } from "../../brew/brew"
import { InstallationInfo } from "./setupBin"

let hasBrew = false

/** A function that installs a package using brew */
export function setupBrewPack(name: string, version?: string, extraArgs: string[] = []): InstallationInfo {
  info(`Installing ${name} ${version ?? ""} via brew`)

  if (!hasBrew || which.sync("brew", { nothrow: true }) === null) {
    setupBrew("", "", process.arch)
    hasBrew = true
  }

  // brew is not thread-safe
  execa.sync("brew", ["install", version !== undefined && version !== "" ? `${name}@${version}` : name, ...extraArgs], {
    stdio: "inherit",
  })

  return { binDir: "/usr/local/bin/" }
}
