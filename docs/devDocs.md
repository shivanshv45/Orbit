


Working on the DataBase--
Orbit works on knowledge units, not files


PostgreSQL SCHEMA

users
-----
id              UUID (PK)
name            TEXT
created_at      TIMESTAMP

(very minimal for now as auth is not present for now)

modules
-------
id              UUID (PK)
user_id         UUID (FK → users.id)
title           TEXT
position        INTEGER        
created_at      TIMESTAMP (idk if needed or not)

TWO USERS CAN UPLOAD THE SAME PDF AND THEY MIGHT GET DIFFERENT RESULTS BASED ON THEM

subtopics
---------
id              UUID (PK)
module_id       UUID (FK → modules.id)
title           TEXT
content         TEXT
score           SMALLINT
position        INTEGER
created_at      TIMESTAMP (idk if needed or not)


score is supposed to help us identify if a subtopic is read or not , so how it works is that by default all the topics have a score of 0 , but for adaptive teaching when we 
update the score we normalise it to a scale not 0 to 100 but 1 to 100 , which would help us identify if a topic has been read or not.



