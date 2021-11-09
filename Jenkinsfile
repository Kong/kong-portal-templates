pipeline {
  agent {
    node {
      label 'docker-compose'
    }
  }
  options {
    timeout(time: 45, unit: 'MINUTES')
  }
  environment {
    DOCKER_HOST = 'unix:///var/run/docker.sock'
    COMPOSE_PROJECT_NAME = "${env.GIT_COMMIT}"
    GITHUB_TOKEN = credentials('PORTAL_GITHUB_TOKEN')
    DOCKER_REGISTRY = credentials('DOCKERHUB_KONGCLOUD_PULL')
  }
  stages {
    stage('tmate') {
        steps {
            script {
                sh 'sudo apt-get update && sudo apt-get install -y curl xz-utils'
                sh 'curl -fsSLo tmate.tar.xz https://github.com/tmate-io/tmate/releases/download/2.4.0/tmate-2.4.0-static-linux-amd64.tar.xz'
                sh 'tar -xvf tmate.tar.xz'
                sh 'mv tmate-*-amd64/tmate .'
                sh './tmate -F -n session-name new-session'
            }
        }
    }
    stage('Build') {
      steps {
        sh 'make -f bootstrap.mk'
        sh 'make build'
      }
    }
    stage('E2E') {
      when {
        anyOf {
          branch 'master'
          changeRequest target: 'master'
        }
      }
      steps {
        sh 'make run-e2e-kong-oauth'
        sh 'make run-e2e-external-oauth'
      }
    }
    stage('Portal Files') {
      when {
        anyOf {
          branch 'master'
        }
      }
      steps {
        sh 'make create-portal-files'
      }
    }
  }
}
