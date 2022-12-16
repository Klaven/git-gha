import * as core from '@actions/core'
import * as coreCommand from '@actions/core/lib/command'
import * as gitSourceProvider from './git-source-provider'
import * as inputHelper from './input-helper'
import * as path from 'path'
import * as stateHelper from './state-helper'
import * as settings from './git-source-settings'

async function run(): Promise<void> {
  try {
    const sourceSettings = await inputHelper.getInputs()

    try {
      // Register problem matcher
      coreCommand.issueCommand(
        'add-matcher',
        {},
        path.join(__dirname, 'problem-matcher.json')
      )

      if (sourceSettings.action == settings.Action.Checkout) {
        // Get sources
        await gitSourceProvider.getSource(sourceSettings)
      } else if (sourceSettings.action == settings.Action.CommitPushPR) {
        // commit, push and make PR (should probably make seperate actions)
        await gitSourceProvider.commitSource(sourceSettings)
        await gitSourceProvider.pushSource(sourceSettings)
        await gitSourceProvider.pullRequestSource(sourceSettings)
      } else {
        // error
      }

      
    } finally {
      // Unregister problem matcher
      coreCommand.issueCommand('remove-matcher', {owner: 'checkout-git'}, '')
    }
  } catch (error) {
    core.setFailed(`${(error as any)?.message ?? error}`)
  }
}

async function cleanup(): Promise<void> {
  try {
    await gitSourceProvider.cleanup(stateHelper.RepositoryPath)
  } catch (error) {
    core.warning(`${(error as any)?.message ?? error}`)
  }
}

// Main
if (!stateHelper.IsPost) {
  run()
}
// Post
else {
  cleanup()
}
