docker build -t meldchat-postgres .
docker run -d --name meldchat-postgres -p 5434:5432 meldchat-postgres
