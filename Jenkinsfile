pipeline {
    agent any

    environment {
        FRONTEND_REPO = 'https://github.com/Med-X9/inventaireModuleWMSFront.git'
        IMAGE_PREFIX = 'smatchdigital'
        FRONTEND_IMAGE = "${IMAGE_PREFIX}/frontend-app"
        
        DEPLOY_HOST = "${env.BRANCH_NAME == 'main' ? '31.97.158.68' : (env.BRANCH_NAME == 'dev' ? '147.93.55.221' : '')}"
        DEPLOY_CREDS = "${env.BRANCH_NAME == 'main' ? 'prod-creds' : (env.BRANCH_NAME == 'dev' ? 'dev-test-creds' : '')}"
        ENV_NAME = "${env.BRANCH_NAME == 'main' ? 'production' : (env.BRANCH_NAME == 'dev' ? 'development' : '')}"

        // SonarQube configuration
        SONAR_PROJECT_KEY = "inventaire-module-wms-front-${env.BRANCH_NAME}"
        SONAR_PROJECT_NAME = "InventaireModuleWMSFront-${env.BRANCH_NAME}"
    }

    stages {
        stage('Check Branch') {
            steps {
                script {
                    if (env.BRANCH_NAME != 'dev' && env.BRANCH_NAME != 'main') {
                        echo "Skipping deployment - not on dev or main branch. Current branch: ${env.BRANCH_NAME}"
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
                anyOf {
                    branch 'dev'
                    branch 'main'
                }
            }
            steps {
                withCredentials([usernamePassword(credentialsId: 'git-cred', usernameVariable: 'GIT_USER', passwordVariable: 'GIT_PASS')]) {
                    sh '''
                        rm -rf /tmp/frontend
                        git clone --single-branch --branch ${BRANCH_NAME} https://$GIT_USER:$GIT_PASS@github.com/Med-X9/inventaireModuleWMSFront.git /tmp/frontend
                    '''
                }
            }
        }

        stage('SonarQube Analysis') {
            when {
                anyOf {
                    branch 'dev'
                    branch 'main'
                }
            }
            steps {
                dir('/tmp/frontend') {
                    script {
                        def scannerHome = tool 'sonar-scanner'
                        try {
                            withSonarQubeEnv(credentialsId: 'sonar-token', installationName: 'SonarQube-Server') {
                                sh """
                                    ${scannerHome}/bin/sonar-scanner \\
                                        -Dsonar.projectKey=${SONAR_PROJECT_KEY} \\
                                        -Dsonar.projectName='${SONAR_PROJECT_NAME}' \\
                                        -Dsonar.sources=src \\
                                        -Dsonar.exclusions='**/node_modules/**,**/dist/**,**/*.spec.ts,**/*.test.ts,**/coverage/**,**/*.d.ts,**/vite.config.ts,**/tailwind.config.cjs,**/postcss.config.cjs' \\
                                        -Dsonar.sourceEncoding=UTF-8 \\
                                        -Dsonar.qualitygate.wait=false
                                    echo "SonarQube analysis completed for branch: ${env.BRANCH_NAME}"
                                """
                            }
                        } catch (Exception e) {
                            echo "Warning: SonarQube analysis encountered issues but continuing build: ${e.getMessage()}"
                            echo "Check SonarQube dashboard for detailed analysis results"
                            // Mark stage as unstable but don't fail the build
                            currentBuild.result = 'UNSTABLE'
                        }
                    }
                }
            }
        }

        stage('SonarQube Status Check') {
            steps {
                script {
                    try {
                        sleep(time: 10, unit: 'SECONDS')
                        
                        def sonarUrl = "http://147.93.55.221:9000"
                        def analysisUrl = "${sonarUrl}/api/qualitygates/project_status?projectKey=${SONAR_PROJECT_KEY}"
                        
                        def response
                        withCredentials([usernamePassword(credentialsId: 'sonar-creds', usernameVariable: 'SONAR_USER', passwordVariable: 'SONAR_PASS')]) {
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


        // stage('Prepare nginx.conf') {
        //     when {
        //         anyOf {
        //             branch 'dev'
        //             branch 'main'
        //         }
        //     }
        //     steps {
        //         sh '''
        //             if [ -f /tmp/backend/nginx/nginx.conf ]; then
        //                 cp /tmp/backend/nginx/nginx.conf /tmp/frontend/nginx.conf
        //             else
        //                 echo "Backend nginx.conf not found, using default frontend nginx.conf"
        //             fi
        //         '''
        //     }
        // }

        stage('Build Frontend Docker Image') {
            when {
                anyOf {
                    branch 'dev'
                    branch 'main'
                }
            }
            steps {
                dir('/tmp/frontend') {
                    script {
                        def imageTag = env.BRANCH_NAME == 'main' ? 'prod-latest' : 'dev-latest'
                        sh "docker build -t ${FRONTEND_IMAGE}:${imageTag} ."
                    }
                }
            }
        }

        stage('Push Docker Images') {
            when {
                anyOf {
                    branch 'dev'
                    branch 'main'
                }
            }
            steps {
                script {
                    withCredentials([usernamePassword(credentialsId: 'docker-hub-company', passwordVariable: 'PASS', usernameVariable: 'USER')]) {
                        sh "echo $PASS | docker login -u $USER --password-stdin"
                    }
                    def imageTag = env.BRANCH_NAME == 'main' ? 'prod-latest' : 'dev-latest'
                    sh "docker push ${FRONTEND_IMAGE}:${imageTag}"
                }
            }
        }

        stage('Upload Essential Files') {
            when {
                anyOf {
                    branch 'dev'
                    branch 'main'
                }
            }
            steps {
                script {
                    def imageTag = env.BRANCH_NAME == 'main' ? 'prod-latest' : 'dev-latest'
                    echo "Preparing deployment files for ${env.ENV_NAME} environment with image: ${FRONTEND_IMAGE}:${imageTag}"
                    
                    withCredentials([usernamePassword(credentialsId: env.DEPLOY_CREDS, usernameVariable: 'USER', passwordVariable: 'PASS')]) {
                        sh '''
                            # Create deployment directory on remote server
                            sshpass -p "$PASS" ssh -o StrictHostKeyChecking=no "$USER@$DEPLOY_HOST" "rm -rf /tmp/deployment/frontend && mkdir -p /tmp/deployment/frontend/config"
                            
                            # Upload only essential files that exist
                            sshpass -p "$PASS" scp -o StrictHostKeyChecking=no /tmp/frontend/Dockerfile "$USER@$DEPLOY_HOST:/tmp/deployment/frontend/"
                            sshpass -p "$PASS" scp -r -o StrictHostKeyChecking=no /tmp/frontend/config/* "$USER@$DEPLOY_HOST:/tmp/deployment/frontend/config/" 2>/dev/null || echo "config directory empty or not found, skipping"
                        '''
                        
                        // Create .env file with IMAGE_TAG variable on remote server
                        sh """
                            sshpass -p "\$PASS" ssh -o StrictHostKeyChecking=no "\$USER@\$DEPLOY_HOST" "
                                cd /tmp/deployment/frontend &&
                                echo 'IMAGE_TAG=${imageTag}' > .env &&
                                echo 'FRONTEND_IMAGE=${FRONTEND_IMAGE}' >> .env &&
                                echo 'Added deployment variables to .env file'
                            "
                        """
                    }
                }
            }
        }

        stage('Deploy Frontend on Remote Server') {
            when {
                anyOf {
                    branch 'dev'
                    branch 'main'
                }
            }
            steps {
                script {
                    def imageTag = env.BRANCH_NAME == 'main' ? 'prod-latest' : 'dev-latest'
                    withCredentials([usernamePassword(credentialsId: env.DEPLOY_CREDS, usernameVariable: 'USER', passwordVariable: 'PASS')]) {
                        sh """
                            sshpass -p "\$PASS" ssh -o StrictHostKeyChecking=no "\$USER@\$DEPLOY_HOST" "
                                # Stop and remove existing container if it exists
                                docker stop frontend-app || true
                                docker rm frontend-app || true
                                
                                # Pull the latest image
                                docker pull ${FRONTEND_IMAGE}:${imageTag}
                                
                                # Run the new container
                                docker run -d \\
                                    --name frontend-app \\
                                    --network inventaire-net \\
                                    -p 8080:80 \\
                                    --restart unless-stopped \\
                                    ${FRONTEND_IMAGE}:${imageTag}
                                
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
                // Clean up temporary files
                sh '''
                    rm -rf /tmp/frontend || true
                    docker system prune -f || true
                '''
            }
        }
        success {
            script {
                if (env.BRANCH_NAME == 'dev') {
                    echo "✅ Successfully deployed to development environment (${env.DEPLOY_HOST})!"
                    echo "🐳 Using image: ${env.FRONTEND_IMAGE}:dev-latest"
                    def projectKey = "inventaire-module-wms-front-${env.BRANCH_NAME}"
                    echo "SonarQube analysis results for ${env.BRANCH_NAME}: http://147.93.55.221:9000/dashboard?id=${projectKey}"
                } else if (env.BRANCH_NAME == 'main') {
                    echo "✅ Successfully deployed to production environment (${env.DEPLOY_HOST})!"
                    echo "🐳 Using image: ${env.FRONTEND_IMAGE}:prod-latest"
                    def projectKey = "inventaire-module-wms-front-${env.BRANCH_NAME}"
                    echo "SonarQube analysis results for ${env.BRANCH_NAME}: http://147.93.55.221:9000/dashboard?id=${projectKey}"
                } else {
                    echo "✅ Pipeline completed - no deployment needed for branch: ${env.BRANCH_NAME}"
                }
                echo "📁 Transferred files: Dockerfile, nginx/, .env"
            }
        }
        failure {
            script {
                if (env.BRANCH_NAME == 'dev' || env.BRANCH_NAME == 'main') {
                    echo "❌ Pipeline failed for ${env.ENV_NAME} deployment!"
                } else {
                    echo "❌ Pipeline failed!"
                }
            }
        }
        unstable {
            script {
                if (env.BRANCH_NAME == 'dev') {
                    echo "⚠️  Pipeline completed with warnings for development deployment!"
                    echo "🐳 Application deployed successfully to: ${env.DEPLOY_HOST}"
                    echo "🐳 Using image: ${env.FRONTEND_IMAGE}:dev-latest"
                    def projectKey = "inventaire-module-wms-front-${env.BRANCH_NAME}"
                    echo "⚠️  SonarQube found code quality issues - Check: http://147.93.55.221:9000/dashboard?id=${projectKey}"
                    echo "✅ Deployment completed despite code quality warnings"
                } else if (env.BRANCH_NAME == 'main') {
                    echo "⚠️  Pipeline completed with warnings for production deployment!"
                    echo "🐳 Application deployed successfully to: ${env.DEPLOY_HOST}"
                    echo "🐳 Using image: ${env.FRONTEND_IMAGE}:prod-latest"
                    def projectKey = "inventaire-module-wms-front-${env.BRANCH_NAME}"
                    echo "⚠️  SonarQube found code quality issues - Check: http://147.93.55.221:9000/dashboard?id=${projectKey}"
                    echo "✅ Deployment completed despite code quality warnings"
                } else {
                    echo "⚠️  Pipeline completed with warnings - no deployment needed for branch: ${env.BRANCH_NAME}"
                }
                echo "📊 Review SonarQube findings to improve code quality"
            }
        }
    }
}
