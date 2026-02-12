-- Seed entries for 2025 (5 slots per partner)
insert into entries (year, partner_id, slot, question, answer)
values
  (2025, 'ACW', 1, 'What is your favorite memory of us from 2025?', 'The night we cooked together and danced in the kitchen.'),
  (2025, 'ACW', 2, 'What challenge did we face that made us stronger?', 'Balancing busy weeks taught us to be more intentional.'),
  (2025, 'ACW', 3, 'What is a small detail about you I adore?', 'The way you smile before you laugh.'),
  (2025, 'ACW', 4, 'What is a dream date you want to plan?', 'A sunrise picnic and a long coastal drive.'),
  (2025, 'ACW', 5, 'What does home feel like with you?', 'Warm, safe, and full of quiet joy.'),
  (2025, 'SLS', 1, 'When did you feel most loved by me in 2025?', 'When you surprised me with coffee on a hard morning.'),
  (2025, 'SLS', 2, 'What is a memory that always makes you smile?', 'Our rainy-day movie marathon with blankets everywhere.'),
  (2025, 'SLS', 3, 'What is a future adventure you want us to take?', 'A fall trip to the mountains with long hikes.'),
  (2025, 'SLS', 4, 'What do you love about our everyday routines?', 'The small check-ins that make me feel seen.'),
  (2025, 'SLS', 5, 'What promise do you want us to keep next year?', 'To protect our slow mornings together.')
on conflict (partner_id, year, slot)
  do update set question = excluded.question, answer = excluded.answer, updated_at = now();

-- Seed board images metadata for 2025
delete from board_images
where storage_path in (
  '2025/ACW/11111111-1111-1111-1111-111111111111.png',
  '2025/ACW/22222222-2222-2222-2222-222222222222.png',
  '2025/ACW/33333333-3333-3333-3333-333333333333.png',
  '2025/SLS/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa.png',
  '2025/SLS/bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb.png',
  '2025/SLS/cccccccc-cccc-cccc-cccc-cccccccccccc.png'
);

insert into board_images (year, uploaded_by_initials, storage_path, caption)
values
  (2025, 'ACW', '2025/ACW/11111111-1111-1111-1111-111111111111.png', 'Seed memory from ACW #1'),
  (2025, 'ACW', '2025/ACW/22222222-2222-2222-2222-222222222222.png', 'Seed memory from ACW #2'),
  (2025, 'ACW', '2025/ACW/33333333-3333-3333-3333-333333333333.png', 'Seed memory from ACW #3'),
  (2025, 'SLS', '2025/SLS/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa.png', 'Seed memory from SLS #1'),
  (2025, 'SLS', '2025/SLS/bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb.png', 'Seed memory from SLS #2'),
  (2025, 'SLS', '2025/SLS/cccccccc-cccc-cccc-cccc-cccccccccccc.png', 'Seed memory from SLS #3');
