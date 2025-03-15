# kill all other containers and start this one

# Find the container ID of the container running on port 5434
CONTAINER_ID=$(docker ps -q --filter "publish=5434")

# Check if a container is found
if [ -n "$CONTAINER_ID" ]; then
    # Stop the container
    docker stop $CONTAINER_ID
    # Remove the container
    docker rm $CONTAINER_ID
    echo "Container $CONTAINER_ID running on port 5434 has been stopped and removed."
else
    echo "No container found running on port 5434."
fi

# Name of the container to remove
CONTAINER_NAME="/meldchat-postgres"

# Check if the container exists
if [ "$(docker ps -a -q -f name=$CONTAINER_NAME)" ]; then
  # If the container exists, stop it if it's running
  docker stop $CONTAINER_NAME
  # Remove the container
  docker rm $CONTAINER_NAME
  echo "Container $CONTAINER_NAME removed."
else
  echo "No container found with the name $CONTAINER_NAME."
fi

docker stop meldchat-postgres
docker rm meldchat-postgres
docker build -t meldchat-postgres .
docker run -d --name meldchat-postgres -p 5434:5432 meldchat-postgres
