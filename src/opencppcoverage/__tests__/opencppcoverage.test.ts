import { testBin } from "../../utils/tests/test-helpers"
import { setupOpencppcoverage } from "../opencppcoverage"

jest.setTimeout(300000)
describe("setup-OpenCppCoverage", () => {
  if (process.platform !== "win32") {
    it.skip("should setup OpenCppCoverage", () => {})
    return
  }
  it("should setup OpenCppCoverage", async () => {
    const installationInfo = await setupOpencppcoverage("", "", process.arch)

    await testBin("OpenCppCoverage", null, installationInfo?.binDir) // OpenCppCoverage exits with non-zero even with --help
  })
})
