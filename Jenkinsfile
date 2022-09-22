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
    GITHUB_TOKEN = credentials('GH_PORTAL_TOKEN')
    DOCKER_REGISTRY = credentials('DOCKERHUB_KONGCLOUD_PULL')
  }
  stages {
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
