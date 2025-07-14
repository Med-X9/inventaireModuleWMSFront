pipeline {
    agent any

    environment {
        FRONTEND_REPO = 'https://github.com/Med-X9/inventaireModuleWMSFront.git'

        IMAGE_PREFIX = 'oussamafannouch'
        FRONTEND_IMAGE = "${IMAGE_PREFIX}/frontend-app"
        IMAGE_TAG = "latest"

        // Dynamically set based on branch
        DEPLOY_HOST  = "${env.BRANCH_NAME == 'main' ? '31.97.158.68' : (env.BRANCH_NAME == 'dev' ? '147.93.55.221' : '')}"
        DEPLOY_CREDS = "${env.BRANCH_NAME == 'main' ? 'prod-creds' : (env.BRANCH_NAME == 'dev' ? 'dev-test-creds' : '')}"
        ENV_NAME     = "${env.BRANCH_NAME == 'main' ? 'production' : (env.BRANCH_NAME == 'dev' ? 'development' : '')}"

        // Container configuration
        CONTAINER_NAME = 'frontend-app'
        CONTAINER_PORT = '80'
        HOST_PORT = '8080'
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

        stage('Prepare nginx.conf') {
            when {
                anyOf {
                    branch 'dev'
                    branch 'main'
                }
            }
            steps {
                sh '''
                    if [ -f /tmp/backend/nginx/nginx.conf ]; then
                        cp /tmp/backend/nginx/nginx.conf /tmp/frontend/nginx.conf
                    else
                        echo "Backend nginx.conf not found, using default frontend nginx.conf"
                    fi
                '''
            }
        }

        stage('Build Frontend Docker Image') {
            when {
                anyOf {
                    branch 'dev'
                    branch 'main'
                }
            }
            steps {
                dir('/tmp/frontend') {
                    sh '''
                        echo "Building Docker image..."
                        docker build -t $FRONTEND_IMAGE:$IMAGE_TAG .
                        echo "Docker image built successfully"
                    '''
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
                withCredentials([usernamePassword(credentialsId: 'docker-hub-creds', passwordVariable: 'PASS', usernameVariable: 'USER')]) {
                    sh '''
                        echo "Logging into Docker Hub..."
                        echo $PASS | docker login -u $USER --password-stdin
                        echo "Pushing Docker image..."
                        docker push $FRONTEND_IMAGE:$IMAGE_TAG
                        echo "Docker image pushed successfully"
                    '''
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
                    withCredentials([usernamePassword(credentialsId: env.DEPLOY_CREDS, usernameVariable: 'USER', passwordVariable: 'PASS')]) {
                        sh '''
                            echo "Deploying to remote server..."

                            sshpass -p "$PASS" ssh -o StrictHostKeyChecking=no "$USER@$DEPLOY_HOST" "
                                echo 'Stopping and removing existing container if it exists...'
                                docker stop $CONTAINER_NAME || true
                                docker rm $CONTAINER_NAME || true
                                
                                echo 'Pulling latest image...'
                                docker pull $FRONTEND_IMAGE:$IMAGE_TAG
                                
                                echo 'Starting new container...'
                                docker run -d \\
                                    --name $CONTAINER_NAME \\
                                    --network inventaire-net \\
                                    -p $HOST_PORT:$CONTAINER_PORT \\
                                    --restart unless-stopped \\
                                    $FRONTEND_IMAGE:$IMAGE_TAG
                                
                                echo 'Deployment completed successfully'
                                echo 'Container status:'
                                docker ps | grep $CONTAINER_NAME || echo 'Container not found in running processes'
                            "
                        '''
                    }
                }
            }
        }
    }

    post {
        always {
            script {
                sh '''
                    echo "Cleaning up local Docker images..."
                    docker rmi $FRONTEND_IMAGE:$IMAGE_TAG || true
                    docker image prune -f || true
                '''
            }
        }
        success {
            echo "✅ Pipeline completed successfully! Frontend is deployed at http://${DEPLOY_HOST}"
        }
        failure {
            echo "❌ Pipeline failed. Check the logs above for details."
        }
    }
}
