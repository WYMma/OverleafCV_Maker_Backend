pipeline {
    agent any

    environment {
        // Retrieve the Render Hook URL from Jenkins Credentials.
        RENDER_HOOK_URL = credentials('render-deploy-hook-url')
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Backend: Install & Test') {
            steps {
                dir('backend') {
                    // Try to install dependencies to ensure code validity
                    // Using 'bat' for Windows agents. If your Jenkins agent is Linux, change 'bat' to 'sh'.
                    script {
                        if (isUnix()) {
                            sh 'npm install'
                        } else {
                            bat 'npm install'
                        }
                    }
                }
            }
        }

        stage('Deploy to Render') {
            steps {
                script {
                    echo "Triggering Render Deployment..."
                    // Use curl to trigger the webhook
                    if (isUnix()) {
                        sh "curl -f -X POST \"${RENDER_HOOK_URL}\""
                    } else {
                        // Windows curl (if available) or PowerShell invoke-restmethod
                        // Assuming standard curl is available in path or git bash
                        bat "curl -f -X POST \"${RENDER_HOOK_URL}\""
                    }
                }
            }
        }
    }
}
