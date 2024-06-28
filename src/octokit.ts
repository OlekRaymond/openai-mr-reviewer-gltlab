import {getInput, warning} from '@actions/core'
import {Octokit} from '@octokit/action'
import {retry} from '@octokit/plugin-retry'
import {throttling} from '@octokit/plugin-throttling'

const token = getInput('token') || process.env.GITHUB_TOKEN

const RetryAndThrottlingOctokit = Octokit.plugin(throttling, retry)
export const octokit = new RetryAndThrottlingOctokit({
  auth: `token ${token}`,
  throttle: {
    // @ts-ignore - package source Types are wrong
    onRateLimit: (
      retryAfter: number,
      options: any,
      _o: Octokit,
      retryCount: number
    ) => {
      warning(
        `Request quota exhausted for request ${options.method} ${options.url}
Retry after: ${retryAfter} seconds
Retry count: ${retryCount}
`
      )
      return
    },
    onSecondaryRateLimit: (_retryAfter: number, options: any) => {
      warning(
        `SecondaryRateLimit detected for request ${options.method} ${options.url}`
      )
      return true
    }
  },
  retry: {
    doNotRetry: ['429'],
    maxRetries: 10
  }
})
