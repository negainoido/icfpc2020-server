ALTER TABLE solution
  ADD COLUMN solution_file VARCHAR(100);
ALTER TABLE solution
  ADD INDEX solution_file_index (solution_file)