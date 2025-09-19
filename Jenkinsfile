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
                        withSonarQubeEnv(credentialsId: 'sonar-token', installationName: 'SonarQube-Server') {
                            sh """
                                ${scannerHome}/bin/sonar-scanner \\
                                    -Dsonar.projectKey=${SONAR_PROJECT_KEY} \\
                                    -Dsonar.projectName='${SONAR_PROJECT_NAME}' \\
                                    -Dsonar.sources=src \\
                                    -Dsonar.exclusions='**/node_modules/**,**/dist/**,**/*.spec.ts,**/*.test.ts,**/coverage/**,**/*.d.ts,**/vite.config.ts,**/tailwind.config.cjs,**/postcss.config.cjs' \\
                                    -Dsonar.sourceEncoding=UTF-8
                            """
                        }
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
                } else if (env.BRANCH_NAME == 'main') {
                    echo "✅ Successfully deployed to production environment (${env.DEPLOY_HOST})!"
                    echo "🐳 Using image: ${env.FRONTEND_IMAGE}:prod-latest"
                } else {
                    echo "✅ Pipeline completed - no deployment needed for branch: ${env.BRANCH_NAME}"
                }
                echo "📁 Transferred files: Dockerfile, config/, .env"
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
    }
}
