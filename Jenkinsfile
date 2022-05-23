@Library('linkurious-shared')_

nodeJob {
  // General
  projectName = "linkurious/ogma"
  parameterList = [
    string(name: 'run', defaultValue: '', description: 'Run Id'),
    string(name: 'testomatio', defaultValue: 'qt69d8c741rk', description: 'Testomatio API'),
    string(name: 'grep', defaultValue: '', description: 'Run specific tests'),
  ]
  runBenchTests = true
  runPreReleaseOnUpload = false
  npmPackPath = '.'

  //documentation
  binaries = ['./dist/ogma.tgz']
  groupId = 'com.linkurious.documentation'
  createGitTag = true

  //Deployement
  runDeploy = true
  playbookAppName = "documentation"
  ansibleTags = "playbook::infra::docker::up"
}
