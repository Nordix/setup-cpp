import { execaSync } from "execa"
import { chmod } from "fs/promises"
import { addExeExt, join } from "patha"
import { isUbuntu } from "../../utils/env/isUbuntu.js"
import { ubuntuVersion } from "../../utils/env/ubuntu_version.js"
import { cleanupTmpDir, setupTmpDir, testBin } from "../../utils/tests/test-helpers.js"
import { getVersion } from "../../versions/versions.js"
import { setupGcc } from "../gcc.js"

jest.setTimeout(3000000)
describe("setup-gcc", () => {
  let directory: string
  beforeAll(async () => {
    directory = await setupTmpDir("gcc")
  })

  it("should setup gcc", async () => {
    const ubuntuVersionOutput = await ubuntuVersion()
    const version = getVersion("gcc", undefined, ubuntuVersionOutput)
    const installInfo = await setupGcc(version, directory, process.arch)

    let gpp = "g++"
    if (isUbuntu()) {
      const ubuntuMajorVersion = ubuntuVersionOutput?.[0]
      // https://packages.ubuntu.com/search?keywords=gcc
      switch (ubuntuMajorVersion) {
        case 26:
        case 25:
          gpp = "g++-14"
          break
        case 24:
        case 23:
          gpp = "g++-13"
          break
        case 22:
        case 21:
          gpp = "g++-11"
          break
        case 20:
          gpp = "g++-9"
          break
        default: {
          // ignore
        }
      }
    } else if (process.platform === "darwin") {
      // https://formulae.brew.sh/formula/gcc
      // As of 3, Sep, 2024
      gpp = "g++-14"
    }

    await testBin(gpp, ["--version"], installInfo?.binDir)

    expect(process.env.CC?.includes("gcc")).toBeTruthy()
    expect(process.env.CXX?.includes("g++")).toBeTruthy()

    // test compilation
    const file = join(__dirname, "main.cpp")
    const main_exe = join(__dirname, addExeExt("main"))
    execaSync("g++", [file, "-o", main_exe], { cwd: __dirname })
    if (process.platform !== "win32") {
      await chmod(main_exe, "755")
    }
    execaSync(main_exe, { cwd: __dirname, stdio: "inherit" })
  })

  afterAll(async () => {
    await cleanupTmpDir("gcc")
  }, 100000)
})
