DROP TABLE IF EXISTS articles;

CREATE TABLE articles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    is_draft INTEGER DEFAULT 0,
    create_time TEXT NOT NULL
);

CREATE INDEX idx_articles_time ON articles(create_time DESC);
