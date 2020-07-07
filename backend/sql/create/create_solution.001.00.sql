CREATE TABLE IF NOT EXISTS solution (
    id INT(10) NOT NULL auto_increment PRIMARY KEY,
    task_id INT(10) NOT NULL,
    solver VARCHAR(256) NOT NULL,
    commit VARCHAR(40),
    score BIGINT(20),
    valid BOOLEAN DEFAULT FALSE,
    created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX task_id_index (task_id),
    FOREIGN KEY (task_id)
        REFERENCES problem(id)
        ON DELETE CASCADE
);
