CREATE TABLE IF NOT EXISTS solution (
    id INT(10) NOT NULL auto_increment PRIMARY KEY,
    task_id INT(10) NOT NULL,
    solver VARCHAR(256) NOT NULL,
    score INT(20),
    valid TINYINT(1) DEFAULT 0,
    created TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
