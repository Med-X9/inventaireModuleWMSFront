pipeline {
    agent any

    environment {
        // These will be loaded from YAML config
        CONFIG_FILE = 'jenkins-config.yml'
    }

    stages {
        stage('Load Configuration') {
            steps {
                script {
                    // Load and parse YAML configuration
                    if (!fileExists(env.CONFIG_FILE)) {
                        error("Configuration file ${env.CONFIG_FILE} not found!")
                    }
                    
                    def configText = readFile(env.CONFIG_FILE)
                    // Use readYaml step instead of creating Yaml object to avoid serialization issues
                    def config = readYaml text: configText
                    
                    // Store config in global variable for access in other stages
                    env.PROJECT_CONFIG = writeJSON returnText: true, json: config
                    
                    // Set dynamic environment variables based on branch
                    def branchConfig = config.environments[env.BRANCH_NAME]
                    if (branchConfig) {
                        env.DEPLOY_HOST = branchConfig.deploy_host ?: ''
                        env.DEPLOY_CREDS = branchConfig.deploy_creds ?: ''
                        env.ENV_NAME = branchConfig.env_name ?: ''
                        env.IMAGE_TAG_SUFFIX = branchConfig.image_tag_suffix ?: 'latest'
                    }
                    
                    // Set common variables
                    env.FRONTEND_REPO = config.repository.url
                    env.IMAGE_PREFIX = config.docker.image_prefix
                    env.FRONTEND_IMAGE = "${env.IMAGE_PREFIX}/${config.docker.image_name}"
                    env.IMAGE_TAG = "latest"
                    
                    // SonarQube configuration
                    env.SONAR_PROJECT_KEY = "${config.sonarqube.project_key}-${env.BRANCH_NAME}"
                    env.SONAR_PROJECT_NAME = "${config.sonarqube.project_name}-${env.BRANCH_NAME}"
                    env.SONAR_PROJECT_VERSION = config.sonarqube.project_version
                    
                    echo "Configuration loaded successfully for branch: ${env.BRANCH_NAME}"
                    echo "Deploy target: ${env.DEPLOY_HOST}"
                    echo "Environment: ${env.ENV_NAME}"
                }
            }
        }

        stage('Check Branch') {
            steps {
                script {
                    def config = readJSON text: env.PROJECT_CONFIG
                    def allowedBranches = config.environments.keySet() as List
                    
                    if (!allowedBranches.contains(env.BRANCH_NAME)) {
                        echo "Skipping deployment - branch '${env.BRANCH_NAME}' not configured for deployment."
                        echo "Configured branches: ${allowedBranches.join(', ')}"
                        currentBuild.result = 'SUCCESS'
                        return
                    }
                    echo "Proceeding with deployment on ${env.BRANCH_NAME} branch to ${env.ENV_NAME} environment"
                    echo "Deploy target: ${env.DEPLOY_HOST}"
                }
            }
        }

        stage('Clone Repositories') {
            when {
                expression {
                    def config = readJSON text: env.PROJECT_CONFIG
                    return config.environments.containsKey(env.BRANCH_NAME)
                }
            }
            steps {
                script {
                    def config = readJSON text: env.PROJECT_CONFIG
                    def gitCredentials = config.credentials.git_credentials_id
                    
                    withCredentials([usernamePassword(credentialsId: gitCredentials, usernameVariable: 'GIT_USER', passwordVariable: 'GIT_PASS')]) {
                        sh """
                            rm -rf /tmp/frontend
                            git clone --single-branch --branch ${env.BRANCH_NAME} https://\$GIT_USER:\$GIT_PASS@${env.FRONTEND_REPO.replace('https://', '')} /tmp/frontend
                        """
                    }
                }
            }
        }

        stage('SonarQube Analysis') {
            environment {
                scannerHome = tool 'sonar-scanner'
            }
            when {
                expression {
                    def config = readJSON text: env.PROJECT_CONFIG
                    return config.sonarqube.enabled && config.sonarqube.analysis_branches.contains(env.BRANCH_NAME)
                }
            }
            steps {
                dir('/tmp/frontend') {
                    script {
                        def config = readJSON text: env.PROJECT_CONFIG
                        def sonarConfig = config.sonarqube
                        
                        // Run SonarQube analysis
                        try {
                            withSonarQubeEnv(credentialsId: sonarConfig.credentials_id, installationName: sonarConfig.server_name) {
                                def sonarArgs = [
                                    "-Dsonar.projectKey=${env.SONAR_PROJECT_KEY}",
                                    "-Dsonar.projectName=\"${env.SONAR_PROJECT_NAME}\"",
                                    "-Dsonar.projectVersion=${env.SONAR_PROJECT_VERSION}",
                                    "-Dsonar.sources=${sonarConfig.sources}",
                                    "-Dsonar.sourceEncoding=${sonarConfig.source_encoding}",
                                    "-Dsonar.test.inclusions=\"${sonarConfig.test_inclusions}\"",
                                    "-Dsonar.exclusions=\"${sonarConfig.exclusions}\"",
                                    "-Dsonar.qualitygate.wait=${sonarConfig.quality_gate_wait}"
                                ]
                                
                                sh """
                                    echo "Starting SonarQube analysis for branch: ${env.BRANCH_NAME}"
                                    \${scannerHome}/bin/sonar-scanner ${sonarArgs.join(' \\\n                                        ')}
                                    echo "SonarQube analysis completed for branch: ${env.BRANCH_NAME}"
                                """
                            }
                        } catch (Exception e) {
                            echo "Warning: SonarQube analysis encountered issues but continuing build: ${e.getMessage()}"
                            echo "Check SonarQube dashboard for detailed analysis results"
                            currentBuild.result = 'UNSTABLE'
                        }
                    }
                }
            }
        }

        stage('SonarQube Status Check') {
            when {
                expression {
                    def config = readJSON text: env.PROJECT_CONFIG
                    return config.sonarqube.enabled && config.sonarqube.status_check_enabled
                }
            }
            steps {
                script {
                    def config = readJSON text: env.PROJECT_CONFIG
                    def sonarConfig = config.sonarqube
                    
                    try {
                        sleep(time: sonarConfig.status_check_delay ?: 10, unit: 'SECONDS')
                        
                        def sonarUrl = sonarConfig.server_url
                        def analysisUrl = "${sonarUrl}/api/qualitygates/project_status?projectKey=${env.SONAR_PROJECT_KEY}"
                        
                        def response
                        withCredentials([usernamePassword(credentialsId: sonarConfig.api_credentials_id, usernameVariable: 'SONAR_USER', passwordVariable: 'SONAR_PASS')]) {
                            response = sh(
                                script: "curl -s -u \$SONAR_USER:\$SONAR_PASS '${analysisUrl}'",
                                returnStdout: true
                            ).trim()
                        }
                        
                        try {
                            def jsonSlurper = new groovy.json.JsonSlurper()
                            def result = jsonSlurper.parseText(response)
                            def projectStatus = result.projectStatus.status
                            
                            if (projectStatus == 'OK') {
                                echo "✅ SonarQube analysis passed!"
                            } else {
                                echo "⚠️  SonarQube analysis found issues: ${projectStatus}"
                                currentBuild.result = 'UNSTABLE'
                            }
                        } catch (Exception jsonError) {
                            if (response.contains('"status":"OK"')) {
                                echo "✅ SonarQube analysis passed!"
                            } else if (response.contains('"status":"ERROR"') || response.contains('"status":"WARN"')) {
                                echo "⚠️  SonarQube analysis found issues"
                                currentBuild.result = 'UNSTABLE'
                            } else {
                                echo "⚠️  Could not determine SonarQube status"
                                currentBuild.result = 'UNSTABLE'
                            }
                        }
                        
                    } catch (Exception e) {
                        echo "⚠️  SonarQube status check failed: ${e.getMessage()}"
                        currentBuild.result = 'UNSTABLE'
                    }
                }
            }
        }

        stage('Build Frontend Docker Image') {
            when {
                expression {
                    def config = readJSON text: env.PROJECT_CONFIG
                    return config.environments.containsKey(env.BRANCH_NAME)
                }
            }
            steps {
                dir('/tmp/frontend') {
                    script {
                        def imageTag = "${env.IMAGE_TAG_SUFFIX}"
                        sh "docker build -t ${env.FRONTEND_IMAGE}:${imageTag} ."
                        sh "docker tag ${env.FRONTEND_IMAGE}:${imageTag} ${env.FRONTEND_IMAGE}:${env.IMAGE_TAG}"
                    }
                }
            }
        }

        stage('Push Docker Images') {
            when {
                expression {
                    def config = readJSON text: env.PROJECT_CONFIG
                    return config.environments.containsKey(env.BRANCH_NAME)
                }
            }
            steps {
                script {
                    def config = readJSON text: env.PROJECT_CONFIG
                    def dockerCredentials = config.credentials.docker_credentials_id
                    
                    withCredentials([usernamePassword(credentialsId: dockerCredentials, passwordVariable: 'PASS', usernameVariable: 'USER')]) {
                        sh "echo \$PASS | docker login -u \$USER --password-stdin"
                    }
                    def imageTag = "${env.IMAGE_TAG_SUFFIX}"
                    sh "docker push ${env.FRONTEND_IMAGE}:${imageTag}"
                    sh "docker push ${env.FRONTEND_IMAGE}:${env.IMAGE_TAG}"
                }
            }
        }

        stage('Upload Essential Files') {
            when {
                expression {
                    def config = readJSON text: env.PROJECT_CONFIG
                    return config.environments.containsKey(env.BRANCH_NAME)
                }
            }
            steps {
                script {
                    def config = readJSON text: env.PROJECT_CONFIG
                    def deployConfig = config.deployment
                    def imageTag = "${env.IMAGE_TAG_SUFFIX}"
                    
                    echo "Preparing deployment files for ${env.ENV_NAME} environment with image: ${env.FRONTEND_IMAGE}:${imageTag}"
                    
                    if (!env.DEPLOY_CREDS) {
                        error("DEPLOY_CREDS environment variable is not set!")
                    }
                    if (!env.DEPLOY_HOST) {
                        error("DEPLOY_HOST environment variable is not set!")
                    }
                    
                    withCredentials([usernamePassword(credentialsId: env.DEPLOY_CREDS, usernameVariable: 'USER', passwordVariable: 'PASS')]) {
                        // Create deployment directory
                        sh """
                            sshpass -p "\$PASS" ssh -o StrictHostKeyChecking=no "\$USER@\$DEPLOY_HOST" "rm -rf ${deployConfig.remote_path} && mkdir -p ${deployConfig.remote_path}/config"
                        """
                        
                        // Upload files specified in config
                        deployConfig.files_to_upload.each { file ->
                            if (file.contains('/')) {
                                // Directory upload
                                sh """
                                    sshpass -p "\$PASS" scp -r -o StrictHostKeyChecking=no /tmp/frontend/${file} "\$USER@\$DEPLOY_HOST:${deployConfig.remote_path}/"
                                """
                            } else {
                                // Single file upload
                                sh """
                                    sshpass -p "\$PASS" scp -o StrictHostKeyChecking=no /tmp/frontend/${file} "\$USER@\$DEPLOY_HOST:${deployConfig.remote_path}/"
                                """
                            }
                        }
                        
                        // Create .env file with IMAGE_TAG variable on remote server
                        sh """
                            sshpass -p "\$PASS" ssh -o StrictHostKeyChecking=no "\$USER@\$DEPLOY_HOST" "
                                cd /tmp/deployment/frontend &&
                                echo 'IMAGE_TAG=${imageTag}' > .env &&
                                echo 'FRONTEND_IMAGE=${env.FRONTEND_IMAGE}' >> .env &&
                                echo 'Added deployment variables to .env file'
                            "
                        """
                    }
                }
            }
        }

        stage('Deploy Frontend on Remote Server') {
            when {
                expression {
                    def config = readJSON text: env.PROJECT_CONFIG
                    return config.environments.containsKey(env.BRANCH_NAME)
                }
            }
            steps {
                script {
                    def config = readJSON text: env.PROJECT_CONFIG
                    def imageTag = "${env.IMAGE_TAG_SUFFIX}"
                    
                    if (!env.DEPLOY_CREDS) {
                        error("DEPLOY_CREDS environment variable is not set!")
                    }
                    if (!env.DEPLOY_HOST) {
                        error("DEPLOY_HOST environment variable is not set!")
                    }
                    
                    withCredentials([usernamePassword(credentialsId: env.DEPLOY_CREDS, usernameVariable: 'USER', passwordVariable: 'PASS')]) {
                        sh """
                            sshpass -p "\$PASS" ssh -o StrictHostKeyChecking=no "\$USER@\$DEPLOY_HOST" "
                                # Stop and remove existing container if it exists
                                docker stop frontend-app || true
                                docker rm frontend-app || true
                                
                                # Pull the latest image
                                docker pull ${env.FRONTEND_IMAGE}:${imageTag}
                                
                                # Run the new container
                                docker run -d \\
                                    --name frontend-app \\
                                    --network inventaire-net \\
                                    -p 8080:80 \\
                                    --restart unless-stopped \\
                                    ${env.FRONTEND_IMAGE}:${imageTag}
                                
                                echo 'Frontend deployment completed successfully'
                                docker ps | grep frontend-app || echo 'Container not found in running processes'
                            "
                        """
                    }
                }
            }
        }
    }

    post {
        always {
            script {
                try {
                    // Check if PROJECT_CONFIG exists and is not empty
                    if (env.PROJECT_CONFIG && env.PROJECT_CONFIG != 'null' && env.PROJECT_CONFIG.trim() != '') {
                        def config = readJSON text: env.PROJECT_CONFIG
                        def cleanupCommands = config.cleanup?.commands ?: [
                            'rm -rf /tmp/frontend || true',
                            'docker system prune -f || true'
                        ]
                        
                        cleanupCommands.each { command ->
                            sh "${command}"
                        }
                    } else {
                        echo "No config loaded, using default cleanup..."
                        sh 'rm -rf /tmp/frontend || true'
                        sh 'docker system prune -f || true'
                    }
                } catch (Exception e) {
                    echo "Cleanup configuration failed: ${e.getMessage()}"
                    echo "Using default cleanup commands..."
                    sh 'rm -rf /tmp/frontend || true'
                    sh 'docker system prune -f || true'
                }
            }
        }
        success {
            script {
                try {
                    if (env.PROJECT_CONFIG && env.PROJECT_CONFIG != 'null' && env.PROJECT_CONFIG.trim() != '') {
                        def config = readJSON text: env.PROJECT_CONFIG
                        def branchConfig = config.environments[env.BRANCH_NAME]
                        
                        if (branchConfig) {
                            echo "✅ Successfully deployed to ${env.ENV_NAME} environment (${env.DEPLOY_HOST})!"
                            echo "🐳 Using image: ${env.FRONTEND_IMAGE}:${env.IMAGE_TAG_SUFFIX}"
                            
                            if (config.sonarqube.enabled) {
                                echo "SonarQube analysis results for ${env.BRANCH_NAME}: ${config.sonarqube.server_url}/dashboard?id=${env.SONAR_PROJECT_KEY}"
                            }
                            
                            def uploadedFiles = config.deployment.files_to_upload.join(', ')
                            echo "📁 Transferred files: ${uploadedFiles}"
                        } else {
                            echo "✅ Pipeline completed - no deployment needed for branch: ${env.BRANCH_NAME}"
                        }
                    } else {
                        echo "✅ Pipeline completed successfully!"
                    }
                } catch (Exception e) {
                    echo "Success message configuration failed: ${e.getMessage()}"
                    echo "✅ Pipeline completed successfully!"
                }
            }
        }
        failure {
            script {
                try {
                    if (env.ENV_NAME) {
                        echo "❌ Pipeline failed for ${env.ENV_NAME} deployment!"
                    } else {
                        echo "❌ Pipeline failed!"
                    }
                } catch (Exception e) {
                    echo "❌ Pipeline failed!"
                }
            }
        }
        unstable {
            echo 'Pipeline completed with warnings. Check SonarQube Quality Gate results.'
        }
    }
}