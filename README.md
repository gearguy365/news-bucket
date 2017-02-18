# new bucket

requirements for running the project

  - nodejs and npm
  - redis

once these things are setup, do the following

  - from the root of the project directory run 'npm install' and wait for all the dependencies to get intalled.
  - run the server by 'node server.js'.
  - monitor the text file(s) under log folder to see parsing happen in every 1 minute(for now only bdnews24)
  - hit the end point localhost:8080/news(or whatever port you got) to get first 5 news from mongodb.



