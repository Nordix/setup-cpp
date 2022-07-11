import { find, downloadTool, cacheDir } from "@actions/tool-cache"
import { info } from "@actions/core"
import { addPath } from "../env/addEnv"
import { join } from "path"
import { existsSync } from "fs"
import { tmpdir } from "os"
import { isGitHubCI } from "../env/isCI"
import { setupAptPack } from "./setupAptPack"
import { setupPacmanPack } from "./setupPacmanPack"
import { isArch } from "../env/isArch"
import { hasDnf } from "../env/hasDnf"
import { setupDnfPack } from "./setupDnfPack"

/** A type that describes a package */
export type PackageInfo = {
  /** Url to download the package */
  url: string
  /** The top folder name once it is extracted. It can be `""` if there is no top folder */
  extractedFolderName: string
  /** The relative directory in which the binary is located. It can be `""` if the exe is in the top folder */
  binRelativeDir: string
  /** The main binary file. */
  binFileName: string
  /** The function to extract the downloaded archive. It can be `undefined`, if the binary itself is downloaded directly. */
  extractFunction?: {
    (file: string, dest: string): Promise<string> | Promise<void>
  }
}

export type InstallationInfo = {
  /** The top install dir */
  installDir?: string
  binDir: string
}

let didInit: boolean = false

/**
 * A function that:
 *
 * - Downloads and extracts a package
 * - Adds the bin path of the package to PATH
 * - Caches the downloaded directory into tool cache for usage from other sessions
 *
 * @returns The installation directory
 */
export async function setupBin(
  name: string,
  version: string,
  getPackageInfo: (version: string, platform: NodeJS.Platform, arch: string) => PackageInfo | Promise<PackageInfo>,
  setupDir: string,
  arch: string
): Promise<InstallationInfo> {
  info(`Installing ${name} ${version} ${arch} via direct downloading`)

  process.env.RUNNER_TEMP = process.env.RUNNER_TEMP ?? tmpdir()
  process.env.RUNNER_TOOL_CACHE = process.env.RUNNER_TOOL_CACHE ?? join(tmpdir(), "setup-cpp", "hostedtoolcache")

  const { url, binRelativeDir, binFileName, extractedFolderName, extractFunction } = await getPackageInfo(
    version,
    process.platform,
    arch
  )

  // Restore from cache (if found).
  if (isGitHubCI()) {
    try {
      const dir = find(name, version)
      if (dir) {
        const installDir = join(dir, extractedFolderName)
        const binDir = join(installDir, binRelativeDir)
        if (existsSync(binDir) && existsSync(join(binDir, binFileName))) {
          info(`${name} ${version} was found in the cache at ${binDir}.`)
          await addPath(binDir)

          return { installDir, binDir }
        }
      }
    } catch {
      // fails on a local machine?
    }
  }

  const installDir = join(setupDir, extractedFolderName)
  const binDir = join(installDir, binRelativeDir)
  const binFile = join(binDir, binFileName)

  // download ane extract the package into the installation directory.
  if (!existsSync(binDir) || !existsSync(binFile)) {
    info(`Download and extract ${name} ${version}`)

    if (!didInit) {
      if (process.platform === "linux") {
        // extraction dependencies
        if (isArch()) {
          setupPacmanPack("unzip")
          setupPacmanPack("tar")
          setupPacmanPack("xz")
        } else if (hasDnf()) {
          setupDnfPack("unzip")
          setupDnfPack("tar")
          setupDnfPack("xz")
        } else {
          setupAptPack("unzip")
          setupAptPack("tar")
          setupAptPack("xz-utils")
        }
      }
      // eslint-disable-next-line require-atomic-updates
      didInit = true
    }

    try {
      const downloaded = await downloadTool(url)
      await extractFunction?.(downloaded, setupDir)
    } catch (err) {
      throw new Error(`Failed to download ${name} ${version} ${arch}: ${err}`)
    }
  }

  // Adding the bin dir to the path
  /** The directory which the tool is installed to */
  info(`Add ${binDir} to PATH`)
  await addPath(binDir)

  // check if inside Github Actions. If so, cache the installation
  if (isGitHubCI() && typeof process.env.RUNNER_TOOL_CACHE === "string") {
    await cacheDir(setupDir, name, version)
  }

  return { installDir, binDir }
}
