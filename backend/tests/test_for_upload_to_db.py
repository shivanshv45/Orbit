from services.db_services.push_to_db import upload_to_db,user_exist
from services.db_services.db import SessionLocal
from uuid import uuid4
modules = [


    [
        {"title": "Too Short 1", "content": "test this then that "},
        {"title": "Too Short 2", "content": "thsldjfs kfjds flksdjf lkdsjf klsfjslkfj sdlkf jslkfj"},
        {"title": "Too Short 3", "content": "jjj"},
    ],

    [
        {
            "title": "Small Concept A",
            "content": "This is valid but short."
        },
        {
            "title": "Small Concept B",
            "content": "Still not enough characters."
        },
    ],


    [
        {
            "title": "Boundary Case",
            "content": (
                "This content is carefully written so that when combined "
                "with the next sentence it crosses the eighty character limit."
            )
        },
        {
            "title": "Continuation",
            "content": "This sentence pushes it over the threshold."
        },
    ],


    [
        {
            "title": "Part 1",
            "content": (
                "This is the first long explanation that will cross the eighty "
                "character limit and produce the first subtopic."
            )
        },
        {
            "title": "Part 2",
            "content": (
                "This is the second long explanation which again crosses the "
                "threshold and should produce another subtopic."
            )
        },
        {
            "title": "Part 3",
            "content": (
                "This third explanation also exceeds the threshold and ensures "
                "multiple subtopics are created for one module."
            )
        },
    ],


    [
        {
            "title": "Main Chunk",
            "content": (
                "This chunk crosses the threshold and becomes a valid subtopic "
                "inside the database."
            )
        },
        {
            "title": "Leftover",
            "content": (
                "This text is valid but not long enough to cross the threshold."
            )
        },
    ],

    [
        {"title": "Noise", "content": "Ok"},
        {"title": "Intro", "content": "This is a decent introduction but still short."},
        {
            "title": "Core Idea",
            "content": (
                "This is the main concept explanation which is sufficiently long "
                "to cross the threshold and form a meaningful subtopic."
            )
        },
        {"title": "Noise Again", "content": "No"},
        {
            "title": "Follow Up",
            "content": (
                "This follow-up explanation also exceeds the length requirement "
                "and ensures another subtopic is formed."
            )
        },
    ],
]

user_name='Prince Trivedi'
user_id:str=str(uuid4())
db=SessionLocal()
user_exist(db,user_id,user_name)

upload_to_db(db,modules, user_id)





