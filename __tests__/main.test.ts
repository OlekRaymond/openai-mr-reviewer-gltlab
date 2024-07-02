import {expect, test} from '@jest/globals'
import * as cp from 'child_process'
import * as path from 'path'
import * as process from 'process'

test('test runs', () => {
  process.env['INPUT_ACTION'] = 'code-review'
  const np = process.execPath
  const ip = path.join(__dirname, '..', 'lib', 'main.js')
  const options: cp.ExecFileSyncOptions = {
    env: process.env
  }

  options.env!["GITHUB_ACTION"] = "MockValue"
  options.env!["GITHUB_TOKEN"] = "MockValue"
  options.env!["GITHUB_REPOSITORY"] = "mock_value/mock_value"
  
  console.log(cp.execFileSync(np, [ip], options).toString())
})
