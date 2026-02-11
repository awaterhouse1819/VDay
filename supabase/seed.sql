insert into questions (prompt, is_active)
values
  ('What is your favorite memory of us this past year?', true),
  ('What challenges did we overcome together?', true),
  ('One thing I appreciate about you today is...', true),
  ('A song that reminds me of our love...', true),
  ('The best date we had this year was...', true),
  ('Something I want us to try next year...', true),
  ('One time you made me laugh uncontrollably was...', true),
  ('I felt loved when you...', true),
  ('If our love were a movie title...', true),
  ('What smell or flavor reminds you of us?', true),
  ('A small detail about you that I adore...', true),
  ('What I am most proud of us for this year...', true),
  ('An adventure I want to take with you...', true),
  ('Our love in three words...', true),
  ('What does Valentine''s Day mean to you now?', true)
on conflict (prompt) do nothing;
