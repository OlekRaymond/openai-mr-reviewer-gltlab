/* eslint-disable no-console */

export const getBooleanInput = (key: string) => {
  const defaultValue = process.env[key]
  if (typeof defaultValue === 'string') {
    return defaultValue === 'true'
  } else {
    return Boolean(defaultValue)
  }
}
export const getInput = (key: string) => {
  return process.env[key]
}
export const getMultilineInput = (key: string) => {
  return process.env[key]?.split('\n')
}

export const setFailed = console.log
export const info = console.log
export const warning = console.warn
export const error = console.error
