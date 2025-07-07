pipeline {
    agent any

    environment {
        FRONTEND_REPO = 'https://github.com/Med-X9/inventaireModuleWMSFront.git'

        IMAGE_PREFIX = 'oussamafannouch'
        FRONTEND_IMAGE = "${IMAGE_PREFIX}/frontend-app"
        IMAGE_TAG = "latest"

        DEPLOY_HOST = '147.93.55.221'
        DEPLOY_USER = credentials('dev-test-creds')
        
        // Container configuration
        CONTAINER_NAME = 'frontend-app'
        CONTAINER_PORT = '80'
        HOST_PORT = '8080'  // Change as needed
    }

    stages {
        stage('Clone Repository') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'git-cred', usernameVariable: 'GIT_USER', passwordVariable: 'GIT_PASS')]) {
                    sh '''
                        rm -rf /tmp/frontend
                        git clone --single-branch --branch dev https://$GIT_USER:$GIT_PASS@github.com/Med-X9/inventaireModuleWMSFront.git /tmp/frontend
                    '''
                }
            }
        }

        stage('Prepare nginx.conf') {
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

        stage('Install dependencies & Lint') {
            steps {
                dir('/tmp/frontend') {
                    sh '''
                        echo "Installing dependencies with npm ci..."
                        npm ci

                        echo "Running lint..."
                        # Only if you have lint script in package.json, otherwise remove this line
                        npm run lint || echo "Lint warnings/errors found"
                    '''
                }
            }
        }

        stage('Validate Build') {
            steps {
                dir('/tmp/frontend') {
                    sh '''
                        echo "Running build to validate code..."
                        npm run build
                    '''
                }
            }
        }

        stage('Build Frontend Docker Image') {
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

        stage('Push Docker Image') {
            steps {
                script {
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
        }

        stage('Deploy Frontend on Remote Server') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'dev-test-creds', usernameVariable: 'USER', passwordVariable: 'PASS')]) {
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
            echo "Pipeline completed successfully! Frontend deployed at http://${DEPLOY_HOST}:${HOST_PORT}"
        }

        failure {
            echo "Pipeline failed. Check logs for details."
            // Example email notification, customize email address & SMTP config in Jenkins
            mail to: 'you@example.com',
                 subject: "Jenkins Build Failed: ${env.JOB_NAME} #${env.BUILD_NUMBER}",
                 body: "Build failed! Check console output at ${env.BUILD_URL}"
        }
    }
}
